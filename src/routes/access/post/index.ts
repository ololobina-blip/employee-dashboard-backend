import { FastifyInstance, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { execute, queryOne } from '@db'
import { getErrorObject } from '@utils'
import schema from './schema'

export default async function init(instance: FastifyInstance) {
  async function post(
    req: FastifyRequest<{
      Body: FromSchema<typeof schema.body>
    }>,
  ): Promise<FromSchema<(typeof schema.response)['200']>> {
    const user = req.user as { role: 'admin' | 'employee' }
    const { email, role } = req.body

    if (user.role !== 'admin') {
      throw getErrorObject('403', 'Only admins can add access entries', 'FORBIDDEN')
    }

    // Check if already exists
    const existing = await queryOne('SELECT id FROM access_entries WHERE email = ?', [email])
    if (existing) {
      throw getErrorObject('400', 'User already exists', 'USER_EXISTS')
    }

    const now = new Date()
    await execute(
      'INSERT INTO access_entries (email, role, status, invited_at) VALUES (?, ?, ?, ?)',
      [email, role || 'employee', 'invited', now.toISOString()],
    )

    return {
      message: 'ok',
      data: {
        email,
        role: role || 'employee',
        status: 'invited',
      },
    }
  }

  instance.post('/', { schema }, post)
  return Promise.resolve()
}
