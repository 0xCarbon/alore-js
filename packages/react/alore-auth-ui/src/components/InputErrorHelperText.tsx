'use client';

import React from 'react';

interface Props {
  id?: string;
  message: string;
}

const InputErrorHelperText = ({ id, message }: Props) => (
  <span
    data-test={id ? `${id}-helper-text` : undefined}
    className='text-sm font-semibold text-alr-red'
  >
    {message}
  </span>
);

export default InputErrorHelperText;
