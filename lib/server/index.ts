import 'source-map-support/register';
import 'joi-extract-type';

import joi from '@hapi/joi';

import { join as pJoin } from 'path';
import { Server, Request } from '@hapi/hapi';
import inert from '@hapi/inert';
import vision from '@hapi/vision';
import hapiAuthJwt2 from 'hapi-auth-jwt2';
import handlebars from 'handlebars';

import { init as initQuizRoute } from './controllers/quiz';
import { init as initQuizService } from './quiz';
import { init as initQuizStorage } from './storage/quiz-storage';
import { init as initUserStorage } from './storage/user-storage';
import { validateUser } from './auth';
import { errorMapperExtension } from './extensions/error-response-mapper';
import _ from 'lodash';

const requireHttps = require('hapi-require-https');

const CONFIG = {
  auth: {
    algorithm: 'HS256',
    secret: 'CHANGE_ME',
  },
};

export type Config = Readonly<typeof CONFIG>;

(async () => {
  const userStorage = initUserStorage({});
  const quizStorage = initQuizStorage({});
  const quizService = initQuizService({ quizStorage, userStorage });

  const server = new Server({
    port: process.env.PORT || 8080,
    router: {
      stripTrailingSlash: true,
    },
    routes: {
      files: {
        relativeTo: pJoin(__dirname, '../client'),
      },
      response: {
        options: {
          allowUnknown: false,
        },
      },
      validate: {
        options: {
          allowUnknown: false,
        },
        failAction: async (_request, _h, error) => {
          throw error;
        }
      }
    }
  });

  await server.register([
    vision,
    inert,
    hapiAuthJwt2,
    requireHttps,
  ]);

  server.views({
    engines: { hbs: handlebars },
    relativeTo: __dirname,
    path: 'views',
    layoutPath: 'views/layouts',
    layout: 'main',
    helpersPath: 'views/helpers',
  });

  server.auth.strategy('jwt', 'jwt', {
    key: CONFIG.auth.secret,
    verifyOptions: {
      algorithms: [CONFIG.auth.algorithm],
    },
    validate: validateUser(userStorage),
    responseFunc: (request: Request) => {
      // @ts-ignore
      request.response.header('Authorization', request.auth.artifacts);
    }
  });

  server.auth.default('jwt');

  server.route({
    method: 'GET',
    path: '/static/{param*}',
    options: {
      auth: false,
    },
    handler: {
      directory: {
        listing: true,
        path: '.',
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: false,
    },
    handler: {
      view: {
        template: 'join',
        context: {},
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/create',
    options: {
      auth: false,
    },
    handler: {
      view: {
        template: 'create',
        context: {},
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/quiz/{quizId}',
    options: {
      auth: false,
      validate: {
        params: joi.object().keys({
          quizId: joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      const { quizId } = request.params;
      const quiz = await quizService.getQuiz(quizId);

      const adminPlayer = _.find(quiz.players, { status: 'ADMIN' });
      if (!adminPlayer) {
        throw new Error('Unexpected error');
      }

      const quizTitle = `${adminPlayer.name}'s Quiz`;

      return h.view('quiz', {
        showHeader: true,
        showFooter: true,
        quizTitle,
        quiz,
      });
    },
  });

  server.route({
    method: 'GET',
    path: '/heartbeat',
    options: {
      auth: false,
    },
    handler: () => ({ status: 'OK' }),
  });

  server.route(initQuizRoute({ quizService, config: CONFIG }));

  server.ext(errorMapperExtension);

  await server.start();
})();

process.on('unhandledRejection', (error) => {
  console.error(error);
  process.exit(1);
});
