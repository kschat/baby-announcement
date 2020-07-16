import { $ } from '../utils/select-or-throw';

export type JoinQuizView = ReturnType<typeof joinQuizViewInit>;

export const joinQuizViewInit = () => {
  const $root = $(document, '#join-quiz-form');
  const $nicknameInput = $<HTMLInputElement>($root, '#nickname-input');
  const $joinCodeInput = $<HTMLInputElement>($root, '#join-code-input');
  const $joinQuizErrorText = $<HTMLDivElement>($root, '#join-quiz-error-text');
  const $joinQuizButton = $<HTMLInputElement>($root, '#join-quiz-button');
  const $joinQuizSpinner = $<HTMLSpanElement>($joinQuizButton, '#join-quiz-button-spinner');

  const disableForm = () => {
    $joinQuizButton.disabled = true;
    $nicknameInput.readOnly = true;
    $joinCodeInput.readOnly = true;
    $joinQuizSpinner.classList.remove('d-none');
  };

  const enableForm = () => {
    $joinQuizButton.disabled = false;
    $nicknameInput.readOnly = false;
    $joinCodeInput.readOnly = false;
    $joinQuizSpinner.classList.add('d-none');
  };

  const resetForm = () => {
    enableForm();
    $joinQuizErrorText.classList.add('d-none');
    $nicknameInput.value = '';
    $joinCodeInput.value = '';
  };

  const showError = (message: string) => {
    $joinQuizErrorText.textContent = message;
    $joinQuizErrorText.classList.remove('d-none');
  };

  const hideError = () => {
    $joinQuizErrorText.classList.add('d-none');
  };

  return {
    disableForm,
    enableForm,
    resetForm,
    showError,
    hideError,

    onSubmit: (fn: (formInput: NameAndJoinCode) => Promise<void>) => {
      $joinQuizButton.addEventListener('click', async () => {
        await fn({
          nickname: $nicknameInput.value,
          joinCode: $joinCodeInput.value,
        });
      });
    },
  };
};

type NameAndJoinCode = {
  readonly nickname: string;
  readonly joinCode: string;
};
