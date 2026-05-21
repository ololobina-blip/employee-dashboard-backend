import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import AppealModel from '@models/Appeal'
import logger from '@utils/logger'

const GOOGLE_SCRIPT_URL = process.env.VITE_GOOGLE_APPEALS_SCRIPT_URL || ''

export default async function appeals(fastify: FastifyInstance) {
  // Get all appeals
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const appeals = await AppealModel.find().sort({ createdAt: -1 })
      reply.send({ success: true, appeals })
    } catch (error) {
      reply.status(500).send({ success: false, error: String(error) })
    }
  })

  // Get employee appeals
  fastify.get('/:employeeName', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { employeeName } = request.params as { employeeName: string }
      const appeals = await AppealModel.find({ employeeName }).sort({ createdAt: -1 })
      reply.send({ success: true, appeals })
    } catch (error) {
      reply.status(500).send({ success: false, error: String(error) })
    }
  })

  // Submit appeal
  fastify.post<{ Body: unknown }>('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const appealData = request.body as {
        ticketLink: string
        employeeName: string
        date: string
        monthYear: string
        comment: string
      }

      const appeal = {
        id: uuidv4(),
        ...appealData,
        status: 'pending' as const,
        submittedAt: new Date().toISOString(),
        syncedToGoogleSheets: false,
      }

      // Save to MongoDB
      const savedAppeal = await AppealModel.create(appeal)

      // Try to sync to Google Sheets (non-blocking)
      if (GOOGLE_SCRIPT_URL) {
        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
              action: 'submitAppeal',
              appeal,
            }),
          })
          await AppealModel.updateOne({ id: appeal.id }, { syncedToGoogleSheets: true })
        } catch (error) {
          logger.warn('Failed to sync appeal to Google Sheets:', error)
        }
      }

      reply.status(201).send({ success: true, appeal: savedAppeal })
    } catch (error) {
      reply.status(500).send({ success: false, error: String(error) })
    }
  })

  // Update appeal status
  fastify.patch<{ Body: unknown }>('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const { status, resolvedBy } = request.body as {
        status: 'approved' | 'rejected'
        resolvedBy?: string
      }

      const appeal = await AppealModel.findOneAndUpdate(
        { id },
        {
          status,
          resolvedAt: new Date().toISOString(),
          resolvedBy,
          syncedToGoogleSheets: false,
        },
        { new: true }
      )

      // Try to sync to Google Sheets
      if (GOOGLE_SCRIPT_URL && appeal) {
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

      reply.send({ success: true, appeal })
    } catch (error) {
      reply.status(500).send({ success: false, error: String(error) })
    }
  })
}