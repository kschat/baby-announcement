import { $ } from '../utils/select-or-throw';

export type CreateQuizView = ReturnType<typeof createQuizViewInit>;

export const createQuizViewInit = () => {
  const $root = $(document, '#create-quiz-form');
  const $nicknameInput = $<HTMLInputElement>($root, '#nickname-input');
  const $createQuizErrorText = $<HTMLDivElement>($root, '#create-quiz-error-text');
  const $createQuizButton = $<HTMLInputElement>($root, '#create-quiz-button');
  const $createQuizSpinner = $<HTMLSpanElement>($createQuizButton, '#create-quiz-button-spinner');

  const disableForm = () => {
    $createQuizButton.disabled = true;
    $nicknameInput.readOnly = true;
    $createQuizSpinner.classList.remove('d-none');
  };

  const enableForm = () => {
    $createQuizButton.disabled = false;
    $nicknameInput.readOnly = false;
    $createQuizSpinner.classList.add('d-none');
  };

  const resetForm = () => {
    enableForm();
    $createQuizErrorText.classList.add('d-none');
    $nicknameInput.value = '';
  };

  const showError = (message: string) => {
    $createQuizErrorText.textContent = message;
    $createQuizErrorText.classList.remove('d-none');
  };

  const hideError = () => {
    $createQuizErrorText.classList.add('d-none');
  };

  return {
    disableForm,
    enableForm,
    resetForm,
    showError,
    hideError,

    onSubmit: (fn: (formInput: { nickname: string }) => Promise<void>) => {
      $createQuizButton.addEventListener('click', async () => {
        await fn({
          nickname: $nicknameInput.value,
        });
      });
    },
  };
};
