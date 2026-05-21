import { getPool } from '../mariadb'
import logger from '@utils/logger'

export interface SyncLog {
  id?: number
  sync_type: string
  status: 'success' | 'failed'
  rows_affected?: number
  error_message?: string
  synced_at?: Date
}

export class SyncLogRepository {
  async create(log: SyncLog): Promise<number> {
    try {
      const query =
        'INSERT INTO sync_logs (sync_type, status, rows_affected, error_message) VALUES (?, ?, ?, ?)'
      const [result] = await getPool().execute(query, [
        log.sync_type,
        log.status,
        log.rows_affected || 0,
        log.error_message || null,
      ])
      const insertResult = result as any
      logger.info(`Sync log created: ${log.sync_type} - ${log.status}`)
      return insertResult.insertId
    } catch (error) {
      logger.error(`Error creating sync log: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findLatestByType(syncType: string): Promise<SyncLog | null> {
    try {
      const query = 'SELECT * FROM sync_logs WHERE sync_type = ? ORDER BY synced_at DESC LIMIT 1'
      const [rows] = await getPool().execute(query, [syncType])
      const result = rows as any[]
      return result.length > 0 ? result[0] : null
    } catch (error) {
      logger.error(`Error finding latest sync log: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByType(syncType: string, limit?: number): Promise<SyncLog[]> {
    try {
      let query = 'SELECT * FROM sync_logs WHERE sync_type = ? ORDER BY synced_at DESC'
      const values: any[] = [syncType]

      if (limit !== undefined) {
        query += ' LIMIT ?'
        values.push(limit)
      }

      const [rows] = await getPool().execute(query, values)
      return rows as SyncLog[]
    } catch (error) {
      logger.error(`Error finding sync logs by type: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findAll(limit?: number): Promise<SyncLog[]> {
    try {
      let query = 'SELECT * FROM sync_logs ORDER BY synced_at DESC'
      const values: any[] = []

      if (limit !== undefined) {
        query += ' LIMIT ?'
        values.push(limit)
      }

      const [rows] = await getPool().execute(query, values)
      return rows as SyncLog[]
    } catch (error) {
      logger.error(`Error finding all sync logs: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async deleteOlderThan(days: number): Promise<void> {
    try {
      const query =
        'DELETE FROM sync_logs WHERE synced_at < DATE_SUB(NOW(), INTERVAL ? DAY)'
      await getPool().execute(query, [days])
      logger.info(`Sync logs older than ${days} days deleted`)
    } catch (error) {
      logger.error(`Error deleting old sync logs: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async truncate(): Promise<void> {
    try {
      const query = 'TRUNCATE TABLE sync_logs'
      await getPool().execute(query)
      logger.info('Sync logs table truncated')
    } catch (error) {
      logger.error(`Error truncating sync logs table: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
}

export default new SyncLogRepository()
