import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import config from '@config'
import { getErrorObject } from '@utils'
import { ErrorResponse } from '@interfaces'
// import authenticate from '@middleware/authenticate'
import initRoutes from './routes'

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'error' : 'debug',
    },
    trustProxy: true,
    ignoreTrailingSlash: true,
  })

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: false,
  })

  // CORS
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  })

  // JWT
  await app.register(jwt, {
    secret: config.jwtSecret,
  })

  // Middleware
  // await app.register(authenticate)

  // Routes
  await app.register(
    async (instance) => {
      await instance.register(initRoutes)
    },
    { prefix: config.apiPrefix },
  )

  // Error handler
  app.setErrorHandler(
    async (error: ErrorResponse | Error, _req: FastifyRequest, reply: FastifyReply) => {
      const errorObj = error instanceof Error ? error : (error as unknown as ErrorResponse)

      if ('statusCode' in errorObj && typeof errorObj.statusCode === 'number') {
        // Custom error
        const customError = errorObj as ErrorResponse
        reply.status(customError.statusCode).send(customError)

        if (customError.statusCode >= 500) {
          app.log.error(customError, 'API Error')
        }
      } else {
        // Unexpected error - mask as 500
        app.log.error(errorObj, 'Unhandled Error')
        reply.status(500).send(getErrorObject('500', 'INTERNAL_SERVER_ERROR'))
      }
    },
  )

  return app
}

