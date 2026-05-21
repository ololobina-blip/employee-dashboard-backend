import { FastifyInstance, FastifyRequest } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import AppealModel from '@models/Appeal'
import logger from '@utils/logger'

export default async function init(instance: FastifyInstance) {
  instance.post('/', async (req: FastifyRequest, reply) => {
    try {
      const { ticketLink, comment, employeeName, date, monthYear } = req.body as {
        ticketLink: string
        comment: string
        employeeName: string
        date: string
        monthYear: string
      }

      if (!employeeName || !date || !monthYear) {
        return reply.status(400).send({
          message: 'Missing required fields',
          data: null,
        })
      }

      const appeal = await AppealModel.create({
        id: uuidv4(),
        ticketLink,
        comment,
        employeeName,
        date,
        monthYear,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        syncedToGoogleSheets: false,
      })

      // Try to sync to Google Sheets (non-blocking)
      const GOOGLE_SCRIPT_URL = process.env.VITE_GOOGLE_APPEALS_SCRIPT_URL
      if (GOOGLE_SCRIPT_URL) {
        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
              action: 'submitAppeal',
              appeal: appeal.toObject(),
            }),
          })
          await AppealModel.updateOne({ id: appeal.id }, { syncedToGoogleSheets: true })
        } catch (error) {
          logger.warn('Failed to sync appeal to Google Sheets:', error)
        }
      }

      return {
        message: 'ok',
        data: {
          id: appeal.id,
          status: 'pending',
          submittedAt: appeal.submittedAt,
        },
      }
    } catch (error) {
      logger.error('Error creating appeal:', error)
      return reply.status(500).send({ message: 'Internal server error', data: null })
    }
  })
}

