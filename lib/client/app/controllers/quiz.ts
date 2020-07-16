import { QuizView } from '../views/quiz';
import { Quiz, User, QuizState } from '../models';
import { createIntervalTimer } from '../utils/interval-timer';
import { getQuizById, startQuiz, submitAnswer } from '../api/quiz';
import { createRecorder } from '../recorder';

type PollQuizOptions = {
  readonly id: string;
  readonly token: string;
  readonly intervalInMs: number;
  readonly callback: (quiz: Quiz, stop: () => void) => Promise<void>;
};

const pollQuiz = ({ id, token, intervalInMs, callback }: PollQuizOptions) => {
  const timer = createIntervalTimer({
    intervalInMs,
    callback: async () => {
      const quiz: Quiz = (await getQuizById({ id, token })).data;
      await callback(quiz, () => timer.stop());
    },
  });

  timer.start();
  return timer;
};

const getUser = (token: string) => {
  const [,userPart] = token.split('.');
  if (!userPart) {
    throw new Error('Malformed token found');
  }

  return JSON.parse(window.atob(userPart)) as User;
};

export type Options = {
  readonly quizView: QuizView;
};

export const quizControllerInit = async ({ quizView }: Options) => {
  const token = localStorage.getItem('auth-token');
  if (!token) {
    throw new Error('Auth token missing');
  }

  const user = getUser(token);

  const initQuiz: Quiz = (await getQuizById({ id: quizView.quizId, token })).data;
  let state: QuizState = {
    user,
    quiz: initQuiz,
    recording: false,
    activeQuestion: {
      id: initQuiz.currentQuestion?.id ?? '',
      answered: false,
      selected: false,
    },
  };

  const recorder = createRecorder();

  pollQuiz({
    id: quizView.quizId,
    token,
    intervalInMs: 1000,
    callback: async (quiz, stopPolling) => {
      const previousPlayerCount = state
        ? state.quiz.players.length
        : quiz.players.length;

      state.quiz = quiz;

      switch (quiz.status) {
        case 'INITIALIZED':
          quizView.showActionButton(state.user.status === 'ADMIN');
          quizView.enableActionButton(quiz.players.length > 1);
          quizView.showWaitingScreen();

          if (previousPlayerCount !== quiz.players.length) {
            quizView.updatePlayerList(state);
          }

          return;

        case 'IN_PROGRESS':
          quizView.showQuizScreen();
          if (
            !state.activeQuestion.id ||
            state.quiz.currentQuestion?.id !== state.activeQuestion.id
          ) {
            if (state.quiz.currentQuestion) {
              state.activeQuestion.id = state.quiz.currentQuestion.id;
              quizView.enableQuestion(state.quiz.currentQuestion);
            }

            state.activeQuestion.answered = false;
            state.activeQuestion.selected = false;
          }

          if (state.activeQuestion.answered) {
            quizView.disableQuizScreen();
          } else {
            quizView.resetQuizScreen(state.activeQuestion.selected);
          }

          if (!state.recording) {
            state.recording = true;
            await recorder.start();
          }

          return;

        case 'FINISHED':
          quizView.showFinishScreen();
          stopPolling();
          return;
      }
    },
  });

  quizView.onActionButtonClick(async () => {
    if (!state) {
      console.error('State not set');
      return;
    }

    const { quiz, user } = state;
    if (quiz.status === 'INITIALIZED' && user.status === 'ADMIN') {
      await startQuiz({
        id: quiz.id,
        token,
      });
    }

    if (quiz.status === 'IN_PROGRESS') {
      const choiceId = quizView.getSelectedAnswer();
      const questionId = quiz.currentQuestion?.id;
      if (!questionId) {
        throw new Error('No questionId found');
      }

      await submitAnswer({
        id: quiz.id,
        token,
        questionId,
        choiceId,
      });

      state.activeQuestion.answered = true;
      quizView.disableQuizScreen();
    }

    if (quiz.status === 'FINISHED') {
      const video = await recorder.stop();
      const url = URL.createObjectURL(video);

      quizView.downloadFile(url, 'reaction.webm');
      quizView.showReactionPlayer(url);
    }
  });

  quizView.onChoiceSelected(async () => {
    state.activeQuestion.selected = true;
    quizView.enableActionButton(true);
  });
};
