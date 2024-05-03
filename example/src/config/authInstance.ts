import { AloreAuth } from '@0xcarbon/alore-auth-sdk';

export const apiKey = 'MY_API_KEY';
export const endpoint = 'http://localhost:8000/v1';

export const aloreAuth = new AloreAuth(apiKey, {
  endpoint,
});
