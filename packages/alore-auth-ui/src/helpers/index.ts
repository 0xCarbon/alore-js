export function verifyEmptyValues(values: object | string | undefined) {
  let hasEmptyValues = false;

  if (values) {
    Object.keys(values).forEach((key) => {
      const value = values[key as keyof typeof values];
      if (
        (typeof value === 'string' || Array.isArray(value)) &&
        (!value || (value as string | any[]).length === 0)
      ) {
        hasEmptyValues = true;
      } else if (typeof value === 'object') {
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
