import { ErrorCode, ErrorResponse } from '@interfaces'
import logger from './logger'

const codeToName: Record<ErrorCode, string> = {
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '403': 'Forbidden',
  '404': 'Not Found',
  '409': 'Conflict',
  '500': 'Internal Server Error',
}

export function getErrorObject(
  code: ErrorCode,
  message: string,
  errorCode: string = message,
  data?: unknown,
): ErrorResponse {
  return {
    statusCode: parseInt(code),
    code,
    name: codeToName[code],
    message,
    error_code: errorCode,
    data,
  }
}

export { logger }
