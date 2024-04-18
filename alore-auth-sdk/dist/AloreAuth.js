var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { startAuthentication } from '@simplewebauthn/browser';
const DEFAULT_URL = 'https://api-beta.bealore.com/v1';
export class AloreAuth {
    constructor(apiKey, options) {
        this.apiKey = apiKey;
        this.services = {
            completeRegistration: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, nickname, passwordHash, device } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff('/auth/account-registration', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        nickname,
                        password_hash: passwordHash,
                        device,
                    }),
                });
                const data = yield response.json();
                if (response.ok)
                    return data;
                throw new Error(data.message || data.error || 'Authentication failed');
            }),
            confirmPassword: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, passwordHash } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff(`/auth/password-creation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        new_password_hash: passwordHash,
                    }),
                });
                if (!response.ok)
                    return {};
                return { error: response === null || response === void 0 ? void 0 : response.statusText };
            }),
            sendConfirmationEmail: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, nickname, captchaToken, isForgeClaim, locale } = event.payload;
                const captchaResponse = yield this.fetchWithProgressiveBackoff(`/auth/captcha-token-verification?token=${captchaToken}`);
                const captchaData = yield captchaResponse.json();
                if (!(captchaResponse === null || captchaResponse === void 0 ? void 0 : captchaResponse.ok)) {
                    throw new Error(captchaData === null || captchaData === void 0 ? void 0 : captchaData.message);
                }
                if (!(captchaData === null || captchaData === void 0 ? void 0 : captchaData.success)) {
                    throw new Error('Cloudflare failed on verify captcha token');
                }
                const response = yield this.fetchWithProgressiveBackoff('/auth/confirmation-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        nickname,
                        isForgeClaim,
                        locale,
                    }),
                });
                if (response.ok) {
                    const resJson = yield response.json();
                    const { salt } = resJson;
                    return { salt };
                }
                if (response.status === 403) {
                    const resJson = yield response.json();
                    throw new Error(resJson);
                }
                return { error: response === null || response === void 0 ? void 0 : response.statusText };
            }),
            retrieveSalt: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff(`/auth/salt/${email}`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const salt = yield response.json();
                    return { salt };
                }
                return { error: response === null || response === void 0 ? void 0 : response.statusText };
            }),
            sendCode: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff(`/reset-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                    }),
                });
                if (!response.ok)
                    return { error: response === null || response === void 0 ? void 0 : response.statusText };
                return {};
            }),
            verifyLogin: (_, event) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const { email, passwordHash, device, captchaToken, isForgeClaim, locale, } = event.payload;
                const captchaResponse = yield this.fetchWithProgressiveBackoff(`/auth/captcha-token-verification?token=${captchaToken}`);
                const captchaData = yield captchaResponse.json();
                if (!(captchaResponse === null || captchaResponse === void 0 ? void 0 : captchaResponse.ok)) {
                    throw new Error(captchaData === null || captchaData === void 0 ? void 0 : captchaData.message);
                }
                if (!(captchaData === null || captchaData === void 0 ? void 0 : captchaData.success)) {
                    throw new Error('Cloudflare failed on verify captcha token');
                }
                const response = yield this.fetchWithProgressiveBackoff('/auth/login-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password_hash: passwordHash,
                        device,
                        isForgeClaim,
                        locale,
                    }),
                });
                const data = yield response.json();
                if (!response.ok) {
                    if (response.status === 403) {
                        return { active2fa: data };
                    }
                    if (((_a = data === null || data === void 0 ? void 0 : data.error) === null || _a === void 0 ? void 0 : _a.includes('2FA')) || ((_b = data === null || data === void 0 ? void 0 : data.error) === null || _b === void 0 ? void 0 : _b.includes('device'))) {
                        return { error: data === null || data === void 0 ? void 0 : data.error };
                    }
                    throw new Error((data === null || data === void 0 ? void 0 : data.message) || (data === null || data === void 0 ? void 0 : data.error) || data);
                }
                else {
                    return { error: (data === null || data === void 0 ? void 0 : data.error) || (data === null || data === void 0 ? void 0 : data.message) };
                }
            }),
            verify2faCode: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, passwordHash, device, otp } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff('/auth/sw-2fa-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password_hash: passwordHash,
                        device,
                        otp,
                    }),
                });
                const data = yield response.json();
                if (response.ok)
                    return data;
                throw new Error(data.message || data.error || 'Authentication failed');
            }),
            authenticateWebauthn: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, passwordHash, device, authId } = event.payload;
                const optionsResponse = yield this.fetchWithProgressiveBackoff('/auth/hw-2fa-start-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        twofa_id: authId,
                        email,
                        password_hash: passwordHash,
                    }),
                });
                if (optionsResponse.status !== 200) {
                    throw new Error(optionsResponse.statusText);
                }
                const opt = yield optionsResponse.json();
                const credential = yield startAuthentication(opt.publicKey).catch((err) => {
                    throw new Error(err);
                });
                const response = yield this.fetchWithProgressiveBackoff('/auth/hw-2fa-finish-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password_hash: passwordHash,
                        device,
                        credential,
                    }),
                });
                const data = yield response.json();
                if (response.ok)
                    return data;
                throw new Error(data.message || data.error || 'Authentication failed');
            }),
            verifyDeviceCode: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, passwordHash, device, secureCode } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff('/auth/device-ownership-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password_hash: passwordHash,
                        device_secret: device,
                        email_code: secureCode,
                    }),
                });
                const data = yield response.json();
                if (response.ok)
                    return data;
                throw new Error(data.message || data.error || 'Authentication failed');
            }),
            verifyEmail: (_, event) => __awaiter(this, void 0, void 0, function* () {
                const { secureCode } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff('/auth/registration-code-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email_code: secureCode,
                        _cookies: document.cookie,
                    }),
                });
                if (!response.ok) {
                    const data = yield response.json();
                    throw new Error(data);
                }
                else {
                    return {};
                }
            }),
            verifyEmail2fa: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, passwordHash, secureCode } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff('/auth/email-2fa-verification', {
                    method: 'POST',
                    body: JSON.stringify({
                        email,
                        password_hash: passwordHash,
                        email_code: secureCode,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = yield response.json();
                if (response.ok)
                    return data;
                throw new Error(data.message || data.error || 'Authentication failed');
            }),
            verifyEmailEligibility: (_, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, isForgeClaim, locale } = event;
                const response = yield this.fetchWithProgressiveBackoff('/auth/email-eligibility-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        isForgeClaim,
                        locale,
                    }),
                });
                const data = yield response.json();
                if (!response.ok)
                    throw new Error((data === null || data === void 0 ? void 0 : data.message) || (data === null || data === void 0 ? void 0 : data.error) || data);
                return { error: (data === null || data === void 0 ? void 0 : data.error) || (data === null || data === void 0 ? void 0 : data.message) };
            }),
            verifyClaimNftEmail2fa: (context, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, emailCode } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff('/auth/eligible-email-code-verification', {
                    method: 'POST',
                    body: JSON.stringify({
                        email,
                        email_code: emailCode,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = yield response.json();
                if (response.ok)
                    return data;
                throw new Error(data || 'Authentication failed');
            }),
            fetchForgeData: (_, event) => __awaiter(this, void 0, void 0, function* () {
                const response = yield this.fetchWithProgressiveBackoff(`/forges/${event.forgeId}`);
                const data = yield response.json();
                if (!response.ok) {
                    throw new Error(`Failed to this.fetchWithProgressiveBackoff: ${data}`);
                }
                return data;
            }),
            googleLogin: (_, event) => __awaiter(this, void 0, void 0, function* () {
                const { googleToken } = event;
                const response = yield this.fetchWithProgressiveBackoff('/auth/google-login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        access_token: googleToken,
                    }),
                });
                const data = yield response.json();
                if (response.ok) {
                    return {
                        googleOtpCode: data.otp_code,
                        salt: data.salt,
                        googleUser: {
                            email: data.email,
                            nickname: data.nickname,
                            salt: data.salt,
                        },
                    };
                }
                if (response.status === 404) {
                    return {
                        isNewUser: true,
                        registerUser: {
                            email: data.email,
                            nickname: data.nickname,
                            salt: data.salt,
                        },
                    };
                }
                if (!response.ok)
                    throw new Error(data.error || data.message || data);
                return {};
            }),
            verifyGoogleLogin: (_, event) => __awaiter(this, void 0, void 0, function* () {
                const { email, passwordHash, otp } = event.payload;
                const response = yield this.fetchWithProgressiveBackoff('/auth/google-2fa-verification', {
                    method: 'POST',
                    body: JSON.stringify({
                        email,
                        email_code: otp,
                        password_hash: passwordHash,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = yield response.json();
                if (response.ok)
                    return data;
                throw new Error(data.message || data.error || 'Authentication failed');
            }),
        };
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
    delay(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line no-promise-executor-return
            yield new Promise((resolve) => setTimeout(resolve, ms));
        });
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
}
