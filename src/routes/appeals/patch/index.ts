import { FastifyInstance, FastifyRequest } from 'fastify'
import AppealModel from '@models/Appeal'
import logger from '@utils/logger'

export default async function init(instance: FastifyInstance) {
  instance.patch<{ Params: { id: string } }>('/:id', async (req: FastifyRequest, reply) => {
    try {
      const user = req.user as { role: 'admin' | 'employee' } | undefined
      const { id } = req.params
      const { status, resolvedBy } = req.body as {
        status: 'approved' | 'rejected'
        resolvedBy?: string
      }

      if (user?.role !== 'admin') {
        return reply.status(403).send({
          message: 'Only admins can update appeals',
          data: null,
        })
      }

      const appeal = await AppealModel.findOne({ id })
      if (!appeal) {
        return reply.status(404).send({
          message: 'Appeal not found',
          data: null,
        })
      }

      const now = new Date().toISOString()
      await AppealModel.updateOne(
        { id },
        {
          status,
          resolvedAt: now,
          resolvedBy,
          syncedToGoogleSheets: false,
        }
      )

      // Try to sync to Google Sheets
      const GOOGLE_SCRIPT_URL = process.env.VITE_GOOGLE_APPEALS_SCRIPT_URL
      if (GOOGLE_SCRIPT_URL) {
        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
              action: 'updateAppealStatus',
              appealId: id,
              status,
              adminName: resolvedBy,
            }),
          })
          await AppealModel.updateOne({ id }, { syncedToGoogleSheets: true })
        } catch (error) {
          logger.warn('Failed to sync appeal update to Google Sheets:', error)
        }
      }

      return {
        message: 'ok',
        data: {
          id,
          status,
          resolvedAt: now,
        },
      }
    } catch (error) {
      logger.error('Error updating appeal:', error)
      return reply.status(500).send({ message: 'Internal server error', data: null })
    }
  })
}

