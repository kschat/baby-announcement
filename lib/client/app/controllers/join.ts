import { joinQuiz } from '../api/quiz';
import { ServiceCallError } from '../errors';
import { sleep } from '../utils/sleep';
import { JoinQuizView } from '../views/join';

export const joinQuizController = ({ joinQuizView }: { joinQuizView: JoinQuizView }) => {
  joinQuizView.onSubmit(async ({ nickname, joinCode }) => {
    joinQuizView.disableForm();
    joinQuizView.hideError();

    await sleep(500);
    await joinQuiz({ nickname, joinCode })
      .then((result) => {
        if (typeof result.token === 'string') {
          localStorage.setItem('auth-token', result.token);
        }

        window.location.href = `/quiz/${result.data.id}`;
      })
      .catch((error: ServiceCallError) => {
        joinQuizView.showError(error.message);
      })
      .finally(() => {
        joinQuizView.enableForm();
      });
  });

  return {};
};
