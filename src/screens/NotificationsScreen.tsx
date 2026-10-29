import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NotificationsStackParamList } from '@/navigation/MainTabs';
import ScreenContainer from '@/components/ScreenContainer';
import { EmptyView } from '@/components/StateViews';
import { useNotificationsInbox } from '@/context/NotificationsContext';
import { colors, radius, shadow, spacing, typography } from '@/theme/theme';
import { AppNotification } from '@/types';

export function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

const STATUS_LABEL = {
  live: 'Live',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
  offline: 'Offline — showing saved notifications',
} as const;

type Props = NativeStackScreenProps<NotificationsStackParamList, 'NotificationsList'>;

/** Titles only; tapping one opens the full message (NotificationDetailScreen), which marks it read. */
export default function NotificationsScreen({ navigation }: Props) {
  const { items, unreadCount, hasMore, loading, connectionStatus, refresh, loadMore, markAllRead } = useNotificationsInbox();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <Pressable
        onPress={() => navigation.navigate('NotificationDetail', { id: item.id })}
        style={({ pressed }) => [styles.card, !item.isRead && styles.cardUnread, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${item.isRead ? '' : 'Unread. '}${item.title}. Opens details.`}
      >
        <View style={styles.cardHeader}>
          {!item.isRead ? <View style={styles.unreadDot} /> : null}
          <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.priority !== 'Normal' ? (
            <View style={[styles.priority, item.priority === 'Urgent' ? styles.priorityUrgent : styles.priorityImportant]}>
              <Text style={[styles.priorityText, { color: item.priority === 'Urgent' ? colors.danger : colors.warning }]}>
                {item.priority}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {item.senderName} · {formatWhen(item.createdAt)}
          </Text>
          <View style={styles.viewDetails}>
            <Text style={styles.viewDetailsText}>View details</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    ),
    [navigation]
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Notifications</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'live' ? colors.success : colors.warning }]} />
            <Text style={styles.statusText}>{STATUS_LABEL[connectionStatus]}</Text>
          </View>
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={() => void markAllRead()} hitSlop={8} accessibilityRole="button">
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasMore) void loadMore();
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <EmptyView icon="notifications-off-outline" message="No notifications yet. Messages from your teachers and school will appear here." />
          )
        }
        ListFooterComponent={hasMore && items.length > 0 ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : undefined}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  heading: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    marginRight: 6,
  },
  statusText: {
    ...typography.small,
    color: colors.textMuted,
  },
  markAll: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardUnread: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
  },
  priority: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  priorityUrgent: {
    backgroundColor: '#FDECEA',
  },
  priorityImportant: {
    backgroundColor: '#FEF5E7',
  },
  priorityText: {
    ...typography.small,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  meta: {
    ...typography.small,
    color: colors.textMuted,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    ...typography.small,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
  loader: {
    marginVertical: spacing.lg,
  },
});
