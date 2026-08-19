import { describe, expect, it } from 'vitest';

import { buildWalletExtensions, resolveWalletSecret } from './passkeyExtensions';

const prfFirst = new Uint8Array([1, 2, 3]);

describe('buildWalletExtensions (JOO-1792: PRF only behind the wallet gate)', () => {
  it('requests NO extensions when wallet creation is disabled', () => {
    (['registration', 'first-auth', 'login'] as const).forEach((purpose) => {
      expect(buildWalletExtensions(purpose, false)).toEqual({});
    });
  });

  it('registration requests prf eval + largeBlob support when enabled', () => {
    const ext = buildWalletExtensions('registration', true);
    expect(ext.prf).toBeDefined();
    expect(ext.largeBlob).toEqual({ support: 'preferred' });
    expect(new TextDecoder().decode(ext.prf!.eval.first)).toBe('Alore');
  });

  it('first-auth writes a blob only with exactly one allowed credential', () => {
    const blob = new Uint8Array(32);
    const single = buildWalletExtensions('first-auth', true, {
      singleAllowCredential: true,
      largeBlobWriteSecret: blob,
    });
    expect(single.largeBlob).toEqual({ write: blob });
    const multi = buildWalletExtensions('first-auth', true, {
      singleAllowCredential: false,
      largeBlobWriteSecret: blob,
    });
    expect(multi.largeBlob).toBeUndefined();
  });

  it('login reads the blob when enabled', () => {
    expect(buildWalletExtensions('login', true).largeBlob).toEqual({ read: true });
  });
});

describe('resolveWalletSecret (JOO-1792: no secret required without the gate)', () => {
  it('wallets disabled: supported with no secret, whatever the authenticator returned', () => {
    expect(resolveWalletSecret(false, {})).toEqual({ supported: true });
    expect(resolveWalletSecret(false, undefined)).toEqual({ supported: true });
  });

  it('wallets enabled: prefers the PRF result', () => {
    const r = resolveWalletSecret(true, { prf: { results: { first: prfFirst } } });
    expect(r).toEqual({ supported: true, secret: prfFirst });
  });

  it('wallets enabled, first-auth write mode: the written blob is the secret', () => {
    const blob = new Uint8Array(32);
    const r = resolveWalletSecret(
      true,
      { largeBlob: { written: true } },
      {
        largeBlobWriteSecret: blob,
      },
    );
    expect(r).toEqual({ supported: true, secret: blob });
  });

  it('wallets enabled, Safari, write mode fallback: written blob without PRF resolves', () => {
    const blob = new Uint8Array(32);
    const r = resolveWalletSecret(
      true,
      { largeBlob: { written: true } },
      {
        largeBlobWriteSecret: blob,
        isSafari: true,
      },
    );
    expect(r).toEqual({ supported: true, secret: blob });
  });

  it('Safari quirk preserved: blob wins over PRF when both are present (login read mode)', () => {
    const prfResult = new Uint8Array([9, 9, 9]);
    const storedBlob = new Uint8Array(32);
    const r = resolveWalletSecret(
      true,
      { prf: { results: { first: prfResult } }, largeBlob: { blob: storedBlob } },
      { isSafari: true },
    );
    expect(r).toEqual({ supported: true, secret: storedBlob });
  });

  it('Safari quirk preserved: written blob wins over PRF when both are present (first-auth)', () => {
    const prfResult = new Uint8Array([9, 9, 9]);
    const blob = new Uint8Array(32);
    const r = resolveWalletSecret(
      true,
      { prf: { results: { first: prfResult } }, largeBlob: { written: true } },
      { largeBlobWriteSecret: blob, isSafari: true },
    );
    expect(r).toEqual({ supported: true, secret: blob });
  });

  it('non-Safari: PRF wins over blob when both are present (login read mode)', () => {
    const prfResult = new Uint8Array([9, 9, 9]);
    const storedBlob = new Uint8Array(32);
    const r = resolveWalletSecret(
      true,
      { prf: { results: { first: prfResult } }, largeBlob: { blob: storedBlob } },
      { isSafari: false },
    );
    expect(r).toEqual({ supported: true, secret: prfResult });
  });

  it('non-Safari: PRF wins over written blob when both are present (first-auth)', () => {
    const prfResult = new Uint8Array([9, 9, 9]);
    const blob = new Uint8Array(32);
    const r = resolveWalletSecret(
      true,
      { prf: { results: { first: prfResult } }, largeBlob: { written: true } },
      { largeBlobWriteSecret: blob, isSafari: false },
    );
    expect(r).toEqual({ supported: true, secret: prfResult });
  });

  it('wallets enabled, login read mode: largeBlob.blob is the secret', () => {
    const r = resolveWalletSecret(true, { largeBlob: { blob: prfFirst } });
    expect(r).toEqual({ supported: true, secret: prfFirst });
  });

  it('wallets enabled and nothing yielded: unsupported (passkeyNotSupported path)', () => {
    expect(resolveWalletSecret(true, {}).supported).toBe(false);
    expect(resolveWalletSecret(true, undefined).supported).toBe(false);
  });
});
