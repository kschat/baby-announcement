export abstract class AppError extends Error {
  public abstract readonly code: string;

  constructor(message: string | Error = '') {
    super(typeof message !== 'string' ? message.message : message)
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

export class UserNotFoundError extends AppError {
  public readonly code = 'USER_NOT_FOUND';
}

export class UserNameTakenError extends AppError {
  public readonly code = 'USER_NAME_TAKEN';
}

export class UserNotInQuizError extends AppError {
  public readonly code = 'USER_NOT_IN_QUIZ';
}

export class UnauthorizedQuizStartError extends AppError {
  public readonly code = 'UNAUTHORIZED_QUIZ_START';
}

export class QuizNotFoundError extends AppError {
  public readonly code = 'QUIZ_NOT_FOUND';
}

export class QuizFullError extends AppError {
  public readonly code = 'QUIZ_FULL';
}

export class QuizAlreadyExistsError extends AppError {
  public readonly code = 'QUIZ_ALREADY_EXISTS';
}

export class QuizAlreadyStartedError extends AppError {
  public readonly code = 'QUIZ_ALREADY_STARTED';
}

export class QuizAlreadyFinishedError extends AppError {
  public readonly code = 'QUIZ_ALREADY_FINISHED';
}

export class QuizNotStartedError extends AppError {
  public readonly code = 'QUIZ_NOT_STARTED';
}

export class QuizNotEnoughPlayersError extends AppError {
  public readonly code = 'NOT_ENOUGH_PLAYERS';
}

export class QuestionNotFoundError extends AppError {
  public readonly code = 'QUESTION_NOT_FOUND';
}

export class QuestionNotCurrentError extends AppError {
  public readonly code = 'QUESTION_NOT_CURRENT';
}

export class QuestionAlreadyAnsweredError extends AppError {
  public readonly code = 'QUESTION_ALREADY_ANSWERED';
}

export class ChoiceInvalidError extends AppError {
  public readonly code = 'CHOICE_INVALID';
}
