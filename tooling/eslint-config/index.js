module.exports = {
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
  },
  plugins: ['@typescript-eslint', 'security'],
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
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',

    // General code quality
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
  },
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    '*.js',
    '*.d.ts',
  ],
};
