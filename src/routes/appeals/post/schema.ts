import { JSONSchema } from 'json-schema-to-ts'

export default {
  description: 'Create new appeal',
  tags: ['appeals'],
  body: {
    type: 'object',
    properties: {
      employeeName: { type: 'string', maxLength: 255 },
      ticketLink: { type: 'string', maxLength: 500 },
      date: { type: 'string', maxLength: 10 },
      monthYear: { type: 'string', maxLength: 50 },
      comment: { type: 'string' },
    },
    required: ['employeeName', 'ticketLink', 'date', 'monthYear', 'comment'],
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
            submittedAt: { type: 'string' },
          },
          required: ['id', 'status', 'submittedAt'],
        },
      },
      required: ['message', 'data'],
    } as const satisfies JSONSchema,
  },
} as const
