import _ from 'lodash';
import uuid from 'uuid/v4';

import { pushAndReturn } from '../utils/array';
import {
  Quiz,
  QuizStatus,
  User,
  Question,
  QuestionStatus,
  QuestionAnswer,
} from '../models';

import {
  QuizNotFoundError,
  QuizAlreadyExistsError,
  QuestionNotFoundError,
} from '../errors';
import { QUESTIONS } from '../quiz';

export type QuizStorage = Readonly<ReturnType<typeof init>>;

export interface Options {}

export type UpdateQuestionStatus = Pick<Question, 'id' | 'status'>;

const FIRST_QUESTION: Question = {
  ...QUESTIONS[0],
  status: 'IN_PROGRESS',
};

export const init = (_options: Options) => {
  const DATA: Quiz[] = [
    {
      id: '413b4b1b-0ab3-4dc6-b899-d68aa72a1ff0',
      joinCode: 'UkQdLpvp',
      status: 'IN_PROGRESS',
      players: [
        {
          id: '000b4b1b-0ab3-4dc6-b899-d68aa72a1ff0',
          name: 'flaps',
          status: 'ADMIN',
        },
        {
          id: '100b4b1b-0ab3-4dc6-b899-d68aa72a1ff0',
          name: 'other',
          status: 'PLAYER',
        },
      ],
      questions: [FIRST_QUESTION, QUESTIONS[1]],
    }
  ];

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
      return DATA[quizIndex] = {
        ...existingQuiz,
        status,
      };
    },

    updateQuestionStatus: async (quizId: string, questionId: string, status: QuestionStatus): Promise<Question> => {
      const [quiz] = await getQuizAndIndex(quizId);

      const questionIndex = quiz.questions.findIndex(({ id }) => id === questionId);
      if (questionIndex === -1) {
        throw new QuestionNotFoundError(`Question id "${questionId}" not found`);
      }

      const existingQuestion = quiz.questions[questionIndex];
      // @ts-ignore - don't mutate
      return quiz.questions[questionIndex] = {
        ...existingQuestion,
        status,
      };
    },

    addAnswer: async (
      quizId: string,
      questionId: string,
      answer: Pick<QuestionAnswer, 'choice' | 'userId'>,
    ): Promise<QuestionAnswer> => {
      const [quiz] = await getQuizAndIndex(quizId);

      const question = _.find(quiz.questions, { id: questionId });
      if (!question) {
        throw new QuestionNotFoundError(`Question id "${questionId}" not found`);
      }

      const fullAnswer = {
        ...answer,
        id: uuid(),
      };

      // @ts-ignore
      question.answers = [
        ...question.answers,
        fullAnswer,
      ];

      return fullAnswer;
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
