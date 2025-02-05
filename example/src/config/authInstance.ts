import { AloreAuth } from '@alore/auth-react-sdk';

export const apiKey = 'TEST_API_KEY';
export const endpoint = 'https://alpha-api.bealore.com/v1';

export const aloreAuth = new AloreAuth(apiKey, { endpoint });
