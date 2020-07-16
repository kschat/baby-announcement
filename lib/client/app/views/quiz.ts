import { $, $$ } from '../utils/select-or-throw';
import { Question, QuizState } from '../models';

export type QuizView = ReturnType<typeof quizViewInit>;

export const quizViewInit = () => {
  const IN_PROGRESS_HEADER_TEXT = 'Answer the questions and try to win!';
  const INITIALIZED_HEADER_TEXT = 'Invite players by giving them the code below';

  const $root = $(document, '#main-container');

  const $questionListContainer = $<HTMLDivElement>($root, '#question-list-container');
  const $spinner = $<HTMLDivElement>($root, '#quiz-spinner');

  const $header = $<HTMLDivElement>($root, '#quiz-header');
  const $headerSubtext = $<HTMLDivElement>($header, '#header-subtext');
  const $joinCode = $<HTMLDivElement>($header, '#join-code');

  const $bottomNav = $<HTMLDivElement>($root, '#bottom-nav');
  const $actionButton = $<HTMLButtonElement>($bottomNav, '#action-button');
  const $actionButtonText = $<HTMLSpanElement>($actionButton, '#action-button-text');
  const $playerList = $<HTMLUListElement>($bottomNav, '#player-list');
  const $finishContainer = $<HTMLDivElement>($root, '#finish-screen');
  const $reactionPlayer = $<HTMLVideoElement>($finishContainer, '#reaction-player');

  const { initialStatus } = $questionListContainer.dataset;
  if (!initialStatus) {
    throw new Error('Missing required data field initial-status');
  }

  const quizId = $questionListContainer.dataset.quizId;
  if (!quizId) {
    throw new Error('Missing required data field quiz-id');
  }

  const showActionButton = (value: boolean) => {
    $actionButton.classList[value ? 'remove' : 'add']('d-none');
  };

  const enableActionButton = (value: boolean) => {
    $actionButton.disabled = !value;
  };

  const downloadFile = (url: string, fileName: string) => {
    const $tempAnchor = document.createElement('a');
    $tempAnchor.href = url;
    $tempAnchor.download = fileName;
    $tempAnchor.click();
  };

  const showWaitingScreen = () => {
    $headerSubtext.textContent = INITIALIZED_HEADER_TEXT;
    $header.classList.remove('d-none');
    $joinCode.classList.remove('d-none');

    $actionButtonText.textContent = 'Start Quiz';

    $bottomNav.classList.remove('d-none');

    $questionListContainer.classList.add('d-none');

    $spinner.classList.add('d-none');
  };

  const showLoadingScreen = () => {
    $spinner.classList.remove('d-none');
    $header.classList.add('d-none');
    $bottomNav.classList.add('d-none');
  };

  const showFinishScreen = () => {
    $spinner.classList.add('d-none');
    $header.classList.add('d-none');

    $actionButtonText.textContent = 'Stop Recording & Download Video';
    $actionButton.classList.remove('d-none');
    $actionButton.disabled = false;
    $bottomNav.classList.remove('d-none');

    $questionListContainer.classList.add('d-none');
    $finishContainer.classList.remove('d-none');
  };

  const showQuizScreen = () => {
    $headerSubtext.textContent = IN_PROGRESS_HEADER_TEXT;
    $header.classList.remove('d-none');
    $joinCode.classList.add('d-none');

    $actionButton.classList.remove('d-none');
    $bottomNav.classList.remove('d-none');

    $questionListContainer.classList.remove('d-none');

    $spinner.classList.add('d-none');
  };

  const resetQuizScreen = (enableButton: boolean) => {
    $actionButtonText.textContent = 'Submit Answer';
    enableActionButton(enableButton);
  };

  const disableQuizScreen = () => {
    $actionButtonText.textContent = 'Waiting for other players to answer...';
    enableActionButton(false);

    const $form = $<HTMLFormElement>(
      $root,
      '.active-question-form',
    );

    const $radioButtons = $$<HTMLInputElement>(
      $form,
      'input[type=radio]',
    );

    $radioButtons.forEach(($button) => $button.disabled = true);
  };

  const updatePlayerList = (state: QuizState) => {
    while ($playerList.firstChild) {
      $playerList.firstChild.remove();
    }

    state.quiz.players.forEach(({ id, name }, i) => {
      const $li = document.createElement('li');
      $li.id = `player-item-${i}`;
      $li.classList.add('list-group-item', 'text-center', 'flex-fill', 'round-0');
      $li.setAttribute('data-id', id);
      $li.textContent = name;

      $playerList.appendChild($li);
    });
  };

  const getSelectedAnswer = () => {
    const $form = $<HTMLFormElement>(
      $root,
      '.active-question-form',
    );

    const { value } = $<HTMLInputElement>(
      $form,
      'input[type=radio]:checked',
    );

    return value;
  };

  const enableQuestion = ({ id, text }: Question) => {
    const $forms = $$<HTMLFormElement>(
      $root,
      '.question-form',
    );
    const $form = $<HTMLFormElement>(
      $root,
      `#question-form-${id}`,
    );

    $forms.forEach(($form, index) => {
      $form.classList.add('d-none');
      $form.classList.remove('active-question-form');
      const $numberElement = $form.previousElementSibling;
      if ($numberElement) {
        $numberElement.classList.add('text-muted');
        $numberElement.classList.remove('d-inline');
        $numberElement.textContent = `Question ${index + 1}`;
      }
    });

    $form.classList.remove('d-none');
    $form.classList.add('active-question-form');

    const $numberElement = $form.previousElementSibling;
    if ($numberElement) {
      $numberElement.classList.remove('text-muted');
      $numberElement.classList.add('d-inline');
      $numberElement.textContent = text;
    }
  };

  const showReactionPlayer = (url: string) => {
    $reactionPlayer.src = url;
    $reactionPlayer.classList.remove('d-none');
  };

  return {
    initialStatus,
    quizId,
    showWaitingScreen,
    showLoadingScreen,
    showFinishScreen,
    showQuizScreen,
    showActionButton,
    enableActionButton,
    downloadFile,
    updatePlayerList,
    getSelectedAnswer,
    resetQuizScreen,
    disableQuizScreen,
    enableQuestion,
    showReactionPlayer,

    onActionButtonClick: (fn: () => void | Promise<void>) => {
      $actionButton.addEventListener('click', async () => {
        if ($actionButton.disabled) {
          return;
        }

        await fn();
      });
    },

    onChoiceSelected: (fn: () => void | Promise<void>) => {
      const $buttons = $$<HTMLFormElement>(
        $root,
        '.question-form input[type=radio]',
      );

      $buttons.forEach(($button) => {
        $button.addEventListener('click', async () => {
          await fn();
        });
      });
    },
  };
};

