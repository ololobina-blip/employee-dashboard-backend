export const API_PREFIX = '/api/v1'
export const JWT_EXPIRATION = '24h'
export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

// HTTP
export const DEFAULT_CORS_ORIGIN = 'http://localhost:5173'

// Database
export const DB_CONNECTION_TIMEOUT = 10_000
export const DB_QUERY_TIMEOUT = 30_000
