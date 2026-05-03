// Minimal react-native mock for palette regression snapshot tests
const React = require('react');
const {Component} = React;

const View = props => React.createElement('View', props, props.children);
const Text = props => React.createElement('Text', props, props.children);
const TextInput = props => React.createElement('TextInput', props);
const TouchableOpacity = props =>
  React.createElement('TouchableOpacity', props, props.children);
const ScrollView = props =>
  React.createElement('ScrollView', props, props.children);
const ActivityIndicator = props =>
  React.createElement('ActivityIndicator', props);

const StyleSheet = {
  create: styles => styles,
};

module.exports = {
  __esModule: true,
  default: {},
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
};
