import axios from 'axios'
import { config } from './config'
import { createConnection } from './db'
import { parseSheetDate, formatRatingDate } from './services/dates'
import { parseSheetRows } from './services/ticketMapper'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

const CALLS_SHEET = 'Оценка звонков'
const CHAT_SHEET = 'Общий лист с оценкой тест'
const CLIENT_RATINGS_SHEET = 'оценки клиентов'

const SHEET_RANGE = 'A2:W'

let syncRunning = false

export function isSyncRunning(): boolean {
  return syncRunning
}

async function getSheetData(sheetName: string, range = SHEET_RANGE): Promise<string[][]> {
  const fullRange = `${sheetName}!${range}`
  const url = `${SHEETS_API}/${config.google.sheetId}/values/${encodeURIComponent(fullRange)}?key=${config.google.apiKey}`
  const response = await axios.get<{ values?: string[][] }>(url)
  return response.data.values || []
}

function toSqlDate(value: string): string {
  return parseSheetDate(value).toISOString().split('T')[0]
}

type DbConnection = Awaited<ReturnType<typeof createConnection>>

async function applySchemaUpdate(connection: DbConnection, label: string, sqls: string[]): Promise<void> {
  let lastError: unknown

  for (const sql of sqls) {
    try {
      await connection.query(sql)
      console.log(`[SYNC] Schema ok: ${label}`)
      return
    } catch (error) {
      lastError = error
    }
  }

  console.warn(`[SYNC] Schema update failed: ${label}`, lastError)
}

