import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dateOnly, imageData, password, pickupInput, today } from '../src/validation.js'

test('password bounds use bytes to avoid bcrypt silent truncation', () => {
  assert.throws(() => password('a'.repeat(73)))
  assert.throws(() => password('界'.repeat(25)))
  assert.equal(password('a'.repeat(72)).length, 72)
})
test('strict calendar parsing and bounded image formats', () => {
  assert.equal(dateOnly(today()), today())
  assert.throws(() => dateOnly('2030-02-30'))
  assert.throws(() => dateOnly('2020-01-01'))
  assert.throws(() => imageData('data:image/png;base64,aGVsbG8='))
  assert.throws(() => imageData('https://example.test/remote-image.jpg'))
  assert.throws(() => pickupInput({ quantity: '2' }))
})
