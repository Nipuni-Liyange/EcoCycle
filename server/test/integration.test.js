import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import sharp from 'sharp'
import { createApp } from '../src/app.js'
import { User, Pickup, Session } from '../src/models.js'
import { findMongoBinary } from '../scripts/local-mongodb.js'

let database
let app
const origin = 'http://localhost:5173'
const credentials = { name: 'Test General User', email: 'user@example.test', password: 'Test-only-password-42', role: 'user' }
const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
const sample = { category: 'laptops', itemName: 'Laptop for recycling', quantity: 2, condition: 'needs-repair', description: 'Screen needs repair.', district: 'Colombo', city: 'Colombo', address: '123 Test Street, test environment', preferredDate: future, image: '' }

before(async () => {
  const systemBinary = findMongoBinary()
  database = await MongoMemoryServer.create({ instance: { dbName: 'ecocycle_integration' }, binary: systemBinary ? { systemBinary, version: '8.0.0' } : undefined })
  await mongoose.connect(database.getUri())
  await Promise.all([User.init(), Pickup.init(), Session.init()])
  app = createApp()
}, { timeout: 180000 })
after(async () => { await mongoose.disconnect(); if (database) await database.stop() })

function client() {
  const agent = request.agent(app)
  let csrf = ''
  return {
    agent,
    async register(values) {
      const response = await agent.post('/api/auth/register').set('Origin', origin).send(values)
      if (response.body.csrfToken) csrf = response.body.csrfToken
      return response
    },
    async login(values) {
      const response = await agent.post('/api/auth/login').set('Origin', origin).send(values)
      if (response.body.csrfToken) csrf = response.body.csrfToken
      return response
    },
    get: path => agent.get(`/api${path}`),
    write(method, path, body = {}) { return agent[method](`/api${path}`).set('Origin', origin).set('X-CSRF-Token', csrf).send(body) },
  }
}

