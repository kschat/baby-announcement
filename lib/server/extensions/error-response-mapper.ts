import * as Boom from '@hapi/boom';
import _ from 'lodash';
import { ServerExtEventsRequestObject } from '@hapi/hapi';

import { AppError } from '../errors';
import {

  DEFAULT_ERROR_RESPONSE,
  ErrorResponseConfig,
  apiErrors,
} from '../config/api-errors';

const DEFAULT_ERROR_CODE = 'INTERNAL_SERVER_ERROR';

const formatBoomError = ({ output }: Boom): ErrorResponseConfig => ({
  title: output.payload.error,
  message: output.payload.message,
  statusCode: output.statusCode,
});

const getApiError = (response: Boom): ErrorResponseConfig => {
  const errorResponse = apiErrors.get(response.constructor);
  if (!errorResponse) {
    return response.output.statusCode === 500
      ? { ...DEFAULT_ERROR_RESPONSE }
      : formatBoomError(response);
  }

  return { ...errorResponse };
};

const isBoom = <T>(value: unknown): value is Boom<T> => {
  return value instanceof Error && (value as any).isBoom;
};

const getErrorCode = (error: Error) => {
  if (error instanceof AppError) {
    return error.code;
  }

  if (isBoom(error)) {
    return _.snakeCase(error.output.payload.error).toUpperCase();
  }

  return DEFAULT_ERROR_CODE;
};

export const errorMapperExtension: ServerExtEventsRequestObject = {
  type: 'onPreResponse',
  method: (request, h) => {
    const { response } = request;
    // @ts-ignore
    if (!isBoom(response)) {
      return h.continue;
    }

    console.log(response);

    const apiError = getApiError(response);

    response.output.statusCode = apiError.statusCode;
    // @ts-ignore
    response.output.payload = {
      // @ts-ignore
      error: {
        code: getErrorCode(response),
        clientTitle: apiError.title,
        clientMessage: apiError.message,
        diagnosticMessage: response.message || undefined,
      },
    };

    return h.continue;
  },
};
