import { JSONSchema } from 'json-schema-to-ts'

export default {
  description: 'User login',
  tags: ['auth'],
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      password: { type: 'string', minLength: 1, maxLength: 255 },
    },
    required: ['email', 'password'],
    additionalProperties: false,
  } as const satisfies JSONSchema,
  response: {
    '4xx': {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error_code: { type: 'string' },
      },
    } as const satisfies JSONSchema,
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                role: { type: 'string', enum: ['admin', 'employee'] },
                employeeName: { type: 'string', nullable: true },
              },
            },
          },
          required: ['token', 'user'],
        },
      },
      required: ['message', 'data'],
    } as const satisfies JSONSchema,
  },
} as const
