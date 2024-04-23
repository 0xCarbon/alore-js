/* eslint-disable global-require */
const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    screens: {
      '2xs': '375px',
      xs: '412px',
      sm: '640px',
      md: '768px',
      lg: '912px',
      xl: '1364px',
      '2xl': '1920px',
    },
    extend: {
      boxShadow: {
        'alr-card': '0 0 13px 1px rgba(0, 0, 0, 0.05)',
      },
      colors: {
        'alr-red': '#E64848',
        'alr-dark-red': '#cf3232',
        'alr-grey': '#303030',
        'alr-white': '#F5F5F5',
      },
      fontFamily: {
        inter: ['var(--font-inter)', ...fontFamily.sans],
        poppins: ['var(--font-poppins)', ...fontFamily.sans],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '100' },
        },
        fadeOut: {
          '0%': { opacity: '100' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 700ms ease-in-out',
        fadeOut: 'fadeOut 1200ms ease-in-out',
      },
    },
  },
  plugins: [
    ({ addVariant }) => {
      addVariant('child', '& > *');
      addVariant('child-hover', '& > *:hover');
    },
    require('flowbite/plugin'),
  ],
};
