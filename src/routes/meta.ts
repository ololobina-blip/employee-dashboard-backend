import { FastifyInstance } from 'fastify'
import { config } from '../config'

/** Публичная конфигурация для будущего подключения фронта (без секретов). */
export default async function metaRoutes(app: FastifyInstance): Promise<void> {
  app.get('/meta', async (_request, reply) => {
    const publicUrl = process.env.PUBLIC_API_URL?.trim().replace(/\/$/, '') || null

    return reply.send({
      success: true,
      data: {
        frontendUrl: config.server.frontendUrl || null,
        apiPrefix: config.server.apiPrefix,
        publicApiUrl: publicUrl,
        endpoints: {
          employees: `${config.server.apiPrefix}/employees`,
          employeeData: `${config.server.apiPrefix}/employees/:name`,
          health: `${config.server.apiPrefix}/health`,
        },
        appealsNote:
          'Подача и рассмотрение апелляций — только через Google Apps Script на фронте, не через этот API.',
      },
    })
  })
}
