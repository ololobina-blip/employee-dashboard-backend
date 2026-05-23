import { RowDataPacket } from 'mysql2'
import { getPool } from '../db'
import type {
  Appeal,
  AccessEntry,
  ClientRating,
  Employee,
  EmployeeData,
  SyncStatus,
  Ticket,
  TicketSourceType,
} from '../types/api'
import { formatIsoDate, formatRatingDate, formatTicketDate } from './dates'
import {
  calculateClientRatingStats,
  calculatePeriodStats,
  filterPeriod,
} from './stats'

interface TicketRow extends RowDataPacket {
  employee_name: string
  source_type: TicketSourceType
  date: Date | string
  ticket_datetime_raw: string | null
  month_year: string
  etiquette_comment: string | null
  solution_comment: string | null
  speed_comment: string | null
  availability_comment: string | null
  participation_comment: string | null
  total_score: number
  original_etiquette_comment: string | null
  original_solution_comment: string | null
  original_speed_comment: string | null
  original_availability_comment: string | null
  original_participation_comment: string | null
  original_total_score: number | null
  revised_etiquette_comment: string | null
  revised_solution_comment: string | null
  revised_speed_comment: string | null
  revised_availability_comment: string | null
  revised_participation_comment: string | null
  revised_total_score: number | null
  has_approved_appeal_revision: number
  link: string | null
  caller_number: string | null
  execution_link: string | null
}

interface RatingRow extends RowDataPacket {
  date: Date | string
  comment: string | null
  rating: number
  responsible: string
  region: 'УЗ' | 'РФ' | 'Все' | null
}

interface EmployeeRow extends RowDataPacket {
  name: string
  role: string | null
  department: string | null
}

interface AppealRow extends RowDataPacket {
  id: string
  ticket_link: string | null
  caller_number: string | null
  employee_name: string
  date: Date | string
  month_year: string | null
  comment: string | null
  review_comment: string | null
  status: string | null
  submitted_at: Date | string
  resolved_at: Date | string | null
  resolved_by: string | null
  new_etiquette_comment: string | null
  new_solution_comment: string | null
  new_speed_comment: string | null
  new_availability_comment: string | null
  new_participation_comment: string | null
  new_total_score: number | null
  source_type: TicketSourceType | null
  source_sheet_name: string | null
  source_row: number | null
}

interface AccessRow extends RowDataPacket {
  email: string
  role: 'admin' | 'employee'
  status: 'active' | 'invited'
  invited_at: Date | string | null
}

interface SyncLogRow extends RowDataPacket {
  status: 'success' | 'failed'
  rows_affected: number | null
  error_message: string | null
  synced_at: Date | string
}

const mapTicketRow = (row: TicketRow): Ticket => ({
  date: row.ticket_datetime_raw
    ? formatTicketDate(row.ticket_datetime_raw)
    : formatTicketDate(row.date),
  monthYear: row.month_year || '',
  employeeName: row.employee_name,
  etiquetteComment: row.etiquette_comment || '0 —',
  solutionComment: row.solution_comment || '0 —',
  speedComment: row.speed_comment || '0 —',
  availabilityComment: row.availability_comment || '0 —',
  participationComment: row.participation_comment || '0 —',
  totalScore: Number(row.total_score) || 0,
  originalEtiquetteComment: row.original_etiquette_comment || undefined,
  originalSolutionComment: row.original_solution_comment || undefined,
  originalSpeedComment: row.original_speed_comment || undefined,
  originalAvailabilityComment: row.original_availability_comment || undefined,
  originalParticipationComment: row.original_participation_comment || undefined,
  originalTotalScore:
    row.original_total_score !== null ? Number(row.original_total_score) : undefined,
  revisedEtiquetteComment: row.revised_etiquette_comment || undefined,
  revisedSolutionComment: row.revised_solution_comment || undefined,
  revisedSpeedComment: row.revised_speed_comment || undefined,
  revisedAvailabilityComment: row.revised_availability_comment || undefined,
  revisedParticipationComment: row.revised_participation_comment || undefined,
  revisedTotalScore:
    row.revised_total_score !== null ? Number(row.revised_total_score) : undefined,
  hasApprovedAppealRevision: Boolean(row.has_approved_appeal_revision),
  link: row.link || '',
  callerNumber: row.caller_number || undefined,
  executionLink: row.execution_link || undefined,
  sourceType: row.source_type,
})

const mapRatingRow = (row: RatingRow): ClientRating => ({
  date: formatRatingDate(row.date),
  comment: row.comment || '',
  rating: Math.min(5, Math.max(1, Number(row.rating) || 1)),
  responsible: row.responsible,
  region: row.region || undefined,
})

