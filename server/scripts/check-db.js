import dotenv from 'dotenv'
import dns from 'node:dns'
import mongoose from 'mongoose'
import { diagnoseDatabaseError } from '../src/databaseErrors.js'

dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true })
const uri = process.env.MONGODB_URI
if (!uri) {
  console.log('MONGODB_URI is missing. The private .env file was not changed.')
  process.exitCode = 1
} else {
  const resolvers = [{ label: 'system DNS', servers: dns.getServers() }, { label: 'project DNS', servers: ['8.8.8.8', '1.1.1.1'] }]
  let success = false
  for (const resolver of resolvers) {
    dns.setServers(resolver.servers)
    let client
    try {
      client = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 })
      await client.connect()
      await client.db('admin').command({ ping: 1 })
      console.log(`${resolver.label}: MongoDB connection and ping succeeded.`)
      success = true
    } catch (error) {
      const diagnosis = diagnoseDatabaseError(error)
      console.log(`${resolver.label}: ${diagnosis.kind}${diagnosis.code ? ` (${diagnosis.code})` : ''}. ${diagnosis.message}`)
    } finally {
      await client?.close()
    }
  }
  console.log('No credentials were printed and no database records were modified.')
  process.exitCode = success ? 0 : 1
}
