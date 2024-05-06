import { AloreAuth } from '@0xcarbon/alore-auth-sdk';

export const apiKey = 'abc123';
export const endpoint = 'http://localhost:8000/api';

export const aloreAuth = new AloreAuth(apiKey, {
  endpoint,
});
