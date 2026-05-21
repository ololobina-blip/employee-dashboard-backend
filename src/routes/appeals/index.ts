import { FastifyInstance } from 'fastify'
import get from './get'
import post from './post'
import patch from './patch'

export default async function init(instance: FastifyInstance) {
  await instance.register(get)
  await instance.register(post)
  await instance.register(patch)
}
