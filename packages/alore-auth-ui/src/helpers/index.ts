export function verifyEmptyValues(values: object | string | undefined) {
  let hasEmptyValues = false;

  if (values) {
    Object.keys(values).forEach((key) => {
      const value = values[key as keyof typeof values];

      if (
        (typeof value === 'string' || Array.isArray(value)) &&
        (!value || (value as string).length === 0)
      ) {
        hasEmptyValues = true;
      } else if (typeof value === 'object' && value !== null) {
        if (Object.keys(value).length === 0) {
          hasEmptyValues = true;
        }
      }
    });
  } else {
    hasEmptyValues = true;
  }

  return hasEmptyValues;
}

export default { verifyEmptyValues };

export interface NewDeviceInfo {
  coordinates?: [latitude: number, longitude: number];
}

export function darkenHexColor(hex: string, amount: number = 20): string {
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.');
  }

  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - amount);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const base64UrlToArrayBuffer = (base64Url: string): ArrayBuffer => {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padLength);

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
