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
} from '../errors';

export interface Options {
  readonly quizStorage: QuizStorage;
  readonly userStorage: UserStorage;
}

interface CreateQuizOptions {
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

export interface QuizAndUser {
  readonly quiz: Quiz;
  readonly user: User;
}

export type QuizService = Readonly<ReturnType<typeof init>>;

const MAX_PLAYERS = 8;

// TODO add validation that this is not empty - Try using tuples for array
const QUESTIONS: Question[] = [
  {
    id: '413b4b1b-0ab3-4dc6-b899-d68aa72a1ff9',
    status: 'NOT_ASKED',
    text: 'Is Trump retarted?',
    choices: [
      {
        id: '2297866d-6a9c-48e5-a192-9be92a487643',
        text: 'Yes',
        isCorrect: true,
      },
      {
        id: 'cc72a07a-716f-401e-8af0-20cd360af078',
        text: 'Yes',
        isCorrect: true,
      },
      {
        id: '976030d0-def4-4290-b1e6-518f5dc0ffe2',
        text: 'Yes',
        isCorrect: true,
      },
      {
        id: 'a2222bb8-9abc-4ee3-ba31-7dc4fbb7fd08',
        text: 'Yes',
        isCorrect: true,
      }
    ],
    answers: [],
  }
];

export const init = ({ quizStorage, userStorage }: Options) => {
  return {
    // TODO update to return questions
    getQuiz: async (quizId: string): Promise<Quiz> => {
      return quizStorage.getById(quizId);
    },

    createQuiz: async ({ joinCode, userName }: CreateQuizOptions): Promise<QuizAndUser> => {
      const user = await userStorage.create(userName, 'ADMIN');
      return {
        user,
        quiz: await quizStorage.create(joinCode, user, QUESTIONS),
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
          `Can't start quiz with only ${quiz.players.length} players`
        );
      }

      return quizStorage.updateStatus(quizId, 'IN_PROGRESS');
    },
  };
};
