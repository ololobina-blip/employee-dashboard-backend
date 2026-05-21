import config from '@config'
import EmployeeRepository from '@db/repositories/EmployeeRepository'
import TicketRepository from '@db/repositories/TicketRepository'
import AppealRepository from '@db/repositories/AppealRepository'
import SyncLogRepository from '@db/repositories/SyncLogRepository'
import logger from '@utils/logger'

const EMPLOYEES_SHEET_NAME = 'Employees'
const TICKETS_SHEET_NAME = 'Tickets'
const APPEALS_SHEET_NAME = 'Appeals'

async function fetchSheetData(range: string): Promise<string[][]> {
  if (!config.googleSpreadsheetId || !config.googleSheetsApiKey) {
    throw new Error('Google Sheets credentials not configured')
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.googleSpreadsheetId}/values/${encodeURIComponent(range)}?key=${config.googleSheetsApiKey}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const error = await response.json() as { error?: { message?: string } }
      throw new Error(`Failed to fetch data: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json() as { values?: string[][] }
    return data.values || []
  } catch (error) {
    logger.error(`Error fetching from Google Sheets: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

const parseDate = (dateStr: string): string => {
  if (!dateStr || !dateStr.trim()) return new Date().toISOString().split('T')[0]

  try {
    const trimmed = dateStr.trim()
    const parts = trimmed.split(' ')
    const datePart = parts[0]

    if (datePart.includes('-')) {
      // Already in YYYY-MM-DD format
      if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return datePart
      }
    }

    if (datePart.includes('.')) {
      const [day, month, year] = datePart.split('.')
      if (day && month && year) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }

    const date = new Date(trimmed)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }

    return new Date().toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

export async function syncEmployeesFromGoogleSheets(): Promise<void> {
  let rowsAffected = 0
  try {
    logger.info('Starting employees sync from Google Sheets...')

    const range = `${EMPLOYEES_SHEET_NAME}!A2:D`
    const rows = await fetchSheetData(range)

    if (!rows || rows.length === 0) {
      logger.warn('No employee data found in Google Sheets')
      await SyncLogRepository.create({
        sync_type: 'employees',
        status: 'success',
        rows_affected: 0,
      })
      return
    }

    await EmployeeRepository.truncate()

    for (const row of rows) {
      if (row.length >= 1 && row[0]?.trim()) {
        try {
          const email = row[0].trim()
          const name = row[1]?.trim() || email
          const role = row[2]?.trim() || null
          const department = row[3]?.trim() || null

          await EmployeeRepository.create({
            email,
            name,
            role: role || undefined,
            department: department || undefined,
          })

          rowsAffected++
        } catch (error) {
          logger.warn(`Error syncing employee row: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    logger.info(`Employees sync completed: ${rowsAffected} employees synced`)
    await SyncLogRepository.create({
      sync_type: 'employees',
      status: 'success',
      rows_affected: rowsAffected,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error syncing employees: ${errorMessage}`)
    await SyncLogRepository.create({
      sync_type: 'employees',
      status: 'failed',
      rows_affected: rowsAffected,
      error_message: errorMessage,
    })
    throw error
  }
}

export async function syncTicketsFromGoogleSheets(): Promise<void> {
  let rowsAffected = 0
  try {
    logger.info('Starting tickets sync from Google Sheets...')

    const range = `${TICKETS_SHEET_NAME}!A2:J`
    const rows = await fetchSheetData(range)

    if (!rows || rows.length === 0) {
      logger.warn('No ticket data found in Google Sheets')
      await SyncLogRepository.create({
        sync_type: 'tickets',
        status: 'success',
        rows_affected: 0,
      })
      return
    }

    await TicketRepository.truncate()

    for (const row of rows) {
      if (row.length >= 3 && row[0]?.trim() && row[1]?.trim()) {
        try {
          const employeeEmail = row[0].trim()
          const ticketId = row[1].trim()
          const date = parseDate(row[2])
          const title = row[3]?.trim() || ''
          const status = (row[4]?.trim().toLowerCase() as 'resolved' | 'pending' | 'closed') || 'pending'
          const category = row[5]?.trim() || ''
          const aiScore = row[6] ? parseFloat(row[6]) : undefined
          const aiComment = row[7]?.trim() || ''
          const errors = row[8]?.trim() || ''
          const responseTime = row[9] ? parseFloat(row[9]) : undefined

          // Validate status
          if (!['resolved', 'pending', 'closed'].includes(status)) {
            logger.warn(`Invalid status for ticket ${ticketId}: ${status}`)
            continue
          }

          await TicketRepository.create({
            employee_email: employeeEmail,
            ticket_id: ticketId,
            date,
            title,
            status,
            category,
            ai_score: aiScore,
            ai_comment: aiComment,
            errors,
            response_time: responseTime,
          })

          rowsAffected++
        } catch (error) {
          logger.warn(`Error syncing ticket row: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    logger.info(`Tickets sync completed: ${rowsAffected} tickets synced`)
    await SyncLogRepository.create({
      sync_type: 'tickets',
      status: 'success',
      rows_affected: rowsAffected,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error syncing tickets: ${errorMessage}`)
    await SyncLogRepository.create({
      sync_type: 'tickets',
      status: 'failed',
      rows_affected: rowsAffected,
      error_message: errorMessage,
    })
    throw error
  }
}

export async function syncAppealsFromGoogleSheets(): Promise<void> {
  let rowsAffected = 0
  try {
    logger.info('Starting appeals sync from Google Sheets...')

    const range = `${APPEALS_SHEET_NAME}!A2:H`
    const rows = await fetchSheetData(range)

    if (!rows || rows.length === 0) {
      logger.warn('No appeal data found in Google Sheets')
      await SyncLogRepository.create({
        sync_type: 'appeals',
        status: 'success',
        rows_affected: 0,
      })
      return
    }

    await AppealRepository.truncate()

    for (const row of rows) {
      if (row.length >= 2 && row[0]?.trim() && row[1]?.trim()) {
        try {
          const employeeEmail = row[0].trim()
          const appealId = row[1].trim()
          const date = parseDate(row[2])
          const reason = row[3]?.trim() || ''
          const status = (row[4]?.trim().toLowerCase() as 'pending' | 'approved' | 'rejected' | 'closed') || 'pending'
          const resolutionDate = row[5] ? parseDate(row[5]) : undefined
          const resolutionNotes = row[6]?.trim() || ''

          // Validate status
          if (!['pending', 'approved', 'rejected', 'closed'].includes(status)) {
            logger.warn(`Invalid status for appeal ${appealId}: ${status}`)
            continue
          }

          await AppealRepository.create({
            employee_email: employeeEmail,
            appeal_id: appealId,
            date,
            reason: reason || undefined,
            status,
            resolution_date: resolutionDate,
            resolution_notes: resolutionNotes || undefined,
          })

          rowsAffected++
        } catch (error) {
          logger.warn(`Error syncing appeal row: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    logger.info(`Appeals sync completed: ${rowsAffected} appeals synced`)
    await SyncLogRepository.create({
      sync_type: 'appeals',
      status: 'success',
      rows_affected: rowsAffected,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error syncing appeals: ${errorMessage}`)
    await SyncLogRepository.create({
      sync_type: 'appeals',
      status: 'failed',
      rows_affected: rowsAffected,
      error_message: errorMessage,
    })
    throw error
  }
}

// Legacy functions for compatibility (if still used elsewhere)
export async function syncClientRatingsFromGoogleSheets(): Promise<void> {
  logger.info('syncClientRatingsFromGoogleSheets called but not implemented for MariaDB')
}
