import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const MAILOSAUR_API_KEY = process.env.MAILOSAUR_API_KEY;
export const MAILOSAUR_SERVER_ID = process.env.MAILOSAUR_SERVER_ID;

export const MAILOSAUR_DOMAIN = process.env.MAILOSAUR_DOMAIN || '';
export const TEST_PASSWORD = 'P@ssword123';
export const TEST_NICKNAME = 'testuser';
