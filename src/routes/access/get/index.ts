import { FastifyInstance, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { query } from '@db'
import { getErrorObject } from '@utils'
import schema from './schema'

export default async function init(instance: FastifyInstance) {
  async function get(
    req: FastifyRequest,
  ): Promise<FromSchema<(typeof schema.response)['200']>> {
    const user = req.user as { role: 'admin' | 'employee' }

    if (user.role !== 'admin') {
      throw getErrorObject('403', 'Only admins can view access entries', 'FORBIDDEN')
    }

    const entries = await query(
      'SELECT id, email, role, status, invited_at, created_at FROM access_entries ORDER BY created_at DESC',
    )

    return {
      message: 'ok',
      data: {
        entries: entries as any,
        total: entries.length,
      },
    }
  }

  instance.get('/', { schema }, get)
  return Promise.resolve()
}
