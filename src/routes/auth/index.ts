import { FastifyInstance } from 'fastify'
import login from './login'

export default async function init(instance: FastifyInstance) {
  await instance.register(login, { prefix: '/login' })
}
