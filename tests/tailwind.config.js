/* eslint-disable global-require */
/** @type {import('tailwindcss').Config} */

const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
    'node_modules/@alore/auth-react-ui/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    screens: {
      '2xs': '375px',
      xs: '412px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1364px',
      '2xl': '1920px',
    },
    extend: {
      boxShadow: {
        'alr-card': '0 0 13px 1px rgba(0, 0, 0, 0.05)',
      },
      colors: {
        'original-purple': '#8038C0',
        'alr-red': '#E64848',
        'alr-dark-red': '#cf3232',
        'alr-grey': '#303030',
        'alr-white': '#F5F5F5',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', ...fontFamily.sans],
        inter: ['var(--font-inter)', ...fontFamily.sans],
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
    backgroundImage: {
      purpleGradient:
        'linear-gradient(180deg, color(display-p3 0.4549 0.3647 0.9216) 0%, color(display-p3 0.502 0.2235 0.7569) 100%)',
      ooriginalGradient: 'linear-gradient(to right, #D30069, #785AF2)',
    },
  },
  plugins: [
    ({ addVariant }) => {
      addVariant('child', '& >');
      addVariant('child-hover', '& > *:hover');
    },
    require('flowbite/plugin'),
  ],
};
