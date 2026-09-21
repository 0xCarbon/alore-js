'use client';

import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const BackButton = ({ onClick, disabled = false, children, className = '', ...props }: Props) => (
  <button
    {...props}
    type="button"
    data-testid="back-button"
    onClick={onClick}
    disabled={disabled}
    className={twMerge(
      `flex w-fit cursor-pointer items-center gap-x-1 rounded text-base text-[var(--primary-color)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2`,
      disabled ? 'cursor-not-allowed' : '',
      className,
    )}
  >
    <ArrowLeftIcon className="size-4" />
    <span className="ml-1 text-sm">{children}</span>
  </button>
);

export default BackButton;
