import { AloreAuth } from '@0xcarbon/alore-auth-sdk';

export const aloreAuth = new AloreAuth('MY_API_KEY', {
  endpoint: 'http://localhost:8000/v1',
});
