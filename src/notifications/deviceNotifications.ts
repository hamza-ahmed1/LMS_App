import { Platform } from 'react-native';
import { AppNotification } from '@/types';
import { colors } from '@/theme/theme';
import { Notifications } from './nativeModules';

/** Android channel for school notifications; created once, the user can tune it in system settings. */
export const NOTIFICATION_CHANNEL_ID = 'school-notifications';

/** Marks a system notification as one of ours so a tap can open the Notifications tab. */
export const NOTIFICATION_DATA_KIND = 'lms-notification';

// Every function below is a no-op in Expo Go, where the notifications module can't load (see nativeModules.ts)

// Show alerts even while the app is open; the in-app list updates at the same time
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function ensureNotificationChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'School notifications',
    description: 'Messages from your teachers, HOD and administration',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colors.primary,
  });
}

/** Asks once (Android 13+ and iOS need permission); returns whether alerts may be shown. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Shows one system notification for a school notification. */
export async function presentNotification(notification: AppNotification): Promise<void> {
  if (!Notifications) return;
  const prefix = notification.priority === 'Urgent' ? 'Urgent: ' : notification.priority === 'Important' ? 'Important: ' : '';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${prefix}${notification.title}`,
      body: notification.message,
      subtitle: notification.senderName,
      data: { kind: NOTIFICATION_DATA_KIND, notificationId: notification.id },
      sound: 'default',
      priority: notification.priority === 'Normal' ? Notifications.AndroidNotificationPriority.DEFAULT : Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : null,
  });
}

/** Shows a single summary instead of a burst when many arrive at once (e.g. after a day offline). */
export async function presentSummary(count: number): Promise<void> {
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New notifications',
      body: `You have ${count} new notifications from your school.`,
      data: { kind: NOTIFICATION_DATA_KIND },
      sound: 'default',
    },
    trigger: Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : null,
  });
}

export async function setBadgeCount(count: number): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Not every Android launcher supports badges
  }
}

/** Opens the Notifications tab when the user taps one of our system notifications. Returns an unsubscribe function. */
export function onNotificationTapped(handler: () => void): () => void {
  if (!Notifications) return () => undefined;
  const isOurs = (data: unknown) => (data as { kind?: string } | undefined)?.kind === NOTIFICATION_DATA_KIND;
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (isOurs(response.notification.request.content.data)) handler();
  });
  // The app may have been launched by tapping a notification
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response && isOurs(response.notification.request.content.data)) handler();
  });
  return () => subscription.remove();
}

export async function dismissAllNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.dismissAllNotificationsAsync().catch(() => undefined);
}
