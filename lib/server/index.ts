import 'source-map-support/register';
import 'joi-extract-type';

import { Server, Request } from '@hapi/hapi';
import inert from '@hapi/inert';
import hapiAuthJwt2 from 'hapi-auth-jwt2';
import { join as pJoin } from 'path';

import { init as initQuizRoute } from './controllers/quiz';
import { init as initQuizService } from './quiz';
import { init as initQuizStorage } from './storage/quiz-storage';
import { init as initUserStorage } from './storage/user-storage';
import { validateUser } from './auth';
import { errorMapperExtension } from './extensions/error-response-mapper';

// required routes:
// POST /quiz -- creates the quiz room and returns a code for others to join. Does not start the quiz
// POST /quiz/{joinCode}/join -- adds a user to a quiz
// POST /quiz/{id}/start -- starts the quiz, only the person who initiated the quiz can do this
// GET /quiz/{id} -- polling/SSE endpoint to determine if the quiz has started. Also used to get the next question when the quiz has started.
// PUT /quiz/{quizId}/question/{questionId}/answer -- sends the answer for a question for a user

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
    port: 8080,
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
    inert,
    hapiAuthJwt2,
  ]);

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
      file: './views/index.html',
    },
  });

  server.route({
    method: 'GET',
    path: '/create',
    options: {
      auth: false,
    },
    handler: {
      file: './views/create.html',
    },
  });

  server.route({
    method: 'GET',
    path: '/quiz',
    options: {
      auth: false,
    },
    handler: {
      file: './views/quiz.html',
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
