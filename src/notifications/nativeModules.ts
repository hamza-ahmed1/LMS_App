import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import type * as BackgroundTaskModule from 'expo-background-task';
import type * as TaskManagerModule from 'expo-task-manager';

/**
 * Expo Go (SDK 53+) ships without some native parts of these modules, and importing them there
 * crashes the whole app (e.g. "Cannot find native module 'ExpoTopicSubscriptionModule'"). They are
 * loaded only in real builds (`npx expo run:android`); in Expo Go the app still works, with the
 * in-app Alerts tab updated live, just without system notifications or the background check.
 */
export const deviceFeaturesAvailable = !isRunningInExpoGo();

function load<T>(loader: () => T): T | null {
  if (!deviceFeaturesAvailable) return null;
  try {
    return loader();
  } catch {
    return null;
  }
}

// require() (not import) so the module only runs when this line does
export const Notifications = load<typeof NotificationsModule>(() => require('expo-notifications'));
export const BackgroundTask = load<typeof BackgroundTaskModule>(() => require('expo-background-task'));
export const TaskManager = load<typeof TaskManagerModule>(() => require('expo-task-manager'));
