var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable no-restricted-globals */
import { keccak256 } from 'ethers';
import init, { derive_child_keyshare } from '@0xcarbon/dkls23-wasm';
import crypto from 'crypto';
import argon2 from 'argon2-browser';
const ID_ZERO = '0';
const { indexedDB } = self;
const DEFAULT_URL = 'https://api-beta.bealore.com/v1';
export function hashUserInfo(userInfo) {
    const hash = crypto.createHash('sha256');
    hash.update(userInfo);
    return hash.digest('hex');
}
export function generateSecureHash(password_1, salt_1) {
    return __awaiter(this, arguments, void 0, function* (password, salt, keyDerivationFunction = 'argon2d') {
        if (keyDerivationFunction === 'argon2d') {
            const result = yield argon2.hash({
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
    });
}
export function arrayToHex(array) {
    const hex = array.map((byte) => byte.toString(16).padStart(2, '0'));
    return `0x${hex.join('')}`;
}
export function generateEthereumAddressFromPublicKey(publicKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const publicKeyHash = keccak256(publicKey.slice(1));
        const address = `0x${publicKeyHash.slice(-40)}`;
        return address;
    });
}
function byteArraytoArrayBuffer(buffer) {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return arrayBuffer;
}
export class AloreCrypto {
    constructor(apiKey, options) {
        this.apiKey = apiKey;
        if (!apiKey)
            throw new Error('API_KEY is required');
        this.endpoint = (options === null || options === void 0 ? void 0 : options.endpoint) || DEFAULT_URL;
        this.configuration = 'TODO';
        // this.configuration = Base64.encode(
        //   JSON.stringify({
        //     API_KEY: this.apiKey,
        //   })
        // );
    }
    fetchWithProgressiveBackoff(
    // eslint-disable-next-line no-undef
    url, 
    // eslint-disable-next-line no-undef
    options, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const { maxAttempts = 3, initialDelay = 200 } = config || {};
            let attempt = 0;
            let delayValue = initialDelay;
            // eslint-disable-next-line no-undef
            const init = Object.assign(Object.assign({}, options), { credentials: 'include', headers: Object.assign(Object.assign({}, options === null || options === void 0 ? void 0 : options.headers), { 'X-API-KEY': this.apiKey }) });
            while (attempt < maxAttempts) {
                if (attempt > 0) {
                    // eslint-disable-next-line no-await-in-loop, no-promise-executor-return, no-loop-func
                    yield this.delay(delayValue);
                    delayValue *= 2;
                }
                attempt += 1;
                try {
                    // eslint-disable-next-line no-await-in-loop
                    const response = yield fetch(new URL(`${this.endpoint}${url}`), init);
                    if (response.status === 401) {
                        // eslint-disable-next-line no-await-in-loop
                        const data = yield response.json();
                        if (data === 'ExpiredSignature') {
                            // eslint-disable-next-line no-await-in-loop
                            const refreshResponse = yield fetch(new URL(`${this.endpoint}/auth/exchange-jwt-token`), {
                                credentials: 'include',
                            });
                            if (!refreshResponse.ok) {
                                console.error('Refresh token failed');
                                return response;
                            }
                            throw new Error('ExpiredSignature');
                        }
                        else if (typeof data === 'string' &&
                            data.includes('No access token provided')) {
                            return response;
                        }
                    }
                    if (response.ok || attempt === maxAttempts || response.status !== 500)
                        return response;
                }
                catch (error) {
                    console.error(error);
                    if (error instanceof TypeError &&
                        error.message === 'Failed to fetch' &&
                        attempt >= maxAttempts) {
                        console.error('Connection refused, the backend is probably not running.');
                        this.verifyBackendStatus();
                    }
                    else if (attempt < maxAttempts) {
                        console.error(`Attempt ${attempt} failed, retrying in ${delayValue}ms...`);
                    }
                }
            }
            throw new Error(`Max attempts (${maxAttempts}) exceeded`);
        });
    }
    delay(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line no-promise-executor-return
            yield new Promise((resolve) => setTimeout(resolve, ms));
        });
    }
    verifyBackendStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield fetch(`${this.endpoint}/health-check`);
                if (!res.ok) {
                    throw new Error('Failed to fetch');
                }
            }
            catch (_a) {
                throw new Error('Server down');
            }
        });
    }
    // @@@@@@@@@@@@@
    deriveAccountKeyshareFromWalletKeyshare(walletKeyshare, account_index) {
        return __awaiter(this, void 0, void 0, function* () {
            return init().then(() => __awaiter(this, void 0, void 0, function* () {
                const accountKeyshare = yield derive_child_keyshare(walletKeyshare, account_index);
                return accountKeyshare[Object.keys(accountKeyshare)[0]];
            }));
        });
    }
    saveKeyshare(keyshare, linker) {
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
    getKeyshare(linker) {
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
                const share = store.get(walletId || apiKeyId);
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
    deleteKeyshareWithoutWallet(linker) {
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
    saveDerivedKey(derivedKey) {
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
    getDerivedKey() {
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
    getKeyMaterial(password) {
        const enc = new TextEncoder();
        return self.crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
    }
    deriveKeyFromPassword(keyMaterial, salt) {
        return self.crypto.subtle.deriveKey({
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt,
            iterations: 600000,
        }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    }
    encryptKeyshare(keyshare) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyshareMulReceiversArray = Array.from(keyshare.mul_receivers);
            const keyshareMulSendersArray = Array.from(keyshare.mul_senders);
            const mapFreeKeyshare = Object.assign(Object.assign({}, keyshare), { mul_receivers: keyshareMulReceiversArray, mul_senders: keyshareMulSendersArray });
            const keyshareString = JSON.stringify(mapFreeKeyshare);
            const iv = self.crypto.getRandomValues(new Uint8Array(12));
            const userDerivedKey = yield this.getDerivedKey();
            const encoded_keyshare = new TextEncoder().encode(keyshareString);
            const ciphertext = yield self.crypto.subtle.encrypt({
                name: 'AES-GCM',
                iv,
            }, userDerivedKey, encoded_keyshare);
            return { ciphertext, iv };
        });
    }
    decryptKeyshare(ciphertext, iv) {
        return __awaiter(this, void 0, void 0, function* () {
            const userDerivedKey = yield this.getDerivedKey();
            const encodedPlaintext = yield self.crypto.subtle.decrypt({
                name: 'AES-GCM',
                iv,
            }, userDerivedKey, ciphertext);
            const plaintextJsonString = new TextDecoder().decode(encodedPlaintext);
            const plaintext = JSON.parse(plaintextJsonString);
            return plaintext;
        });
    }
    derivePassword(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            const salt = `${credentials.email}alore`;
            const EncodedSalt = new TextEncoder().encode(salt);
            const saltBuffer = new Uint8Array(EncodedSalt);
            const keyMaterial = yield this.getKeyMaterial(credentials.password);
            const derivedKey = yield this.deriveKeyFromPassword(keyMaterial, saltBuffer);
            this.saveDerivedKey(derivedKey);
            postMessage({
                method: 'derive-password-done',
            });
        });
    }
    encryptAndPostKeyshare(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { payload, storeName, dkgId } = data;
            const walletKeyshare = payload;
            this.saveKeyshare(walletKeyshare, storeName === 'apiKeyKeyshares'
                ? { apiKeyId: ID_ZERO }
                : { walletId: ID_ZERO });
            const { ciphertext, iv } = yield this.encryptKeyshare(walletKeyshare);
            const ciphertextByteArray = new Uint8Array(ciphertext);
            const encryptedKeyshare = Array.from(ciphertextByteArray);
            const encryptionIv = Array.from(iv);
            try {
                yield this.fetchWithProgressiveBackoff(`/keyshares`, {
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
            }
            catch (error) {
                throw new Error("Couldn't post keyshare to server");
            }
        });
    }
    linkKeyshare(eventData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { walletId, apiKeyId, dkgId } = eventData;
            const body = walletId ? { walletId, dkgId } : { apiKeyId, dkgId };
            try {
                yield this.fetchWithProgressiveBackoff(`/keyshares`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });
            }
            catch (error) {
                throw new Error("Couldn't link keyshare to server");
            }
            this.getKeyshare(walletId ? { walletId: ID_ZERO } : { apiKeyId: ID_ZERO }).then((keyshare) => __awaiter(this, void 0, void 0, function* () {
                yield this.deleteKeyshareWithoutWallet(walletId ? { walletId: ID_ZERO } : { apiKeyId: ID_ZERO });
                if (keyshare && walletId)
                    yield this.saveKeyshare(keyshare, { walletId });
                else if (keyshare && apiKeyId)
                    yield this.saveKeyshare(keyshare, { apiKeyId });
                postMessage({
                    method: 'link-keyshare',
                    payload: 'done',
                });
            }));
        });
    }
    allSharesOnLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const encryptedShares = yield this.fetchWithProgressiveBackoff(`/keyshares`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then((res) => res.json());
                if (encryptedShares.length !== 0) {
                    encryptedShares.map((encrypted_share) => __awaiter(this, void 0, void 0, function* () {
                        const { encrypted_key_share, encryption_iv, wallet_id, api_key_id, } = encrypted_share;
                        const ciphertextBuffer = Buffer.from(encrypted_key_share);
                        const ivBuffer = byteArraytoArrayBuffer(encryption_iv);
                        const plaintext = yield this.decryptKeyshare(ciphertextBuffer, ivBuffer);
                        this.saveKeyshare(plaintext, wallet_id ? { walletId: wallet_id } : { apiKeyId: api_key_id });
                    }));
                }
                postMessage({
                    method: 'all-shares-on-login',
                    payload: 'done',
                });
            }
            catch (error) {
                throw new Error("Couldn't retrieve encrypted keyshare");
            }
        });
    }
    retrieveDecryptedKeyshare(eventData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { derivationIndex, walletId, apiKeyId } = eventData;
            if (walletId) {
                const walletKeyshare = yield this.getKeyshare({ walletId });
                if (!walletKeyshare) {
                    yield this.allSharesOnLogin();
                }
                else {
                    const accountKeyshare = yield this.deriveAccountKeyshareFromWalletKeyshare(walletKeyshare, derivationIndex);
                    postMessage({
                        method: 'retrieve-keyshare',
                        payload: accountKeyshare,
                    });
                }
            }
            else if (apiKeyId) {
                const apiKeyshare = yield this.getKeyshare({ apiKeyId });
                if (!apiKeyshare) {
                    yield this.allSharesOnLogin();
                }
                else {
                    const accountKeyshare = yield this.deriveAccountKeyshareFromWalletKeyshare(apiKeyshare, derivationIndex);
                    postMessage({
                        method: 'retrieve-keyshare',
                        payload: accountKeyshare,
                    });
                }
            }
            else {
                throw Error('Missing walletId or apiKeyId');
            }
        });
    }
    retrieveEncryptedKeyshare(eventData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { walletId, apiKeyId } = eventData;
            if (walletId) {
                const walletKeyshare = yield this.getKeyshare({ walletId });
                if (!walletKeyshare) {
                    yield this.allSharesOnLogin();
                }
                else {
                    const { ciphertext, iv } = yield this.encryptKeyshare(walletKeyshare);
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
            }
            else if (apiKeyId) {
                const apiKeyshare = yield this.getKeyshare({ apiKeyId });
                if (!apiKeyshare) {
                    yield this.allSharesOnLogin();
                }
                else {
                    const { ciphertext, iv } = yield this.encryptKeyshare(apiKeyshare);
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
            }
            else {
                throw Error('Missing walletId or apiKeyId');
            }
        });
    }
}
