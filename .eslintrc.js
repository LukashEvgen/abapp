module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['coverage/**'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'avoid',
        bracketSpacing: false,
        bracketSameLine: true,
      },
    ],
    quotes: ['error', 'single', {avoidEscape: true}],
    'react-hooks/exhaustive-deps': 'warn',
    'eslint-comments/no-unlimited-disable': 'warn',
  },
};
