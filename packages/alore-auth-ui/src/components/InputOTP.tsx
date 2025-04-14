'use client';

import React, { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

export type Props = {
  inputLength: number;
  value: string;
  'data-testid'?: string;
  errorMessage?: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

const RE_DIGIT = /^\d+$/;

const OTPInput = ({
  value,
  inputLength,
  'data-testid': dataTest = '',
  errorMessage,
  onChange,
  className,
  disabled = false,
}: Props) => {
  const inputs = useMemo(() => {
    const valueArray = value.split('');
    const items: Array<string> = [];

    for (let i = 0; i < inputLength; i += 1) {
      const char = valueArray[i];

      if (RE_DIGIT.test(char)) {
        items.push(char);
      } else {
        items.push('');
      }
    }

    return items;
  }, [value, inputLength]);

  function focusToNextInput(target: HTMLElement) {
    const nextElementSibling = target.nextElementSibling as HTMLInputElement | null;

    if (nextElementSibling) {
      nextElementSibling.focus();
    }
  }

  function focusToPrevInput(target: HTMLElement) {
    const previousElementSibling = target.previousElementSibling as HTMLInputElement | null;

    if (previousElementSibling) {
      previousElementSibling.focus();
    }
  }

  function inputOnChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const { target } = e;
    let targetValue = target.value.trim();
    const isTargetValueDigit = RE_DIGIT.test(targetValue);

    if (!isTargetValueDigit && targetValue !== '') {
      return;
    }

    const nextInputEl = target.nextElementSibling as HTMLInputElement | null;

    if (!isTargetValueDigit && nextInputEl && nextInputEl.value !== '') {
      return;
    }

    targetValue = isTargetValueDigit ? targetValue : ' ';

    const targetValueLength = targetValue.length;

    if (targetValueLength === 1) {
      const newValue = value.substring(0, idx) + targetValue + value.substring(idx + 1);

      onChange(newValue);

      if (!isTargetValueDigit) {
        return;
      }

      focusToNextInput(target);
    } else if (targetValueLength === inputLength) {
      onChange(targetValue);

      target.blur();
    }
  }

  function inputOnKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const { key } = e;
    const target = e.target as HTMLInputElement;

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      e.preventDefault();
      return focusToNextInput(target);
    }

    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      e.preventDefault();
      return focusToPrevInput(target);
    }

    const targetValue = target.value;

    target.setSelectionRange(0, targetValue.length);

    if (e.key !== 'Backspace' || targetValue !== '') {
      return;
    }

    focusToPrevInput(target);
  }

  function inputOnFocus(e: React.FocusEvent<HTMLInputElement>) {
    const { target } = e;

    const prevInputEl = target.previousElementSibling as HTMLInputElement | null;

    if (prevInputEl && prevInputEl.value === '') {
      return prevInputEl.focus();
    }

    target.setSelectionRange(0, target.value.length);
  }

  return (
    <div
      data-testid={dataTest}
      className={twMerge('flex flex-col items-center gap-y-6', className)}
    >
      <div className="flex w-full gap-x-5">
        {inputs.map((digit, idx) => (
          <input
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            type="text"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={idx === 0}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{1}"
            maxLength={inputLength}
            className={twMerge(
              `h-[2.56rem] w-[2.56rem] rounded-md border text-center font-semibold duration-500`,
              errorMessage ? 'border-alr-red' : 'border-gray-300',
            )}
            value={digit}
            onChange={(e) => inputOnChange(e, idx)}
            onKeyDown={inputOnKeyDown}
            onFocus={inputOnFocus}
            disabled={disabled}
          />
        ))}
      </div>
      {errorMessage && <span className="text-alr-red text-base font-normal">{errorMessage}</span>}
    </div>
  );
};

export default OTPInput;
