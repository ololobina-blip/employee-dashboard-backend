import { FastifyInstance } from 'fastify'
import { getAllAppeals } from '../services/dashboardService'
import { submitAppeal, reviewAppeal } from '../services/appealsService'
import type { SubmitAppealInput, ReviewAppealInput } from '../services/appealsService'

export default async function appealsRoutes(app: FastifyInstance): Promise<void> {

  // GET /appeals — получить все апелляции
  app.get('/appeals', async (_request, reply) => {
    const data = await getAllAppeals()
    return reply.send({ success: true, data })
  })

  // POST /appeals — подать апелляцию
  app.post<{ Body: SubmitAppealInput }>(
    '/appeals',
    async (request, reply) => {
      const input = request.body

     if (
  !input.employeeName ||
  !input.comment ||
  !input.sourceSheetName ||
  input.sourceRow == null ||
  !input.date
) {
  return reply.status(400).send({
    success: false,
    error: 'Missing required fields: employeeName, comment, sourceSheetName, sourceRow, date',
  })
}

      const appeal = await submitAppeal(input)
      return reply.status(201).send({ success: true, data: appeal })
    }
  )

  // PATCH /appeals/:id/review — рассмотреть апелляцию
  app.patch<{
    Params: { id: string }
    Body: ReviewAppealInput
  }>(
    '/appeals/:id/review',
    async (request, reply) => {
      const appealId = decodeURIComponent(request.params.id)
      const input = request.body

      if (!input.status || !input.adminName) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: status, adminName',
        })
      }

      if (input.status !== 'approved' && input.status !== 'rejected') {
        return reply.status(400).send({
          success: false,
          error: 'Invalid status: must be approved or rejected',
        })
      }

      const appeal = await reviewAppeal(appealId, input)
      return reply.send({ success: true, data: appeal })
    }
  )
}
