/* eslint-disable no-restricted-globals */
import { keccak256 } from 'ethers';
import init, { derive_child_keyshare } from '@0xcarbon/dkls23-wasm';
import crypto, { UUID } from 'crypto';
import argon2 from 'argon2-browser';

type FetchWithProgressiveBackoffConfig = {
  maxAttempts?: number;
  initialDelay?: number;
};

interface JavascriptEncryptedFile {
  algorithm: string;
  iv: string;
  ciphertext: string;
}

export type SimpleCredential = {
  email: string;
  password: string;
};

export type KeyshareWorkerMessage = {
  method:
    | 'derive-password'
    | 'derive-password-done'
    | 'encrypt-keyshare'
    | 'all-shares-on-login'
    | 'retrieve-keyshare'
    | 'download-keyshare'
    | 'link-keyshare';
  payload?:
    | string
    | CryptoKey
    | Keyshare
    | JavascriptEncryptedFile
    | SimpleCredential;
  walletId?: UUID;
  apiKeyId?: UUID;
  dkgId?: UUID;
  storeName?: 'apiKeyKeyshares' | 'walletKeyshares';
  derivationIndex: number;
};

export interface EncryptedKeyshare {
  encrypted_key_share: Uint8Array;
  encryption_iv: Uint8Array;
  wallet_id?: UUID;
}

const ID_ZERO = '0';

const { indexedDB } = self;

const DEFAULT_URL = 'https://api-beta.bealore.com/v1';

export interface AloreCryptoConfiguration {
  endpoint?: string;
}

export interface Keyshare {
  parameters: {
    threshold: number;
    share_count: number;
  };
  party_index: number;
  session_id: number[];
  poly_point: string;
  pk: string;
  zero_share: {
    seeds: {
      lowest_index: boolean;
      index_counterparty: number;
      seed: number[];
    }[];
  };
  mul_senders: Map<number, {}>;
  mul_receivers: Map<number, {}>;
  derivation_data: {
    depth: number;
    child_number: number;
    parent_fingerprint: number[];
    poly_point: string;
    pk: string;
    chain_code: number[];
  };
  eth_address: string;
}

export function hashUserInfo(userInfo: string) {
  const hash = crypto.createHash('sha256');
  hash.update(userInfo);
  return hash.digest('hex');
}

type KeyDerivationFunction = 'argon2d' | 'pbkdf2';

export async function generateSecureHash(
  password: string,
  salt: string,
  keyDerivationFunction: KeyDerivationFunction = 'argon2d'
): Promise<string> {
  if (keyDerivationFunction === 'argon2d') {
    const result = await argon2.hash({
      pass: password,
      salt,
      type: argon2.ArgonType.Argon2d,
      hashLen: 32,
      mem: 32768,
      time: 3,
      parallelism: 2,
    });

    return result.encoded;
  }
  throw new Error('Unsupported key derivation function');
}

export function arrayToHex(array: number[]) {
  const hex = array.map((byte) => byte.toString(16).padStart(2, '0'));
  return `0x${hex.join('')}`;
}

export async function generateEthereumAddressFromPublicKey(
  publicKey: Uint8Array
) {
  const publicKeyHash = keccak256(publicKey.slice(1));
  const address = `0x${publicKeyHash.slice(-40)}`;

  return address;
}

function byteArraytoArrayBuffer(buffer: Uint8Array) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

export class AloreCrypto {
  protected readonly endpoint: string;
  protected readonly configuration: string;

