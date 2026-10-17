import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
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
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nAAAAABJRU5ErkJggg=='
    const discarded = await owner.write('post', '/pickups', { ...sample, image: tinyPng })
    assert.equal(discarded.status, 201)
    assert.equal((await owner.get(`/pickups/${discarded.body.request._id}`)).body.request.image, tinyPng)
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
