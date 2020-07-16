import { ServiceCallError } from '../errors';
import { serviceCall, ApiResult } from './service-call';

export interface JoinQuizOptions {
  readonly nickname: string;
  readonly joinCode: string;
}

export const joinQuiz = async ({ nickname, joinCode }: JoinQuizOptions): Promise<ApiResult> => {
  const result = await serviceCall(`/api/quiz/${joinCode}/join`, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        userName: nickname,
      },
    }),
  });

  if (!result.token) {
    throw new ServiceCallError('Unexpected error', 'Missing required auth token');
  }

  return result;
};

export interface CreateQuizOptions {
  readonly nickname: string;
}

export const createQuiz = async ({ nickname }: CreateQuizOptions): Promise<ApiResult> => {
  const result = await serviceCall(`/api/quiz`, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        userName: nickname,
      },
    }),
  });

  if (!result.token) {
    throw new ServiceCallError('Unexpected error', 'Missing required auth token');
  }

  return result;
};

interface GetQuizOptions {
  readonly id: string;
  readonly token: string;
}

export const getQuizById = async ({ id, token }: GetQuizOptions): Promise<ApiResult> => {
  const result = await serviceCall(`/api/quiz/${id}`, {
    method: 'GET',
    headers: {
      authorization: token,
    },
  });

  if (!result.token) {
    throw new ServiceCallError('Unexpected error', 'Missing required auth token');
  }

  return result;
};

interface StartQuizOptions {
  readonly id: string;
  readonly token: string;
}

export const startQuiz = async ({
  id,
  token,
}: StartQuizOptions): Promise<ApiResult> => {
  const result = await serviceCall(`/api/quiz/${id}/start`, {
    method: 'POST',
    headers: {
      authorization: token,
    },
  });

  if (!result.token) {
    throw new ServiceCallError('Unexpected error', 'Missing required auth token');
  }

  return result;
};

interface SubmitAnswerOptions {
  readonly id: string;
  readonly token: string;
  readonly questionId: string;
  readonly choiceId: string;
}

export const submitAnswer = async ({
  id,
  token,
  questionId,
  choiceId,
}: SubmitAnswerOptions): Promise<ApiResult> => {
  const result = await serviceCall(`/api/quiz/${id}/question/${questionId}/answer`, {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        choiceId,
      },
    }),
    headers: {
      authorization: token,
    },
  });

  if (!result.token) {
    throw new ServiceCallError('Unexpected error', 'Missing required auth token');
  }

  return result;
};