test('authentication, ownership, CRUD, concurrency and the complete collector lifecycle', { timeout: 120000 }, async t => {
  const owner = client()
  const stranger = client()
  const collector = client()
  const competitor = client()
  let pickup
  let savedCookie

  await t.test('anonymous requests and unsupported roles are denied', async () => {
    assert.equal((await owner.get('/pickups')).status, 401)
    assert.equal((await owner.register({ ...credentials, role: 'admin' })).status, 422)
    assert.equal((await owner.register({ ...credentials, email: { $ne: null } })).status, 422)
  })
  await t.test('registration hashes passwords and sets a protected cookie', async () => {
    const result = await owner.register(credentials)
    assert.equal(result.status, 201)
    savedCookie = result.headers['set-cookie'][0].split(';')[0]
    assert.match(result.headers['set-cookie'][0], /HttpOnly/)
    assert.match(result.headers['set-cookie'][0], /SameSite=Lax/)
    assert.equal(result.body.user.passwordHash, undefined)
    const stored = await User.findOne({ email: credentials.email }).select('+passwordHash')
    assert.notEqual(stored.passwordHash, credentials.password)
    assert.equal(await bcrypt.compare(credentials.password, stored.passwordHash), true)
    const duplicate = await owner.register({ ...credentials, email: 'USER@example.test' })
    assert.equal(duplicate.status, 409)
    assert.equal((await owner.get('/auth/me')).body.user.role, 'user')
    assert.equal((await stranger.register({ ...credentials, name: 'Other User', email: 'other@example.test' })).status, 201)
    assert.equal((await collector.register({ ...credentials, name: 'Collector One', email: 'collector@example.test', role: 'collector' })).status, 201)
    assert.equal((await competitor.register({ ...credentials, name: 'Collector Two', email: 'collector2@example.test', role: 'collector' })).status, 201)
  })
  await t.test('login failures, CSRF, foreign origins and profile role changes are rejected', async () => {
    assert.equal((await client().login({ ...credentials, password: 'incorrect-password' })).status, 401)
    assert.equal((await client().login({ ...credentials, role: 'collector' })).status, 401)
    assert.equal((await client().login({ ...credentials, role: 'admin' })).status, 422)
    const collectorLogin = await client().login({ email: 'collector@example.test', password: credentials.password, role: 'collector' })
    assert.equal(collectorLogin.status, 200)
    assert.equal(collectorLogin.body.user.role, 'collector')
    assert.equal((await owner.agent.post('/api/pickups').set('Origin', origin).send(sample)).status, 403)
    assert.equal((await owner.agent.post('/api/auth/login').set('Origin', 'https://untrusted.example').send(credentials)).status, 403)
    assert.equal((await owner.agent.post('/api/auth/login').type('form').send(credentials)).status, 415)
    assert.equal((await owner.write('patch', '/auth/profile', { name: 'Owner', role: 'collector' })).status, 422)
    assert.equal((await collector.write('post', '/pickups', sample)).status, 403)
  })
  await t.test('validates quantities, dates, images and stores a real request', async () => {
    for (const invalid of [{ quantity: 1.5 }, { quantity: -1 }, { category: 'invalid' }, { preferredDate: '2000-01-01' }, { preferredDate: '2030-02-30' }, { image: 'data:image/svg+xml;base64,PHN2Zz4=' }]) {
      assert.equal((await owner.write('post', '/pickups', { ...sample, ...invalid })).status, 422)
    }
    const created = await owner.write('post', '/pickups', { ...sample, user: new mongoose.Types.ObjectId(), collector: new mongoose.Types.ObjectId(), status: 'recycled' })
    assert.equal(created.status, 201)
    pickup = created.body.request
    assert.equal(pickup.status, 'pending')
    assert.equal(pickup.collector, null)
    assert.equal(await Pickup.countDocuments({ _id: pickup._id }), 1)
    assert.equal((await owner.get('/pickups')).body.total, 1)
    assert.equal((await stranger.get('/pickups')).body.total, 0)
    assert.equal((await stranger.get(`/pickups/${pickup._id}`)).status, 404)
    assert.equal((await stranger.write('patch', `/pickups/${pickup._id}`, { ...sample, version: 0 })).status, 409)
    assert.equal((await stranger.write('delete', `/pickups/${pickup._id}`)).status, 409)
    assert.equal((await owner.get('/pickups?scope=available')).status, 403)
  })
  await t.test('pending CRUD persists across connections and prevents stale overwrites', async () => {
    const edited = await owner.write('patch', `/pickups/${pickup._id}`, { ...sample, itemName: 'Updated laptop', version: pickup.__v })
    assert.equal(edited.status, 200)
    assert.equal(edited.body.request.itemName, 'Updated laptop')
    assert.equal((await owner.write('patch', `/pickups/${pickup._id}`, { ...sample, version: pickup.__v })).status, 409)
    pickup = edited.body.request
    await mongoose.disconnect()
    await mongoose.connect(database.getUri())
    assert.equal((await owner.get(`/pickups/${pickup._id}`)).body.request.itemName, 'Updated laptop')
    assert.equal((await owner.get('/pickups?q=Updated&status=pending')).body.total, 1)
    assert.equal((await owner.get('/pickups?q=.*')).body.total, 0)
    const tinyPng = `data:image/png;base64,${(await sharp({ create: { width: 10, height: 10, channels: 3, background: '#426536' } }).png().toBuffer()).toString('base64')}`
    const discarded = await owner.write('post', '/pickups', { ...sample, image: tinyPng })
    assert.equal(discarded.status, 201)
    const saved = (await owner.get(`/pickups/${discarded.body.request._id}`)).body.request
    assert.equal(saved.image, undefined)
    assert.equal(saved.photos.length, 1)
    assert.equal((await owner.agent.get(saved.photos[0].url)).status, 200)
    assert.equal((await owner.get('/pickups')).body.requests.every(item => item.image === undefined), true)
    assert.equal((await owner.write('delete', `/pickups/${discarded.body.request._id}`)).status, 204)
    assert.equal((await owner.get(`/pickups/${discarded.body.request._id}`)).status, 404)
  })
  await t.test('available pickups hide exact addresses; concurrent acceptance has one winner', async () => {
    const available = await collector.get('/pickups?scope=available')
    assert.equal(available.body.requests[0].address, undefined)
    assert.equal(available.body.requests[0].user, undefined)
    assert.equal((await collector.get(`/pickups/${pickup._id}`)).body.request.address, undefined)
    const attempts = await Promise.all([collector.write('post', `/pickups/${pickup._id}/accept`), competitor.write('post', `/pickups/${pickup._id}/accept`)])
    assert.deepEqual(attempts.map(result => result.status).sort(), [200, 409])
    const winning = attempts[0].status === 200 ? collector : competitor
    const losing = attempts[0].status === 200 ? competitor : collector
    collector.winner = winning
    collector.loser = losing
    assert.equal((await winning.get(`/pickups/${pickup._id}`)).body.request.address, sample.address)
    assert.equal((await losing.get(`/pickups/${pickup._id}`)).status, 404)
    assert.equal((await owner.write('patch', `/pickups/${pickup._id}`, { ...sample, version: pickup.__v })).status, 409)
    assert.equal((await owner.write('delete', `/pickups/${pickup._id}`)).status, 409)
  })
  await t.test('only the assigned collector can schedule and advance valid statuses', async () => {
    const winning = collector.winner
    const losing = collector.loser
    assert.equal((await winning.write('post', `/pickups/${pickup._id}/status`, { status: 'recycled' })).status, 409)
    assert.equal((await losing.write('post', `/pickups/${pickup._id}/schedule`, { scheduledAt: `${future}T09:30:00+05:30` })).status, 409)
    assert.equal((await winning.write('post', `/pickups/${pickup._id}/schedule`, { scheduledAt: '2000-01-01' })).status, 422)
    assert.equal((await winning.write('post', `/pickups/${pickup._id}/schedule`, { scheduledAt: `${future}T09:30:00+05:30`, note: 'Test schedule' })).status, 200)
    assert.equal((await owner.get('/pickups/stats')).body.scheduled, 1)
    assert.equal((await winning.write('post', `/pickups/${pickup._id}/status`, { status: 'collected' })).status, 200)
    assert.equal((await winning.write('post', `/pickups/${pickup._id}/status`, { status: 'collected' })).status, 409)
    assert.equal((await winning.write('post', `/pickups/${pickup._id}/status`, { status: 'recycled' })).status, 200)
    const final = (await owner.get(`/pickups/${pickup._id}`)).body.request
    assert.deepEqual(final.timeline.map(event => event.status), ['pending', 'accepted', 'scheduled', 'collected', 'recycled'])
    assert.equal((await owner.get('/pickups/stats')).body.completed, 1)
    assert.equal((await winning.get('/pickups?scope=history')).body.total, 1)
    assert.equal((await winning.get('/pickups?scope=available')).body.total, 0)
  })
  await t.test('profile updates persist and logout revokes the actual session', async () => {
    const updated = await owner.write('patch', '/auth/profile', { name: 'Updated Name', phone: '+94 77 123 4567', district: 'Galle' })
    assert.equal(updated.status, 200)
    assert.equal((await owner.get('/auth/me')).body.user.name, 'Updated Name')
    assert.equal((await owner.write('post', '/auth/logout')).status, 204)
    assert.equal((await request(app).get('/api/auth/me').set('Cookie', savedCookie)).status, 401)
    assert.equal((await owner.login(credentials)).status, 200)
    assert.equal((await owner.get('/auth/me')).body.user.name, 'Updated Name')
    const user = await User.findOne({ email: credentials.email })
    await Session.updateMany({ user: user._id }, { expiresAt: new Date(0) })
    assert.equal((await owner.get('/auth/me')).status, 401)
  })
})

