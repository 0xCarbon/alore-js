import argon2 from 'argon2-browser';
import crypto from 'crypto';

import { KeyDerivationFunction } from '../types';

export function hashUserInfo(userInfo: string) {
  const hash = crypto.createHash('sha256');
  hash.update(userInfo);
  return hash.digest('hex');
}

export async function generateSecureHash(
  password: string,
  salt: string,
  keyDerivationFunction: KeyDerivationFunction = 'argon2d',
): Promise<string> {
  if (keyDerivationFunction === 'argon2d') {
    const result = await argon2.hash({
      pass: password,
      salt,
      type: argon2.ArgonType.Argon2d,
      hashLen: 32,
      mem: 32768,
      time: 3,
      parallelism: 2,
    });

    return result.encoded;
  }
  throw new Error('Unsupported key derivation function');
}
