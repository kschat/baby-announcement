import { ServiceCallError } from '../errors';

export interface ApiResult {
  readonly token: string | null;
  readonly data: any;
}

export const serviceCall = async (
  ...args: Parameters<typeof fetch>
): Promise<ApiResult> => {
  try {
    const response = await fetch(...args);
    const result = await response.json();
    if (!result) {
      throw new ServiceCallError('Error', 'Unexpected response from service');
    }

    if (result.error) {
      throw new ServiceCallError(
        result.error.clientTitle || 'Unknown Error',
        result.error.clientMessage || 'Unknown error occurred.',
      );
    }

    if (!result.data) {
      throw new ServiceCallError('Error', 'Unexpected response from service');
    }

    return {
      token: response.headers.get('authorization') || null,
      data: result.data,
    };
  } catch (responseError) {
    if (responseError instanceof ServiceCallError) {
      throw responseError;
    }

    const data = responseError && responseError.error || {};
    throw new ServiceCallError(
      data.clientTitle || 'Unknown Error',
      data.clientMessage || 'Unknown error occurred.',
    );
  }
};
