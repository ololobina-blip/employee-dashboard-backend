export interface Config {
  nodeEnv: string
  port: number
  apiPrefix: string
  jwtSecret: string
  jwtExpiration: string
  corsOrigin: string
  mongoUri: string
  googleSheetsApiKey: string
  googleSpreadsheetId: string
}

export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_dashboard',
  googleSheetsApiKey: process.env.GOOGLE_API_KEY || '',
  googleSpreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
} as Config
