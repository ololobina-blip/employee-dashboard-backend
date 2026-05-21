import { initMariaDB, closeDatabase } from './src/db/mariadb'
import EmployeeRepository from './src/db/repositories/EmployeeRepository'
import TicketRepository from './src/db/repositories/TicketRepository'
import AppealRepository from './src/db/repositories/AppealRepository'
import logger from './src/utils/logger'

async function seedDatabase() {
  try {
    console.log('[SEED] Starting database seeding...')

    await initMariaDB()

    // Clear existing data
    console.log('[SEED] Clearing existing data...')
    await EmployeeRepository.truncate()
    await TicketRepository.truncate()
    await AppealRepository.truncate()

    // Seed employees
    console.log('[SEED] Seeding employees...')
    const employees = [
      {
        email: 'ivan.petrov@company.com',
        name: 'Иван Петров',
        role: 'Support Engineer',
        department: 'Техподдержка',
      },
      {
        email: 'maria.sidorova@company.com',
        name: 'Мария Сидорова',
        role: 'Senior Support',
        department: 'Техподдержка',
      },
      {
        email: 'alex.ivanov@company.com',
        name: 'Александр Иванов',
        role: 'Support Lead',
        department: 'Техподдержка',
      },
      {
        email: 'anna.smith@company.com',
        name: 'Анна Смит',
        role: 'Junior Support',
        department: 'Техподдержка',
      },
    ]

    for (const employee of employees) {
      await EmployeeRepository.create(employee)
    }
    console.log(`[SEED] ✅ ${employees.length} employees seeded`)

    // Seed tickets
    console.log('[SEED] Seeding tickets...')
    const tickets = [
      {
        employee_email: 'ivan.petrov@company.com',
        ticket_id: 'TICKET-1001',
        date: '2024-01-15',
        title: 'Проблема с оплатой',
        status: 'resolved' as const,
        category: 'Биллинг',
        ai_score: 92.5,
        ai_comment: 'Отличная работа! Быстрое решение',
        errors: '',
        response_time: 2.5,
      },
      {
        employee_email: 'ivan.petrov@company.com',
        ticket_id: 'TICKET-1002',
        date: '2024-01-16',
        title: 'Не работает функция',
        status: 'resolved' as const,
        category: 'Технические',
        ai_score: 85.0,
        ai_comment: 'Хорошо, но можно быстрее',
        errors: 'Долгое время ответа',
        response_time: 6.0,
      },
      {
        employee_email: 'maria.sidorova@company.com',
        ticket_id: 'TICKET-2001',
        date: '2024-01-15',
        title: 'Сброс пароля',
        status: 'resolved' as const,
        category: 'Аккаунт',
        ai_score: 95.0,
        ai_comment: 'Идеально!',
        errors: '',
        response_time: 1.0,
      },
      {
        employee_email: 'maria.sidorova@company.com',
        ticket_id: 'TICKET-2002',
        date: '2024-01-16',
        title: 'Технический вопрос',
        status: 'resolved' as const,
        category: 'Технические',
        ai_score: 88.0,
        ai_comment: 'Хорошая работа',
        errors: '',
        response_time: 3.5,
      },
    ]

    for (const ticket of tickets) {
      await TicketRepository.create(ticket)
    }
    console.log(`[SEED] ✅ ${tickets.length} tickets seeded`)

    // Seed appeals
    console.log('[SEED] Seeding appeals...')
    const appeals = [
      {
        employee_email: 'ivan.petrov@company.com',
        appeal_id: 'APPEAL-1001',
        date: '2024-01-20',
        reason: 'Несогласие с оценкой',
        status: 'pending' as const,
        resolution_date: undefined,
        resolution_notes: undefined,
      },
      {
        employee_email: 'maria.sidorova@company.com',
        appeal_id: 'APPEAL-2001',
        date: '2024-01-18',
        reason: 'Ошибка в расчетах',
        status: 'approved' as const,
        resolution_date: '2024-01-19',
        resolution_notes: 'Ошибка исправлена',
      },
    ]

    for (const appeal of appeals) {
      await AppealRepository.create(appeal)
    }
    console.log(`[SEED] ✅ ${appeals.length} appeals seeded`)

    await closeDatabase()
    console.log('[SEED] ✅ Database seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('[SEED] ❌ Seeding failed:', error)
    logger.error(`Seeding failed: ${error instanceof Error ? error.message : String(error)}`)
    await closeDatabase().catch(() => {})
    process.exit(1)
  }
}

seedDatabase()
