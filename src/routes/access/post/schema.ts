import { JSONSchema } from 'json-schema-to-ts'

export default {
  description: 'Add new access entry (admin only)',
  tags: ['access'],
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      role: { type: 'string', enum: ['admin', 'employee'] },
    },
    required: ['email'],
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
            email: { type: 'string' },
            role: { type: 'string' },
            status: { type: 'string' },
          },
          required: ['email', 'role', 'status'],
        },
      },
      required: ['message', 'data'],
    } as const satisfies JSONSchema,
  },
} as const