test('tracking, active collections and completed history stay distinct and private', { timeout: 120000 }, async t => {
  const owner = client(), stranger = client(), collector = client(), competitor = client()
  const people = []
  for (const [account, name, role] of [[owner, 'lists-owner', 'user'], [stranger, 'lists-stranger', 'user'], [collector, 'lists-collector', 'collector'], [competitor, 'lists-competitor', 'collector']]) {
    const result = await account.register({ ...credentials, name, email: `${name}@example.test`, phone: '+94 77 123 4567', role })
    assert.equal(result.status, 201)
    people.push(result.body.user)
  }
  const [ownerUser, strangerUser, assignedUser, otherCollector] = people
  const ownerId = new mongoose.Types.ObjectId(ownerUser._id)
  const assignedId = new mongoose.Types.ObjectId(assignedUser._id)
  const fixtures = []
  for (const status of ['pending', 'accepted', 'scheduled', 'collected', 'recycled']) {
    fixtures.push(await Pickup.create({ ...sample, itemName: `Tracking ${status}`, user: ownerId, collector: status === 'pending' ? null : assignedId, status,
      timeline: [{ status: 'pending', at: new Date('2026-10-01T08:00:00Z') }, ...(status === 'collected' || status === 'recycled' ? [{ status: 'collected', at: new Date('2026-10-02T08:00:00Z') }] : []), ...(status === 'recycled' ? [{ status: 'recycled', at: new Date('2026-10-04T08:00:00Z') }] : [])],
    }))
  }
  const oldCompleted = await Pickup.create({ ...sample, itemName: 'Earlier recycling', user: ownerId, collector: assignedId, status: 'recycled', timeline: [{ status: 'recycled', at: new Date('2026-10-03T08:00:00Z') }] })
  const undated = await Pickup.create({ ...sample, itemName: 'Undated recycling', user: ownerId, collector: assignedId, status: 'recycled', timeline: [] })
  const foreign = await Pickup.create({ ...sample, itemName: 'Private foreign request', user: strangerUser._id, collector: otherCollector._id, status: 'collected' })
  const before = await Pickup.find({ user: ownerId }).sort({ _id: 1 }).lean()

  await t.test('owner management includes all statuses; tracking excludes only recycled and populates authorized contacts', async () => {
    const all = await owner.get('/pickups')
    assert.equal(all.status, 200)
    assert.equal(all.body.total, 7)
    const active = await owner.get('/pickups?scope=active')
    assert.equal(active.body.total, 4)
    assert.deepEqual(active.body.requests.map(item => item.status).sort(), ['accepted', 'collected', 'pending', 'scheduled'])
    assert.equal(active.body.requests.find(item => item.status === 'pending').collector, null)
    const assigned = active.body.requests.find(item => item.status === 'accepted')
    assert.equal(assigned.collector.email, 'lists-collector@example.test')
    assert.equal(assigned.collector.passwordHash, undefined)
    assert.equal(assigned.address, sample.address)
    assert.equal((await owner.get('/pickups?scope=active&status=recycled')).status, 422)
    assert.equal((await owner.get('/pickups?scope=active&status=accepted&q=Tracking')).body.total, 1)
    assert.equal((await owner.get('/pickups?scope=active&q=.*')).body.total, 0)
    assert.equal((await owner.get(`/pickups/${foreign._id}`)).status, 404)
    assert.equal((await owner.get('/pickups?scope=history')).status, 403)
  })
  await t.test('collector active/history scopes cannot be broadened with query parameters', async () => {
    const active = await collector.get('/pickups?scope=active')
    assert.equal(active.body.total, 3)
    assert.deepEqual(active.body.requests.map(item => item.status).sort(), ['accepted', 'collected', 'scheduled'])
    assert.equal((await competitor.get('/pickups?scope=active')).body.total, 1)
    assert.equal((await competitor.get('/pickups?scope=history')).body.total, 0)
    assert.equal((await collector.get('/pickups?scope=history&status=collected')).status, 422)
    assert.equal((await collector.get('/pickups?scope=active&status=pending')).status, 422)
    assert.equal((await collector.get('/pickups?scope=active&status=recycled')).status, 422)
    assert.equal((await collector.get('/pickups?scope=unknown')).status, 422)
    assert.equal((await collector.get('/pickups?scope=history&sort=invalid')).status, 422)
    assert.equal((await competitor.get(`/pickups/${fixtures[1]._id}`)).status, 404)
    assert.equal((await competitor.write('post', `/pickups/${fixtures[3]._id}/status`, { status: 'recycled' })).status, 409)
  })
  await t.test('history uses recorded dates, sorts both ways, paginates and retains the unfiltered total', async () => {
    const history = await collector.get('/pickups?scope=history')
    assert.equal(history.body.total, 3)
    assert.equal(history.body.completedTotal, 3)
    assert.deepEqual(history.body.requests.map(item => item._id), [fixtures[4].id, oldCompleted.id, undated.id])
    assert.equal(history.body.requests[0].collectedAt, '2026-10-02T08:00:00.000Z')
    assert.equal(history.body.requests[0].recycledAt, '2026-10-04T08:00:00.000Z')
    assert.equal(history.body.requests[1].collectedAt, null)
    assert.equal(history.body.requests[2].recycledAt, null)
    assert.equal(history.body.requests[0].hasCompletionDate, undefined)
    assert.equal(history.body.requests.every(item => item.status === 'recycled'), true)
    const oldest = await collector.get('/pickups?scope=history&sort=oldest')
    assert.deepEqual(oldest.body.requests.map(item => item._id), [oldCompleted.id, fixtures[4].id, undated.id])
    const page = await collector.get('/pickups?scope=history&limit=1&page=2')
    assert.equal(page.body.requests[0]._id, oldCompleted.id)
    assert.equal(page.body.pages, 3)
    const search = await collector.get('/pickups?scope=history&q=Earlier')
    assert.equal(search.body.total, 1)
    assert.equal(search.body.completedTotal, 3)
    assert.deepEqual(await Pickup.find({ user: ownerId }).sort({ _id: 1 }).lean(), before)
  })
  await t.test('recycling moves a collection between lists without deleting it; completed history is read-only', async () => {
    const id = fixtures[3].id
    assert.equal((await collector.write('post', `/pickups/${id}/status`, { status: 'recycled' })).status, 200)
    assert.equal((await collector.get('/pickups?scope=active')).body.total, 2)
    assert.equal((await owner.get('/pickups?scope=active')).body.total, 3)
    const history = await collector.get('/pickups?scope=history')
    assert.equal(history.body.total, 4)
    assert.equal(history.body.requests.some(item => item._id === id), true)
    assert.equal((await owner.get('/pickups')).body.total, 7)
    assert.equal((await owner.write('patch', `/pickups/${id}`, { ...sample, version: 1 })).status, 409)
    assert.equal((await owner.write('delete', `/pickups/${id}`)).status, 409)
    assert.equal((await collector.write('post', `/pickups/${id}/status`, { status: 'collected' })).status, 409)
    assert.equal((await collector.write('post', `/pickups/${id}/schedule`, { scheduledAt: `${future}T09:30:00+05:30` })).status, 409)
    await mongoose.disconnect()
    await mongoose.connect(database.getUri())
    assert.equal((await Pickup.findById(id)).status, 'recycled')
    assert.equal((await collector.get('/pickups?scope=history')).body.completedTotal, 4)
  })
})

