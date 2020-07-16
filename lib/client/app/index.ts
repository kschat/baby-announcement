import { domReady } from './utils/dom-ready';

import { createQuizViewInit } from './views/create';
import { createQuizControllerInit } from './controllers/create';

import { joinQuizViewInit } from './views/join';
import { joinQuizController } from './controllers/join';
import { quizViewInit } from './views/quiz';
import { quizControllerInit } from './controllers/quiz';

const initCreatePage = () => {
  const createQuizView = createQuizViewInit();
  createQuizControllerInit({ createQuizView });
};

const initHomePage = () => {
  const joinQuizView = joinQuizViewInit();
  joinQuizController({ joinQuizView });
};

const initQuizPage = () => {
  const quizView = quizViewInit();
  quizControllerInit({ quizView });
};

const normalizeRoute = (pathname: string): string => {
  if (pathname.match(/\/quiz\/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/i)) {
    return '/quiz/{id}';
  }

  return pathname;
};

domReady(() => {
  switch (normalizeRoute(window.location.pathname)) {
    case '/': return initHomePage();
    case '/create': return initCreatePage();
    case '/quiz/{id}': return initQuizPage();
  }
});
