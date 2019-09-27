import jwt from 'jsonwebtoken';

import { AuthUser } from '../models';
import { UserStorage } from '../storage/user-storage';

export interface CreateOptions {
  readonly user: AuthUser;
  readonly secret: string;
  readonly algorithm: string;
}

export const createToken = ({ user, secret, algorithm }: CreateOptions): string => {
  const authUser = {
    id: user.id,
    name: user.name
  };

  return jwt.sign(authUser, secret, {
    algorithm,
  });
};

export const validateUser = (userStorage: UserStorage) => async (user: AuthUser) => {
  const foundUser = await userStorage.getById(user.id).catch(() => false);
  if (!foundUser) {
    return { isValid: false };
  }

  return { isValid: true };
};
