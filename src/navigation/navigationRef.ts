import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pendingNotificationsOpen = false;

/** Opens the Notifications tab; if navigation isn't mounted yet (cold start from a tap), waits for onReady. */
export function openNotificationsTab() {
  if (navigationRef.isReady()) {
    // The tab only exists while signed in; navigate is a no-op otherwise
    (navigationRef.navigate as (name: string) => void)('Notifications');
  } else {
    pendingNotificationsOpen = true;
  }
}

/** Called from NavigationContainer's onReady. */
export function flushPendingNavigation() {
  if (pendingNotificationsOpen) {
    pendingNotificationsOpen = false;
    openNotificationsTab();
  }
}
