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
  <span
    {...props}
    onClick={!disabled ? onClick : undefined}
    className={twMerge(
      `flex w-fit cursor-pointer items-center gap-x-1 text-base text-[var(--primary-color)]`,
      disabled ? 'cursor-not-allowed' : '',
      className,
    )}
  >
    <ArrowLeftIcon className="size-4" />
    <span className="ml-1 text-sm">{children}</span>
  </span>
);

export default BackButton;
