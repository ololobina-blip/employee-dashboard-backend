import { FastifyInstance } from 'fastify'
import { getAccessEntries } from '../services/dashboardService'

export default async function accessRoutes(app: FastifyInstance): Promise<void> {
  app.get('/access', async (_request, reply) => {
    const data = await getAccessEntries()
    return reply.send({ success: true, data })
  })
}
