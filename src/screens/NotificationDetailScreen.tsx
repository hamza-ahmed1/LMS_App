import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '@/components/Card';
import { EmptyView } from '@/components/StateViews';
import { useNotificationsInbox } from '@/context/NotificationsContext';
import type { NotificationsStackParamList } from '@/navigation/MainTabs';
import { colors, radius, spacing, typography } from '@/theme/theme';

type Props = NativeStackScreenProps<NotificationsStackParamList, 'NotificationDetail'>;

/** Full notification message. Opening it marks it read (saved on the server and reflected in the list). */
export default function NotificationDetailScreen({ route }: Props) {
  const { items, markRead } = useNotificationsInbox();
  const notification = items.find((item) => item.id === route.params.id);

  useEffect(() => {
    if (notification && !notification.isRead) void markRead(notification.id);
  }, [markRead, notification]);

  if (!notification) {
    return <EmptyView icon="notifications-off-outline" message="This notification is no longer available." />;
  }

  const sent = new Date(notification.createdAt);
  const priorityColor = notification.priority === 'Urgent' ? colors.danger : colors.warning;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        {notification.priority !== 'Normal' ? (
          <View style={[styles.priority, { backgroundColor: priorityColor + '1F' }]}>
            <Ionicons name="alert-circle" size={14} color={priorityColor} />
            <Text style={[styles.priorityText, { color: priorityColor }]}>{notification.priority}</Text>
          </View>
        ) : null}

        <Text style={styles.title} accessibilityRole="header">
          {notification.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="person-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.meta}>
            {notification.senderName} · {notification.senderRole}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.meta}>
            {Number.isNaN(sent.getTime())
              ? notification.createdAt
              : sent.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.message} selectable>
          {notification.message}
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  priority: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  priorityText: { ...typography.small, fontWeight: '700' },
  title: { ...typography.h2, color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs },
  meta: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  message: { ...typography.body, color: colors.textPrimary, lineHeight: 23 },
});
