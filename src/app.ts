import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config'
import registerRoutes from './routes'

export async function createApp() {
  const app = Fastify({ logger: true })

  await app.register(cors, {
    origin: config.server.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  await app.register(registerRoutes, { prefix: config.server.apiPrefix })

  app.get('/', async () => ({
    success: true,
    data: {
      service: 'employee-dashboard-backend',
      apiPrefix: config.server.apiPrefix,
      frontendUrl: config.server.frontendUrl || null,
      cors: config.server.corsOrigins === true ? '*' : config.server.corsOrigins,
      docs: {
        health: `${config.server.apiPrefix}/health`,
        employees: `${config.server.apiPrefix}/employees`,
        employeeData: `${config.server.apiPrefix}/employees/:name`,
        syncStatus: `${config.server.apiPrefix}/sync/status`,
      },
    },
  }))

  return app
}
