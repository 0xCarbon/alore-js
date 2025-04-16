import {
  ButtonTheme,
  CheckboxTheme,
  buttonTheme as flowbiteButtonTheme,
  checkboxTheme as flowbiteCheckboxTheme,
  TextInputTheme,
} from 'flowbite-react';

export const checkboxTheme: CheckboxTheme = {
  ...flowbiteCheckboxTheme,
  color: {
    ...flowbiteCheckboxTheme.color,
    default:
      'size-4 rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-cyan-600 dark:focus:ring-cyan-600 text-[var(--primary-color)] hover:text-[var(--primary-hover)] focus:ring-2 focus:ring-[var(--primary-color)]',
  },
};

export const buttonTheme: ButtonTheme = {
  ...flowbiteButtonTheme,
  color: {
    ...flowbiteButtonTheme.color,
    default:
      'bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] group relative flex items-center justify-center border border-transparent p-0.5 text-center font-medium text-white duration-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:enabled:hover:bg-red-700 dark:disabled:hover:bg-red-600',
  },
};

export const textInputTheme: TextInputTheme = {
  base: 'flex',
  addon:
    'inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-200 px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400',
  field: {
    base: 'relative w-full',
    icon: {
      base: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4',
      svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
    },
    rightIcon: {
      base: 'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3',
      svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
    },
    input: {
      base: 'block w-full bg-gray-100 !px-11 !rounded-full border-0 disabled:cursor-not-allowed disabled:opacity-50',
      sizes: {
        sm: 'p-2 sm:text-xs',
        md: 'p-2.5 text-sm',
        lg: 'sm:text-md p-4',
      },
      colors: {
        gray: 'duration-300 !bg-gray-100 text-gray-900 outline-none border-0 focus:border-0 focus:ring-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500',
        info: 'border-cyan-500 bg-cyan-50 text-cyan-900 placeholder-cyan-700 focus:border-cyan-500 focus:ring-cyan-500 dark:border-cyan-400 dark:bg-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500',
        failure:
          'border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500',
        warning:
          'border-yellow-500 bg-yellow-50 text-yellow-900 placeholder-yellow-700 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-400 dark:bg-yellow-100 dark:focus:border-yellow-500 dark:focus:ring-yellow-500',
        success:
          'border-green-500 bg-green-50 text-green-900 placeholder-green-700 focus:border-green-500 focus:ring-green-500 dark:border-green-400 dark:bg-green-100 dark:focus:border-green-500 dark:focus:ring-green-500',
      },
      withRightIcon: {
        on: 'pr-10',
        off: '',
      },
      withIcon: {
        on: 'pl-10',
        off: '',
      },
      withAddon: {
        on: 'rounded-r-lg',
        off: 'rounded-lg',
      },
      withShadow: {
        on: 'shadow-sm dark:shadow-sm-light',
        off: '',
      },
    },
  },
};
