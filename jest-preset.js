const rnPreset = require('react-native/jest-preset');

module.exports = {
  ...rnPreset,
  setupFiles: [require.resolve('./jest/setup.js')],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|date-fns|@firebase|firebase)/)',
  ],
};
