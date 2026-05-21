import 'dotenv/config'
import config from '@config'
import { createApp } from './app'
import { initDatabase, closeDatabase } from '@db'
import {
  syncTicketsFromGoogleSheets,
  syncClientRatingsFromGoogleSheets,
  syncAppealsFromGoogleSheets
} from '@services/googleSheetsSync'
import cron from 'node-cron'
import logger from '@utils/logger'

async function start() {
  try {
    const app = await createApp()
    await app.listen({ port: config.port, host: '0.0.0.0' })

    console.log(`[SERVER] Running on http://localhost:${config.port}${config.apiPrefix}`)
  } catch (error) {
    console.error('[SERVER] Failed to start:', error)
    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  console.log('[SERVER] Shutting down...')
  process.exit(0)
})

start()
