import _ from 'lodash';
import { ServerRoute } from '@hapi/hapi';
import joi from '@hapi/joi';
import 'joi-extract-type';
import shortId from 'shortid';

import { QuizService } from '../quiz';
import { Config } from '..';
import { createToken } from '../auth';

import {
  userNameSchema,
  initializedQuizSchema,
  joinCodeSchema,
  idSchema,
  quizResponseSchema,
} from '../models';

export interface Options {
  readonly quizService: QuizService;
  readonly config: Config;
}

export const init = ({ quizService, config }: Options): ServerRoute[] => {
  const getQuiz: ServerRoute = {
    method: 'GET',
    path: '/api/quiz/{id}',
    options: {
      response: {
        failAction: 'log',
        schema: joi.object().keys({
          data: quizResponseSchema.required(),
        }),
      },
      validate: {
        params: joi.object().keys({
          id: idSchema.required(),
        }),
      },
    },
    handler: async (request) => {
      const { id } = request.params;
      const quiz = await quizService.getQuiz(id);
      const quizResponse = {
        id: quiz.id,
        joinCode: quiz.joinCode,
        status: quiz.status,
        players: quiz.players,
      };

      if (quiz.status !== 'IN_PROGRESS') {
        return { data: quizResponse };
      }

      const currentQuestion = _.find(quiz.questions, { status: 'IN_PROGRESS' });
      if (!currentQuestion) {
        throw new Error('Missing current question');
      }

      return {
        data: {
          ...quizResponse,
          currentQuestion: {
            id: currentQuestion.id,
            status: currentQuestion.status,
            text: currentQuestion.text,
            choices: currentQuestion.choices,
          },
        },
      };
    },
  };


  const createQuiz: ServerRoute = {
    method: 'POST',
    path: '/api/quiz',
    options: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          data: {
            userName: userNameSchema.required(),
          },
        }),
      },
      response: {
        schema: joi.object().keys({
          data: initializedQuizSchema.required(),
        }),
      },
    },
    handler: async (request, h) => {
      const { quiz, user } = await quizService.createQuiz({
        joinCode: shortId(),
        // @ts-ignore - figure out how to have type saftey with payload
        userName: request.payload.data.userName,
      });

      const response = h.response({
        data: {
          id: quiz.id,
          joinCode: quiz.joinCode,
          status: quiz.status,
        },
      });

      response.header('Authorization', createToken({
        user,
        secret: config.auth.secret,
        algorithm: config.auth.algorithm,
      }));

      return response;
    },
  };

  const joinQuiz: ServerRoute = {
    method: 'POST',
    path: '/api/quiz/{joinCode}/join',
    options: {
      auth: false,
      validate: {
        params: joi.object().keys({
          joinCode: joinCodeSchema.required(),
        }),
        payload: joi.object().keys({
          data: {
            userName: userNameSchema.required(),
          },
        }),
      },
      response: {
        schema: joi.object().keys({
          data: initializedQuizSchema.required(),
        }),
      },
    },
    handler: async (request, h) => {
      const { params } = request;
      // @ts-ignore - TODO determine if we can type checked by TS
      const { userName } = request.payload.data as { userName: string };

      const { quiz, user } = await quizService.joinQuiz({
        joinCode: params.joinCode,
        userName,
      });

      const response = h.response({
        data: {
          id: quiz.id,
          joinCode: quiz.joinCode,
          status: quiz.status,
        },
      });

      response.header('Authorization', createToken({
        user,
        secret: config.auth.secret,
        algorithm: config.auth.algorithm,
      }));

      return response;
    },
  };

  const startQuiz: ServerRoute = {
    method: 'POST',
    path: '/api/quiz/{id}/start',
    options: {
      response: {
        schema: joi.object().keys({
          data: quizResponseSchema.required(),
        }),
      },
      validate: {
        params: joi.object().keys({
          id: idSchema.required(),
        }),
      },
    },
    handler: async (request) => {
      // @ts-ignore
      const userId = request.auth.credentials.id;
      const { id } = request.params;
      const quiz = await quizService.startQuiz({ quizId: id, userId });

      const [firstQuestion] = quiz.questions;

      return {
        data: {
          id: quiz.id,
          joinCode: quiz.joinCode,
          status: quiz.status,
          currentQuestion: {
            id: firstQuestion.id,
            status: firstQuestion.status,
            text: firstQuestion.text,
            choices: firstQuestion.choices,
          },
        },
      };
    },
  };

  const submitAnswer: ServerRoute = {
    method: 'PUT',
    path: '/api/quiz/{quizId}/question/{questionId}/answer',
    options: {
      response: {
        schema: joi.object().keys({
          data: quizResponseSchema.required(),
        }),
      },
      validate: {
        params: joi.object().keys({
          quizId: idSchema.required(),
          questionId: idSchema.required(),
        }),
        payload: joi.object().keys({
          data: {
            choiceId: idSchema.required(),
          },
        }),
      },
    },
    handler: async (request) => {
      // @ts-ignore
      const userId = request.auth.credentials.id;
      // @ts-ignore - TODO determine if we can type checked by TS
      const { choiceId } = request.payload.data as { choiceId: string };
      const { quizId, questionId } = request.params;

      const quiz = await quizService.answerQuizQuestion({
        userId,
        quizId,
        choiceId,
        questionId,
      });

      const quizResponse = {
        id: quiz.id,
        joinCode: quiz.joinCode,
        status: quiz.status,
      };

      if (quiz.status !== 'IN_PROGRESS') {
        return { data: quizResponse };
      }

      const currentQuestion = _.find(quiz.questions, { status: 'IN_PROGRESS' });
      if (!currentQuestion) {
        throw new Error('Missing current question');
      }

      return {
        data: {
          ...quizResponse,
          currentQuestion: {
            id: currentQuestion.id,
            status: currentQuestion.status,
            text: currentQuestion.text,
            choices: currentQuestion.choices,
          },
        },
      };
    },
  };

  return [
    getQuiz,
    createQuiz,
    joinQuiz,
    startQuiz,
    submitAnswer,
  ];
};
