import { AeadId, CipherSuite, KdfId, KemId } from 'hpke-js';
import {
  Keyshare,
  KeyshareIdentifier,
  KeyshareEntry,
  SimpleCredential,
  StoreName,
  UUID,
  byteArraytoArrayBuffer,
  deriveAccountKeyshareFromWalletKeyshare,
} from '../utils';
import { SignerModule } from '../modules/signer';
import { KeygenModule } from '../modules/keygen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import crypto from 'react-native-quick-crypto';
import { CryptoKey } from 'react-native-quick-crypto/lib/typescript/keys';
import { getRandomValues } from 'react-native-quick-crypto/lib/typescript/random';

interface AloreCryptoConfiguration {
  endpoint?: string;
  accessToken?: string;
  refreshToken?: string;
}

type FetchWithProgressiveBackoffConfig = {
  maxAttempts?: number;
  initialDelay?: number;
};

const DEFAULT_URL = 'https://alpha-api.bealore.com/v1';

const ID_ZERO: UUID = '00000000-0000-0000-0000-000000000000';

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
  protected readonly accessToken?: string;
  protected readonly refreshToken?: string;

  public readonly signer: SignerModule;
  public readonly keygen: KeygenModule;

  constructor(
    public readonly apiKey: string,
    options?: AloreCryptoConfiguration
  ) {
    if (!apiKey) throw new Error('API_KEY is required');

    this.endpoint = options?.endpoint || DEFAULT_URL;
    this.accessToken = options?.accessToken;
    this.refreshToken = options?.refreshToken;

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
    let init: RequestInit = {
      ...options,
      headers: {
        ...options?.headers,
        'X-API-KEY': this.apiKey,
      },
    };

    if (this.accessToken) {
      init = {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${this.accessToken}`,
        },
      };
    }

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

        if (response.status === 401 && !url.toString().startsWith('/auth')) {
          // eslint-disable-next-line no-await-in-loop
          const data = await response.json();

          if (data === 'ExpiredSignature') {
            // eslint-disable-next-line no-await-in-loop
            const refreshResponse = await fetch(
              new URL(
                `${this.endpoint}/auth/exchange-jwt-token/${this.refreshToken}`
              )
            );

            if (!refreshResponse.ok) {
              console.error('Refresh token failed');
              return response;
            }

            throw new Error('ExpiredSignature');
          } else if (
            typeof data === 'string' &&
            data.includes('No Authorization header')
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

  private assertParams(
    storeName: StoreName,
    keyshareIdentifier: KeyshareIdentifier
  ) {
    const { apiKeyId, accountId, walletId } = keyshareIdentifier;

    if (storeName === 'apiKeyKeyshares' && !apiKeyId) {
      throw new Error(
        'Invalid Parameters: apiKeyId is required for accessing apiKeyKeyshares'
      );
    } else if (storeName === 'walletKeyshares' && !walletId) {
      throw new Error(
        'Invalid Parameters: walletId is required for accessing walletKeyshares'
      );
    } else if (storeName === 'accountKeyshares' && !accountId) {
      throw new Error(
        'Invalid Parameters: accountId is required for accessing accountKeyshares'
      );
    }

    return true;
  }

  public async saveKeyshare(
    storeName: StoreName,
    keyshareEntry: KeyshareEntry
  ) {
    this.assertParams(storeName, keyshareEntry);

    const existingEntries = await AsyncStorage.getItem(storeName);

    const entries: KeyshareEntry[] = existingEntries
      ? JSON.parse(existingEntries)
      : [];

    entries.push(keyshareEntry);

    await AsyncStorage.setItem(storeName, JSON.stringify(entries));
  }

  public async getAllKeyshares(storeName: StoreName): Promise<KeyshareEntry[]> {
    const existingEntries = await AsyncStorage.getItem(storeName);

    return existingEntries ? JSON.parse(existingEntries) : [];
  }

  public async getKeyshare(
    storeName: StoreName,
    keyshareIdentifier: KeyshareIdentifier
  ): Promise<Keyshare> {
    this.assertParams(storeName, keyshareIdentifier);

    const entries = await this.getAllKeyshares(storeName);
    const found = entries.find(
      (entry) =>
        entry.accountId === keyshareIdentifier.accountId ||
        entry.walletId === keyshareIdentifier.walletId ||
        entry.apiKeyId === keyshareIdentifier.apiKeyId
    );

    if (!found) throw new Error('Keyshare not found');

    return found.keyshare;
  }

  public async deleteKeyshareById(
    storeName: StoreName,
    keyshareIdentifier: KeyshareIdentifier
  ) {
    this.assertParams(storeName, keyshareIdentifier);

    const entries = await this.getAllKeyshares(storeName);
    const filteredEntries = entries.filter(
      (entry) =>
        entry.accountId !== keyshareIdentifier.accountId &&
        entry.walletId !== keyshareIdentifier.walletId &&
        entry.apiKeyId !== keyshareIdentifier.apiKeyId
    );

    await AsyncStorage.setItem(storeName, JSON.stringify(filteredEntries));
  }

  public async saveDerivedKey(derivedKey: CryptoKey) {
    await AsyncStorage.setItem('derivedKey', JSON.stringify(derivedKey));
  }

  public async getDerivedKey(): Promise<CryptoKey> {
    const derivedKeyString = await AsyncStorage.getItem('derivedKey');

    if (derivedKeyString) {
      const derivedKey = JSON.parse(derivedKeyString);

      return derivedKey;
    }

    throw new Error('DerivedKey not found');
  }

  public getKeyMaterial(password: string) {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
  }

  // TODO: Fix this function
  public deriveKeyFromPassword(keyMaterial: CryptoKey, salt: string) {
    return crypto.pbkdf2DeriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 },
      keyMaterial,
      256
    );

    // return crypto.subtle.deriveKey(
    //   {
    //     name: 'PBKDF2',
    //     hash: 'SHA-256',
    //     salt,
    //     iterations: 600000,
    //   },
    //   keyMaterial,
    //   { name: 'AES-GCM', length: 256 },
    //   true,
    //   ['encrypt', 'decrypt']
    // );
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
    const key = await crypto.subtle.importKey(
      'raw',
      serverPublicKeyBuffer,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );

    const { keyObject, keyAlgorithm, keyUsages, keyExtractable } = key;

    const clientHpkeSenderContext = await suite.createSenderContext({
      recipientPublicKey: {
        usages: keyUsages,
        algorithm: keyAlgorithm,
        extractable: keyExtractable,
        // @ts-ignore
        type: keyObject.type,
      },
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
    const iv = getRandomValues(new Uint8Array(12));
    const userDerivedKey = await this.getDerivedKey();
    const encoded_keyshare = new TextEncoder().encode(keyshareString);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      userDerivedKey,
      encoded_keyshare
    );

    return { ciphertext, iv };
  }

  public async decryptKeyshare(ciphertext: ArrayBuffer, iv: ArrayBuffer) {
    const userDerivedKey = await this.getDerivedKey();

    const encodedPlaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      userDerivedKey,
      ciphertext
    );
    const plaintextJsonString = new TextDecoder().decode(encodedPlaintext);
    const plaintext = JSON.parse(plaintextJsonString);

    return plaintext;
  }

  // public async derivePasswordAndSaveKey(credentials: SimpleCredential) {
  //   const salt = `${credentials.email}alore`;
  //   const keyMaterial = await this.getKeyMaterial(credentials.password);

  //   const derivedKey = await this.deriveKeyFromPassword(keyMaterial, salt);

  //   await this.saveDerivedKey(derivedKey);
  // }

  // public async encryptAndPostKeyshare(
  //   keyshare: Keyshare,
  //   storeName: StoreName,
  //   dkgId: UUID
  // ) {
  //   let keyshareOwnerObjectId;
  //   if (storeName === 'apiKeyKeyshares') {
  //     keyshareOwnerObjectId = { apiKeyId: ID_ZERO };
  //   } else if (storeName === 'walletKeyshares') {
  //     keyshareOwnerObjectId = { walletId: ID_ZERO };
  //   } else {
  //     keyshareOwnerObjectId = { accountId: ID_ZERO };
  //   }

  //   this.saveKeyshare(storeName, { ...keyshareOwnerObjectId, keyshare });

  //   const { ciphertext, iv } = await this.encryptKeyshare(keyshare);
  //   const ciphertextByteArray = new Uint8Array(ciphertext);
  //   const encryptedKeyshare = Array.from(ciphertextByteArray);
  //   const encryptionIv = Array.from(iv);

  //   try {
  //     const response = await this.fetchWithProgressiveBackoff(`/keyshares`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         encrypted_keyshare: encryptedKeyshare,
  //         encryption_iv: encryptionIv,
  //         dkg_id: dkgId,
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error(response.statusText);
  //     }

  //     return 'encrypt-keyshare-done';
  //   } catch (error) {
  //     throw new Error("Couldn't post client keyshare to server");
  //   }
  // }

  // public async encryptAndPostServerKeyshare(strKeyshare: string, dkgId: UUID) {
  //   const { enc, ciphertext } = await this.encryptServerKeyshare(strKeyshare);
  //   const ciphertextByteArray = new Uint8Array(ciphertext);
  //   const encryptedKeyshare = Array.from(ciphertextByteArray);
  //   try {
  //     const response = await this.fetchWithProgressiveBackoff(
  //       `/import-account-server-keyshare`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           encrypted_keyshare: encryptedKeyshare,
  //           encryption_iv: Array.from(new Uint8Array(enc)),
  //           dkg_id: dkgId,
  //           server_auth_tag: [1],
  //         }),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error(response.statusText);
  //     }

  //     return 'encrypt-and-post-server-keyshare-done';
  //   } catch (error) {
  //     throw new Error("Couldn't post server keyshare to server");
  //   }
  // }

  // public async linkKeyshare(
  //   storeName: StoreName,
  //   keyshareDkgIdentifier: KeyshareIdentifier & { dkgId: UUID }
  // ) {
  //   try {
  //     await this.fetchWithProgressiveBackoff(`/keyshares`, {
  //       method: 'PATCH',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(keyshareDkgIdentifier),
  //     });
  //   } catch (error) {
  //     throw new Error("Couldn't link keyshare to server");
  //   }
  //   const { accountId, apiKeyId, walletId } = keyshareDkgIdentifier;

  //   let unlinkedKeyshareIdentifier: KeyshareIdentifier;
  //   let keyshareEntry: KeyshareIdentifier;

  //   if (storeName === 'apiKeyKeyshares') {
  //     unlinkedKeyshareIdentifier = { apiKeyId: ID_ZERO };

  //     if (!apiKeyId) throw new Error('apiKeyId is required');

  //     keyshareEntry = { apiKeyId };
  //   } else if (storeName === 'walletKeyshares') {
  //     unlinkedKeyshareIdentifier = { walletId: ID_ZERO };

  //     if (!walletId) throw new Error('walletId is required');

  //     keyshareEntry = { walletId };
  //   } else {
  //     unlinkedKeyshareIdentifier = { accountId: ID_ZERO };

  //     if (!accountId) throw new Error('accountId is required');

  //     keyshareEntry = { accountId };
  //   }

  //   this.getKeyshare(storeName, unlinkedKeyshareIdentifier).then(
  //     async (keyshare) => {
  //       await this.deleteKeyshareById(storeName, unlinkedKeyshareIdentifier);
  //       await this.saveKeyshare(storeName, {
  //         ...keyshareEntry,
  //         keyshare,
  //       });

  //       postMessage({
  //         method: 'link-keyshare',
  //         payload: 'done',
  //       });
  //     }
  //   );
  // }

  // public async allSharesOnLogin() {
  //   try {
  //     const encryptedShares = await this.fetchWithProgressiveBackoff(
  //       `/keyshares`,
  //       {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     ).then((res) => res.json());

  //     if (encryptedShares.length !== 0) {
  //       await Promise.all(
  //         encryptedShares.map(
  //           async (encrypted_share: {
  //             encrypted_key_share: Uint8Array;
  //             encryption_iv: Uint8Array;
  //             wallet_id?: string;
  //             api_key_id?: string;
  //             account_id?: string;
  //           }) => {
  //             const {
  //               encrypted_key_share,
  //               encryption_iv,
  //               wallet_id,
  //               api_key_id,
  //               account_id,
  //             } = encrypted_share;

  //             const ciphertextBuffer = Buffer.from(encrypted_key_share);
  //             const ivBuffer = byteArraytoArrayBuffer(encryption_iv);

  //             const plaintext = await this.decryptKeyshare(
  //               ciphertextBuffer,
  //               ivBuffer
  //             );

  //             let localStorageNameObj;
  //             if (wallet_id) localStorageNameObj = { walletId: wallet_id };
  //             else if (api_key_id)
  //               localStorageNameObj = { apiKeyId: api_key_id };
  //             else localStorageNameObj = { accountId: account_id };

  //             await this.saveKeyshare(plaintext, localStorageNameObj);
  //           }
  //         )
  //       );
  //     }

  //     postMessage({
  //       method: 'all-shares-on-login',
  //       payload: 'done',
  //     });
  //   } catch (error) {
  //     throw new Error("Couldn't retrieve encrypted keyshare");
  //   }
  // }

  // public async retrieveDecryptedKeyshare(
  //   eventData: KeyshareWorkerMessage
  // ): Promise<void | Error> {
  //   const { derivationIndex, walletId, apiKeyId, accountId } = eventData;

  //   if (accountId) {
  //     const accountKeyshare = await this.getKeyshare({ accountId });
  //     if (accountKeyshare) {
  //       postMessage({
  //         method: 'retrieve-keyshare',
  //         payload: accountKeyshare,
  //       });
  //       return;
  //     }
  //   }

  //   if (walletId) {
  //     const walletKeyshare = await this.getKeyshare({ walletId });

  //     if (!walletKeyshare) {
  //       await this.allSharesOnLogin();
  //     } else {
  //       const accountKeyshare: Keyshare =
  //         await deriveAccountKeyshareFromWalletKeyshare(
  //           walletKeyshare,
  //           derivationIndex
  //         );

  //       postMessage({
  //         method: 'retrieve-keyshare',
  //         payload: accountKeyshare,
  //       });
  //     }
  //   } else if (apiKeyId) {
  //     const apiKeyshare = await this.getKeyshare({ apiKeyId });

  //     if (!apiKeyshare) {
  //       await this.allSharesOnLogin();
  //     } else {
  //       const accountKeyshare: Keyshare =
  //         await deriveAccountKeyshareFromWalletKeyshare(
  //           apiKeyshare,
  //           derivationIndex
  //         );

  //       postMessage({
  //         method: 'retrieve-keyshare',
  //         payload: accountKeyshare,
  //       });
  //     }
  //   } else {
  //     throw Error('Missing walletId or apiKeyId');
  //   }
  // }

  // public async retrieveEncryptedKeyshare(eventData: KeyshareWorkerMessage) {
  //   const { walletId, apiKeyId } = eventData;

  //   if (walletId) {
  //     const walletKeyshare = await this.getKeyshare({ walletId });

  //     if (!walletKeyshare) {
  //       await this.allSharesOnLogin();
  //     } else {
  //       const { ciphertext, iv } = await this.encryptKeyshare(walletKeyshare);
  //       const ciphertextString = new TextDecoder().decode(ciphertext);
  //       const ivString = new TextDecoder().decode(iv);

  //       const JEF = {
  //         algorithm: 'A256GCM',
  //         iv: ivString,
  //         ciphertext: ciphertextString,
  //       };

  //       postMessage({
  //         method: 'download-keyshare',
  //         payload: JEF,
  //       });
  //     }
  //   } else if (apiKeyId) {
  //     const apiKeyshare = await this.getKeyshare({ apiKeyId });

  //     if (!apiKeyshare) {
  //       await this.allSharesOnLogin();
  //     } else {
  //       const { ciphertext, iv } = await this.encryptKeyshare(apiKeyshare);
  //       const ciphertextString = new TextDecoder().decode(ciphertext);
  //       const ivString = new TextDecoder().decode(iv);

  //       const JEF = {
  //         algorithm: 'A256GCM',
  //         iv: ivString,
  //         ciphertext: ciphertextString,
  //       };

  //       postMessage({
  //         method: 'download-keyshare',
  //         payload: JEF,
  //       });
  //     }
  //   } else {
  //     throw Error('Missing walletId or apiKeyId');
  //   }
  // }
}
