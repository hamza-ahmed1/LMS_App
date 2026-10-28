import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/notifications';
import { getValidAccessToken } from '@/api/session';
import { alertedStore } from '@/notifications/alertedStore';
import { registerBackgroundCheck, unregisterBackgroundCheck } from '@/notifications/backgroundCheck';
import {
  dismissAllNotifications,
  ensureNotificationChannel,
  onNotificationTapped,
  presentNotification,
  requestNotificationPermission,
  setBadgeCount,
} from '@/notifications/deviceNotifications';
import { openNotificationsTab } from '@/navigation/navigationRef';
import { AppNotification } from '@/types';

const HUB_PATH = '/hubs/notifications';
const PAGE_SIZE = 20;

export type ConnectionStatus = 'offline' | 'connecting' | 'live' | 'reconnecting';

interface NotificationsContextValue {
  items: AppNotification[];
  unreadCount: number;
  hasMore: boolean;
  loading: boolean;
  connectionStatus: ConnectionStatus;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

function mergeNewestFirst(incoming: AppNotification[], existing: AppNotification[]): AppNotification[] {
  const byId = new Map<string, AppNotification>();
  [...existing, ...incoming].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Notifications for the signed-in student. The server's database is the source of truth: the list is
 * loaded over REST and reloaded whenever the app returns to the foreground or the live connection
 * reconnects. While the app is open a SignalR connection delivers new notifications instantly; while it
 * is closed the background check (see notifications/backgroundCheck.ts) takes over.
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadedPages, setLoadedPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const unreadRef = useRef(0);
  unreadRef.current = unreadCount;

  const applyUnread = useCallback((count: number) => {
    setUnreadCount(count);
    void setBadgeCount(count);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const inbox = await getNotifications({ page: 1, pageSize: PAGE_SIZE });
      setItems((current) => mergeNewestFirst(inbox.items, current));
      setTotal(inbox.total);
      setLoadedPages((current) => Math.max(current, 1));
      applyUnread(inbox.unreadCount);
      // The student is looking at these in the app, so the background check shouldn't pop them up later
      await alertedStore.addNew(inbox.items.map((item) => item.id));
    } catch {
      // Keep what we have; the next foreground or reconnect retries
    } finally {
      setLoading(false);
    }
  }, [applyUnread]);

  const loadMore = useCallback(async () => {
    if (loading || items.length >= total) return;
    setLoading(true);
    try {
      const inbox = await getNotifications({ page: loadedPages + 1, pageSize: PAGE_SIZE });
      setItems((current) => mergeNewestFirst(inbox.items, current));
      setTotal(inbox.total);
      setLoadedPages((current) => current + 1);
      applyUnread(inbox.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [applyUnread, items.length, loadedPages, loading, total]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      await ensureNotificationChannel();
      await requestNotificationPermission();
      try {
        await registerBackgroundCheck();
      } catch {
        // Background fetch unavailable (e.g. Expo Go on some platforms); live delivery still works
      }
    })();

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}${HUB_PATH}`, { accessTokenFactory: async () => (await getValidAccessToken()) ?? '' })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) => Math.min(30_000, 1_000 * 2 ** context.previousRetryCount),
      })
      .configureLogging(LogLevel.None)
      .build();

    connection.on('ReceiveNotification', async (notification: AppNotification) => {
      // Confirm receipt to the server even for duplicates; it only records the first acknowledgement
      connection.invoke('AcknowledgeNotification', notification.id).catch(() => undefined);

      const fresh = await alertedStore.addNew([notification.id]);
      setItems((current) => mergeNewestFirst([notification], current));
      if (fresh.length > 0) {
        setTotal((current) => current + 1);
        applyUnread(unreadRef.current + 1);
        await presentNotification(notification);
      }
    });

    connection.onreconnecting(() => setConnectionStatus('reconnecting'));
    connection.onreconnected(() => {
      setConnectionStatus('live');
      void refresh();
    });
    connection.onclose(() => {
      if (!disposed) setConnectionStatus('offline');
    });

    const start = async (attempt: number) => {
      if (disposed || AppState.currentState !== 'active' || connection.state !== HubConnectionState.Disconnected) return;
      setConnectionStatus('connecting');
      try {
        await connection.start();
        if (disposed) return;
        setConnectionStatus('live');
        // Pick up anything sent while we were disconnected
        void refresh();
      } catch {
        if (disposed) return;
        setConnectionStatus('offline');
        retryTimer = setTimeout(() => void start(attempt + 1), Math.min(30_000, 2_000 * 2 ** attempt));
      }
    };

    // Phones suspend background apps, so hold the socket only while in the foreground
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void refresh();
        void start(0);
      } else if (state === 'background') {
        clearTimeout(retryTimer);
        void connection.stop();
      }
    };
    const appStateSubscription = AppState.addEventListener('change', onAppStateChange);

    // Tapping one of our system notifications opens the Notifications tab
    const stopTapListener = onNotificationTapped(openNotificationsTab);

    void refresh();
    void start(0);

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      appStateSubscription.remove();
      stopTapListener();
      void connection.stop();
      // Signed out: stop background checks and forget this student's notifications on the device
      void unregisterBackgroundCheck().catch(() => undefined);
      void alertedStore.clear();
      void dismissAllNotifications();
      void setBadgeCount(0);
      setItems([]);
      setTotal(0);
      setLoadedPages(0);
      setUnreadCount(0);
      setConnectionStatus('offline');
    };
  }, [applyUnread, isAuthenticated, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id);
      if (!target || target.isRead) return;
      setItems((current) => current.map((item) => (item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item)));
      applyUnread(Math.max(0, unreadRef.current - 1));
      try {
        await markNotificationRead(id);
      } catch {
        void refresh();
      }
    },
    [applyUnread, items, refresh]
  );

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    setItems((current) => current.map((item) => (item.isRead ? item : { ...item, isRead: true, readAt })));
    applyUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void refresh();
    }
  }, [applyUnread, refresh]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      unreadCount,
      hasMore: items.length < total,
      loading,
      connectionStatus,
      refresh,
      loadMore,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, total, loading, connectionStatus, refresh, loadMore, markRead, markAllRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsInbox(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsInbox must be used within a NotificationsProvider');
  return ctx;
}
