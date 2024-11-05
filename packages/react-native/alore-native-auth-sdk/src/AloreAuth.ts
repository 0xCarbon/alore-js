import base64url from 'base64url';
import type {
  FinishPasskeyLoginEvent,
  AloreCommonType,
  AuthMachineContext,
  UserInputPasskeyLoginEvent,
  StartPasskeyLoginEvent,
  UserInputPasskeyRegisterEvent,
  StartPasskeyRegisterEvent,
  FinishPasskeyRegisterEvent,
  CompleteRegistrationEvent,
  ResendCodeEvent,
  SendRegistrationEmailEvent,
  VerifyEmailEvent,
  NextEvent,
  VerifyLoginEvent,
  VerifyEmail2FAEvent,
  PasskeyGetRequest,
  FetchSaltEvent,
} from '@0xcarbon/alore-native-common';
import AloreCommon from '@0xcarbon/alore-native-common';
import { randomBytes } from 'crypto';
import { Passkey } from 'react-native-passkey';

export interface AloreAuthConfiguration {
  endpoint?: string;
  emailTemplate?: string;
}

export class AloreAuth {
  protected readonly aloreCommon: AloreCommonType;

  constructor(
    public readonly apiKey: string,
    options?: AloreAuthConfiguration
  ) {
    if (!apiKey) throw new Error('API_KEY is required');

    this.aloreCommon = new AloreCommon(apiKey, {
      emailTemplate: options?.emailTemplate,
      endpoint: options?.endpoint,
    });
  }

