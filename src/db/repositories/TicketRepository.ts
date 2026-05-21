import { getPool } from '../mariadb'
import logger from '@utils/logger'

export interface Ticket {
  id?: number
  employee_email: string
  ticket_id: string
  date: string
  title?: string
  status: 'resolved' | 'pending' | 'closed'
  category?: string
  ai_score?: number
  ai_comment?: string
  errors?: string
  response_time?: number
  synced_at?: Date
  created_at?: Date
  updated_at?: Date
}

export class TicketRepository {
  async findById(id: number): Promise<Ticket | null> {
    try {
      const query = 'SELECT * FROM tickets WHERE id = ?'
      const [rows] = await getPool().execute(query, [id])
      const result = rows as any[]
      return result.length > 0 ? result[0] : null
    } catch (error) {
      logger.error(`Error finding ticket by id: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByTicketId(ticketId: string): Promise<Ticket | null> {
    try {
      const query = 'SELECT * FROM tickets WHERE ticket_id = ?'
      const [rows] = await getPool().execute(query, [ticketId])
      const result = rows as any[]
      return result.length > 0 ? result[0] : null
    } catch (error) {
      logger.error(`Error finding ticket by ticket_id: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByEmployeeEmail(email: string): Promise<Ticket[]> {
    try {
      const query = 'SELECT * FROM tickets WHERE employee_email = ? ORDER BY date DESC'
      const [rows] = await getPool().execute(query, [email])
      return rows as Ticket[]
    } catch (error) {
      logger.error(`Error finding tickets by employee email: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Ticket[]> {
    try {
      const query = 'SELECT * FROM tickets WHERE date >= ? AND date <= ? ORDER BY date DESC'
      const [rows] = await getPool().execute(query, [startDate, endDate])
      return rows as Ticket[]
    } catch (error) {
      logger.error(`Error finding tickets by date range: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByStatus(status: string): Promise<Ticket[]> {
    try {
      const query = 'SELECT * FROM tickets WHERE status = ? ORDER BY date DESC'
      const [rows] = await getPool().execute(query, [status])
      return rows as Ticket[]
    } catch (error) {
      logger.error(`Error finding tickets by status: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findAll(limit?: number, offset?: number): Promise<Ticket[]> {
    try {
      let query = 'SELECT * FROM tickets ORDER BY date DESC'
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
      return rows as Ticket[]
    } catch (error) {
      logger.error(`Error finding all tickets: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async create(ticket: Ticket): Promise<number> {
    try {
      const query =
        'INSERT INTO tickets (employee_email, ticket_id, date, title, status, category, ai_score, ai_comment, errors, response_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      const [result] = await getPool().execute(query, [
        ticket.employee_email,
        ticket.ticket_id,
        ticket.date,
        ticket.title,
        ticket.status,
        ticket.category,
        ticket.ai_score,
        ticket.ai_comment,
        ticket.errors,
        ticket.response_time,
      ])
      const insertResult = result as any
      logger.info(`Ticket created: ${ticket.ticket_id}`)
      return insertResult.insertId
    } catch (error) {
      logger.error(`Error creating ticket: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async update(id: number, ticket: Partial<Ticket>): Promise<void> {
    try {
      const fields: string[] = []
      const values: any[] = []

      if (ticket.title !== undefined) {
        fields.push('title = ?')
        values.push(ticket.title)
      }
      if (ticket.status !== undefined) {
        fields.push('status = ?')
        values.push(ticket.status)
      }
      if (ticket.category !== undefined) {
        fields.push('category = ?')
        values.push(ticket.category)
      }
      if (ticket.ai_score !== undefined) {
        fields.push('ai_score = ?')
        values.push(ticket.ai_score)
      }
      if (ticket.ai_comment !== undefined) {
        fields.push('ai_comment = ?')
        values.push(ticket.ai_comment)
      }
      if (ticket.errors !== undefined) {
        fields.push('errors = ?')
        values.push(ticket.errors)
      }
      if (ticket.response_time !== undefined) {
        fields.push('response_time = ?')
        values.push(ticket.response_time)
      }

      if (fields.length === 0) return

      values.push(id)
      const query = `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`
      await getPool().execute(query, values)
      logger.info(`Ticket updated: ${id}`)
    } catch (error) {
      logger.error(`Error updating ticket: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async deleteById(id: number): Promise<void> {
    try {
      const query = 'DELETE FROM tickets WHERE id = ?'
      await getPool().execute(query, [id])
      logger.info(`Ticket deleted: ${id}`)
    } catch (error) {
      logger.error(`Error deleting ticket: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async count(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM tickets'
      const [rows] = await getPool().execute(query)
      const result = rows as any[]
      return result[0]?.count || 0
    } catch (error) {
      logger.error(`Error counting tickets: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async truncate(): Promise<void> {
    try {
      const query = 'TRUNCATE TABLE tickets'
      await getPool().execute(query)
      logger.info('Tickets table truncated')
    } catch (error) {
      logger.error(`Error truncating tickets table: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
}

export default new TicketRepository()
