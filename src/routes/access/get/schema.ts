import { JSONSchema } from 'json-schema-to-ts'

export default {
  description: 'Get access entries (admin only)',
  tags: ['access'],
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
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  email: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'employee'] },
                  status: { type: 'string', enum: ['active', 'invited'] },
                  invited_at: { type: 'string', nullable: true },
                  created_at: { type: 'string' },
                },
              },
            },
            total: { type: 'integer' },
          },
          required: ['entries', 'total'],
        },
      },
      required: ['message', 'data'],
    } as const satisfies JSONSchema,
  },
} as const
