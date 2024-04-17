import React from 'react';
const InputErrorHelperText = ({ id, message }) => (React.createElement("span", { "data-test": id ? `${id}-helper-text` : undefined, className: 'text-sm font-semibold text-alr-red' }, message));
export default InputErrorHelperText;
