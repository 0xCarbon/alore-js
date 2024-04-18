import {
  AloreCrypto,
  KeyshareWorkerMessage,
  SimpleCredential,
} from '@0xcarbon/alore-crypto-sdk';

const aloreCrypto = new AloreCrypto('MY_API_KEY', {
  endpoint: 'http://localhost:8000/v1',
});

const onmessage = async (event: MessageEvent<KeyshareWorkerMessage>) => {
  /* eslint-disable no-unused-expressions */
  event.data.method === 'derive-password' &&
    aloreCrypto.derivePassword(event.data.payload as SimpleCredential);
  event.data.method === 'encrypt-keyshare' &&
    aloreCrypto.encryptAndPostKeyshare(event.data);
  event.data.method === 'link-keyshare' && aloreCrypto.linkKeyshare(event.data);
  event.data.method === 'all-shares-on-login' && aloreCrypto.allSharesOnLogin();
  event.data.method === 'retrieve-keyshare' &&
    aloreCrypto.retrieveDecryptedKeyshare(event.data);
  event.data.method === 'download-keyshare' &&
    aloreCrypto.retrieveEncryptedKeyshare(event.data);
  /* eslint-disable no-unused-expressions */
};

// eslint-disable-next-line no-restricted-globals
addEventListener('message', onmessage);

export {};
