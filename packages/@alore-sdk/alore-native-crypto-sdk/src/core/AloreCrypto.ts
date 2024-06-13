/* eslint-disable no-restricted-globals */
import { AeadId, CipherSuite, KdfId, KemId } from 'hpke-js';
import {
  Keyshare,
  KeyshareWorkerMessage,
  SimpleCredential,
  byteArraytoArrayBuffer,
  deriveAccountKeyshareFromWalletKeyshare,
} from '../utils';
import { SignerModule } from '../modules/signer';
import { KeygenModule } from '../modules/keygen';

interface AloreCryptoConfiguration {
  endpoint?: string;
}

type FetchWithProgressiveBackoffConfig = {
  maxAttempts?: number;
  initialDelay?: number;
};

const ID_ZERO = '0';

const { indexedDB } = self;

const DEFAULT_URL = 'https://alpha-api.bealore.com/v1';

/**
 * The `AloreCrypto` class provides a set of cryptographic utilities and functionality for the Alore platform.
 *
 * It handles tasks such as:
 * - Fetching data from the Alore API with progressive backoff
 * - Saving, retrieving, and deleting keyshares (encrypted user data) in IndexedDB
 * - Encrypting and decrypting keyshares using AES-GCM
 * - Deriving a key from a user's password using PBKDF2
 * - Encrypting and posting keyshares to the Alore server
 * - Linking keyshares to user accounts on the Alore server
 * - Retrieving and decrypting keyshares on user login
 *
 * The class is initialized with an API key and optional configuration options, and provides a set of public methods to interact with the Alore platform's cryptographic functionality.
 */
export class AloreCrypto {
  protected readonly endpoint: string;

  public readonly signer: SignerModule;
  public readonly keygen: KeygenModule;

  constructor(
    public readonly apiKey: string,
    options?: AloreCryptoConfiguration
  ) {
    if (!apiKey) throw new Error('API_KEY is required');

    this.endpoint = options?.endpoint || DEFAULT_URL;

    this.signer = new SignerModule(this);
    this.keygen = new KeygenModule(this);
  }

