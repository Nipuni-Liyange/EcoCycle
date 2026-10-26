import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diagnoseDatabaseError } from '../src/databaseErrors.js'

test('finds the TLS rejection nested inside a server-selection topology', () => {
  const root = { message: 'Could not connect', reason: { servers: new Map([
    ['private-host', { error: { cause: { code: 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' } } }],
  ]) } }
  const result = diagnoseDatabaseError(root)
  assert.equal(result.kind, 'tls')
  assert.equal(result.code, 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR')
  assert.match(result.message, /before login/)
  assert.match(result.message, /CURRENT public IP/)
  assert.doesNotMatch(JSON.stringify(result), /private-host/)
})

test('separates authentication from network, DNS and database permission failures', () => {
  assert.equal(diagnoseDatabaseError({ cause: { code: 18 } }).kind, 'authentication')
  assert.equal(diagnoseDatabaseError({ code: 'ENOTFOUND' }).kind, 'dns')
  assert.equal(diagnoseDatabaseError({ code: 'ETIMEDOUT' }).kind, 'network')
  assert.equal(diagnoseDatabaseError({ code: 13 }).kind, 'authorization')
  assert.equal(diagnoseDatabaseError({ code: 11000 }).kind, 'index')
})

test('diagnostics never return raw connection strings, and tolerate circular causes', () => {
  const root = { message: 'Failed mongodb+srv://synthetic-user:synthetic-secret@private-host/test' }
  root.cause = root
  const result = JSON.stringify(diagnoseDatabaseError(root))
  assert.doesNotMatch(result, /synthetic-user|synthetic-secret|private-host|mongodb\+srv/)
  root.name = 'MongoParseError'
  assert.equal(diagnoseDatabaseError(root).kind, 'configuration')
  assert.doesNotMatch(JSON.stringify(diagnoseDatabaseError(root)), /synthetic-user|synthetic-secret|private-host/)
})
