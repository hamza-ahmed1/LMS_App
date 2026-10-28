import { getNotifications } from '@/api/notifications';
import { getValidAccessToken } from '@/api/session';
import { alertedStore } from './alertedStore';
import { ensureNotificationChannel, presentNotification, presentSummary, setBadgeCount } from './deviceNotifications';
import { BackgroundTask, TaskManager } from './nativeModules';

/**
 * Background worker: while the app is closed, the OS runs it roughly every 15 minutes at best (the
 * shortest interval Android/iOS allow; the OS often stretches it to save battery, and iOS may only run
 * it in occasional windows) to fetch unread notifications from the server and show the ones this
 * device has not alerted yet. When the app is open, the live SignalR connection delivers instantly.
 *
 * The task must be defined at module load (this file is imported from App.tsx) so it exists when the
 * OS starts the app in the background with no UI. Not available in Expo Go (see nativeModules.ts).
 */
export const BACKGROUND_CHECK_TASK = 'eduverse-notification-check';

const MAX_INDIVIDUAL_ALERTS = 3;

export async function checkForNewNotifications(): Promise<number> {
  // Signed out or session expired: nothing to check
  const token = await getValidAccessToken();
  if (!token) return 0;

  const inbox = await getNotifications({ unreadOnly: true, pageSize: 20 });
  await setBadgeCount(inbox.unreadCount);

  const fresh = await alertedStore.addNew(inbox.items.map((item) => item.id));
  if (fresh.length === 0) return 0;

  await ensureNotificationChannel();
  const freshItems = inbox.items.filter((item) => fresh.includes(item.id));
  if (freshItems.length > MAX_INDIVIDUAL_ALERTS) {
    await presentSummary(freshItems.length);
  } else {
    // Oldest first so the newest ends up on top of the notification shade
    for (const item of [...freshItems].reverse()) await presentNotification(item);
  }
  return freshItems.length;
}

if (TaskManager && BackgroundTask) {
  const { BackgroundTaskResult } = BackgroundTask;
  TaskManager.defineTask(BACKGROUND_CHECK_TASK, async () => {
    try {
      await checkForNewNotifications();
      return BackgroundTaskResult.Success;
    } catch {
      return BackgroundTaskResult.Failed;
    }
  });
}

/** Starts the periodic check; the OS keeps it scheduled after the app is swiped away and after a reboot. */
export async function registerBackgroundCheck(): Promise<void> {
  if (!TaskManager || !BackgroundTask) return;
  if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) return;
  if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_CHECK_TASK)) return;

  // In minutes; 15 is the minimum the OS allows
  await BackgroundTask.registerTaskAsync(BACKGROUND_CHECK_TASK, { minimumInterval: 15 });
}

export async function unregisterBackgroundCheck(): Promise<void> {
  if (!TaskManager || !BackgroundTask) return;
  if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_CHECK_TASK)) {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_CHECK_TASK);
  }
}
