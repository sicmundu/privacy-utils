import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import securityPlugin from 'eslint-plugin-security';

export default [
  {
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      '*.js',
      '*.d.ts',
      'packages/*/dist/',
      'packages/*/build/',
    ],
  },
  {
    files: ['packages/**/*.ts', 'tooling/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: true,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      security: securityPlugin,
    },
    rules: {
      // Security rules - forbid unsafe crypto usage
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="Math.random"]',
          message: 'Use crypto.getRandomValues() instead of Math.random() for security',
        },
        {
          selector: 'CallExpression[callee.object.name="crypto"][callee.property.name="randomBytes"]',
          message: 'Use crypto.getRandomValues() or WebCrypto for cross-platform compatibility',
        },
        {
          selector: 'CallExpression[callee.name="eval"]',
          message: 'eval() is not allowed for security reasons',
        },
        {
          selector: 'CallExpression[callee.name="Function"]',
          message: 'Function constructor is not allowed for security reasons',
        },
      ],

      // TypeScript strict rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'warn',

      // General code quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
    },
  },
];
