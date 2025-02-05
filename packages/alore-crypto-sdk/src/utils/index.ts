import init, { derive_child_keyshare } from '@0xcarbon/dkls23-wasm';
import argon2 from 'argon2-browser';
import crypto, { UUID } from 'crypto';
import { keccak256, toUtf8Bytes } from 'ethers';

interface JavascriptEncryptedFile {
  algorithm: string;
  iv: string;
  ciphertext: string;
}

type SimpleCredential = {
  email: string;
  password: string;
};

type KeyshareWorkerMessage = {
  method:
    | 'derive-password'
    | 'derive-password-done'
    | 'encrypt-keyshare'
    | 'encrypt-and-post-server-keyshare'
    | 'all-shares-on-login'
    | 'retrieve-keyshare'
    | 'download-keyshare'
    | 'link-keyshare';
  payload?: string | CryptoKey | Keyshare | JavascriptEncryptedFile | SimpleCredential;
  walletId?: UUID;
  apiKeyId?: UUID;
  accountId?: UUID;
  dkgId?: UUID;
  storeName?: 'apiKeyKeyshares' | 'walletKeyshares';
  derivationIndex: number;
};

interface EncryptedKeyshare {
  encrypted_key_share: Uint8Array;
  encryption_iv: Uint8Array;
  wallet_id?: UUID;
}

