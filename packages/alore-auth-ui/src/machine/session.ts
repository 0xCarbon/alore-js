/**
 * What the auth UI keeps in localStorage under `authState`.
 *
 * It is a minimal, versioned session record, never a serialized XState snapshot.
 * A snapshot carries the event history, and after a password login that history
 * holds the client-side Argon2 `passwordHash`, which the server accepts as the
 * password. The record holds only what a signed-in app needs: the session user
 * (identity plus access and refresh tokens) and the passkey relying-party domain.
 *
 * The record keeps the `context.sessionUser` path that consuming apps already
 * read (Joori reads `context.sessionUser.{accessToken,refreshToken}` and patches
 * rotated tokens back in place), so they keep working without a coordinated change.
 */

export const AUTH_STATE_STORAGE_KEY = 'authState';
export const SESSION_RECORD_VERSION = 2;

/** The only `sessionUser` fields that are ever persisted. */
const SESSION_USER_FIELDS = [
  'id',
  'email',
  'nickname',
  'picture',
  'status',
  'createdAt',
  'lastLogin',
  'lastTransaction',
  'device',
  'deviceCreatedAt',
  'accessToken',
  'refreshToken',
] as const;

export type PersistedSessionUser = {
  id?: string;
  email?: string;
  nickname?: string | null;
  picture?: string | null;
  status?: string;
  createdAt?: string;
  lastLogin?: string | null;
  lastTransaction?: string | null;
  device?: string;
  deviceCreatedAt?: string;
  accessToken?: string;
  refreshToken?: string;
};

export type PersistedAuthSession = {
  v: typeof SESSION_RECORD_VERSION;
  /** Passkeys are bound to it: a session saved under another one is not restored. */
  rpDomain?: string;
  context: { sessionUser: PersistedSessionUser };
};

export type StorageReader = Pick<Storage, 'getItem' | 'removeItem'>;
export type StorageWriter = Pick<Storage, 'setItem' | 'removeItem'>;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function pickSessionUser(value: unknown): PersistedSessionUser | undefined {
  if (!isObject(value)) return undefined;
  const picked: JsonObject = {};
  SESSION_USER_FIELDS.forEach((field) => {
    if (value[field] !== undefined) picked[field] = value[field];
  });
  // A record with no token cannot sign anyone in.
  if (!isNonEmptyString(picked.accessToken) && !isNonEmptyString(picked.refreshToken)) {
    return undefined;
  }
  return picked as PersistedSessionUser;
}

export function buildSessionRecord(
  sessionUser: unknown,
  rpDomain?: unknown,
): PersistedAuthSession | undefined {
  const user = pickSessionUser(sessionUser);
  if (!user) return undefined;
  return {
    v: SESSION_RECORD_VERSION,
    ...(isNonEmptyString(rpDomain) ? { rpDomain } : {}),
    context: { sessionUser: user },
  };
}

/** Whether a legacy snapshot's state value is one where the user is signed in. */
function isSignedInValue(value: unknown): boolean {
  if (!isObject(value) || !isObject(value.active)) return false;
  const { active } = value;
  return active.login === 'successfulLogin' || active.register === 'userCreated';
}

export type ParsedSession = {
  record: PersistedAuthSession;
  /** The stored text differs from the record: store the record in its place. */
  needsRewrite: boolean;
};

/**
 * Reads the stored text as a session record. Returns undefined when it holds no
 * usable session: malformed, no tokens, or a legacy snapshot of a flow that was
 * still in progress. The caller deletes the key in that case.
 *
 * A legacy value (the old serialized XState snapshot, or a bare
 * `{ context: { sessionUser } }` written by an app) is migrated: its session
 * survives, everything else in it, event history included, is dropped.
 */
export function parsePersistedSession(raw: string): ParsedSession | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isObject(parsed)) return undefined;

  const context = isObject(parsed.context) ? parsed.context : {};
  const isCurrent = parsed.v === SESSION_RECORD_VERSION;

  // A snapshot written mid-flow is not a session, even if a stale sessionUser
  // is still in its context. An app-written record has no `value` at all.
  if (!isCurrent && parsed.value !== undefined && !isSignedInValue(parsed.value)) {
    return undefined;
  }

  const configs = isObject(context.authProviderConfigs) ? context.authProviderConfigs : {};
  const rpDomain = isCurrent ? parsed.rpDomain : configs.rpDomain;
  const record = buildSessionRecord(context.sessionUser, rpDomain);
  if (!record) return undefined;

  return { record, needsRewrite: JSON.stringify(record) !== JSON.stringify(parsed) };
}

/**
 * Writes the record. If it cannot be written, the key is removed instead so the
 * old content never survives a failed migration.
 */
export function writeSessionRecord(storage: StorageWriter, record: PersistedAuthSession): void {
  try {
    storage.setItem(AUTH_STATE_STORAGE_KEY, JSON.stringify(record));
  } catch {
    removeSessionRecord(storage);
  }
}

export function removeSessionRecord(storage: Pick<Storage, 'removeItem'>): void {
  try {
    storage.removeItem(AUTH_STATE_STORAGE_KEY);
  } catch {
    // storage unavailable: nothing to clean up
  }
}
