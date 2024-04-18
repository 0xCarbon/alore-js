/// <reference types="node" />
import { UUID } from 'crypto';
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
    method: 'derive-password' | 'derive-password-done' | 'encrypt-keyshare' | 'all-shares-on-login' | 'retrieve-keyshare' | 'download-keyshare' | 'link-keyshare';
    payload?: string | CryptoKey | Keyshare | JavascriptEncryptedFile | SimpleCredential;
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
export declare function hashUserInfo(userInfo: string): string;
type KeyDerivationFunction = 'argon2d' | 'pbkdf2';
export declare function generateSecureHash(password: string, salt: string, keyDerivationFunction?: KeyDerivationFunction): Promise<string>;
export declare function arrayToHex(array: number[]): string;
export declare function generateEthereumAddressFromPublicKey(publicKey: Uint8Array): Promise<string>;
export declare class AloreCrypto {
    readonly apiKey: string;
    protected readonly endpoint: string;
    protected readonly configuration: string;
    constructor(apiKey: string, options?: AloreCryptoConfiguration);
    fetchWithProgressiveBackoff(url: RequestInfo | URL, options?: RequestInit, config?: FetchWithProgressiveBackoffConfig): Promise<Response>;
    private delay;
    private verifyBackendStatus;
    deriveAccountKeyshareFromWalletKeyshare(walletKeyshare: Keyshare, account_index: number): Promise<any>;
    saveKeyshare(keyshare: Keyshare, linker: {
        walletId?: string;
        apiKeyId?: string;
    }): Promise<unknown>;
    getKeyshare(linker: {
        walletId?: string;
        apiKeyId?: string;
    }): Promise<Keyshare | null>;
    deleteKeyshareWithoutWallet(linker: {
        walletId?: string;
        apiKeyId?: string;
    }): Promise<unknown>;
    saveDerivedKey(derivedKey: CryptoKey): Promise<unknown>;
    getDerivedKey(): Promise<CryptoKey | null>;
    getKeyMaterial(password: string): Promise<CryptoKey>;
    deriveKeyFromPassword(keyMaterial: CryptoKey, salt: Uint8Array): Promise<CryptoKey>;
    encryptKeyshare(keyshare: Keyshare): Promise<{
        ciphertext: ArrayBuffer;
        iv: Uint8Array;
    }>;
    decryptKeyshare(ciphertext: ArrayBuffer, iv: ArrayBuffer): Promise<any>;
    derivePassword(credentials: SimpleCredential): Promise<void>;
    encryptAndPostKeyshare(data: KeyshareWorkerMessage): Promise<void>;
    linkKeyshare(eventData: KeyshareWorkerMessage): Promise<void>;
    allSharesOnLogin(): Promise<void>;
    retrieveDecryptedKeyshare(eventData: KeyshareWorkerMessage): Promise<void | Error>;
    retrieveEncryptedKeyshare(eventData: KeyshareWorkerMessage): Promise<void>;
}
export {};
