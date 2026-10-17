import mongoose from 'mongoose'
import dns from 'node:dns'
import { initializeModels } from './models.js'

export function configureDns() {
  // Retain the existing resolver defaults; allow system DNS without changing .env.
  if (process.env.DNS_SERVERS === 'system') return
  dns.setServers((process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',').map(value => value.trim()))
}

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MISSING_DATABASE_CONFIGURATION')
  configureDns()
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 })
  await initializeModels()
}
