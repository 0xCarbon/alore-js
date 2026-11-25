import { AloreContractVersionError } from './errors.js';

const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/;
const NUMERIC_ID_RE = /^(0|[1-9]\d*)$/;

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: readonly string[];
}

export function isValidSemver(value: string): boolean {
  return SEMVER_RE.test(value);
}

export function parseSemver(value: string): ParsedSemver {
  const match = SEMVER_RE.exec(value);
  if (!match) {
    throw new TypeError(`Invalid semver string: ${value}`);
  }
  const prerelease = match[4] ? match[4].split('.') : [];
  if (prerelease.some((part) => part.length === 0)) {
    throw new TypeError(`Invalid semver prerelease identifier: ${value}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease,
  };
}

/**
 * Compare two SemVer 2.0 versions (ignoring build metadata per contract schema).
 * Returns -1 when `a < b`, 0 when equal, and 1 when `a > b`.
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);

  if (pa.major !== pb.major) return pa.major < pb.major ? -1 : 1;
  if (pa.minor !== pb.minor) return pa.minor < pb.minor ? -1 : 1;
  if (pa.patch !== pb.patch) return pa.patch < pb.patch ? -1 : 1;

  const aPre = pa.prerelease;
  const bPre = pb.prerelease;
  if (aPre.length === 0 && bPre.length === 0) return 0;
  if (aPre.length === 0) return 1;
  if (bPre.length === 0) return -1;

  const len = Math.max(aPre.length, bPre.length);
  for (let i = 0; i < len; i += 1) {
    const ai = aPre[i];
    const bi = bPre[i];
    if (ai === undefined) return -1;
    if (bi === undefined) return 1;
    if (ai !== bi) {
      const aNum = NUMERIC_ID_RE.test(ai);
      const bNum = NUMERIC_ID_RE.test(bi);
      if (aNum && bNum) {
        return Number(ai) < Number(bi) ? -1 : 1;
      }
      if (aNum) return -1;
      if (bNum) return 1;
      return ai < bi ? -1 : 1;
    }
  }
  return 0;
}

/**
 * Assert that the server's `contract` version satisfies the caller's `minContract`.
 * Throws `AloreContractVersionError` when the server is older than `minContract`, or when
 * `minContract` is `>= 1.0.0` and the server has moved to a different major version.
 */
export function assertCompatibleContract(served: string, minContract: string): void {
  const parsedServed = parseSemver(served);
  const parsedMin = parseSemver(minContract);
  const cmp = compareSemver(served, minContract);
  const majorMismatch = parsedMin.major >= 1 && parsedServed.major !== parsedMin.major;

  if (cmp < 0 || majorMismatch) {
    const detail = majorMismatch
      ? `Alore contract major mismatch: server offers ${served}, client requires major ${parsedMin.major} (minimum ${minContract}).`
      : `Alore contract version ${served} is below required minimum ${minContract}.`;
    throw new AloreContractVersionError(
      {
        type: 'contract_version',
        title: 'Incompatible contract version',
        status: 400,
        detail,
        error: {
          type: 'contract_version',
          message: detail,
          code: 'contract_version',
          param: null,
        },
      },
      undefined,
      { servedContract: served, minContract },
    );
  }
}
