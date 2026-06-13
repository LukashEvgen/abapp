// Custom Jest setup to avoid react-native Flow polyfill crash
// React Native's default setup tries to require @react-native/js-polyfills/error-guard
// which contains Flow type annotations that crash under babel-jest without @babel/preset-flow.
// We skip that polyfill and set up minimal globals manually.

global.__DEV__ = true;
