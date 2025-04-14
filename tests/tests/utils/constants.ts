import { AuthProviderConfig } from '@alore/auth-react-ui';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const { TESTMAIL_API_KEY, TESTMAIL_NAMESPACE } = process.env;

export const TEST_PASSWORD = 'P@ssword123';
export const TEST_NICKNAME = 'testuser';

export const DEFAULT_ALORE_CONFIGS: AuthProviderConfig = {
  locale: 'pt',
  enablePasskeys: false,
  enablePasswords: true,
  rpDomain: 'http://localhost:3000',
  requireEmailVerification: true,
  requireUsername: true,
  passwordMinLength: 8,
};
