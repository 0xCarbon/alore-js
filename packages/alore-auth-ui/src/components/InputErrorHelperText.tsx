'use client';

import React from 'react';

interface Props {
  id?: string;
  message: string;
}

const InputErrorHelperText = ({ id, message }: Props) => (
  <span
    data-test={id ? `${id}-helper-text` : undefined}
    className="text-alr-red text-sm font-semibold"
  >
    {message}
  </span>
);

export default InputErrorHelperText;
