import cron from 'node-cron'
import logger from '@utils/logger'
import {
  syncEmployeesFromGoogleSheets,
  syncTicketsFromGoogleSheets,
  syncAppealsFromGoogleSheets,
} from './googleSheetsSync.mariadb'

export interface CronJob {
  start(): void
  stop(): void
  running: boolean
}

class GoogleSheetsSyncScheduler {
  private employeesSyncJob: cron.ScheduledTask | null = null
  private ticketsSyncJob: cron.ScheduledTask | null = null
  private appealsSyncJob: cron.ScheduledTask | null = null

  // Every hour at minute 0
  private readonly SYNC_CRON_EXPRESSION = '0 * * * *'

  start(): void {
    try {
      // Sync employees every hour
      this.employeesSyncJob = cron.schedule(this.SYNC_CRON_EXPRESSION, async () => {
        try {
          logger.info('Starting scheduled employees sync...')
          await syncEmployeesFromGoogleSheets()
          logger.info('Scheduled employees sync completed successfully')
        } catch (error) {
          logger.error(
            `Scheduled employees sync failed: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      })

      // Sync tickets every hour (5 minutes after employees)
      this.ticketsSyncJob = cron.schedule('5 * * * *', async () => {
        try {
          logger.info('Starting scheduled tickets sync...')
          await syncTicketsFromGoogleSheets()
          logger.info('Scheduled tickets sync completed successfully')
        } catch (error) {
          logger.error(`Scheduled tickets sync failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      })

      // Sync appeals every hour (10 minutes after employees)
      this.appealsSyncJob = cron.schedule('10 * * * *', async () => {
        try {
          logger.info('Starting scheduled appeals sync...')
          await syncAppealsFromGoogleSheets()
          logger.info('Scheduled appeals sync completed successfully')
        } catch (error) {
          logger.error(`Scheduled appeals sync failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      })

      logger.info('Google Sheets sync scheduler started')
      console.log('[SCHEDULER] Google Sheets sync jobs scheduled')
    } catch (error) {
      logger.error(`Error starting scheduler: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  stop(): void {
    if (this.employeesSyncJob) {
      this.employeesSyncJob.stop()
      this.employeesSyncJob = null
    }
    if (this.ticketsSyncJob) {
      this.ticketsSyncJob.stop()
      this.ticketsSyncJob = null
    }
    if (this.appealsSyncJob) {
      this.appealsSyncJob.stop()
      this.appealsSyncJob = null
    }
    logger.info('Google Sheets sync scheduler stopped')
  }

  isRunning(): boolean {
    return (
      this.employeesSyncJob?.status === 'running' ||
      this.ticketsSyncJob?.status === 'running' ||
      this.appealsSyncJob?.status === 'running'
    )
  }
}

export default new GoogleSheetsSyncScheduler()
