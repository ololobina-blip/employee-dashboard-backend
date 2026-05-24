import { getPool } from '../db'
import type { Appeal } from '../types/api'
import { formatIsoDate } from './dates'
import logger from '../utils/logger'

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_APPEALS_SCRIPT_URL

interface GoogleScriptResponse {
  success?: boolean
  error?: string
}

function toSqlDate(value: string): string {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/)

  if (!match) {
    throw new Error(`Invalid appeal date format: ${value}`)
  }

  const [, dd, mm, yyyy] = match
  return `${yyyy}-${mm}-${dd}`
}

// ─── Вызов Google Apps Script ─────────────────────────────────────────────────

async function callGoogleScript(body: Record<string, unknown>): Promise<void> {
  if (!GOOGLE_SCRIPT_URL) {
    throw new Error('GOOGLE_APPEALS_SCRIPT_URL is not configured')
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Google Script responded with ${response.status}`)
  }

  const result = (await response.json()) as GoogleScriptResponse

  if (!result.success) {
    throw new Error(result.error || 'Google Script returned failure')
  }
}

// ─── Подача апелляции ────────────────────────────────────────────────────────

export interface SubmitAppealInput {
  employeeName: string
  ticketLink?: string
  callerNumber?: string
  comment: string
  sourceType: 'chat' | 'calls'
  sourceSheetName: string
  sourceRow: number
  submittedAt: string
  date: string
  monthYear?: string
}

export async function submitAppeal(input: SubmitAppealInput): Promise<Appeal> {
  await callGoogleScript({
    action: 'submitAppeal',
    sourceSheetName: input.sourceSheetName,
    sourceRow: input.sourceRow,
    sourceType: input.sourceType,
    employeeName: input.employeeName,
    comment: input.comment,
    submittedAt: input.submittedAt,
  })

  logger.info(`Appeal submitted to Google Sheet: ${input.sourceSheetName} row ${input.sourceRow}`)

  const pool = getPool()

  const id = `${input.sourceSheetName}:${input.sourceRow}:${input.employeeName}:${input.date}`

  await pool.query(
    `INSERT INTO appeals (
      id, employee_name, date, month_year, comment, status,
      submitted_at, ticket_link, caller_number,
      source_type, source_sheet_name, source_row
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      comment = VALUES(comment),
      submitted_at = VALUES(submitted_at),
      status = 'pending'`,
    [
  id,
  input.employeeName,
  toSqlDate(input.date),
  input.monthYear || null,
  input.comment,
  input.submittedAt,
  input.ticketLink || null,
  input.callerNumber || null,
  input.sourceType,
  input.sourceSheetName,
  input.sourceRow,
]

  )

  logger.info(`Appeal saved to DB: ${id}`)

  return {
    id,
    employeeName: input.employeeName,
    date: input.date,
    monthYear: input.monthYear,
    comment: input.comment,
    status: 'pending',
    submittedAt: input.submittedAt,
    ticketLink: input.ticketLink,
    callerNumber: input.callerNumber,
    sourceType: input.sourceType,
    sourceSheetName: input.sourceSheetName,
    sourceRow: input.sourceRow,
  }
}

// ─── Рассмотрение апелляции ──────────────────────────────────────────────────

export interface ReviewAppealInput {
  status: 'approved' | 'rejected'
  adminName: string
  reviewComment?: string
  newEtiquetteComment?: string
  newSolutionComment?: string
  newSpeedComment?: string
  newAvailabilityComment?: string
  newParticipationComment?: string
  newTotalScore?: number
}

export async function reviewAppeal(
  appealId: string,
  input: ReviewAppealInput
): Promise<Appeal> {
  const pool = getPool()

  const [rows] = await pool.query<any[]>(
    `SELECT * FROM appeals WHERE id = ? LIMIT 1`,
    [appealId]
  )

  if (!rows.length) {
    throw new Error(`Appeal not found: ${appealId}`)
  }

  const appeal = rows[0]

  if (appeal.status !== 'pending') {
    throw new Error(`Appeal is not pending: ${appealId}`)
  }

  if (!appeal.source_sheet_name || !appeal.source_row) {
    throw new Error(`Appeal missing source coordinates: ${appealId}`)
  }

  const resolvedAt = new Date().toISOString()

  await callGoogleScript({
    action: 'updateAppealStatus',
    sourceSheetName: appeal.source_sheet_name,
    sourceRow: appeal.source_row,
    sourceType: appeal.source_type,
    status: input.status,
    adminName: input.adminName,
    adminComment: input.reviewComment || '',
    newEtiquette: input.newEtiquetteComment,
    newSolution: input.newSolutionComment,
    newSpeed: input.newSpeedComment,
    newAvailability: input.newAvailabilityComment,
    newParticipation: input.newParticipationComment,
  })

  logger.info(`Appeal reviewed in Google Sheet: ${appeal.source_sheet_name} row ${appeal.source_row}`)

  await pool.query(
    `UPDATE appeals SET
      status = ?,
      resolved_at = ?,
      resolved_by = ?,
      review_comment = ?,
      new_etiquette_comment = ?,
      new_solution_comment = ?,
      new_speed_comment = ?,
      new_availability_comment = ?,
      new_participation_comment = ?,
      new_total_score = ?
    WHERE id = ?`,
    [
      input.status,
      resolvedAt,
      input.adminName,
      input.reviewComment || null,
      input.newEtiquetteComment || null,
      input.newSolutionComment || null,
      input.newSpeedComment || null,
      input.newAvailabilityComment || null,
      input.newParticipationComment || null,
      input.newTotalScore ?? null,
      appealId,
    ]
  )

  if (input.status === 'approved' && input.newTotalScore !== undefined) {
    await pool.query(
      `UPDATE tickets SET
        revised_etiquette_comment = ?,
        revised_solution_comment = ?,
        revised_speed_comment = ?,
        revised_availability_comment = ?,
        revised_participation_comment = ?,
        revised_total_score = ?,
        has_approved_appeal_revision = 1,
        etiquette_comment = COALESCE(?, etiquette_comment),
        solution_comment = COALESCE(?, solution_comment),
        speed_comment = COALESCE(?, speed_comment),
        availability_comment = COALESCE(?, availability_comment),
        participation_comment = COALESCE(?, participation_comment),
        total_score = ?
      WHERE source_sheet_name = ? AND source_row = ?`,
      [
        input.newEtiquetteComment || null,
        input.newSolutionComment || null,
        input.newSpeedComment || null,
        input.newAvailabilityComment || null,
        input.newParticipationComment || null,
        input.newTotalScore,
        input.newEtiquetteComment || null,
        input.newSolutionComment || null,
        input.newSpeedComment || null,
        input.newAvailabilityComment || null,
        input.newParticipationComment || null,
        input.newTotalScore,
        appeal.source_sheet_name,
        appeal.source_row,
      ]
    )

    logger.info(`Ticket updated after appeal approval: ${appeal.source_sheet_name} row ${appeal.source_row}`)
  }

  logger.info(`Appeal ${appealId} ${input.status} by ${input.adminName}`)

  return {
    id: appealId,
    employeeName: appeal.employee_name,
    date: appeal.date,
    monthYear: appeal.month_year,
    comment: appeal.comment,
    status: input.status,
    submittedAt: formatIsoDate(appeal.submitted_at),
    resolvedAt,
    resolvedBy: input.adminName,
    reviewComment: input.reviewComment,
    newEtiquetteComment: input.newEtiquetteComment,
    newSolutionComment: input.newSolutionComment,
    newSpeedComment: input.newSpeedComment,
    newAvailabilityComment: input.newAvailabilityComment,
    newParticipationComment: input.newParticipationComment,
    newTotalScore: input.newTotalScore,
    sourceType: appeal.source_type,
    sourceSheetName: appeal.source_sheet_name,
    sourceRow: appeal.source_row,
  }
}
