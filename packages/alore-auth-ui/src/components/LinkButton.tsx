'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  onClick: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

/**
 * Inline textual action (forgot password, sign up, resend code, 2FA method switches).
 * These used to be `span`/`div` with an onClick, which no keyboard could ever reach.
 */
const LinkButton = ({
  onClick,
  children,
  className = '',
  disabled = false,
  'data-testid': dataTest,
  ...props
}: Props) => (
  <button
    {...props}
    type="button"
    data-testid={dataTest}
    onClick={onClick}
    disabled={disabled}
    className={twMerge(
      'w-fit cursor-pointer rounded font-medium text-[var(--primary-color)] duration-300 hover:text-[var(--primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed',
      className,
    )}
  >
    {children}
  </button>
);

export default LinkButton;