interface Keyshare {
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
  mul_senders: Map<number, unknown>;
  mul_receivers: Map<number, unknown>;
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

interface SignData {
  sign_id: number[];
  counterparties: number[];
  message_hash: number[];
}

interface SingleVecTransmit1to2 {
  commitment: number[];
  mul_transmit: {
    u: number[];
    verify_t: number[][];
    verify_x: number[];
  };
  parties: {
    sender: number;
    receiver: number;
  };
}

interface UniqueKeep1to2 {
  instance_key: string;
  instance_point: string;
  instance_mask: string;
  zeta: string;
}

interface MulKeep {
  b: string;
  chi_hat: string[];
  chi_tilde: string[];
  choice_bits: boolean[];
  extended_seeds: Uint8Array;
}

interface SingleOfHashmapKeep1to2 {
  chi: string;
  mul_keep: MulKeep;
  salt: number[];
}

interface SingleVecTransmit2to3 {
  gamma_u: string;
  gamma_v: string;
  instance_point: string;
  mul_transmit: {
    gamma_sender: string[];
    vector_of_tau: string[][];
    verify_r: number[];
    verify_u: string[];
  };
  parties: {
    sender: number;
    receiver: number;
  };
  psi: string;
  public_share: string;
  salt: number[];
}

interface UniqueKeep2to3 {
  instance_key: string;
  instance_point: string;
  instance_mask: string;
  key_share: string;
  public_share: string;
}

interface SingleOfHashmapKeep2to3 {
  c_u: string;
  c_v: string;
  chi: string;
  commitment: number[];
  mul_keep: MulKeep;
}

interface Broadcast3to4 {
  u: string;
  w: string;
}

interface BroadcastDerive2to4 {
  cc_commitment: number[];
  sender_index: number;
}

interface SessionData {
  session_id: number[];
  parameters: { threshold: number; share_count: number };
  party_index: number;
}

interface KeepZeroShare2to3 {
  seed: number[];
  salt: number[];
}

interface KeepDerive2to3 {
  aux_chain_code: number[];
  cc_salt: number[];
}

interface SingleTransmitZeroShare3to4 {
  parties: {
    sender: number;
    receiver: number;
  };
  salt: number[];
  seed: number[];
}

interface SingleTransmitZeroShare2to4 {
  commitment: number[];
  parties: {
    receiver: number;
    sender: number;
  };
}

interface SingleProof {
  challenge: number[];
  challenge_response: string;
}

interface SingleCommitmentEncProof {
  rc_g: string;
  rc_h: string;
}

interface SingleProofEncProof {
  base_g: string;
  base_h: string;
  challenge_response: string;
  point_u: string;
  point_v: string;
}

interface SingleEncProof {
  challenge0: string;
  challenge1: string;
  commitments0: SingleCommitmentEncProof;
  commitments1: SingleCommitmentEncProof;
  proof0: SingleProofEncProof;
  proof1: SingleProofEncProof;
}

interface SingleTransmitMul3to4 {
  dlog_proof: {
    point: string;
    proofs: SingleProof[];
    rand_commitments: string[];
  };
  enc_proofs: SingleEncProof[];
  nonce: string;
  parties: {
    sender: number;
    receiver: number;
  };
  seed: number[];
}

interface BroadcastDerive3to4 {
  aux_chain_code: number[];
  cc_salt: number[];
  sender_index: number;
}

interface SingleProofWithCommitment {
  point: string;
  proofs: SingleProof[];
  rand_commitments: string[];
}

interface ProofCommitment {
  commitment: number[];
  index: number;
  proof: SingleProofWithCommitment;
}

interface SingleMulKept {
  correlation: boolean[];
  nonce: string;
  ot_receiver: {
    seed: number[];
  };
  ot_sender: {
    proof: SingleProofWithCommitment;
    s: string;
  };
  vec_r: string[];
}

type KeyDerivationFunction = 'argon2d' | 'pbkdf2';

function byteArraytoArrayBuffer(buffer: Uint8Array) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

async function generateEthereumAddressFromPublicKey(publicKey: Uint8Array) {
  const publicKeyHash = keccak256(publicKey.slice(1));
  const address = `0x${publicKeyHash.slice(-40)}`;

  return address;
}

function arrayToHex(array: number[]) {
  const hex = array.map((byte) => byte.toString(16).padStart(2, '0'));
  return `0x${hex.join('')}`;
}

async function deriveAccountKeyshareFromWalletKeyshare(
  walletKeyshare: Keyshare,
  account_index: number,
) {
  return init().then(async () => {
    const accountKeyshare = await derive_child_keyshare(walletKeyshare, account_index);

    return accountKeyshare[Object.keys(accountKeyshare)[0]];
  });
}

function generateSalt(length: number = 16): string {
  return crypto.randomBytes(length).toString('base64');
}

function getNumberFromString(seed: string): number {
  const hash = keccak256(toUtf8Bytes(seed));

  let sum = 0;
  for (let i = 2; i < hash.length; i += 2) {
    sum += parseInt(hash.substr(i, 2), 16);
  }

  return (sum % 3) + 1;
}

function hashUserInfo(userInfo: string) {
  const hash = crypto.createHash('sha256');
  hash.update(userInfo);
  return hash.digest('hex');
}

async function generateSecureHash(
  password: string,
  salt: string,
  keyDerivationFunction: KeyDerivationFunction = 'argon2d',
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

function generateUUID() {
  let uuid = '';
  let uuidAux = 0;
  for (uuidAux = 0; uuidAux < 32; uuidAux += 1) {
    switch (uuidAux) {
      case 8:
      case 20:
        uuid += '-';
        // eslint-disable-next-line no-bitwise
        uuid += ((Math.random() * 16) | 0).toString(16);
        break;
      case 12:
        uuid += '-';
        uuid += '4';
        break;
      case 16:
        uuid += '-';
        // eslint-disable-next-line no-bitwise
        uuid += ((Math.random() * 4) | 8).toString(16);
        break;
      default:
        // eslint-disable-next-line no-bitwise
        uuid += ((Math.random() * 16) | 0).toString(16);
    }
  }

  const uuidBytes = new TextEncoder().encode(uuid);

  return uuidBytes;
}

function hexStringToBytes(hexString: string): number[] {
  const bytes: number[] = [];
  const cleanHexString = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  for (let i = 0; i < cleanHexString.length; i += 2) {
    const byte = parseInt(cleanHexString.substr(i, 2), 16);
    if (!Number.isNaN(byte)) {
      bytes.push(byte);
    }
  }
  return bytes;
}

export type {
  KeyshareWorkerMessage,
  EncryptedKeyshare,
  Keyshare,
  SimpleCredential,
  SignData,
  SingleVecTransmit1to2,
  SingleVecTransmit2to3,
  SingleOfHashmapKeep1to2,
  UniqueKeep1to2,
  UniqueKeep2to3,
  SingleOfHashmapKeep2to3,
  Broadcast3to4,
  BroadcastDerive2to4,
  SessionData,
  SingleTransmitZeroShare2to4,
  KeepZeroShare2to3,
  KeepDerive2to3,
  SingleTransmitZeroShare3to4,
  SingleTransmitMul3to4,
  BroadcastDerive3to4,
  ProofCommitment,
  SingleMulKept,
};

export {
  byteArraytoArrayBuffer,
  generateEthereumAddressFromPublicKey,
  arrayToHex,
  deriveAccountKeyshareFromWalletKeyshare,
  generateSalt,
  getNumberFromString,
  hashUserInfo,
  generateSecureHash,
  generateUUID,
  hexStringToBytes,
};
