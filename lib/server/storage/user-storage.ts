import uuid from 'uuid/v4';

import { pushAndReturn } from '../utils/array';
import { User } from '../models';
import { UserNotFoundError } from '../errors';

export type UserStorage = Readonly<ReturnType<typeof init>>;

export interface Options {}

export const init = (_options: Options) => {
  const DATA: User[] = [];

  return {
    __DATA: DATA,

    // TODO move status to type
    create: async (name: string, status: User['status']): Promise<User> => {
      return pushAndReturn(DATA, {
        id: uuid(),
        name,
        status,
      });
    },

    getById: async (id: string): Promise<User> => {
      const user = DATA.find((user) => user.id === id);
      if (!user) {
        throw new UserNotFoundError(`User with ID "${id}" does not exist`);
      }

      return user;
    },
  };
};
