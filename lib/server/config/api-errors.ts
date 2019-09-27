import * as errors from '../errors';

export interface ErrorResponseConfig {
  readonly title: string;
  readonly message: string;
  readonly statusCode: number;
}

export const DEFAULT_ERROR_RESPONSE: ErrorResponseConfig = {
  title: 'Unknown Error',
  message: 'An unknown error occured.',
  statusCode: 500,
};

export const apiErrors = new Map<Function, ErrorResponseConfig>()
  .set(errors.UserNotFoundError, {
    title: 'User not found',
    message: 'Could not find user.',
    statusCode: 404,
  })
  .set(errors.UserNameTakenError, {
    title: 'Name not available',
    message: 'That name is already taken, please pick something else.',
    statusCode: 400,
  })
  .set(errors.UnauthorizedQuizStartError, {
    title: `Can't start quiz`,
    message: 'Only the person who created the quiz can start it.',
    statusCode: 400,
  })
  .set(errors.QuizNotFoundError, {
    title: 'Quiz not found',
    message: 'Could not find quiz. Please double check that you entered the code correctly.',
    statusCode: 404,
  })
  .set(errors.QuizFullError, {
    title: `Can't join quiz`,
    message: 'The quiz is full.',
    statusCode: 400,
  })
  .set(errors.QuizAlreadyExistsError, {
    title: 'Failed to create quiz',
    message: `There was an issue creating the quiz. Please try again.`,
    statusCode: 500,
  })
  .set(errors.QuizAlreadyStartedError, {
    title: `Can't start quiz`,
    message: 'The quiz has already been started.',
    statusCode: 400,
  })
  .set(errors.QuizAlreadyFinishedError, {
    title: `Can't start quiz`,
    message: 'The quiz has already finished.',
    statusCode: 400,
  })
  .set(errors.QuizNotStartedError, {
    title: `Operation not allowed`,
    message: 'Please wait until the quiz has started and try again.',
    statusCode: 400,
  })
  .set(errors.QuizNotEnoughPlayersError, {
    title: `Can't start quiz`,
    message: `There aren't enough players to start the quiz. Please invite more players and try again.`,
    statusCode: 400,
  })
  .set(errors.QuestionNotFoundError, {
    title: `Uknown question`,
    message: `The question submitted cannot be found.`,
    statusCode: 400,
  })
  .set(errors.QuestionNotCurrentError, {
    title: `Operation not allowed`,
    message: `The question being answered in not the current question.`,
    statusCode: 400,
  })
  .set(errors.QuestionAlreadyAnsweredError, {
    title: `Can't answer question`,
    message: `That question has already been answered.`,
    statusCode: 400,
  })
  .set(errors.ChoiceInvalidError, {
    title: `Not a valid choice`,
    message: `The choice given is not a valid option for the question.`,
    statusCode: 400,
  });
