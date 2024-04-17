import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import React from 'react';

interface Props {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const BackButton = ({
  onClick,
  disabled = false,
  children,
  className = '',
  ...props
}: Props) => (
  <span
    {...props}
    onClick={!disabled ? onClick : undefined}
    className={classNames(
      className,
      `flex w-fit cursor-pointer items-center gap-x-1 text-base text-alr-red ${
        disabled ? 'cursor-not-allowed' : ''
      }`
    )}
  >
    <ArrowLeftIcon className='h-4 w-4' />
    {children}
  </span>
);

export default BackButton;
