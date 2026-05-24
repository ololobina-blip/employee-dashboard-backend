import type { Appeal, AppealStatus, Ticket, TicketSourceType } from '../types/api'
import { formatTicketDate, parseSheetDate } from './dates'

const normalizeValue = (value?: string): string => (value ?? '').trim()

const parseScore = (value?: string): number => {
  const score = Number.parseFloat(normalizeValue(value))
  return Number.isNaN(score) ? 0 : score
}

const extractMonthYear = (value: string): string => {
  const normalized = normalizeValue(value)
  if (!normalized) return ''
  const match = normalized.match(/(\d{1,2})\/(\d{4})/)
  if (match) return `${match[1]}/${match[2]}`
  const date = parseSheetDate(normalized)
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(date)
}

export const isRevisedValid = (row: string[]): boolean => {
  const revisedFields = [row[17], row[18], row[19], row[20], row[21]]
  return revisedFields.some((f) => normalizeValue(f) !== '')
}

export const normalizeAppealStatus = (value: string): AppealStatus => {
  const normalized = value.trim().toLowerCase()
  if (
    normalized.includes('одоб') ||
    normalized.includes('approv') ||
    normalized.includes('принят')  // ← добавить это
  ) return 'approved'
  if (
    normalized.includes('отклон') ||
    normalized.includes('reject')
  ) return 'rejected'
  return 'pending'
}

export interface ParsedSheetRow {
  ticket: Ticket
  appeal?: Appeal
  sourceType: TicketSourceType
  sourceSheetName: string
  sourceRow: number
  rawDate: string
}

export const parseTicketRow = (
  row: string[],
  source: TicketSourceType,
  sourceSheetName: string,
  sourceRow: number,
): ParsedSheetRow | null => {
  const dateRaw = normalizeValue(row[0])
  const employeeName = normalizeValue(row[2])
  const originalTotalScore = parseScore(row[8])

 if (!employeeName || Number.isNaN(originalTotalScore)) return null

  const monthYear = normalizeValue(row[1]) || extractMonthYear(dateRaw)

  const originalEtiquette = normalizeValue(row[3]) || '0 —'
  const originalSolution = normalizeValue(row[4]) || '0 —'
  const originalSpeed = normalizeValue(row[5]) || '0 —'
  const originalAvailability = normalizeValue(row[6]) || '0 —'
  const originalParticipation = normalizeValue(row[7]) || '0 —'

  const revisedEtiquette = normalizeValue(row[17])
  const revisedSolution = normalizeValue(row[18])
  const revisedSpeed = normalizeValue(row[19])
  const revisedAvailability = normalizeValue(row[20])
  const revisedParticipation = normalizeValue(row[21])
  const revisedTotalScoreRaw = normalizeValue(row[22])
  const revisedTotalScore = revisedTotalScoreRaw ? parseScore(revisedTotalScoreRaw) : undefined

  const appealStatusRaw = normalizeValue(row[13]).toLowerCase()
const isApproved =
  appealStatusRaw.includes('принят') ||
  appealStatusRaw.includes('approved') ||
  appealStatusRaw.includes('одоб')

  const hasApprovedRevision = isApproved && isRevisedValid(row)

  const effectiveEtiquette = hasApprovedRevision ? revisedEtiquette : originalEtiquette
  const effectiveSolution = hasApprovedRevision ? revisedSolution : originalSolution
  const effectiveSpeed = hasApprovedRevision ? revisedSpeed : originalSpeed
  const effectiveAvailability = hasApprovedRevision ? revisedAvailability : originalAvailability
  const effectiveParticipation = hasApprovedRevision ? revisedParticipation : originalParticipation
  const effectiveTotalScore =
    hasApprovedRevision && revisedTotalScore !== undefined ? revisedTotalScore : originalTotalScore

   const ticket: Ticket = {
    date: formatTicketDate(dateRaw),
    monthYear,
    employeeName,
    etiquetteComment: effectiveEtiquette,
    solutionComment: effectiveSolution,
    speedComment: effectiveSpeed,
    availabilityComment: effectiveAvailability,
    participationComment: effectiveParticipation,
    totalScore: effectiveTotalScore,
    originalEtiquetteComment: originalEtiquette,
    originalSolutionComment: originalSolution,
    originalSpeedComment: originalSpeed,
    originalAvailabilityComment: originalAvailability,
    originalParticipationComment: originalParticipation,
    originalTotalScore,
    revisedEtiquetteComment: revisedEtiquette || undefined,
    revisedSolutionComment: revisedSolution || undefined,
    revisedSpeedComment: revisedSpeed || undefined,
    revisedAvailabilityComment: revisedAvailability || undefined,
    revisedParticipationComment: revisedParticipation || undefined,
    revisedTotalScore,
    hasApprovedAppealRevision: hasApprovedRevision,
    link: source === 'chat' ? normalizeValue(row[9]) : '',
    callerNumber: source === 'calls' ? normalizeValue(row[9]) || undefined : undefined,
    executionLink: undefined,
    sourceType: source,
    sourceSheetName,
    sourceRow,
  }

  const appealFlag = normalizeValue(row[10])
  const submittedAt = normalizeValue(row[11])
  const appealComment = normalizeValue(row[12])

  let appeal: Appeal | undefined

  if (appealFlag && (submittedAt || appealComment)) {
    const status = normalizeAppealStatus(row[13] || 'pending')
    appeal = {
      id: `${sourceSheetName}:${sourceRow}:${employeeName}:${dateRaw}`,
      employeeName,
      date: formatTicketDate(dateRaw),
      monthYear,
      comment: appealComment,
      status,
      submittedAt: submittedAt || new Date().toISOString(),
      resolvedAt: normalizeValue(row[14]) || undefined,
      resolvedBy: normalizeValue(row[15]) || undefined,
      reviewComment: normalizeValue(row[16]) || undefined,
      ticketLink: source === 'chat' ? normalizeValue(row[9]) || undefined : undefined,
      callerNumber: source === 'calls' ? normalizeValue(row[9]) || undefined : undefined,
      newEtiquetteComment: revisedEtiquette || undefined,
      newSolutionComment: revisedSolution || undefined,
      newSpeedComment: revisedSpeed || undefined,
      newAvailabilityComment: revisedAvailability || undefined,
      newParticipationComment: revisedParticipation || undefined,
      newTotalScore: revisedTotalScore,
      sourceType: source,
      sourceSheetName,
      sourceRow,
      ticketData: ticket,
    }
  }

  return { ticket, appeal, sourceType: source, sourceSheetName, sourceRow, rawDate: dateRaw }
}

export const parseSheetRows = (
  rows: string[][],
  source: TicketSourceType,
  sourceSheetName: string,
): ParsedSheetRow[] => {
  const parsed: ParsedSheetRow[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row?.length) continue
    const item = parseTicketRow(row, source, sourceSheetName, i + 2)
    if (item) parsed.push(item)
  }

  return parsed
}
