/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import {setBackgroundMessageHandler} from './src/services/pushNotifications';

setBackgroundMessageHandler(async message => {
  console.log('Background message received:', message);
});

AppRegistry.registerComponent(appName, () => App);
