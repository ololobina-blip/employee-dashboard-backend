import { FastifyInstance } from 'fastify'
import { getSyncStatus } from '../services/dashboardService'
import { isSyncRunning, syncSheets } from '../sync-sheets'

export default async function syncRoutes(app: FastifyInstance): Promise<void> {
  app.get('/sync/status', async (_request, reply) => {
    const data = await getSyncStatus()
    return reply.send({ success: true, data, meta: { syncInProgress: isSyncRunning() } })
  })

  app.post('/sync/run', async (_request, reply) => {
    if (isSyncRunning()) {
      return reply.status(409).send({
        success: false,
        error: 'Sync already in progress',
      })
    }

    try {
      await syncSheets()
      const data = await getSyncStatus()
      return reply.send({ success: true, data })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return reply.status(500).send({ success: false, error: message })
    }
  })
}
