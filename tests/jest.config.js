/* eslint-env node */
/** @type {import('jest').Config} */
module.exports = {
  rootDir: '../',
  testEnvironment: 'node',
  testMatch: ['**/tests/firestore-storage.rules.test.js'],
  transform: {
    '^.+\\.(m?[tj]sx?|mjs)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
        ],
      },
    ],
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\](?!(@firebase|firebase|tslib|uuid)/)',
  ],
};
