import { FastifyInstance } from 'fastify'
import {
  fetchEmployeeData,
  getAllEmployees,
  getRatingsForEmployee,
  getTicketsForEmployee,
} from '../services/dashboardService'

export default async function employeesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/employees', async (_request, reply) => {
    const data = await getAllEmployees()
    return reply.send({ success: true, data })
  })

  app.get<{ Params: { name: string } }>('/employees/:name', async (request, reply) => {
    const name = decodeURIComponent(request.params.name)
    const data = await fetchEmployeeData(name)

    if (!data) {
      return reply.status(404).send({ success: false, error: 'Employee not found' })
    }

    return reply.send({ success: true, data })
  })

  app.get<{ Params: { name: string } }>('/employees/:name/tickets', async (request, reply) => {
    const name = decodeURIComponent(request.params.name)
    const data = await getTicketsForEmployee(name)
    return reply.send({ success: true, data })
  })

  app.get<{ Params: { name: string } }>('/employees/:name/ratings', async (request, reply) => {
    const name = decodeURIComponent(request.params.name)
    const data = await getRatingsForEmployee(name)
    return reply.send({ success: true, data })
  })
}
