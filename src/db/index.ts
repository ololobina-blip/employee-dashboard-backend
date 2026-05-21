import mongoose from 'mongoose'
import config from '@config'

export async function initDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri, {
      retryWrites: true,
      w: 'majority',
    })
    console.log('[DB] Connected to MongoDB')
  } catch (error) {
    console.error('[DB] Failed to connect to MongoDB:', error)
    throw error
  }
}

export async function closeDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    console.log('[DB] Database connection closed')
  }
}

export default {
  initDatabase,
  closeDatabase,
}
