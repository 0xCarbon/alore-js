import { AloreAuth } from '@0xcarbon/alore-auth-sdk';
import { AloreCrypto } from '@0xcarbon/alore-crypto-sdk';

const apiKey = 'MY_API_KEY';
const endpoint = 'http://localhost:8000/v1';

export const aloreCrypto = new AloreCrypto(apiKey, {
  endpoint,
});

export const aloreAuth = new AloreAuth(apiKey, {
  endpoint,
});
