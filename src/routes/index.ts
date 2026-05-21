import { FastifyInstance } from 'fastify'
// import auth from './auth'
import appeals from './appeals'
// import access from './access'
import employees from './employees'

export default async function initRoutes(instance: FastifyInstance) {
  // Health check
  instance.get('/health', async () => ({
    message: 'ok',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  }))

  // All routes
  // await instance.register(auth, { prefix: '/auth' })
  await instance.register(appeals, { prefix: '/appeals' })
  // await instance.register(access, { prefix: '/access' })
  await instance.register(employees, { prefix: '/employees' })
}

