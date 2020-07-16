export interface User {
  readonly id: string;
  readonly status: 'ADMIN' | 'PLAYER';
  readonly name: string;
}

export interface Quiz {
  readonly id: string;
  readonly joinCode: string;
  readonly status: 'INITIALIZED' | 'IN_PROGRESS' | 'FINISHED';
  readonly players: readonly User[];
  readonly questions: readonly Question[];
  readonly currentQuestion?: Question;
}

export interface Question {
  readonly id: string;
  readonly status: 'NOT_ASKED' | 'IN_PROGRESS' | 'FINISHED';
  readonly text: string;
  readonly choices: readonly QuestionChoice[];
}

export interface QuestionChoice {
  readonly id: string;
  readonly text: string;
}

export interface ActiveQuestion {
  id: string;
  answered: boolean;
  selected: boolean;
}

export interface QuizState {
  user: User;
  quiz: Quiz;
  activeQuestion: ActiveQuestion;
  recording: boolean;
}
