import { FastifyInstance } from 'fastify'
import { getAllAppeals } from '../services/dashboardService'

/** Read-only: подача/рассмотрение апелляций остаётся на Google Apps Script (фронт). */
export default async function appealsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/appeals', async (_request, reply) => {
    const data = await getAllAppeals()
    return reply.send({ success: true, data })
  })
}
