import { createQuiz } from '../api/quiz';
import { ServiceCallError } from '../errors';
import { CreateQuizView } from '../views/create';
import { sleep } from '../utils/sleep';

export const createQuizControllerInit = ({ createQuizView }: { createQuizView: CreateQuizView }) => {
  createQuizView.onSubmit(async ({ nickname }) => {
    createQuizView.disableForm();
    createQuizView.hideError();

    await sleep(500);
    await createQuiz({ nickname })
      .then((result) => {
        if (typeof result.token === 'string') {
          localStorage.setItem('auth-token', result.token);
        }

        window.location.href = `/quiz/${result.data.id}`;
      })
      .catch((error: ServiceCallError) => {
        createQuizView.showError(error.message);
      })
      .finally(() => {
        createQuizView.enableForm();
      });
  });

  return {};
};
