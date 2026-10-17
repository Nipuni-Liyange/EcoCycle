import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

export function findMongoBinary() {
  if (process.env.MONGOD_BINARY && existsSync(process.env.MONGOD_BINARY)) return process.env.MONGOD_BINARY
  if (process.platform !== 'win32') return undefined
  const root = path.join(process.env.ProgramFiles || 'C:/Program Files', 'MongoDB', 'Server')
  if (!existsSync(root)) return undefined
  const versions = readdirSync(root).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  return versions.map(version => path.join(root, version, 'bin', 'mongod.exe')).find(file => existsSync(file))
}