  constructor(
    public readonly apiKey: string,
    options?: AloreCryptoConfiguration
  ) {
    if (!apiKey) throw new Error('API_KEY is required');

    this.endpoint = options?.endpoint || DEFAULT_URL;

    this.configuration = 'TODO';

    // this.configuration = Base64.encode(
    //   JSON.stringify({
    //     API_KEY: this.apiKey,
    //   })
    // );
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

  // @@@@@@@@@@@@@

  public async deriveAccountKeyshareFromWalletKeyshare(
    walletKeyshare: Keyshare,
    account_index: number
  ) {
    return init().then(async () => {
      const accountKeyshare = await derive_child_keyshare(
        walletKeyshare,
        account_index
      );

      return accountKeyshare[Object.keys(accountKeyshare)[0]];
    });
  }

  public saveKeyshare(
    keyshare: Keyshare,
    linker: { walletId?: string; apiKeyId?: string }
  ) {
    const { walletId, apiKeyId } = linker;

    return new Promise((resolve) => {
      const open = indexedDB.open('browserDB');

      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
        db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
        db.createObjectStore('derivedKey', { keyPath: 'id' });
      };

      open.onsuccess = () => {
        const db = open.result;
        const path = apiKeyId ? 'apiKeyKeyshares' : 'walletKeyshares';

        const tx = db.transaction(path, 'readwrite');
        const store = tx.objectStore(path);

        const storeObject = walletId
          ? { walletId, keyshare }
          : { apiKeyId, keyshare };
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
  }): Promise<Keyshare | null> {
    const { walletId, apiKeyId } = linker;

    return new Promise((resolve) => {
      const open = indexedDB.open('browserDB');

      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
        db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
        db.createObjectStore('derivedKey', { keyPath: 'id' });
      };

      open.onsuccess = () => {
        const db = open.result;
        const path = apiKeyId ? 'apiKeyKeyshares' : 'walletKeyshares';

        const tx = db.transaction(path, 'readwrite');
        const store = tx.objectStore(path);

        const share = store.get(walletId || apiKeyId!);

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
  }) {
    return new Promise((resolve) => {
      const open = indexedDB.open('browserDB');

      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
        db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
        db.createObjectStore('derivedKey', { keyPath: 'id' });
      };

      open.onsuccess = () => {
        const db = open.result;
        const path = linker.apiKeyId ? 'apiKeyKeyshares' : 'walletKeyshares';

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
      const open = indexedDB.open('browserDB');

      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
        db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
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
    });
  }

  public getDerivedKey(): Promise<CryptoKey | null> {
    return new Promise((resolve) => {
      const open = indexedDB.open('browserDB');

      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('walletKeyshares', { keyPath: 'walletId' });
        db.createObjectStore('apiKeyKeyshares', { keyPath: 'apiKeyId' });
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
    const walletKeyshare = payload as Keyshare;

    this.saveKeyshare(
      walletKeyshare,
      storeName === 'apiKeyKeyshares'
        ? { apiKeyId: ID_ZERO }
        : { walletId: ID_ZERO }
    );

    const { ciphertext, iv } = await this.encryptKeyshare(walletKeyshare);
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
      throw new Error("Couldn't post keyshare to server");
    }
  }

  public async linkKeyshare(eventData: KeyshareWorkerMessage) {
    const { walletId, apiKeyId, dkgId } = eventData;

    const body = walletId ? { walletId, dkgId } : { apiKeyId, dkgId };
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

    this.getKeyshare(
      walletId ? { walletId: ID_ZERO } : { apiKeyId: ID_ZERO }
    ).then(async (keyshare) => {
      await this.deleteKeyshareWithoutWallet(
        walletId ? { walletId: ID_ZERO } : { apiKeyId: ID_ZERO }
      );
      if (keyshare && walletId) await this.saveKeyshare(keyshare, { walletId });
      else if (keyshare && apiKeyId)
        await this.saveKeyshare(keyshare, { apiKeyId });

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
          }) => {
            const {
              encrypted_key_share,
              encryption_iv,
              wallet_id,
              api_key_id,
            } = encrypted_share;

            const ciphertextBuffer = Buffer.from(encrypted_key_share);
            const ivBuffer = byteArraytoArrayBuffer(encryption_iv);

            const plaintext = await this.decryptKeyshare(
              ciphertextBuffer,
              ivBuffer
            );
            this.saveKeyshare(
              plaintext,
              wallet_id ? { walletId: wallet_id } : { apiKeyId: api_key_id }
            );
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
    const { derivationIndex, walletId, apiKeyId } = eventData;

    if (walletId) {
      const walletKeyshare = await this.getKeyshare({ walletId });

      if (!walletKeyshare) {
        await this.allSharesOnLogin();
      } else {
        const accountKeyshare: Keyshare =
          await this.deriveAccountKeyshareFromWalletKeyshare(
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
          await this.deriveAccountKeyshareFromWalletKeyshare(
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
