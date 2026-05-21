import { initDatabase, closeDatabase } from './db'
import TicketModel from './models/Ticket'
import ClientRatingModel from './models/ClientRating'

async function seed() {
  try {
    console.log('[SEED] Connecting to database...')
    await initDatabase()

    console.log('[SEED] Clearing existing data...')
    await TicketModel.deleteMany({})
    await ClientRatingModel.deleteMany({})

    const tickets = [
      {
        date: '01.05.2026',
        monthYear: '05-2026',
        employeeName: 'Иван Иванов',
        etiquetteComment: '0 —',
        solutionComment: '0 —',
        speedComment: '0 —',
        availabilityComment: '0 —',
        participationComment: '0 —',
        totalScore: 5,
        link: '',
        source: 'chat',
        syncedAt: new Date(),
      },
      {
        date: '02.05.2026',
        monthYear: '05-2026',
        employeeName: 'Пётр Петров',
        etiquetteComment: '0 —',
        solutionComment: '0 —',
        speedComment: '0 —',
        availabilityComment: '0 —',
        participationComment: '0 —',
        totalScore: 4,
        link: '',
        source: 'calls',
        callerNumber: '+998901234567',
        executionLink: '',
        syncedAt: new Date(),
      },
    ]

    const ratings = [
      {
        date: '01.05.2026',
        comment: 'Отличная работа',
        rating: 5,
        responsible: 'Иван Иванов',
        region: 'УЗ',
        syncedAt: new Date(),
      },
    ]

    if (tickets.length > 0) {
      await TicketModel.insertMany(tickets)
      console.log(`[SEED] Inserted ${tickets.length} tickets`)
    }

    if (ratings.length > 0) {
      await ClientRatingModel.insertMany(ratings)
      console.log(`[SEED] Inserted ${ratings.length} client ratings`)
    }

    await closeDatabase()
    console.log('[SEED] Completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('[SEED] Failed:', error)
    try {
      await closeDatabase()
    } catch {}
    process.exit(1)
  }
}

seed()
