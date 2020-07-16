import jwt from 'jsonwebtoken';

import { User } from '../models';
import { UserStorage } from '../storage/user-storage';

export interface CreateOptions {
  readonly user: User;
  readonly secret: string;
  readonly algorithm: string;
}

export const createToken = ({ user, secret, algorithm }: CreateOptions): string => {
  return jwt.sign(user, secret, {
    algorithm,
  });
};

export const validateUser = (userStorage: UserStorage) => async (user: User) => {
  const foundUser = await userStorage.getById(user.id).catch(() => false);
  if (!foundUser) {
    return { isValid: false };
  }

  return { isValid: true };
};