const normalizeAppealStatus = (
  status: string | null | undefined,
): 'pending' | 'approved' | 'rejected' => {
  const value = String(status ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .trim()

  if (
    value.includes('approved') ||
    value.includes('принят')
  ) {
    return 'approved'
  }

  if (
    value.includes('rejected') ||
    value.includes('отклон')
  ) {
    return 'rejected'
  }

  return 'pending'
}

const mapAppealRow = (row: AppealRow): Appeal => {
  console.log('REAL STATUS FROM DB:', row.status)

  return {
    id: row.id,
    ticketLink: row.ticket_link || undefined,
    callerNumber: row.caller_number || undefined,
    employeeName: row.employee_name,
    date: formatTicketDate(row.date),
    monthYear: row.month_year || undefined,
    comment: row.comment || '',
    status: normalizeAppealStatus(row.status),
    submittedAt: formatIsoDate(row.submitted_at),
    resolvedAt: row.resolved_at ? formatIsoDate(row.resolved_at) : undefined,
    resolvedBy: row.resolved_by || undefined,
    reviewComment: row.review_comment || undefined,
    newEtiquetteComment: row.new_etiquette_comment || undefined,
    newSolutionComment: row.new_solution_comment || undefined,
    newSpeedComment: row.new_speed_comment || undefined,
    newAvailabilityComment: row.new_availability_comment || undefined,
    newParticipationComment: row.new_participation_comment || undefined,
    newTotalScore:
      row.new_total_score !== null
        ? Number(row.new_total_score)
        : undefined,
    sourceType: row.source_type || undefined,
    sourceSheetName: row.source_sheet_name || undefined,
    sourceRow: row.source_row ?? undefined,
  }
}

export async function getAllEmployees(): Promise<Employee[]> {
  const pool = getPool()
  const [rows] = await pool.query<EmployeeRow[]>(
    `SELECT name, role, department FROM employees ORDER BY name ASC`,
  )

  if (rows.length > 0) {
    return rows.map((row) => ({
      name: row.name,
      role: row.role || 'Support',
      department: row.department || 'Техподдержка',
    }))
  }

  const [fromTickets] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT employee_name AS name FROM tickets ORDER BY employee_name ASC`,
  )

  return fromTickets.map((row) => ({
    name: String(row.name),
    role: 'Support',
    department: 'Техподдержка',
  }))
}

export async function getTicketsForEmployee(employeeName: string): Promise<Ticket[]> {
  const pool = getPool()
  const [rows] = await pool.query<TicketRow[]>(
    `SELECT * FROM tickets WHERE employee_name = ? ORDER BY date DESC, id DESC`,
    [employeeName],
  )
  return rows.map(mapTicketRow)
}

export async function getRatingsForEmployee(employeeName: string): Promise<ClientRating[]> {
  const pool = getPool()
  const [rows] = await pool.query<RatingRow[]>(
    `SELECT * FROM client_ratings WHERE responsible = ? ORDER BY date DESC, id DESC`,
    [employeeName],
  )
  return rows.map(mapRatingRow)
}

export async function fetchEmployeeData(employeeName: string): Promise<EmployeeData | null> {
  const employees = await getAllEmployees()
  const employee =
    employees.find((e) => e.name === employeeName) ?? {
      name: employeeName,
      role: 'Support',
      department: 'Техподдержка',
    }

  const tickets = await getTicketsForEmployee(employeeName)
  const clientRatings = await getRatingsForEmployee(employeeName)

  const weekStats = calculatePeriodStats(filterPeriod(tickets, 'week'))
  const monthStats = calculatePeriodStats(filterPeriod(tickets, 'month'))
  const yearStats = calculatePeriodStats(filterPeriod(tickets, 'year'))

  const weekRatings = filterPeriod(clientRatings, 'week')
  const monthRatings = filterPeriod(clientRatings, 'month')
  const yearRatings = filterPeriod(clientRatings, 'year')

  return {
    employee,
    tickets,
    weekStats,
    monthStats,
    yearStats,
    clientRatings: {
      week: calculateClientRatingStats(weekRatings),
      month: calculateClientRatingStats(monthRatings),
      year: calculateClientRatingStats(yearRatings),
      all: clientRatings,
    },
  }
}

export async function getAllAppeals(): Promise<Appeal[]> {
  const pool = getPool()
  const [rows] = await pool.query<AppealRow[]>(
    `SELECT * FROM appeals ORDER BY submitted_at DESC`,
  )
  return rows.map(mapAppealRow)
}

export async function getAccessEntries(): Promise<AccessEntry[]> {
  const pool = getPool()
  const [rows] = await pool.query<AccessRow[]>(
    `SELECT email, role, status, invited_at FROM access_entries ORDER BY email ASC`,
  )

  return rows.map((row) => ({
    email: row.email,
    role: row.role,
    status: row.status,
    invitedAt: row.invited_at ? formatIsoDate(row.invited_at) : undefined,
  }))
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const pool = getPool()
  const [rows] = await pool.query<SyncLogRow[]>(
    `SELECT status, rows_affected, error_message, synced_at
     FROM sync_logs ORDER BY synced_at DESC LIMIT 1`,
  )

  if (rows.length === 0) {
    return {
      lastSyncAt: null,
      lastStatus: null,
      rowsAffected: null,
      errorMessage: null,
    }
  }

  const row = rows[0]
  return {
    lastSyncAt: formatIsoDate(row.synced_at),
    lastStatus: row.status,
    rowsAffected: row.rows_affected,
    errorMessage: row.error_message,
  }
}
