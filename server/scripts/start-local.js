// Explicit local development only. This never reads or changes server/.env.
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import mongoose from 'mongoose'
import { findMongoBinary } from './local-mongodb.js'
import { createApp } from '../src/app.js'
import { initializeModels } from '../src/models.js'

const binary = findMongoBinary()
if (!binary) {
  console.error('Local MongoDB was not found. Install MongoDB Community or set MONGOD_BINARY to its mongod executable.')
  process.exit(1)
}
const dataPath = fileURLToPath(new URL('../.local-data/mongodb/', import.meta.url))
await mkdir(dataPath, { recursive: true })
const port = Number(process.env.LOCAL_MONGO_PORT || 27018)
const child = spawn(binary, ['--dbpath', dataPath, '--port', String(port), '--bind_ip', '127.0.0.1', '--logpath', `${dataPath}/mongodb.log`, '--logappend'], { windowsHide: true, stdio: 'ignore' })
let stopping = false
let server
async function shutdown() {
  if (stopping) return
  stopping = true
  if (server) await new Promise(resolve => server.close(resolve))
  await mongoose.disconnect()
  child.kill()
}
child.once('error', () => { console.error('Local MongoDB could not start. Check the installed executable.'); process.exitCode = 1 })
child.once('exit', () => { if (!stopping) { console.error('Local MongoDB stopped. Check the database port and local log file.'); shutdown(); process.exitCode = 1 } })
process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())
try {
  // A separate loopback database and directory keep this development option
  // independent of Atlas and any pre-existing MongoDB service.
  await mongoose.connect(`mongodb://127.0.0.1:${port}/ecocycle_local`, { serverSelectionTimeoutMS: 15000 })
  await initializeModels()
  server = createApp().listen(process.env.PORT || 5000, '127.0.0.1', () => console.log('EcoCycle local API: http://127.0.0.1:5000 — persistent local MongoDB; Atlas .env unchanged.'))
  server.on('error', async () => { console.error('API port is unavailable.'); await shutdown(); process.exitCode = 1 })
} catch {
  console.error('Local MongoDB connection failed. Check the local log and port availability.')
  await shutdown()
  process.exitCode = 1
}
