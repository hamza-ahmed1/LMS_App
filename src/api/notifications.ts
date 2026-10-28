import { apiClient } from '@/api/client';
import { AppNotification, NotificationInbox } from '@/types';

/** GET /api/notifications — the signed-in student's notifications, newest first. */
export async function getNotifications(params: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}): Promise<NotificationInbox> {
  const { data } = await apiClient.get<NotificationInbox>('/api/notifications', {
    params: { unreadOnly: params.unreadOnly ?? false, page: params.page ?? 1, pageSize: params.pageSize ?? 20 },
  });
  return data;
}

/** POST /api/notifications/{id}/read */
export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/api/notifications/${id}/read`);
}

/** POST /api/notifications/read-all — an empty body marks every notification as read. */
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/api/notifications/read-all', {});
}

export type { AppNotification };
