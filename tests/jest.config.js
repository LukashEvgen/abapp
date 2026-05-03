/* eslint-env node */
/** @type {import('jest').Config} */
export default {
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  testEnvironment: 'node',
  testMatch: ['**/*.rules.test.js'],
};
