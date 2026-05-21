import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { getErrorObject } from '@utils'

export default async function init(instance: FastifyInstance) {
  instance.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    // Skip for public endpoints
    if (req.url.startsWith('/auth')) {
      return
    }

    try {
      await req.jwtVerify()
    } catch (err) {
      throw getErrorObject('401', 'Unauthorized', 'UNAUTHORIZED')
    }
  })
}


