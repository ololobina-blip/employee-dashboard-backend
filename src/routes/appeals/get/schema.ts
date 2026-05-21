import { JSONSchema } from 'json-schema-to-ts'

export default {
  description: 'Get appeals list',
  tags: ['appeals'],
  querystring: {
    type: 'object',
    properties: {
      employeeId: { type: 'string', maxLength: 255 },
    },
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
            appeals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  employee_name: { type: 'string' },
                  ticket_link: { type: 'string' },
                  date: { type: 'string' },
                  month_year: { type: 'string' },
                  comment: { type: 'string' },
                  status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                  submitted_at: { type: 'string' },
                  resolved_at: { type: 'string', nullable: true },
                },
              },
            },
            total: { type: 'integer' },
          },
          required: ['appeals', 'total'],
        },
      },
      required: ['message', 'data'],
    } as const satisfies JSONSchema,
  },
} as const
