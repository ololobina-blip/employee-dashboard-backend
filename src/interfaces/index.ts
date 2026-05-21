// Employee
export interface Employee {
  id: number
  name: string
  role?: string
  department?: string
  createdAt: Date
  updatedAt: Date
}

// Ticket (Performance record)
export interface Ticket {
  id: number
  employeeId: number
  date: string // "02.04.2026"
  monthYear: string // "Апрель 2026"
  etiquetteScore: number
  etiquetteComment: string
  solutionScore: number
  solutionComment: string
  speedScore: number
  speedComment: string
  availabilityScore: number
  availabilityComment: string
  participationScore: number
  participationComment: string
  totalScore: number
  link: string
  createdAt: Date
  updatedAt: Date
}

// Statistics for period (week/month/year)
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

// Client Rating (Customer feedback)
export interface ClientRating {
  id: number
  employeeId: number
  date: string // 'YYYY-MM-DD HH:mm:ss'
  comment: string
  rating: number // 1-5
  region?: 'УЗ' | 'РФ' | 'Все'
  createdAt: Date
}

// Client Rating Stats
export interface ClientRatingStats {
  averageRating: number
  totalRatings: number
  ratings: ClientRating[]
}

// Complete Employee Data
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

// Appeal/Dispute
export interface Appeal {
  id: string
  employeeId: number
  ticketLink: string
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  resolvedAt?: string
  createdAt: Date
  updatedAt: Date
}

// User (Internal)
export interface User {
  id: number
  email: string
  passwordHash: string
  role: 'admin' | 'employee'
  employeeName?: string
  createdAt: Date
  updatedAt: Date
}

// Access Entry (User management)
export interface AccessEntry {
  id: number
  email: string
  role: 'admin' | 'employee'
  status: 'active' | 'invited'
  invitedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Auth
export interface AuthPayload {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: {
    id: number
    email: string
    role: 'admin' | 'employee'
    employeeName?: string
  }
}

// Error Response
export type ErrorCode = '400' | '401' | '403' | '404' | '409' | '500'

export interface ErrorResponse {
  statusCode: number
  code: ErrorCode
  name: string
  message: string
  error_code: string
  data?: unknown
}
