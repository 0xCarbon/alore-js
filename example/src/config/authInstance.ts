import { AloreAuth } from '@0xcarbon/alore-auth-sdk';

export const apiKey = 'fmaymZJOlqI4HKxkOkXFcEdDG2K9p1KbkqjA0mA+tEM=';
export const endpoint = 'https://alpha-api.bealore.com/v1';

export const aloreAuth = new AloreAuth(apiKey, {
  endpoint,
});
