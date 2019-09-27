import joi from '@hapi/joi';

export const QUIZ_STATUSES = [
  'INITIALIZED',
  'IN_PROGRESS',
  'FINISHED',
] as const;

export type QuizStatus = typeof QUIZ_STATUSES[number];

export const QUESTION_STATUSES = [
  'NOT_ASKED',
  'IN_PROGRESS',
  'FINISHED',
] as const;

export type QuestionStatus = typeof QUESTION_STATUSES[number];

export const idSchema = joi.string().guid();
export const joinCodeSchema = joi.string().min(7).max(14);
export const quizStatusSchema = joi.string().valid(...QUIZ_STATUSES);
export const questionStatusSchema = joi.string().valid(...QUESTION_STATUSES);
export const userNameSchema = joi.string()
  .regex(/^[a-z|A-Z|0-9|\s|\.|\!|\?|\#|\$]+$/)
  .min(1)
  .max(25)
  .trim();

export interface User {
  readonly id: joi.extractType<typeof idSchema>;
  readonly status: 'ADMIN' | 'PLAYER';
  readonly name: joi.extractType<typeof userNameSchema>;
}

export interface AuthUser {
  readonly id: string;
  readonly name: string;
}

export interface QuestionChoice {
  readonly id: joi.extractType<typeof idSchema>;
  readonly text: string;
  readonly isCorrect: boolean;
}

export interface QuestionAnswer {
  readonly id: joi.extractType<typeof idSchema>;
  readonly userId: User['id'];
  readonly choice: QuestionChoice;
}

export interface Question {
  readonly id: joi.extractType<typeof idSchema>;
  readonly status: joi.extractType<typeof questionStatusSchema>;
  readonly text: string;
  readonly choices: readonly QuestionChoice[];
  readonly answers: readonly QuestionAnswer[];
}

// TODO add currentQuestion
export interface Quiz {
  readonly id: string;
  readonly joinCode: joi.extractType<typeof joinCodeSchema>;
  readonly status: joi.extractType<typeof quizStatusSchema>;
  readonly players: readonly User[];
  // TODO try making this [Question, ....Question[]]
  readonly questions: readonly Question[];
}

export const initializedQuizSchema = joi.object().keys({
  id: idSchema.required(),
  joinCode: joinCodeSchema.required(),
  status: quizStatusSchema.valid(QUIZ_STATUSES[0]).required(),
});

export type InitializedQuiz = Readonly<joi.extractType<typeof initializedQuizSchema>>;

// TODO match with Quiz interface and create a QuizRecord interface to represent DB Quiz
export const quizSchema = joi.object().keys({
  id: idSchema.required(),
  joinCode: joinCodeSchema.required(),
  status: quizStatusSchema.valid(...QUIZ_STATUSES).required(),
});

export const choiceResponseSchema = joi.object().keys({
  id: idSchema.required(),
  text: joi.string().required(),
  isCorrect: joi.boolean().required(),
});

export const questionResponseSchema = joi.object().keys({
  id: idSchema.required(),
  status: questionStatusSchema.required(),
  text: joi.string().required(),
  choices: joi.array().items(choiceResponseSchema.required()).required(),
});

export const quizResponseSchema = joi.object().keys({
  id: idSchema.required(),
  joinCode: joinCodeSchema.required(),
  status: quizStatusSchema.valid(...QUIZ_STATUSES).required(),
  currentQuestion: joi.when('status', {
    is: 'IN_PROGRESS',
    then: questionResponseSchema.required(),
    otherwise: joi.forbidden(),
  }),
});
