import { FastifyInstance } from 'fastify'
import TicketModel from '@models/Ticket'
import ClientRatingModel from '@models/ClientRating'
import { logger } from '@utils'

export default async function init(instance: FastifyInstance) {
  // Get all employees
  instance.get('/', async (_req, reply) => {
    try {
      const employees = await TicketModel.distinct('employeeName')
      return {
        message: 'ok',
        data: {
          employees: (employees as string[]).sort() || [],
        },
      }
    } catch (error) {
      logger.error('Error getting employees:', error)
      return reply.status(500).send({ message: 'Internal server error', data: null })
    }
  })

  // Get employee tickets
  instance.get<{ Params: { name: string } }>('/:name/tickets', async (req, reply) => {
    try {
      const { name } = req.params
      const tickets = await TicketModel.find({ employeeName: name }).sort({ date: -1 })
      return {
        message: 'ok',
        data: { tickets },
      }
    } catch (error) {
      logger.error('Error getting tickets:', error)
      return reply.status(500).send({ message: 'Internal server error', data: null })
    }
  })

  // Get employee ratings
  instance.get<{ Params: { name: string } }>('/:name/ratings', async (req, reply) => {
    try {
      const { name } = req.params
      const ratings = await ClientRatingModel.find({ responsible: name }).sort({ date: -1 })
      return {
        message: 'ok',
        data: { ratings },
      }
    } catch (error) {
      logger.error('Error getting ratings:', error)
      return reply.status(500).send({ message: 'Internal server error', data: null })
    }
  })
}

