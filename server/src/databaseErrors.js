// Inspect nested driver errors, but return only fixed messages and known codes.
// Raw MongoDB messages can contain connection details and must never be logged.
function errorChain(root) {
  const pending = [root]
  const visited = new Set()
  const errors = []
  while (pending.length && errors.length < 40) {
    const error = pending.shift()
    if (!error || typeof error !== 'object' || visited.has(error)) continue
    visited.add(error)
    errors.push(error)
    pending.push(error.cause, error.reason, error.error)
    if (error.servers instanceof Map) {
      for (const server of error.servers.values()) pending.push(server.error)
    }
  }
  return errors
}

export function diagnoseDatabaseError(error) {
  const chain = errorChain(error)
  const has = pattern => chain.some(item => pattern.test(String(item.message || '')))
  const code = value => chain.some(item => item.code === value)
  if (has(/^MISSING_DATABASE_CONFIGURATION$/)) return {
    kind: 'configuration', message: 'MONGODB_URI is missing. Configure it in server/.env.',
  }
  if (chain.some(item => item.name === 'MongoParseError')) return {
    kind: 'configuration', message: 'MONGODB_URI is not a valid MongoDB connection string. Check its format in server/.env and URL-encode the username and password.',
  }
  if (code(18) || code(8000) && has(/bad auth|authentication/i) || has(/authentication failed|bad auth/i)) return {
    kind: 'authentication', message: 'Atlas rejected database authentication. Check the database username and password in server/.env, remove leftover template brackets, and URL-encode password characters. Use the Atlas database user, not the Atlas website login.',
  }
  if (code('ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR') || has(/tlsv1 alert internal error|SSL alert number 80/i)) return {
    kind: 'tls', code: 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR', message: 'The TLS connection to Atlas was rejected before login. In Atlas Network Access / IP Access List, check that this computer\'s CURRENT public IP is allowed and the entry is Active. If it is already allowed, check VPN, firewall or TLS-inspection settings and cluster availability. This error alone does not prove which network setting is responsible.',
  }
  if (has(/certificate|TLS|SSL/i) || code('CERT_HAS_EXPIRED') || code('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) return {
    kind: 'tls', message: 'MongoDB TLS negotiation failed before login. Check the runtime certificate store, system clock and any TLS-inspecting network proxy.',
  }
  if (has(/querySrv|queryTxt|ENOTFOUND|EAI_AGAIN/i) || code('ENOTFOUND') || code('EAI_AGAIN')) return {
    kind: 'dns', message: 'MongoDB DNS lookup failed. Check the cluster hostname and DNS resolver. Run npm run db:check to compare system DNS with the project resolvers.',
  }
  if (code(13)) return {
    kind: 'authorization', message: 'MongoDB login succeeded but the database user lacks permission for this operation. Check its access to the application database in Atlas Database Access.',
  }
  if (code(11000)) return {
    kind: 'index', message: 'Database initialization found duplicate values for a unique index. Review existing database records before changing them.',
  }
  return {
    kind: 'network', message: 'MongoDB could not be reached. Check cluster availability, the current IP access-list entry and outbound network access. Run npm run db:check for a credential-safe diagnosis.',
  }
}

export const getDatabaseFailureAdvice = error => diagnoseDatabaseError(error).message
