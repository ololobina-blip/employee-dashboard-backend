import { FastifyInstance, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import bcrypt from 'bcryptjs'
import { queryOne } from '@db'
import { getErrorObject } from '@utils'
import schema from './schema'

export default async function init(instance: FastifyInstance) {
  async function post(
    req: FastifyRequest<{
      Body: FromSchema<typeof schema.body>
    }>,
  ): Promise<FromSchema<(typeof schema.response)['200']>> {
    const { email, password } = req.body

    // Find user
    const user = await queryOne<{ id: number; email: string; password_hash: string; role: string; employee_name?: string }>(
      'SELECT id, email, password_hash, role, employee_name FROM users WHERE email = ?',
      [email],
    )

    if (!user) {
      throw getErrorObject('401', 'Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      throw getErrorObject('401', 'Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // Generate JWT token
    const token = instance.jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: '24h' },
    )

    return {
      message: 'ok',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role as 'admin' | 'employee',
          employeeName: user.employee_name,
        },
      },
    }
  }

  instance.post('/', { schema }, post)
  return Promise.resolve()
}
