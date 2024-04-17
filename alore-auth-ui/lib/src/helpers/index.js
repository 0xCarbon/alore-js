export function verifyEmptyValues(values) {
    let hasEmptyValues = false;
    if (values) {
        Object.keys(values).forEach((key) => {
            const value = values[key];
            if ((typeof value === 'string' || Array.isArray(value)) &&
                (!value || value.length === 0)) {
                hasEmptyValues = true;
            }
            else if (typeof value === 'object') {
                if (Object.keys(value).length === 0) {
                    hasEmptyValues = true;
                }
            }
        });
    }
    else {
        hasEmptyValues = true;
    }
    return hasEmptyValues;
}
export default { verifyEmptyValues };
