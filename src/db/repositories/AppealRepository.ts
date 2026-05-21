import { getPool } from '../mariadb'
import logger from '@utils/logger'

export interface Appeal {
  id?: number
  employee_email: string
  appeal_id: string
  date: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'closed'
  resolution_date?: string
  resolution_notes?: string
  created_at?: Date
  updated_at?: Date
}

export class AppealRepository {
  async create(appeal: Appeal): Promise<number> {
    try {
      const query =
        'INSERT INTO appeals (employee_email, appeal_id, date, reason, status, resolution_date, resolution_notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
      const [result] = await getPool().execute(query, [
        appeal.employee_email,
        appeal.appeal_id,
        appeal.date,
        appeal.reason || null,
        appeal.status,
        appeal.resolution_date || null,
        appeal.resolution_notes || null,
      ])
      const insertResult = result as any
      logger.info(`Appeal created: ${appeal.appeal_id}`)
      return insertResult.insertId
    } catch (error) {
      logger.error(`Error creating appeal: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findById(id: number): Promise<Appeal | null> {
    try {
      const query = 'SELECT * FROM appeals WHERE id = ?'
      const [rows] = await getPool().execute(query, [id])
      const result = rows as any[]
      return result.length > 0 ? result[0] : null
    } catch (error) {
      logger.error(`Error finding appeal by id: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByAppealId(appealId: string): Promise<Appeal | null> {
    try {
      const query = 'SELECT * FROM appeals WHERE appeal_id = ?'
      const [rows] = await getPool().execute(query, [appealId])
      const result = rows as any[]
      return result.length > 0 ? result[0] : null
    } catch (error) {
      logger.error(`Error finding appeal by appeal_id: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByEmployeeEmail(email: string): Promise<Appeal[]> {
    try {
      const query = 'SELECT * FROM appeals WHERE employee_email = ? ORDER BY date DESC'
      const [rows] = await getPool().execute(query, [email])
      return rows as Appeal[]
    } catch (error) {
      logger.error(`Error finding appeals by employee: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByStatus(status: string): Promise<Appeal[]> {
    try {
      const query = 'SELECT * FROM appeals WHERE status = ? ORDER BY date DESC'
      const [rows] = await getPool().execute(query, [status])
      return rows as Appeal[]
    } catch (error) {
      logger.error(`Error finding appeals by status: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Appeal[]> {
    try {
      const query = 'SELECT * FROM appeals WHERE date BETWEEN ? AND ? ORDER BY date DESC'
      const [rows] = await getPool().execute(query, [startDate, endDate])
      return rows as Appeal[]
    } catch (error) {
      logger.error(`Error finding appeals by date range: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findAll(limit?: number, offset?: number): Promise<Appeal[]> {
    try {
      let query = 'SELECT * FROM appeals ORDER BY date DESC'
      const values: any[] = []

      if (limit !== undefined) {
        query += ' LIMIT ?'
        values.push(limit)
        if (offset !== undefined) {
          query += ' OFFSET ?'
          values.push(offset)
        }
      }

      const [rows] = await getPool().execute(query, values)
      return rows as Appeal[]
    } catch (error) {
      logger.error(`Error finding all appeals: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async update(id: number, appeal: Partial<Appeal>): Promise<void> {
    try {
      const fields: string[] = []
      const values: any[] = []

      if (appeal.status !== undefined) {
        fields.push('status = ?')
        values.push(appeal.status)
      }
      if (appeal.resolution_date !== undefined) {
        fields.push('resolution_date = ?')
        values.push(appeal.resolution_date || null)
      }
      if (appeal.resolution_notes !== undefined) {
        fields.push('resolution_notes = ?')
        values.push(appeal.resolution_notes || null)
      }

      if (fields.length === 0) return

      values.push(id)
      const query = `UPDATE appeals SET ${fields.join(', ')} WHERE id = ?`
      await getPool().execute(query, values)
      logger.info(`Appeal updated: ${id}`)
    } catch (error) {
      logger.error(`Error updating appeal: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async deleteById(id: number): Promise<void> {
    try {
      const query = 'DELETE FROM appeals WHERE id = ?'
      await getPool().execute(query, [id])
      logger.info(`Appeal deleted: ${id}`)
    } catch (error) {
      logger.error(`Error deleting appeal: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async count(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM appeals'
      const [rows] = await getPool().execute(query)
      const result = rows as any[]
      return result[0]?.count || 0
    } catch (error) {
      logger.error(`Error counting appeals: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async truncate(): Promise<void> {
    try {
      const query = 'TRUNCATE TABLE appeals'
      await getPool().execute(query)
      logger.info('Appeals table truncated')
    } catch (error) {
      logger.error(`Error truncating appeals table: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
}

export default new AppealRepository()
