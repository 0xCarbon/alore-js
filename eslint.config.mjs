import { fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import _import from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends(
    'next/core-web-vitals',
    'airbnb',
    'prettier',
    'plugin:@next/next/recommended',
    'plugin:tailwindcss/recommended',
    'plugin:prettier/recommended',
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      // import: fixupPluginRules(_import),
      react,
      // "react-hooks": fixupPluginRules(reactHooks),
      prettier,
    },

    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/public/**',
      '**/cypress/**',
      '**/.next/*',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
    ],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      },

      next: {
        rootDir: './',
      },
    },

    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/anchor-is-valid': 'off',

      'jsx-a11y/alt-text': [
        2,
        {
          elements: ['img', 'object', 'area', 'input[type="image"]'],
          img: ['Image'],
          object: ['Object'],
          area: ['Area'],
          'input[type="image"]': ['InputImage'],
        },
      ],

      'jsx-quotes': ['error', 'prefer-double'],
      'prettier/prettier': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-one-expression-per-line': 'off',

      'react/jsx-key': [
        'error',
        {
          checkFragmentShorthand: true,
        },
      ],

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',

      'react/function-component-definition': [
        2,
        {
          namedComponents: ['arrow-function', 'function-declaration'],
          unnamedComponents: 'arrow-function',
        },
      ],

      'react/jsx-filename-extension': [
        'error',
        {
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      ],

      'react/jsx-props-no-spreading': [
        0,
        {
          html: 'ignore',
          custom: 'ignore',
          explicitSpread: 'ignore',
        },
      ],

      'react/prop-types': 0,
      'react/require-default-props': 0,
      'react/style-prop-object': 0,
      'import/no-cycle': 'off',
      'import/prefer-default-export': 0,
      'import/no-unresolved': 0,
      'import/no-extraneous-dependencies': 0,

      'import/extensions': [
        'error',
        'never',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
          json: 'always',
          svg: 'always',
          css: 'always',
          png: 'always',
          jpeg: 'always',
          client: 'always',
          server: 'always',
        },
      ],

      'no-use-before-define': 'off',
      'no-param-reassign': 'off',

      'no-unused-vars': [
        2,
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      'no-underscore-dangle': 'off',
      camelcase: 'off',
      'consistent-return': 'off',

      'no-console': [
        1,
        {
          allow: ['warn'],
        },
      ],

      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/classnames-order': 'off',
    },
  },
];
