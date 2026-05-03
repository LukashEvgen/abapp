import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import {searchEdrHandler} from './registry/edr';
import {searchCourtHandler} from './registry/court';
import {searchEnforcementHandler} from './registry/enforcement';

export const searchEdr = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .https.onCall(searchEdrHandler);

export const searchCourt = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .https.onCall(searchCourtHandler);

export const searchEnforcement = functions
  .runWith({maxInstances: 10, timeoutSeconds: 30})
  .https.onCall(searchEnforcementHandler);