  services = {
    finishPasskeyAuth: async (
      context: AuthMachineContext,
      event: FinishPasskeyLoginEvent
    ) => {
      const { passkeyAuth } = event.payload;
      const response = await this.aloreCommon.fetchWithProgressiveBackoff(
        `/auth/login-passkey-finish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ passkeyAuth, sessionId: context.sessionId }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        return data;
      }

      throw new Error(data.message || data.error);
    },
    userInputLoginPasskey: async (
      context: AuthMachineContext,
      event: UserInputPasskeyLoginEvent
    ) => {
      const publicKey = event.payload.RCRPublicKey?.publicKey;
      const { isFirstLogin } = context;

      if (!publicKey) {
        throw new Error('PublicKeyCredentialCreationOptions is undefined');
      }

      const blob = new Uint8Array(randomBytes(32));

      const loginData: PasskeyGetRequest = {
        ...publicKey,
        extensions: {
          // @ts-ignore
          largeBlob: isFirstLogin
            ? {
                write: blob,
              }
            : { read: true },
          prf: { eval: { first: new TextEncoder().encode('Alore') } },
        },
      };
      let result = await Passkey.get(loginData);

      if (typeof result === 'string') {
        result = JSON.parse(result);
      }

      const clientExtensionResults = result.clientExtensionResults;
      const prfWritten = !!clientExtensionResults?.prf?.results;
      const blobWritten = !!clientExtensionResults?.largeBlob?.written;
      let secretFromCredential;

      if (prfWritten) {
        secretFromCredential = clientExtensionResults?.prf?.results?.first;
      }
      // TODO: Continue for largeblob on ios

      if (!secretFromCredential) {
        throw new Error('PASSKEY_NOT_SUPPORTED');
      }

      return { response: result, secret: secretFromCredential };
    },
    startPasskeyAuth: async (
      _: AuthMachineContext,
      event: StartPasskeyLoginEvent
    ) => {
      let url = `/auth/login-passkey`;

      if (event.payload?.email) {
        url += `?email=${event.payload.email}`;
      }

      const startAuthResponse =
        await this.aloreCommon.fetchWithProgressiveBackoff(url);

      const data = await startAuthResponse.json();

      if (startAuthResponse.ok) {
        return data;
      }

      throw new Error(data.message || data.error);
    },
    userInputRegisterPasskey: async (
      _: AuthMachineContext,
      event: UserInputPasskeyRegisterEvent
    ) => {
      const { CCRPublicKey, email, nickname } = event.payload;
      const publicKey = CCRPublicKey?.publicKey;

      if (!publicKey) {
        throw new Error('PublicKeyCredentialCreationOptions is undefined');
      }

      let result = await Passkey.create({
        ...publicKey,
        rp: {
          ...publicKey.rp,
          id: publicKey.rp.id!,
        },
        user: {
          ...publicKey.user,
          name: email,
          displayName: nickname,
        },
        extensions: {
          prf: {
            eval: {
              first: new TextEncoder().encode('Alore'),
            },
          },
          largeBlob: {
            // TODO: Continue for largeblob on ios
          },
        },
        authenticatorSelection: {
          requireResidentKey: true,
          residentKey: 'required',
          userVerification: 'required',
        },
      });

      if (typeof result === 'string') {
        result = JSON.parse(result);
      }
      // @ts-ignore
      const clientExtensionResults = result?.clientExtensionResults;
      const prfSupported = !!clientExtensionResults?.prf?.enabled;
      const largeBlobSupported = !!clientExtensionResults?.largeBlob?.supported;

      if (!prfSupported && !largeBlobSupported) {
        throw new Error('PASSKEY_NOT_SUPPORTED');
      }

      return result;
    },
    startRegisterPasskey: async (
      _context: AuthMachineContext,
      event: StartPasskeyRegisterEvent
    ) => {
      const { email, nickname, device } = event.payload;

      const startPasskeyRegistrationResponse =
        await this.aloreCommon.fetchWithProgressiveBackoff(
          `/auth/account-registration-passkey`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userEmail: email,
              userNickname: nickname,
              userDevice: device,
            }),
          }
        );

      const data = await startPasskeyRegistrationResponse.json();

      if (startPasskeyRegistrationResponse.ok) {
        return data;
      }

      throw new Error(data.message || data.error);
    },
    finishRegisterPasskey: async (
      context: AuthMachineContext,
      event: FinishPasskeyRegisterEvent
    ) => {
      const { email, nickname, device, passkeyRegistration } = event.payload;

      const response = await this.aloreCommon.fetchWithProgressiveBackoff(
        `/auth/account-registration-passkey-finish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: email,
            userNickname: nickname,
            userDevice: device,
            passkeyRegistration: {
              id: passkeyRegistration.id,
              rawId: base64url.fromBase64(passkeyRegistration.rawId),
              response: {
                attestationObject: base64url.fromBase64(
                  passkeyRegistration.response.attestationObject
                ),
                clientDataJSON: base64url.fromBase64(
                  passkeyRegistration.response.clientDataJSON
                ),
              },
              type: passkeyRegistration.type,
            },
            sessionId: context.sessionId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return data;
      }

      throw new Error(data.message || data.error);
    },
    completeRegistration: async (
      _: AuthMachineContext,
      event: CompleteRegistrationEvent
    ) => {
      const { email, nickname, passwordHash, device } = event.payload;

      const response = await this.aloreCommon.fetchWithProgressiveBackoff(
        `/auth/account-registration`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            nickname,
            passwordHash,
            device,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) return data;

      throw new Error(data.message || data.error || 'Authentication failed');
    },
    sendConfirmationEmail: async (
      _: AuthMachineContext,
      event: ResendCodeEvent | SendRegistrationEmailEvent
    ) => {
      const { email, nickname, locale } = event.payload;
      const searchParams = new URLSearchParams();
      let url = '/auth/confirmation-email';

      if (locale) {
        searchParams.append('locale', locale);
      }

      if (this.aloreCommon.emailTemplate) {
        searchParams.append('template', this.aloreCommon.emailTemplate);
      }

      const response = await this.aloreCommon.fetchWithProgressiveBackoff(
        searchParams.size > 0 ? `${url}?${searchParams.toString()}` : url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            nickname,
            locale,
          }),
        }
      );

      if (response.ok) {
        const resJson = await response.json();
        const { salt, sessionId } = resJson;
        return { salt, sessionId };
      }

      if (response.status === 403) {
        const resJson = await response.json();
        throw new Error(resJson);
      }

      throw new Error(response?.statusText);
    },
    verifyEmail: async (
      context: AuthMachineContext,
      event: VerifyEmailEvent
    ) => {
      const { secureCode } = event.payload;
      const response = await this.aloreCommon.fetchWithProgressiveBackoff(
        `/auth/registration-code-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailCode: secureCode,
            sessionId: context.sessionId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || data?.error || data);
      } else {
        return {};
      }
    },
    retrieveSalt: async (_: AuthMachineContext, event: FetchSaltEvent) => {
      const { email } = event.payload;
      const response = await this.aloreCommon.fetchWithProgressiveBackoff(
        `/auth/salt/${email}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const salt: string = await response.json();
        return { salt };
      }

      throw new Error(response.statusText);
    },
    verifyLogin: async (
      _: AuthMachineContext,
      event: VerifyLoginEvent | ResendCodeEvent
    ) => {
      const { email, passwordHash, device, locale } = event.payload;
      const searchParams = new URLSearchParams();
      let url = '/auth/login-verification';

      if (locale) {
        searchParams.append('locale', locale);
      }

      if (this.aloreCommon.emailTemplate) {
        searchParams.append('template', this.aloreCommon.emailTemplate);
      }

      const response = await this.aloreCommon.fetchWithProgressiveBackoff(
        searchParams.size > 0 ? `${url}?${searchParams.toString()}` : url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            passwordHash,
            device,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          return { active2fa: data };
        }
        if (data?.error?.includes('2FA') || data?.error?.includes('device')) {
          return { error: data?.error };
        }
        throw new Error(data?.message || data?.error || data);
      } else {
        return data;
      }
    },
    verifyEmail2fa: async (
      context: AuthMachineContext,
      event: VerifyEmail2FAEvent
    ) => {
      const { email, passwordHash, secureCode } = event.payload;

      const response = await this.aloreCommon.fetchWithProgressiveBackoff(
        `/auth/email-2fa-verification`,
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            passwordHash,
            emailCode: secureCode,
            sessionId: context.sessionId,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok) return data;

      throw new Error(data.message || data.error || 'Authentication failed');
    },
  };
}