async function ensureSyncSchema(connection: DbConnection): Promise<void> {
  console.log('[SYNC] Ensuring DB schema for sync fields...')

  const updates: Array<{ label: string; sqls: string[] }> = [
    {
      label: 'appeals.id',
      sqls: [
        `ALTER TABLE appeals MODIFY COLUMN id VARCHAR(255) NOT NULL`,
        `ALTER TABLE appeals MODIFY COLUMN id VARCHAR(191) NOT NULL`,
      ],
    },

    {
      label: 'employees.name',
      sqls: [`ALTER TABLE employees MODIFY COLUMN name VARCHAR(255) NOT NULL`],
    },

    {
      label: 'tickets.employee_name',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN employee_name VARCHAR(255) NOT NULL`],
    },
    {
      label: 'tickets.source_type',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN source_type VARCHAR(50) NOT NULL`],
    },
    {
      label: 'tickets.ticket_datetime_raw',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN ticket_datetime_raw VARCHAR(100) NULL`],
    },
    {
      label: 'tickets.month_year',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN month_year VARCHAR(100) NULL`],
    },
    {
      label: 'tickets.etiquette_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN etiquette_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.solution_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN solution_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.speed_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN speed_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.availability_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN availability_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.participation_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN participation_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.original_etiquette_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN original_etiquette_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.original_solution_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN original_solution_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.original_speed_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN original_speed_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.original_availability_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN original_availability_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.original_participation_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN original_participation_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.revised_etiquette_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN revised_etiquette_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.revised_solution_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN revised_solution_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.revised_speed_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN revised_speed_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.revised_availability_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN revised_availability_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.revised_participation_comment',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN revised_participation_comment LONGTEXT NULL`],
    },
    {
      label: 'tickets.link',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN link LONGTEXT NULL`],
    },
    {
      label: 'tickets.caller_number',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN caller_number TEXT NULL`],
    },
    {
      label: 'tickets.execution_link',
      sqls: [`ALTER TABLE tickets MODIFY COLUMN execution_link LONGTEXT NULL`],
    },

    {
      label: 'appeals.employee_name',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN employee_name VARCHAR(255) NOT NULL`],
    },
    {
      label: 'appeals.month_year',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN month_year VARCHAR(100) NULL`],
    },
    {
      label: 'appeals.comment',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN comment LONGTEXT NULL`],
    },
    {
      label: 'appeals.review_comment',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN review_comment LONGTEXT NULL`],
    },
    {
      label: 'appeals.status',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN status VARCHAR(100) NULL`],
    },
    {
      label: 'appeals.ticket_link',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN ticket_link LONGTEXT NULL`],
    },
    {
      label: 'appeals.caller_number',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN caller_number TEXT NULL`],
    },
    {
      label: 'appeals.resolved_at',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN resolved_at VARCHAR(100) NULL`],
    },
    {
      label: 'appeals.resolved_by',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN resolved_by VARCHAR(255) NULL`],
    },
    {
      label: 'appeals.submitted_at',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN submitted_at VARCHAR(100) NULL`],
    },
    {
      label: 'appeals.new_etiquette_comment',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN new_etiquette_comment LONGTEXT NULL`],
    },
    {
      label: 'appeals.new_solution_comment',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN new_solution_comment LONGTEXT NULL`],
    },
    {
      label: 'appeals.new_speed_comment',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN new_speed_comment LONGTEXT NULL`],
    },
    {
      label: 'appeals.new_availability_comment',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN new_availability_comment LONGTEXT NULL`],
    },
    {
      label: 'appeals.new_participation_comment',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN new_participation_comment LONGTEXT NULL`],
    },
    {
      label: 'appeals.source_type',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN source_type VARCHAR(50) NULL`],
    },
    {
      label: 'appeals.source_sheet_name',
      sqls: [`ALTER TABLE appeals MODIFY COLUMN source_sheet_name VARCHAR(255) NULL`],
    },

    {
      label: 'client_ratings.comment',
      sqls: [`ALTER TABLE client_ratings MODIFY COLUMN comment LONGTEXT NULL`],
    },
    {
      label: 'client_ratings.responsible',
      sqls: [`ALTER TABLE client_ratings MODIFY COLUMN responsible VARCHAR(255) NOT NULL`],
    },

    {
      label: 'sync_logs.sync_type',
      sqls: [`ALTER TABLE sync_logs MODIFY COLUMN sync_type VARCHAR(100) NOT NULL`],
    },
    {
      label: 'sync_logs.status',
      sqls: [`ALTER TABLE sync_logs MODIFY COLUMN status VARCHAR(50) NOT NULL`],
    },
    {
      label: 'sync_logs.error_message',
      sqls: [`ALTER TABLE sync_logs MODIFY COLUMN error_message LONGTEXT NULL`],
    },
  ]

  for (const update of updates) {
    await applySchemaUpdate(connection, update.label, update.sqls)
  }
}

async function syncToDatabase(
  parsedRows: ReturnType<typeof parseSheetRows>,
  clientRatings: Array<{ date: string; comment: string; rating: number; responsible: string }>,
): Promise<void> {
  const connection = await createConnection()

  try {
    console.log('[SYNC] Starting database sync...')

    await ensureSyncSchema(connection)

    await connection.beginTransaction()
    await connection.query('DELETE FROM tickets')
    await connection.query('DELETE FROM appeals')
    await connection.query('DELETE FROM client_ratings')

    const employees = new Set<string>()
    parsedRows.forEach((r) => employees.add(r.ticket.employeeName))
    parsedRows.forEach((r) => {
      if (r.appeal) employees.add(r.appeal.employeeName)
    })
    clientRatings.forEach((r) => employees.add(r.responsible))

    let employeesInserted = 0
    for (const name of employees) {
      if (!name) continue
      await connection.query('INSERT IGNORE INTO employees (name) VALUES (?)', [name])
      employeesInserted++
    }

    let ticketsInserted = 0
    for (const row of parsedRows) {
      const t = row.ticket
      await connection.query(
        `INSERT INTO tickets (
          employee_name, source_type, \`date\`, ticket_datetime_raw, month_year,
          etiquette_comment, solution_comment, speed_comment, availability_comment, participation_comment, total_score,
          original_etiquette_comment, original_solution_comment, original_speed_comment,
          original_availability_comment, original_participation_comment, original_total_score,
          revised_etiquette_comment, revised_solution_comment, revised_speed_comment,
          revised_availability_comment, revised_participation_comment, revised_total_score,
          has_approved_appeal_revision,
          link, caller_number, execution_link
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.employeeName,
          row.sourceType,
          toSqlDate(row.rawDate),
          row.rawDate,
          t.monthYear,
          t.etiquetteComment,
          t.solutionComment,
          t.speedComment,
          t.availabilityComment,
          t.participationComment,
          t.totalScore,
          t.originalEtiquetteComment,
          t.originalSolutionComment,
          t.originalSpeedComment,
          t.originalAvailabilityComment,
          t.originalParticipationComment,
          t.originalTotalScore,
          t.revisedEtiquetteComment || null,
          t.revisedSolutionComment || null,
          t.revisedSpeedComment || null,
          t.revisedAvailabilityComment || null,
          t.revisedParticipationComment || null,
          t.revisedTotalScore ?? null,
          t.hasApprovedAppealRevision ? 1 : 0,
          t.link || null,
          t.callerNumber || null,
          t.executionLink || null,
        ],
      )
      ticketsInserted++
    }

    let appealsInserted = 0
    for (const row of parsedRows) {
      const a = row.appeal
      if (!a) continue

      await connection.query(
        `INSERT INTO appeals (
          id, employee_name, date, month_year, comment, review_comment, status,
          ticket_link, caller_number, resolved_at, resolved_by, submitted_at,
          new_etiquette_comment, new_solution_comment, new_speed_comment,
          new_availability_comment, new_participation_comment, new_total_score,
          source_type, source_sheet_name, source_row
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.employeeName,
          toSqlDate(a.date),
          a.monthYear || null,
          a.comment,
          a.reviewComment || null,
          a.status,
          a.ticketLink || null,
          a.callerNumber || null,
          a.resolvedAt || null,
          a.resolvedBy || null,
          a.submittedAt,
          a.newEtiquetteComment || null,
          a.newSolutionComment || null,
          a.newSpeedComment || null,
          a.newAvailabilityComment || null,
          a.newParticipationComment || null,
          a.newTotalScore ?? null,
          a.sourceType || null,
          a.sourceSheetName || null,
          a.sourceRow ?? null,
        ],
      )
      appealsInserted++
    }

    let ratingsInserted = 0
    for (const rating of clientRatings) {
      await connection.query(
        `INSERT INTO client_ratings (date, comment, rating, responsible) VALUES (?, ?, ?, ?)`,
        [rating.date, rating.comment, rating.rating, rating.responsible],
      )
      ratingsInserted++
    }

    const rowsAffected = employeesInserted + ticketsInserted + appealsInserted + ratingsInserted
    await connection.query(
      `INSERT INTO sync_logs (sync_type, status, rows_affected) VALUES (?, ?, ?)`,
      ['google_sheets_sync', 'success', rowsAffected],
    )

    await connection.commit()
    console.log(
      `[SYNC] Done: employees=${employeesInserted}, tickets=${ticketsInserted}, appeals=${appealsInserted}, ratings=${ratingsInserted}`,
    )
  } catch (error) {
    await connection.rollback().catch(() => undefined)
    console.error('[SYNC] Failed:', error)
    await connection.query(
      `INSERT INTO sync_logs (sync_type, status, error_message) VALUES (?, ?, ?)`,
      ['google_sheets_sync', 'failed', String(error)],
    )
    throw error
  } finally {
    await connection.end()
  }
}