  public async fetchWithProgressiveBackoff(
    // eslint-disable-next-line no-undef
    url: RequestInfo | URL,
    // eslint-disable-next-line no-undef
    options?: RequestInit,
    config?: FetchWithProgressiveBackoffConfig
  ) {
    const { maxAttempts = 3, initialDelay = 200 } = config || {};

    let attempt = 0;
    let delayValue = initialDelay;

    // eslint-disable-next-line no-undef
    const init: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...options?.headers,
        'X-API-KEY': this.apiKey,
      },
    };

    while (attempt < maxAttempts) {
      if (attempt > 0) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return, no-loop-func
        await this.delay(delayValue);
        delayValue *= 2;
      }

      attempt += 1;
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(new URL(`${this.endpoint}${url}`), init);

        if (response.status === 401) {
          // eslint-disable-next-line no-await-in-loop
          const data = await response.json();

          if (data === 'ExpiredSignature') {
            // eslint-disable-next-line no-await-in-loop
            const refreshResponse = await fetch(
              new URL(`${this.endpoint}/auth/exchange-jwt-token`),
              {
                credentials: 'include',
              }
            );

            if (!refreshResponse.ok) {
              console.error('Refresh token failed');
              return response;
            }

            throw new Error('ExpiredSignature');
          } else if (
            typeof data === 'string' &&
            data.includes('No access token provided')
          ) {
            return response;
          }
        }

        if (response.ok || attempt === maxAttempts || response.status !== 500)
          return response;
      } catch (error) {
        console.error(error);

        if (
          error instanceof TypeError &&
          error.message === 'Failed to fetch' &&
          attempt >= maxAttempts
        ) {
          console.error(
            'Connection refused, the backend is probably not running.'
          );
          this.verifyBackendStatus();
        } else if (attempt < maxAttempts) {
          console.error(
            `Attempt ${attempt} failed, retrying in ${delayValue}ms...`
          );
        }
      }
    }

    throw new Error(`Max attempts (${maxAttempts}) exceeded`);
  }

  private async delay(ms: number) {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async verifyBackendStatus() {
    try {
      const res = await fetch(`${this.endpoint}/health-check`);

      if (!res.ok) {
        throw new Error('Failed to fetch');
      }
    } catch {
      throw new Error('Server down');
    }
  }

  public saveKeyshare(
    keyshare: Keyshare,
    linker: { walletId?: string; apiKeyId?: string; accountId?: string }
  ) {
    const { walletId, apiKeyId, accountId } = linker;

    return new Promise((resolve) => {
      const open = indexedDB.open('browserDB');

      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
        db.createObjectStore('accountKeyshares', { keyPath: 'accountId' });
        db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
        db.createObjectStore('derivedKey', { keyPath: 'id' });
      };

      open.onsuccess = () => {
        const db = open.result;
        let path;
        if (apiKeyId) {
          path = 'apiKeyKeyshares';
        } else if (walletId) {
          path = 'walletKeyshares';
        } else {
          path = 'accountKeyshares';
        }

        const tx = db.transaction(path, 'readwrite');
        const store = tx.objectStore(path);

        let storeObject;
        if (walletId) {
          storeObject = { walletId, keyshare };
        } else if (apiKeyId) {
          storeObject = { apiKeyId, keyshare };
        } else {
          storeObject = { accountId, keyshare };
        }

        store.put(storeObject);

        tx.oncomplete = () => {
          resolve('saved');
          db.close();
        };
      };
    });
  }

  public getKeyshare(linker: {
    walletId?: string;
    apiKeyId?: string;
    accountId?: string;
  }): Promise<Keyshare | null> {
    const { walletId, apiKeyId, accountId } = linker;

    return new Promise((resolve) => {
      const open = indexedDB.open('browserDB');

      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
        db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
        db.createObjectStore('accountKeyshares', { keyPath: 'accountId' });
        db.createObjectStore('derivedKey', { keyPath: 'id' });
      };

      open.onsuccess = () => {
        const db = open.result;
        let path = '';
        if (apiKeyId) {
          path = 'apiKeyKeyshares';
        } else if (walletId) {
          path = 'walletKeyshares';
        } else if (accountId) {
          path = 'accountKeyshares';
        }

        const tx = db.transaction(path, 'readwrite');
        const store = tx.objectStore(path);

        const share = store.get(walletId || apiKeyId || accountId!);

        share.onerror = () => {
          resolve(null);
          db.close();
        };

        share.onsuccess = () => {
          resolve(share.result.keyshare);
          db.close();
        };

        share.onerror = () => {
          resolve(null);
          db.close();
        };
      };
    });
  }

  public deleteKeyshareWithoutWallet(linker: {
    walletId?: string;
    apiKeyId?: string;
    accountId?: string;
  }) {
    return new Promise((resolve) => {
      const open = indexedDB.open('browserDB');

      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
        db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
        db.createObjectStore('accountKeyshares', { keyPath: 'accountId' });
        db.createObjectStore('derivedKey', { keyPath: 'id' });
      };

      open.onsuccess = () => {
        const db = open.result;
        let path = '';
        if (linker.apiKeyId) {
          path = 'apiKeyKeyshares';
        } else if (linker.walletId) {
          path = 'walletKeyshares';
        } else if (linker.accountId) {
          path = 'accountKeyshares';
        }

        const tx = db.transaction(path, 'readwrite');
        const store = tx.objectStore(path);

        const share = store.delete(ID_ZERO);

        share.onsuccess = () => {
          resolve('deleted');
          db.close();
        };
      };
    });
  }

  public saveDerivedKey(derivedKey: CryptoKey) {
    return new Promise((resolve) => {
      indexedDB.deleteDatabase('browserDB').onsuccess = () => {
        const open = indexedDB.open('browserDB');

        open.onupgradeneeded = () => {
          const db = open.result;
          db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
          db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
          db.createObjectStore('accountKeyshares', { keyPath: 'accountId' });
          db.createObjectStore('derivedKey', { keyPath: 'id' });
        };

        open.onsuccess = () => {
          const db = open.result;

          const tx = db.transaction('derivedKey', 'readwrite');
          const store = tx.objectStore('derivedKey');

          store.put({ id: 1, derivedKey });

          tx.oncomplete = () => {
            resolve('saved');
            db.close();
          };
        };
      };
    });
  }

  public getDerivedKey(): Promise<CryptoKey | null> {
    return new Promise((resolve) => {
      const open = indexedDB.open('browserDB');

      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
        db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
        db.createObjectStore('accountKeyshares', { keyPath: 'accountId' });
        db.createObjectStore('derivedKey', { keyPath: 'id' });
      };

      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('derivedKey', 'readwrite');
        const store = tx.objectStore('derivedKey');

        const derivedKey = store.get(1);

        derivedKey.onsuccess = () => {
          resolve(derivedKey.result.derivedKey);
          db.close();
        };

        derivedKey.onerror = () => {
          resolve(null);
          db.close();
        };
      };
    });
  }

  public getKeyMaterial(password: string) {
    const enc = new TextEncoder();
    return self.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
  }

  public deriveKeyFromPassword(keyMaterial: CryptoKey, salt: Uint8Array) {
    return self.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt,
        iterations: 600000,
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  public async encryptServerKeyshare(keyshare: string) {
    const keyshareStringBuffer = new TextEncoder().encode(keyshare);

    const suite = new CipherSuite({
      kem: KemId.DhkemP256HkdfSha256,
      kdf: KdfId.HkdfSha256,
      aead: AeadId.Aes256Gcm,
    });

    const publicKeyBytes = new Uint8Array([
      4, 174, 169, 247, 167, 65, 46, 136, 230, 226, 53, 38, 220, 95, 200, 27,
      53, 240, 59, 72, 13, 34, 0, 42, 78, 160, 34, 67, 20, 103, 53, 53, 220,
      213, 109, 225, 131, 218, 49, 75, 232, 114, 88, 181, 223, 45, 84, 233, 2,
      10, 16, 100, 104, 134, 247, 10, 124, 163, 113, 49, 229, 91, 149, 184, 148,
    ]);
    const serverPublicKeyBuffer = publicKeyBytes.buffer;

    const clientHpkeSenderContext = await suite.createSenderContext({
      recipientPublicKey: await crypto.subtle.importKey(
        'raw',
        serverPublicKeyBuffer,
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        true,
        []
      ),
      info: new Uint8Array([0]),
    });

    const ciphertext = await clientHpkeSenderContext.seal(
      keyshareStringBuffer,
      new Uint8Array([0])
    );

    return { enc: clientHpkeSenderContext.enc, ciphertext };
  }

  public async encryptKeyshare(keyshare: Keyshare) {
    const keyshareMulReceiversArray = Array.from(keyshare.mul_receivers);
    const keyshareMulSendersArray = Array.from(keyshare.mul_senders);
    const mapFreeKeyshare = {
      ...keyshare,
      mul_receivers: keyshareMulReceiversArray,
      mul_senders: keyshareMulSendersArray,
    };
    const keyshareString = JSON.stringify(mapFreeKeyshare);
    const iv = self.crypto.getRandomValues(new Uint8Array(12));
    const userDerivedKey = await this.getDerivedKey();
    const encoded_keyshare = new TextEncoder().encode(keyshareString);

    const ciphertext = await self.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      userDerivedKey as CryptoKey,
      encoded_keyshare
    );

    return { ciphertext, iv };
  }

  public async decryptKeyshare(ciphertext: ArrayBuffer, iv: ArrayBuffer) {
    const userDerivedKey = await this.getDerivedKey();

    const encodedPlaintext = await self.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      userDerivedKey as CryptoKey,
      ciphertext
    );
    const plaintextJsonString = new TextDecoder().decode(encodedPlaintext);
    const plaintext = JSON.parse(plaintextJsonString);

    return plaintext;
  }

  public async derivePassword(credentials: SimpleCredential) {
    const salt = `${credentials.email}alore`;
    const EncodedSalt = new TextEncoder().encode(salt);
    const saltBuffer = new Uint8Array(EncodedSalt);

    const keyMaterial = await this.getKeyMaterial(credentials.password);

    const derivedKey = await this.deriveKeyFromPassword(
      keyMaterial,
      saltBuffer
    );
    this.saveDerivedKey(derivedKey);

    postMessage({
      method: 'derive-password-done',
    });
  }

  public async encryptAndPostKeyshare(data: KeyshareWorkerMessage) {
    const { payload, storeName, dkgId } = data;
    const keyshare = payload as Keyshare;
    let keyshareOwnerObjectId;
    if (storeName === 'apiKeyKeyshares') {
      keyshareOwnerObjectId = { apiKeyId: ID_ZERO };
    } else if (storeName === 'walletKeyshares') {
      keyshareOwnerObjectId = { walletId: ID_ZERO };
    } else {
      keyshareOwnerObjectId = { accountId: ID_ZERO };
    }

    this.saveKeyshare(keyshare, keyshareOwnerObjectId);

    const { ciphertext, iv } = await this.encryptKeyshare(keyshare);
    const ciphertextByteArray = new Uint8Array(ciphertext);
    const encryptedKeyshare = Array.from(ciphertextByteArray);
    const encryptionIv = Array.from(iv);

    try {
      await this.fetchWithProgressiveBackoff(`/keyshares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encrypted_keyshare: encryptedKeyshare,
          encryption_iv: encryptionIv,
          dkg_id: dkgId,
        }),
      }).then(() => {
        postMessage({
          method: 'encrypt-keyshare-done',
        });
      });
    } catch (error) {
      throw new Error("Couldn't post client keyshare to server");
    }
  }

  public async encryptAndPostServerKeyshare(data: KeyshareWorkerMessage) {
    const { payload, dkgId } = data;
    const keyshare = payload as string;

    const { enc, ciphertext } = await this.encryptServerKeyshare(keyshare);
    const ciphertextByteArray = new Uint8Array(ciphertext);
    const encryptedKeyshare = Array.from(ciphertextByteArray);
    try {
      await this.fetchWithProgressiveBackoff(
        `/import-account-server-keyshare`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            encrypted_keyshare: encryptedKeyshare,
            encryption_iv: Array.from(new Uint8Array(enc)),
            dkg_id: dkgId,
            server_auth_tag: [1],
          }),
        }
      ).then(() => {
        postMessage({
          method: 'encrypt-and-post-server-keyshare-done',
        });
      });
    } catch (error) {
      throw new Error("Couldn't post server keyshare to server");
    }
  }

  public async linkKeyshare(eventData: KeyshareWorkerMessage) {
    const { walletId, apiKeyId, accountId, dkgId } = eventData;
    let localUnlinkedId: {
      walletId?: string;
      apiKeyId?: string;
      accountId?: string;
    };
    let body;

    if (walletId) {
      localUnlinkedId = { walletId: ID_ZERO };
      body = { walletId, dkgId };
    } else if (apiKeyId) {
      localUnlinkedId = { apiKeyId: ID_ZERO };
      body = { apiKeyId, dkgId };
    } else {
      localUnlinkedId = { accountId: ID_ZERO };
      body = { accountId, dkgId };
    }

    try {
      await this.fetchWithProgressiveBackoff(`/keyshares`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error("Couldn't link keyshare to server");
    }

    this.getKeyshare(localUnlinkedId).then(async (keyshare) => {
      await this.deleteKeyshareWithoutWallet(localUnlinkedId);
      if (keyshare && walletId) await this.saveKeyshare(keyshare, { walletId });
      else if (keyshare && apiKeyId)
        await this.saveKeyshare(keyshare, { apiKeyId });
      else if (keyshare && accountId)
        await this.saveKeyshare(keyshare, { accountId });

      postMessage({
        method: 'link-keyshare',
        payload: 'done',
      });
    });
  }

  public async allSharesOnLogin() {
    try {
      const encryptedShares = await this.fetchWithProgressiveBackoff(
        `/keyshares`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ).then((res) => res.json());

      if (encryptedShares.length !== 0) {
        encryptedShares.map(
          async (encrypted_share: {
            encrypted_key_share: Uint8Array;
            encryption_iv: Uint8Array;
            wallet_id?: string;
            api_key_id?: string;
            account_id?: string;
          }) => {
            const {
              encrypted_key_share,
              encryption_iv,
              wallet_id,
              api_key_id,
              account_id,
            } = encrypted_share;

            const ciphertextBuffer = Buffer.from(encrypted_key_share);
            const ivBuffer = byteArraytoArrayBuffer(encryption_iv);

            const plaintext = await this.decryptKeyshare(
              ciphertextBuffer,
              ivBuffer
            );

            let localStorageNameObj;
            if (wallet_id) localStorageNameObj = { walletId: wallet_id };
            else if (api_key_id) localStorageNameObj = { apiKeyId: api_key_id };
            else localStorageNameObj = { accountId: account_id };

            this.saveKeyshare(plaintext, localStorageNameObj);
          }
        );
      }

      postMessage({
        method: 'all-shares-on-login',
        payload: 'done',
      });
    } catch (error) {
      throw new Error("Couldn't retrieve encrypted keyshare");
    }
  }

  public async retrieveDecryptedKeyshare(
    eventData: KeyshareWorkerMessage
  ): Promise<void | Error> {
    const { derivationIndex, walletId, apiKeyId, accountId } = eventData;

    if (accountId) {
      const accountKeyshare = await this.getKeyshare({ accountId });
      if (accountKeyshare) {
        postMessage({
          method: 'retrieve-keyshare',
          payload: accountKeyshare,
        });
        return;
      }
    }

    if (walletId) {
      const walletKeyshare = await this.getKeyshare({ walletId });

      if (!walletKeyshare) {
        await this.allSharesOnLogin();
      } else {
        const accountKeyshare: Keyshare =
          await deriveAccountKeyshareFromWalletKeyshare(
            walletKeyshare,
            derivationIndex
          );

        postMessage({
          method: 'retrieve-keyshare',
          payload: accountKeyshare,
        });
      }
    } else if (apiKeyId) {
      const apiKeyshare = await this.getKeyshare({ apiKeyId });

      if (!apiKeyshare) {
        await this.allSharesOnLogin();
      } else {
        const accountKeyshare: Keyshare =
          await deriveAccountKeyshareFromWalletKeyshare(
            apiKeyshare,
            derivationIndex
          );

        postMessage({
          method: 'retrieve-keyshare',
          payload: accountKeyshare,
        });
      }
    } else {
      throw Error('Missing walletId or apiKeyId');
    }
  }

  public async retrieveEncryptedKeyshare(eventData: KeyshareWorkerMessage) {
    const { walletId, apiKeyId } = eventData;

    if (walletId) {
      const walletKeyshare = await this.getKeyshare({ walletId });

      if (!walletKeyshare) {
        await this.allSharesOnLogin();
      } else {
        const { ciphertext, iv } = await this.encryptKeyshare(walletKeyshare);
        const ciphertextString = new TextDecoder().decode(ciphertext);
        const ivString = new TextDecoder().decode(iv);

        const JEF = {
          algorithm: 'A256GCM',
          iv: ivString,
          ciphertext: ciphertextString,
        };

        postMessage({
          method: 'download-keyshare',
          payload: JEF,
        });
      }
    } else if (apiKeyId) {
      const apiKeyshare = await this.getKeyshare({ apiKeyId });

      if (!apiKeyshare) {
        await this.allSharesOnLogin();
      } else {
        const { ciphertext, iv } = await this.encryptKeyshare(apiKeyshare);
        const ciphertextString = new TextDecoder().decode(ciphertext);
        const ivString = new TextDecoder().decode(iv);

        const JEF = {
          algorithm: 'A256GCM',
          iv: ivString,
          ciphertext: ciphertextString,
        };

        postMessage({
          method: 'download-keyshare',
          payload: JEF,
        });
      }
    } else {
      throw Error('Missing walletId or apiKeyId');
    }
  }
}
