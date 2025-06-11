import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import testingLibrary from 'eslint-plugin-testing-library';
import jestDom from 'eslint-plugin-jest-dom';
import vitest from 'eslint-plugin-vitest';
import checkFile from 'eslint-plugin-check-file';
import globals from 'globals';

import type { Linter } from 'eslint';

const config: Linter.Config[] = [
  // Base configuration for all files
  {
    ignores: ['node_modules/*', 'public/mockServiceWorker.js', 'generators/*'],
  },

  // JavaScript files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Configurer no-unused-vars pour ignorer les variables avec prefix _
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },

  // TypeScript and React files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescript as any,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
      prettier,
      'jest-dom': jestDom,
      vitest,
      'check-file': checkFile,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      // Base ESLint rules
      ...js.configs.recommended.rules,

      // Configurer no-unused-vars pour ignorer les variables avec prefix _
      'no-unused-vars': 'off', // Désactiver la règle de base
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // React rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // JSX A11y rules
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',

      // Import rules
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // disables cross-feature imports:
            // eg. ./src-react/features/discussions should not import from ./src-react/features/comments, etc.

            // e.g. ./src-react/app can import from ./src-react/features but not the other way around
            {
              target: '././src-react/features',
              from: '././src-react/app',
            },

            // e.g ./src-react/features and ./src-react/app can import from these shared modules but not the other way around
            {
              target: [
                '././src-react/components',
                '././src-react/hooks',
                '././src-react/lib',
                '././src-react/services',
                '././src-react/types',
                '././src-react/utils',
              ],
              from: ['././src-react/features', '././src-react/app'],
            },
          ],
        },
      ],
      'import/no-cycle': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
      'import/no-unresolved': 'error',

      // General rules
      'linebreak-style': ['error', 'unix'],
      'no-console': 'warn',
      'no-debugger': 'warn',

      // Prettier rules
      'prettier/prettier': [
        'error',
        {},
        {
          usePrettierrc: true,
          fileInfoOptions: {
            withNodeModules: true,
          },
        },
      ],

      // Jest DOM rules
      'jest-dom/prefer-checked': 'error',
      'jest-dom/prefer-enabled-disabled': 'error',
      'jest-dom/prefer-required': 'error',
      'jest-dom/prefer-to-have-attribute': 'error',

      // Vitest rules
      'vitest/expect-expect': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
      'vitest/valid-expect': 'error',

      // File naming rules
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{ts,tsx}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },

  // Folder naming convention for source files
  {
    files: ['./src-react/**/!(__tests__)/*'],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        {
          '**/*': 'KEBAB_CASE',
        },
      ],
    },
  },

  // Test files specific configuration
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
    ],
    plugins: {
      'testing-library': testingLibrary,
      'jest-dom': jestDom,
      vitest,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'testing-library/prefer-screen-queries': 'error',
      'testing-library/prefer-user-event': 'error',
    },
  },
];

export default config;