export async function syncSheets(): Promise<void> {
  if (syncRunning) {
    console.log('[SYNC] Already running, skip')
    return
  }

  syncRunning = true
  try {
    await runSyncSheets()
  } finally {
    syncRunning = false
  }
}

async function runSyncSheets(): Promise<void> {
  console.log('[SYNC] Fetching Google Sheets (A:W)...')

  const [callsRows, chatRows, ratingsRows] = await Promise.all([
    getSheetData(CALLS_SHEET),
    getSheetData(CHAT_SHEET),
    getSheetData(CLIENT_RATINGS_SHEET, 'A2:D'),
  ])

  const parsed = [
    ...parseSheetRows(callsRows, 'calls', CALLS_SHEET),
    ...parseSheetRows(chatRows, 'chat', CHAT_SHEET),
  ]

  const clientRatings = ratingsRows
    .filter((row) => row.length >= 4)
    .map((row) => ({
      date: formatRatingDate(row[0] || ''),
      comment: (row[1] || '').trim(),
      rating: Math.min(5, Math.max(1, Number.parseInt(row[2] || '0', 10) || 1)),
      responsible: (row[3] || '').trim(),
    }))
    .filter((r) => r.responsible && r.rating > 0)

  console.log(`[SYNC] Parsed tickets: ${parsed.length}`)
  console.log(`[SYNC] Parsed appeals: ${parsed.filter((p) => p.appeal).length}`)
  console.log(`[SYNC] Parsed client ratings: ${clientRatings.length}`)

  await syncToDatabase(parsed, clientRatings)
}

export { runSyncSheets }

if (require.main === module) {
  syncSheets().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
