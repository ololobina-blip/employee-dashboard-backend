import 'dotenv/config'
import cron from 'node-cron'
import { createApp } from './app'
import { config } from './config'
import { closePool } from './db'
import { isSyncRunning, syncSheets } from './sync-sheets'

async function runScheduledSync(): Promise<void> {
  if (isSyncRunning()) {
    console.log('[SYNC] Skip scheduled run — already in progress')
    return
  }

  try {
    await syncSheets()
  } catch (error) {
    console.error('[SYNC] Scheduled sync failed:', error)
  }
}

async function start(): Promise<void> {
  const app = await createApp()

  await app.listen({
    port: config.server.port,
    host: config.server.host,
  })

  console.log(`[SERVER] http://${config.server.host}:${config.server.port}`)
  console.log(`[SERVER] API ${config.server.apiPrefix}`)
  if (config.server.frontendUrl) {
    console.log(`[SERVER] Frontend (CORS): ${config.server.frontendUrl}`)
  } else {
    console.log('[SERVER] FRONTEND_URL not set — CORS allows all origins (*)')
  }

  if (config.sync.runOnStart) {
    void runScheduledSync()
  }

  cron.schedule(config.sync.cron, () => {
    void runScheduledSync()
  })

  console.log(`[SYNC] Cron: ${config.sync.cron}`)
}

const shutdown = async () => {
  console.log('[SERVER] Shutting down...')
  await closePool()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())

start().catch((error) => {
  console.error('[SERVER] Failed to start:', error)
  process.exit(1)
})
