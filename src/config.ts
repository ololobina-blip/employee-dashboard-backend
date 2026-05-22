import 'dotenv/config'

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parseCorsOrigins(): string[] | true {
  const fromEnv = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
  ]
    .filter(Boolean)
    .join(',')

  if (!fromEnv.trim() || fromEnv.trim() === '*') {
    return true
  }

  return [...new Set(fromEnv.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean))]
}

export const config = {
  server: {
    port: Number.parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    /** URL дашборда на Vercel — для CORS и подсказок API */
    frontendUrl: (process.env.FRONTEND_URL || '').trim().replace(/\/$/, ''),
    corsOrigins: parseCorsOrigins(),
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'dashboard_user',
    password: process.env.DB_PASSWORD || 'dashboard_pass_2026',
    database: process.env.DB_NAME || 'employee_dashboard',
  },
  google: {
    get sheetId() {
      return requireEnv('GOOGLE_SHEETS_ID')
    },
    get apiKey() {
      return requireEnv('GOOGLE_API_KEY')
    },
  },
  sync: {
    cron: process.env.SYNC_CRON || '0 * * * *',
    runOnStart: process.env.SYNC_ON_START !== 'false',
  },
}
