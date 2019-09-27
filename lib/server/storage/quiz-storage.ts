import uuid from 'uuid/v4';

import { pushAndReturn } from '../utils/array';
import { Quiz, QuizStatus, User, Question } from '../models';
import { QuizNotFoundError, QuizAlreadyExistsError } from '../errors';

export type QuizStorage = Readonly<ReturnType<typeof init>>;

export interface Options {}

export const init = (_options: Options) => {
  const DATA: Quiz[] = [];

  const getQuizAndIndex = async (id: string): Promise<[Quiz, number]> => {
    const index = DATA.findIndex((quiz) => quiz.id === id);
    if (index === -1) {
      throw new QuizNotFoundError('Quiz not found!');
    }

    return [DATA[index], index];
  };

  return {
    __DATA: DATA,

    getById: async (id: string): Promise<Quiz> => (await getQuizAndIndex(id))[0],

    create: async (joinCode: string, user: User, questions: Question[]): Promise<Quiz> => {
      if (DATA.find((quiz) => quiz.joinCode === joinCode && quiz.status !== 'FINISHED')) {
        throw new QuizAlreadyExistsError(
          `Quiz with join code "${joinCode}" already exists and is still active`
        );
      }

      return pushAndReturn(DATA, {
        id: uuid(),
        joinCode,
        status: 'INITIALIZED',
        players: [user],
        questions,
      });
    },

    getByJoinCode: async (joinCode: string): Promise<Quiz> => {
      const quiz = DATA.find((quiz) => quiz.joinCode === joinCode);
      if (!quiz) {
        throw new QuizNotFoundError('Quiz not found!');
      }

      return quiz;
    },

    updateStatus: async (id: string, status: QuizStatus): Promise<Quiz> => {
      const [, quizIndex] = await getQuizAndIndex(id);

      const existingQuiz = DATA[quizIndex];
      // @ts-ignore - TODO don't mutate
      existingQuiz.questions[0].status = 'IN_PROGRESS';
      return DATA[quizIndex] = {
        ...existingQuiz,
        status,
      };
    },

    addUser: async (id: string, user: User): Promise<Quiz> => {
      const [, quizIndex] = await getQuizAndIndex(id);

      const existingQuiz = DATA[quizIndex];
      return DATA[quizIndex] = {
        ...existingQuiz,
        players: existingQuiz.players.concat(user),
      };
    },
  };
};