test('private photos survive refresh, replacement and collector transitions in real MongoDB', { timeout: 120000 }, async t => {
  const owner = client(), stranger = client(), collector = client(), competitor = client()
  const accounts = [[owner, 'photo-owner', 'user'], [stranger, 'photo-stranger', 'user'], [collector, 'photo-collector', 'collector'], [competitor, 'photo-competitor', 'collector']]
  for (const [account, name, role] of accounts) assert.equal((await account.register({ ...credentials, name, email: `${name}@example.test`, role })).status, 201)
  const input = { ...sample }
  delete input.image
  const uploads = []
  for (const format of ['jpeg', 'png', 'webp']) {
    const bytes = await sharp({ create: { width: 100, height: 75, channels: 3, background: '#426536' } }).toFormat(format).toBuffer()
    uploads.push({ dataUrl: `data:image/${format};base64,${bytes.toString('base64')}` })
  }
  let pickup
  let originalPhoto
  const noBytes = response => {
    assert.equal(response.text.includes('data:image'), false)
    assert.equal(response.text.includes('"type":"Buffer"'), false)
    assert.equal(response.body.request?.image, undefined)
  }

  await t.test('creates all three formats, lists only references and protects image URLs', async () => {
    const created = await owner.write('post', '/pickups', { ...input, photos: uploads })
    assert.equal(created.status, 201, created.text)
    noBytes(created)
    pickup = created.body.request
    assert.equal(pickup.photos.length, 3)
    originalPhoto = pickup.photos[0]
    const stored = await Pickup.findById(pickup._id).select('+photos.data')
    assert.equal(stored.photos.length, 3)
    for (const photo of stored.photos) assert.equal((await sharp(photo.data).metadata()).format, 'webp')
    assert.equal((await Pickup.findById(pickup._id)).photos[0].data, undefined)
    const listed = await owner.get('/pickups')
    noBytes(listed)
    assert.deepEqual(listed.body.requests[0].photos, pickup.photos)
    const fetched = await owner.agent.get(originalPhoto.url)
    assert.equal(fetched.status, 200)
    assert.equal(fetched.headers['content-type'], 'image/webp')
    assert.equal(fetched.headers['cache-control'], 'private, no-store')
    assert.equal(fetched.headers['x-content-type-options'], 'nosniff')
    assert.deepEqual(fetched.body, Buffer.from(stored.photos[0].data))
    assert.equal((await request(app).get(originalPhoto.url)).status, 401)
    assert.equal((await stranger.agent.get(originalPhoto.url)).status, 404)
    assert.equal((await collector.agent.get(originalPhoto.url)).status, 200)
    assert.equal((await owner.agent.get(originalPhoto.url.replace(originalPhoto.id, 'invalid'))).status, 404)
    assert.equal((await collector.write('patch', `/pickups/${pickup._id}`, { ...input, version: 0, photos: [] })).status, 403)
  })

  await t.test('invalid uploads and cross-request references leave data unchanged', async () => {
    const originalCount = await Pickup.countDocuments()
    const corrupt = `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]).toString('base64')}`
    const oversize = `data:image/jpeg;base64,${Buffer.concat([Buffer.from([255, 216, 255]), Buffer.alloc(2 * 1024 * 1024)]).toString('base64')}`
    for (const photos of [[...uploads, uploads[0]], [{ dataUrl: corrupt }], [{ dataUrl: oversize }], [{ dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }], [{ id: originalPhoto.id }], [{ dataUrl: uploads[0].dataUrl, id: originalPhoto.id }], null]) {
      const rejected = await owner.write('post', '/pickups', { ...input, photos })
      assert.equal(rejected.status, 422, rejected.text)
    }
    assert.equal(await Pickup.countDocuments(), originalCount)
    const foreign = await stranger.write('post', '/pickups', { ...input, photos: [uploads[0]] })
    assert.equal(foreign.status, 201)
    for (const photos of [[{ id: foreign.body.request.photos[0].id }], [{ id: originalPhoto.id }, { id: originalPhoto.id }], [{ dataUrl: corrupt }]]) {
      assert.equal((await owner.write('patch', `/pickups/${pickup._id}`, { ...input, version: 0, photos })).status, 422)
    }
    assert.deepEqual((await owner.get(`/pickups/${pickup._id}`)).body.request.photos, pickup.photos)
    assert.equal((await stranger.write('delete', `/pickups/${foreign.body.request._id}`)).status, 204)
  })

  await t.test('the authenticated body limit accepts three images of exactly 2 MiB each', async () => {
    const jpeg = Buffer.from(uploads[0].dataUrl.split(',')[1], 'base64')
    const bytes = Buffer.concat([jpeg, Buffer.alloc(2 * 1024 * 1024 - jpeg.length)])
    const photo = { dataUrl: `data:image/jpeg;base64,${bytes.toString('base64')}` }
    const created = await owner.write('post', '/pickups', { ...input, photos: [photo, photo, photo] })
    assert.equal(created.status, 201, created.text)
    assert.equal(created.body.request.photos.length, 3)
    assert.equal((await owner.write('delete', `/pickups/${created.body.request._id}`)).status, 204)
  })

  await t.test('omission preserves photos, edits retain/remove/replace and stale edits cannot overwrite', async () => {
    const textEdit = await owner.write('patch', `/pickups/${pickup._id}`, { ...input, itemName: 'Photo test edited', version: pickup.__v })
    assert.equal(textEdit.status, 200, textEdit.text)
    assert.deepEqual(textEdit.body.request.photos, pickup.photos)
    pickup = textEdit.body.request
    const oldVersion = pickup.__v
    const removed = pickup.photos[1]
    const edited = await owner.write('patch', `/pickups/${pickup._id}`, { ...input, version: oldVersion, photos: [{ id: originalPhoto.id }, uploads[2]] })
    assert.equal(edited.status, 200, edited.text)
    noBytes(edited)
    pickup = edited.body.request
    assert.equal(pickup.photos.length, 2)
    assert.equal(pickup.photos[0].id, originalPhoto.id)
    assert.notEqual(pickup.photos[1].id, removed.id)
    assert.equal((await owner.agent.get(removed.url)).status, 404)
    assert.equal((await owner.write('patch', `/pickups/${pickup._id}`, { ...input, version: oldVersion, photos: [] })).status, 409)
    assert.deepEqual((await owner.get(`/pickups/${pickup._id}`)).body.request.photos, pickup.photos)
  })

  await t.test('DB outages report failure; a new app and DB connection recover saved bytes and sessions', async () => {
    const savedBytes = (await owner.agent.get(originalPhoto.url)).body
    await mongoose.disconnect()
    assert.equal((await owner.get('/health')).status, 503)
    assert.equal((await owner.write('patch', `/pickups/${pickup._id}`, { ...input, version: pickup.__v, photos: [] })).status, 503)
    await mongoose.connect(database.getUri())
    assert.equal((await owner.get('/auth/me')).status, 200)
    assert.deepEqual((await owner.get(`/pickups/${pickup._id}`)).body.request.photos, pickup.photos)
    assert.deepEqual((await owner.agent.get(originalPhoto.url)).body, savedBytes)
    const restarted = request.agent(createApp())
    const loggedIn = await restarted.post('/api/auth/login').set('Origin', origin).send({ email: 'photo-owner@example.test', password: credentials.password })
    assert.equal(loggedIn.status, 200)
    assert.deepEqual((await restarted.get(originalPhoto.url)).body, savedBytes)
  })

  await t.test('acceptance restricts photo access to the owner and assigned collector and prevents edits', async () => {
    const available = await collector.get('/pickups?scope=available')
    noBytes(available)
    assert.equal(available.body.requests.find(item => item._id === pickup._id).photos.length, 2)
    const accepted = await collector.write('post', `/pickups/${pickup._id}/accept`)
    assert.equal(accepted.status, 200)
    noBytes(accepted)
    assert.equal(accepted.body.request.photos.length, 2)
    assert.equal((await collector.get('/pickups')).body.requests[0].photos.length, 2)
    assert.equal((await collector.agent.get(originalPhoto.url)).status, 200)
    assert.equal((await owner.agent.get(originalPhoto.url)).status, 200)
    assert.equal((await competitor.agent.get(originalPhoto.url)).status, 404)
    assert.equal((await owner.write('patch', `/pickups/${pickup._id}`, { ...input, version: accepted.body.request.__v, photos: [] })).status, 409)
    assert.equal((await owner.write('delete', `/pickups/${pickup._id}`)).status, 409)
  })

  await t.test('legacy photos remain private and migrate on editing; clearing and deleting remove bytes', async () => {
    const user = await User.findOne({ email: 'photo-owner@example.test' })
    const legacy = await Pickup.create({ ...input, user: user._id, image: uploads[0].dataUrl })
    const detail = await owner.get(`/pickups/${legacy._id}`)
    noBytes(detail)
    assert.equal(detail.body.request.photos[0].id, 'legacy')
    const legacyUrl = detail.body.request.photos[0].url
    assert.equal((await owner.get('/pickups')).body.requests.find(item => item._id === legacy.id).photos[0].id, 'legacy')
    assert.equal((await owner.agent.get(legacyUrl)).status, 200)
    assert.equal((await stranger.agent.get(legacyUrl)).status, 404)
    const migrated = await owner.write('patch', `/pickups/${legacy._id}`, { ...input, version: 0, photos: [{ id: 'legacy' }, uploads[1]] })
    assert.equal(migrated.status, 200, migrated.text)
    assert.equal((await Pickup.findById(legacy._id).select('+image')).image, '')
    assert.equal((await owner.agent.get(legacyUrl)).status, 404)
    const cleared = await owner.write('patch', `/pickups/${legacy._id}`, { ...input, version: 1, photos: [] })
    assert.equal(cleared.status, 200)
    assert.deepEqual(cleared.body.request.photos, [])
    assert.equal((await owner.agent.get(migrated.body.request.photos[0].url)).status, 404)
    const replaced = await owner.write('patch', `/pickups/${legacy._id}`, { ...input, version: 2, photos: uploads })
    assert.equal(replaced.status, 200)
    assert.equal((await owner.write('delete', `/pickups/${legacy._id}`)).status, 204)
    assert.equal(await Pickup.exists({ _id: legacy._id }), null)
    for (const photo of replaced.body.request.photos) assert.equal((await owner.agent.get(photo.url)).status, 404)
  })
})
