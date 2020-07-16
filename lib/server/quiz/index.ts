import _ from 'lodash';
import uuid from 'uuid/v4';

import { QuizStorage } from '../storage/quiz-storage';
import { UserStorage } from '../storage/user-storage';
import { Quiz, User, Question } from '../models';

import {
  QuizFullError,
  UserNameTakenError,
  UnauthorizedQuizStartError,
  QuizAlreadyStartedError,
  QuizAlreadyFinishedError,
  QuizNotEnoughPlayersError,
  QuizNotStartedError,
  UserNotInQuizError,
  QuestionNotFoundError,
  QuestionNotCurrentError,
  QuestionAlreadyAnsweredError,
  ChoiceInvalidError,
} from '../errors';

export interface Options {
  readonly quizStorage: QuizStorage;
  readonly userStorage: UserStorage;
}

export interface CreateQuizOptions {
  readonly joinCode: string;
  readonly userName: string;
}

export interface JoinQuizOptions {
  readonly joinCode: string;
  readonly userName: string;
}

export interface StartQuizOptions {
  readonly quizId: string;
  readonly userId: string;
}

export interface AnswerQuizQuestionOptions {
  readonly quizId: string;
  readonly userId: string;
  readonly questionId: string;
  readonly choiceId: string;
}

export interface QuizAndUser {
  readonly quiz: Quiz;
  readonly user: User;
}

export type QuizService = Readonly<ReturnType<typeof init>>;

const MAX_PLAYERS = 8;

export const QUESTIONS: Question[] = [
  {
    id: uuid(),
    status: 'NOT_ASKED',
    text: 'Who was the worst president in history?',
    choices: [
      {
        id: uuid(),
        text: 'Trump',
      },
      {
        id: uuid(),
        text: 'Trump',
      },
      {
        id: uuid(),
        text: 'Trump',
      },
      {
        id: uuid(),
        text: 'Trump',
      }
    ],
    answers: [],
  },
  {
    id: uuid(),
    status: 'NOT_ASKED',
    text: 'How many times has Dad shit his pants?',
    choices: [
      {
        id: uuid(),
        text: '100',
      },
      {
        id: uuid(),
        text: '1,000',
      },
      {
        id: uuid(),
        text: '2,134',
      },
      {
        id: uuid(),
        text: 'Yes',
      }
    ],
    answers: [],
  },
  {
    id: uuid(),
    status: 'NOT_ASKED',
    text: 'Does Casey have to study?',
    choices: [
      {
        id: uuid(),
        text: 'Is water wet?',
      },
      {
        id: uuid(),
        text: 'Do bears shit in the woods?',
      },
      {
        id: uuid(),
        text: `I don't have time to answer this, I have to study`,
      },
      {
        id: uuid(),
        text: 'Yes',
      }
    ],
    answers: [],
  },
];

export const init = ({ quizStorage, userStorage }: Options) => {
  return {
    getQuiz: async (quizId: string): Promise<Quiz> => {
      return quizStorage.getById(quizId);
    },

    createQuiz: async ({ joinCode, userName }: CreateQuizOptions): Promise<QuizAndUser> => {
      const user = await userStorage.create(userName, 'ADMIN');
      return {
        user,
        quiz: await quizStorage.create(joinCode, user, _.cloneDeep(QUESTIONS)),
      };
    },

    joinQuiz: async ({ joinCode, userName }: JoinQuizOptions): Promise<QuizAndUser> => {
      const existingQuiz = await quizStorage.getByJoinCode(joinCode);
      if (existingQuiz.players.length > MAX_PLAYERS) {
        throw new QuizFullError(`Quiz at capacity of "${MAX_PLAYERS}"`);
      }

      if (existingQuiz.players.find((user) => user.name === userName)) {
        throw new UserNameTakenError(`User with name "${userName}" already exists in quiz`);
      }

      const user = await userStorage.create(userName, 'PLAYER');
      return {
        user,
        quiz: await quizStorage.addUser(existingQuiz.id, user),
      };
    },

    startQuiz: async ({ quizId, userId }: StartQuizOptions): Promise<Quiz> => {
      const [quiz, user] = await Promise.all([
        quizStorage.getById(quizId),
        userStorage.getById(userId),
      ]);

      if (!_.find(quiz.players, { id: userId })) {
        throw new UserNotInQuizError(`User "${userId}" not in Quiz "${quizId}"`);
      }

      if (user.status !== 'ADMIN') {
        throw new UnauthorizedQuizStartError('Only the admin user can start the quiz');
      }

      if (quiz.status === 'IN_PROGRESS') {
        throw new QuizAlreadyStartedError(`Quiz "${quiz.id}" is already in progress`);
      }

      if (quiz.status === 'FINISHED') {
        throw new QuizAlreadyFinishedError(`Quiz "${quiz.id}" has already finished`);
      }

      if (quiz.players.length <= 1) {
        throw new QuizNotEnoughPlayersError(
          `Can't start quiz with only ${quiz.players.length} players`,
        );
      }

      await quizStorage.updateQuestionStatus(
        quizId,
        quiz.questions[0].id,
        'IN_PROGRESS',
      );

      return quizStorage.updateStatus(quizId, 'IN_PROGRESS');
    },

    answerQuizQuestion: async ({
      quizId,
      userId,
      questionId,
      choiceId,
    }: AnswerQuizQuestionOptions): Promise<Quiz> => {
      const quiz = await quizStorage.getById(quizId);

      if (!_.find(quiz.players, { id: userId })) {
        throw new UserNotInQuizError(`User "${userId}" not in Quiz "${quizId}"`);
      }

      if (quiz.status === 'INITIALIZED') {
        throw new QuizNotStartedError(`Quiz "${quiz.id}" is already in progress`);
      }

      if (quiz.status === 'FINISHED') {
        throw new QuizAlreadyFinishedError(`Quiz "${quiz.id}" has already finished`);
      }

      const questionIndex = _.findIndex(quiz.questions, { id: questionId });
      if (questionIndex === -1) {
        throw new QuestionNotFoundError(
          `Question "${questionId}" does not exist for Quiz "${quizId}"`,
        );
      }

      const question = quiz.questions[questionIndex];
      if (question.status !== 'IN_PROGRESS') {
        throw new QuestionNotCurrentError();
      }

      const hasUserAnswered = Boolean(
        _.find(question.answers, (answer) => answer.userId === userId),
      );

      if (hasUserAnswered) {
        throw new QuestionAlreadyAnsweredError(
          `User "${userId}" already answered question "${questionId}"`,
        );
      }

      const choice = _.find(question.choices, { id: choiceId });
      if (!choice) {
        throw new ChoiceInvalidError(
          `Choice "${choiceId}" doesn't exist for question "${questionId}"`,
        );
      }

      await quizStorage.addAnswer(quizId, questionId, {
        choice,
        userId,
      });

      const updatedQuiz = await quizStorage.getById(quizId);
      const currentQuestion = updatedQuiz.questions[questionIndex];

      if (currentQuestion.answers.length !== updatedQuiz.players.length) {
        return updatedQuiz;
      }

      await quizStorage.updateQuestionStatus(
        updatedQuiz.id,
        currentQuestion.id,
        'FINISHED',
      );

      const nextQuestion = updatedQuiz.questions[questionIndex + 1];
      if (!nextQuestion) {
        return quizStorage.updateStatus(quizId, 'FINISHED');
      }

      await quizStorage.updateQuestionStatus(
        updatedQuiz.id,
        nextQuestion.id,
        'IN_PROGRESS',
      );

      return quizStorage.getById(quizId);
    },
  };
};
