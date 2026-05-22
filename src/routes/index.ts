import { FastifyInstance } from 'fastify'
import employeesRoutes from './employees'
import appealsRoutes from './appeals'
import accessRoutes from './access'
import syncRoutes from './sync'
import metaRoutes from './meta'

export default async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  }))

  await app.register(employeesRoutes)
  await app.register(appealsRoutes)
  await app.register(accessRoutes)
  await app.register(syncRoutes)
  await app.register(metaRoutes)
}
