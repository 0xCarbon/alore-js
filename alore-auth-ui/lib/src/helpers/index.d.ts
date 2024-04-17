export declare function verifyEmptyValues(values: object | string | undefined): boolean;
declare const _default: {
    verifyEmptyValues: typeof verifyEmptyValues;
};
export default _default;
export interface NewDeviceInfo {
    coordinates?: [latitude: number, longitude: number];
}
export type CaptchaStatus = 'success' | 'error' | 'expired' | 'idle';
