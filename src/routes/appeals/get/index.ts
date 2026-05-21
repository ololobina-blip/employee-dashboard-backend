import { FastifyInstance, FastifyRequest } from 'fastify'
import AppealModel from '@models/Appeal'
import logger from '@utils/logger'

export default async function init(instance: FastifyInstance) {
  // Get all appeals (admin only)
  instance.get('/', async (req: FastifyRequest, reply) => {
    try {
      const user = req.user as { role: 'admin' | 'employee'; email: string } | undefined

      if (user?.role !== 'admin') {
        return reply.status(403).send({ message: 'Forbidden', data: null })
      }

      const appeals = await AppealModel.find().sort({ createdAt: -1 })
      return { message: 'ok', data: { appeals, total: appeals.length } }
    } catch (error) {
      logger.error('Error getting appeals:', error)
      return reply.status(500).send({ message: 'Internal server error', data: null })
    }
  })

  // Get appeals by employee
  instance.get('/:employeeName', async (req: FastifyRequest, reply) => {
    try {
      const { employeeName } = req.params as { employeeName: string }
      const appeals = await AppealModel.find({ employeeName }).sort({ createdAt: -1 })
      return { message: 'ok', data: { appeals, total: appeals.length } }
    } catch (error) {
      logger.error('Error getting employee appeals:', error)
      return reply.status(500).send({ message: 'Internal server error', data: null })
    }
  })
}

