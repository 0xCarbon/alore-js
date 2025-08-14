interface SessionUser {
  id: string;
  email: string;
  nickname: null | string;
  status: string;
  createdAt: string;
  lastLogin: null | string;
  lastTransaction: null | string;
  device: string;
  deviceCreatedAt: string;
  accessToken: string;
  refreshToken: string;
  hpkePubKey: null | string;
}

interface FirebaseOptions {
  firebaseCompatible: boolean;
  firebaseServiceAccountEmail: string;
}

interface AuthProviderConfigs {
  locale: string;
  enablePasskeys: boolean;
  enablePasswords: boolean;
  rpDomain: string;
  requireEmailVerification: boolean;
  requireUsername: boolean;
  passwordMinLength: number;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  firebaseOptions: FirebaseOptions;
  allowedEmailDomains?: string | string[];
}

interface Context {
  salt: string;
  sessionId: string;
  sessionUser: SessionUser;
  authProviderConfigs: AuthProviderConfigs;
}

interface ActivitySrc {
  type: string;
}

interface Activity {
  src: ActivitySrc;
  id: string;
  type: string;
}

interface Action {
  type: string;
  activity: Activity;
}

interface EventData {
  type: string;
  data: SessionUser;
}

interface XEvent {
  name: string;
  data: EventData;
  $$type: string;
  type: string;
  origin: string;
}

export interface LocalStorageAuthState {
  actions: Action[];
  activities: Record<string, boolean>;
  meta: Record<string, unknown>;
  events: unknown[];
  value: {
    active: {
      register: string;
    };
  };
  context: Context;
  _event: XEvent;
  _sessionid: string;
  event: {
    type: string;
  };
}
