import dotenv from 'dotenv'
import dns from 'node:dns'
import mongoose from 'mongoose'

dotenv.config({ quiet: true })
const uri = process.env.MONGODB_URI
if (!uri) {
  console.log('MONGODB_URI is missing. The private .env file was not changed.')
  process.exitCode = 1
} else {
  const resolvers = [{ label: 'system DNS', servers: dns.getServers() }, { label: 'project DNS', servers: ['8.8.8.8', '1.1.1.1'] }]
  let success = false
  for (const resolver of resolvers) {
    dns.setServers(resolver.servers)
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, autoIndex: false })
      await mongoose.connection.db.admin().ping()
      console.log(`${resolver.label}: MongoDB connection and ping succeeded.`)
      success = true
    } catch (error) {
      const code = error.code || error.cause?.code
      const message = String(error.message || '')
      const category = /querySrv|queryTxt|ENOTFOUND|ECONNREFUSED|ETIMEOUT/.test(message) ? 'DNS lookup or resolver connectivity failed' : code === 18 || /authentication/i.test(message) ? 'database authentication failed' : /certificate|TLS|SSL/i.test(message) ? 'TLS negotiation failed' : 'connection timed out or network/Atlas access list prevented access'
      console.log(`${resolver.label}: ${category}.`)
    } finally {
      await mongoose.disconnect()
    }
  }
  console.log('No credentials were printed and no database records were modified.')
  process.exitCode = success ? 0 : 1
}
