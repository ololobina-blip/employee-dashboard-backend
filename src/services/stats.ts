import type { ClientRating, ClientRatingStats, PeriodStats, Ticket } from '../types/api'
import { isPenaltyCriterion } from '../utils/criteria'
import { parseSheetDate } from './dates'

export const filterPeriod = <T extends { date: string }>(
  items: T[],
  period: 'week' | 'month' | 'year',
): T[] => {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
  }

  return items.filter((item) => {
    const parsed = parseSheetDate(item.date)
    return parsed >= startDate && parsed <= now
  })
}

export const calculatePeriodStats = (tickets: Ticket[]): PeriodStats => {
  if (tickets.length === 0) {
    return {
      totalTickets: 0,
      avgTotalScore: 0,
      minScore: 0,
      maxScore: 0,
      scoreDistribution: [],
      penaltyStats: {
        etiquette: 0,
        solution: 0,
        speed: 0,
        availability: 0,
        participation: 0,
      },
    }
  }

  const scoreMap = new Map<number, number>()
  const penaltyStats = {
    etiquette: 0,
    solution: 0,
    speed: 0,
    availability: 0,
    participation: 0,
  }

  tickets.forEach((ticket) => {
    const scoreRange = Math.floor(ticket.totalScore / 10) * 10
    scoreMap.set(scoreRange, (scoreMap.get(scoreRange) || 0) + 1)

    if (isPenaltyCriterion(ticket.etiquetteComment)) penaltyStats.etiquette++
    if (isPenaltyCriterion(ticket.solutionComment)) penaltyStats.solution++
    if (isPenaltyCriterion(ticket.speedComment)) penaltyStats.speed++
    if (isPenaltyCriterion(ticket.availabilityComment)) penaltyStats.availability++
    if (isPenaltyCriterion(ticket.participationComment)) penaltyStats.participation++
  })

  const scores = tickets.map((t) => t.totalScore)
  const scoreDistribution = Array.from(scoreMap.entries())
    .map(([score, count]) => ({ score, count }))
    .sort((a, b) => a.score - b.score)

  return {
    totalTickets: tickets.length,
    avgTotalScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
    scoreDistribution,
    penaltyStats,
  }
}

export const calculateClientRatingStats = (ratings: ClientRating[]): ClientRatingStats => {
  if (ratings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratings: [],
    }
  }

  const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0)
  return {
    averageRating: totalRating / ratings.length,
    totalRatings: ratings.length,
    ratings,
  }
}
