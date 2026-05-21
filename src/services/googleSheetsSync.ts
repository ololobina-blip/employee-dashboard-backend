import config from '@config'
import TicketModel from '@models/Ticket'
import ClientRatingModel from '@models/ClientRating'
import AppealModel from '@models/Appeal'
import logger from '@utils/logger'

const CHAT_SHEET_NAME = 'Общий лист с оценкой тест'
const CALLS_SHEET_NAME = 'Оценка звонков'
const CLIENT_RATINGS_SHEET_NAME = 'оценки клиентов'

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

const parseTicketDate = (dateStr: string): string => {
  if (!dateStr || !dateStr.trim()) return new Date().toISOString().split('T')[0]
  
  try {
    const trimmed = dateStr.trim()
    const parts = trimmed.split(' ')
    const datePart = parts[0]
    
    if (datePart.includes('.')) {
      const [day, month, year] = datePart.split('.')
      if (day && month && year) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }
    
    return new Date(trimmed).toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

const extractMonthYear = (dateStr: string): string => {
  try {
    const trimmed = dateStr.trim()
    const match = trimmed.match(/(\d{1,2})\/(\d{4})/)
    if (match) {
      return `${match[1]}/${match[2]}`
    }
    
    const date = new Date(trimmed)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${year}`
  } catch {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    return `${month}/${year}`
  }
}

const mapAppealStatus = (statusStr: string): 'pending' | 'approved' | 'rejected' => {
  const status = statusStr?.toLowerCase().trim() || ''
  
  if (status === 'принята') {
    return 'approved'
  }
  if (status === 'отклонена') {
    return 'rejected'
  }
  
  // 'pending' или пусто = pending
  return 'pending'
}

export async function syncTicketsFromGoogleSheets(): Promise<void> {
  try {
    logger.info('Starting tickets sync from Google Sheets...')
    await syncTicketsBySheet(CHAT_SHEET_NAME, 'chat')
    await syncTicketsBySheet(CALLS_SHEET_NAME, 'calls')
    logger.info('Tickets sync completed successfully')
  } catch (error) {
    logger.error(`Error syncing tickets: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

async function syncTicketsBySheet(sheetName: string, source: 'chat' | 'calls'): Promise<void> {
  try {
    const range = `${sheetName}!A2:K`
    const rows = await fetchSheetData(range)

    if (!rows || rows.length === 0) {
      logger.warn(`No data found in sheet: ${sheetName}`)
      return
    }

    const tickets = rows
      .filter((row) => row.length >= 9 && row[0] && row[2])
      .map((row: string[]) => {
        const monthYear = row[1]?.trim() || extractMonthYear(row[0])
        
        return {
          date: parseTicketDate(row[0]),
          monthYear: monthYear,
          employeeName: row[2]?.trim() || '',
          etiquetteComment: row[3]?.trim() || '0 —',
          solutionComment: row[4]?.trim() || '0 —',
          speedComment: row[5]?.trim() || '0 —',
          availabilityComment: row[6]?.trim() || '0 —',
          participationComment: row[7]?.trim() || '0 —',
          totalScore: parseFloat(row[8]) || 0,
          link: source === 'chat' ? (row[9]?.trim() || '') : '',
          callerNumber: source === 'calls' ? (row[9]?.trim() || '') : undefined,
          executionLink: source === 'calls' ? (row[10]?.trim() || '') : undefined,
          source,
          syncedAt: new Date(),
        }
      })
      .filter((ticket) => ticket.monthYear && ticket.monthYear.trim())

    await TicketModel.deleteMany({ source })

    if (tickets.length > 0) {
      await TicketModel.insertMany(tickets)
      logger.info(`Synced ${tickets.length} tickets from ${sheetName}`)
    } else {
      logger.warn(`No valid tickets found in ${sheetName}`)
    }
  } catch (error) {
    logger.error(`Error syncing tickets from ${sheetName}: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export async function syncAppealsFromGoogleSheets(): Promise<void> {
  try {
    logger.info('Starting appeals sync from Google Sheets...')
    await syncAppealsBySheet(CHAT_SHEET_NAME, 'chat')
    await syncAppealsBySheet(CALLS_SHEET_NAME, 'calls')
    logger.info('Appeals sync completed successfully')
  } catch (error) {
    logger.error(`Error syncing appeals: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

async function syncAppealsBySheet(sheetName: string, source: 'chat' | 'calls'): Promise<void> {
  try {
    const range = `${sheetName}!A2:Q`
    const rows = await fetchSheetData(range)

    if (!rows || rows.length === 0) {
      logger.warn(`No data found in sheet: ${sheetName}`)
      return
    }

    // Структура колонок:
    // 0: Дата
    // 1: МЕСЯЦ/ГОД
    // 2: Сотрудник
    // 3-7: Оценки (ЭТИКЕТ, РЕШЕНИЕ, СКОРОСТЬ, ДОСТУПНОСТЬ, УЧАСТИЕ)
    // 8: Итоговый балл
    // 9: Ссылка/Номер звонящего
    // 10: Аппеляция (да/нет)
    // 11: Дата подачи
    // 12: Комментарий
    // 13: Статус (pending/Принята/Отклонена)
    // 14: Дата рассмотрения
    // 15: Кто рассмотрел

    const appeals = rows
      .filter((row) => {
        // Фильтруем только те строки где есть апелляция
        const hasAppeal = row[10]?.toLowerCase().trim() === 'да'
        return row.length >= 13 && row[0] && row[2] && hasAppeal
      })
      .map((row: string[]) => {
        const ticketDate = parseTicketDate(row[0])
        const monthYear = row[1]?.trim() || extractMonthYear(row[0])
        const employeeName = row[2]?.trim() || ''
        
        // Создаём уникальный ID апелляции
        const ticketIdentifier = source === 'chat' ? (row[9]?.trim() || '') : `call:${row[9]?.trim() || ''}`
        const appealId = `${employeeName}-${ticketIdentifier}-${ticketDate}`

        const resolvedAtStr = row[14]?.trim()
        const resolvedByStr = row[15]?.trim()

        return {
          id: appealId,
          ticketLink: ticketIdentifier,
          employeeName: employeeName,
          date: ticketDate,
          monthYear: monthYear,
          comment: row[12]?.trim() || '',
          status: mapAppealStatus(row[13] || ''),
          submittedAt: row[11] ? parseTicketDate(row[11]) : new Date().toISOString(),
          resolvedAt: resolvedAtStr ? parseTicketDate(resolvedAtStr) : undefined,
          resolvedBy: resolvedByStr ? resolvedByStr : undefined,
          syncedToGoogleSheets: true,
        }
      })

    if (appeals.length > 0) {
      for (const appeal of appeals) {
        await AppealModel.updateOne(
          { id: appeal.id },
          appeal,
          { upsert: true }
        )
      }
      logger.info(`Synced ${appeals.length} appeals from ${sheetName}`)
    } else {
      logger.info(`No appeals found in ${sheetName}`)
    }
  } catch (error) {
    logger.error(`Error syncing appeals from ${sheetName}: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export async function syncClientRatingsFromGoogleSheets(): Promise<void> {
  try {
    logger.info('Starting client ratings sync from Google Sheets...')

    const rows = await fetchSheetData(`${CLIENT_RATINGS_SHEET_NAME}!A2:D`)

    if (!rows || rows.length === 0) {
      logger.warn('No client ratings found')
      return
    }

    const ratings = rows
      .filter((row) => row.length >= 4 && row[0] && row[3])
      .map((row: string[]) => ({
        date: parseTicketDate(row[0]),
        comment: row[1]?.trim() || '',
        rating: Math.min(5, Math.max(1, parseInt(row[2]) || 1)),
        responsible: row[3]?.trim() || '',
        syncedAt: new Date(),
      }))

    await ClientRatingModel.deleteMany({})

    if (ratings.length > 0) {
      await ClientRatingModel.insertMany(ratings)
      logger.info(`Synced ${ratings.length} client ratings`)
    } else {
      logger.warn('No valid client ratings found')
    }

    logger.info('Client ratings sync completed successfully')
  } catch (error) {
    logger.error(`Error syncing client ratings: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}