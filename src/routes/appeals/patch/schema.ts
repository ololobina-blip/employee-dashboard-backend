import { JSONSchema } from 'json-schema-to-ts'

export default {
  description: 'Update appeal status (admin only)',
  tags: ['appeals'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string', maxLength: 36 },
    },
    required: ['id'],
  } as const satisfies JSONSchema,
  body: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
    },
    required: ['status'],
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
            id: { type: 'string' },
            status: { type: 'string' },
            resolvedAt: { type: 'string' },
          },
          required: ['id', 'status', 'resolvedAt'],
        },
      },
      required: ['message', 'data'],
    } as const satisfies JSONSchema,
  },
} as const
