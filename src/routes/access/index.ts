import { FastifyInstance } from 'fastify'
import get from './get'
import post from './post'

export default async function init(instance: FastifyInstance) {
  await instance.register(get)
  await instance.register(post)
}
