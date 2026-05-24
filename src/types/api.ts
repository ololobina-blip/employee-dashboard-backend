export interface Employee {
  name: string
  role?: string
  department?: string
}

export type TicketSourceType = 'chat' | 'calls'

export interface Ticket {
  date: string
  monthYear: string
  employeeName: string

  etiquetteComment: string
  solutionComment: string
  speedComment: string
  availabilityComment: string
  participationComment: string
  totalScore: number

  originalEtiquetteComment?: string
  originalSolutionComment?: string
  originalSpeedComment?: string
  originalAvailabilityComment?: string
  originalParticipationComment?: string
  originalTotalScore?: number

  revisedEtiquetteComment?: string
  revisedSolutionComment?: string
  revisedSpeedComment?: string
  revisedAvailabilityComment?: string
  revisedParticipationComment?: string
  revisedTotalScore?: number

  hasApprovedAppealRevision?: boolean

  link: string
  callerNumber?: string
  executionLink?: string
  sourceType?: TicketSourceType
  sourceSheetName?: string
  sourceRow?: number
}

export interface PeriodStats {
  totalTickets: number
  avgTotalScore: number
  minScore: number
  maxScore: number
  scoreDistribution: Array<{ score: number; count: number }>
  penaltyStats: {
    etiquette: number
    solution: number
    speed: number
    availability: number
    participation: number
  }
}

export interface ClientRating {
  date: string
  comment: string
  rating: number
  responsible: string
  region?: 'УЗ' | 'РФ' | 'Все'
}

export interface ClientRatingStats {
  averageRating: number
  totalRatings: number
  ratings: ClientRating[]
}

export interface EmployeeData {
  employee: Employee
  tickets: Ticket[]
  weekStats: PeriodStats
  monthStats: PeriodStats
  yearStats: PeriodStats
  clientRatings: {
    week: ClientRatingStats
    month: ClientRatingStats
    year: ClientRatingStats
    all: ClientRating[]
  }
}

export type AppealStatus = 'pending' | 'approved' | 'rejected'

export interface Appeal {
  id: string
  ticketLink?: string
  callerNumber?: string
  ticketData?: Ticket
  employeeName: string
  date: string
  monthYear?: string
  comment: string
  status: AppealStatus
  submittedAt: string
  resolvedAt?: string
  resolvedBy?: string
  reviewComment?: string
  newEtiquetteComment?: string
  newSolutionComment?: string
  newSpeedComment?: string
  newAvailabilityComment?: string
  newParticipationComment?: string
  newTotalScore?: number
  sourceType?: TicketSourceType
  sourceSheetName?: string
  sourceRow?: number
}

export interface AccessEntry {
  email: string
  role: 'admin' | 'employee'
  status: 'active' | 'invited'
  invitedAt?: string
}

export interface SyncStatus {
  lastSyncAt: string | null
  lastStatus: 'success' | 'failed' | null
  rowsAffected: number | null
  errorMessage: string | null
}
