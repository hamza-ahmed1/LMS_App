import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '@/components/ScreenContainer';
import Card from '@/components/Card';
import { LoadingView, ErrorView, EmptyView } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { getFeeChallans } from '@/api/fees';
import { getApiErrorMessage } from '@/api/client';
import { FeeChallan } from '@/types';
import { colors, radius, spacing, typography } from '@/theme/theme';

function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

function formatDueDate(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATE_STYLE = {
  Paid: { label: 'Paid', color: colors.success },
  Partial: { label: 'Partly paid', color: colors.warning },
  Unpaid: { label: 'Unpaid', color: colors.warning },
  Overdue: { label: 'Overdue', color: colors.danger },
  Voided: { label: 'Cancelled', color: colors.textMuted },
} as const;

export default function FeeChalanScreen() {
  const { student } = useAuth();
  const [challans, setChallans] = useState<FeeChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!student?.studentId) return;
    setError(null);
    try {
      setChallans(await getFeeChallans(student.studentId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your fee challans.'));
    } finally {
      setLoading(false);
    }
  }, [student?.studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const totalDue = useMemo(() => challans.reduce((sum, c) => sum + Math.max(0, c.amountDue), 0), [challans]);
  const nextDue = useMemo(
    () =>
      challans
        .filter((c) => c.status !== 'Paid')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0],
    [challans]
  );
  const currency = challans[0]?.currency ?? 'PKR';

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingView label="Loading your fee challans..." />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <ErrorView message={error} onRetry={load} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Fee Challan</Text>

        {challans.length > 0 && (
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total outstanding</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalDue, currency)}</Text>
            {nextDue ? (
              <Text style={styles.totalHint}>
                Next due: {nextDue.month} {nextDue.year} · by {formatDueDate(nextDue.dueDate)}
              </Text>
            ) : (
              <Text style={styles.totalHint}>All challans are paid.</Text>
            )}
          </Card>
        )}

        {challans.length === 0 ? (
          <EmptyView icon="receipt-outline" message="No fee challans have been issued yet." />
        ) : (
          challans.map((challan) => {
            const state = challan.status;
            const { label, color } = STATE_STYLE[state];
            return (
              <Card key={challan.id} style={state === 'Overdue' ? { ...styles.card, ...styles.cardOverdue } : styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex1}>
                    <Text style={styles.feeName}>{challan.feeTypeName || 'Fee'}</Text>
                    <Text style={styles.challanNo}>Challan {challan.invoiceNum}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.statusText, { color }]}>{label}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Detail icon="calendar-outline" label="Applicable month" value={`${challan.month} ${challan.year}`.trim()} />
                  <Detail icon="alarm-outline" label="Due date" value={formatDueDate(challan.dueDate)} highlight={state === 'Overdue' ? colors.danger : undefined} />
                </View>

                <View style={styles.amountRow}>
                  <View>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amount}>{formatCurrency(challan.netAmount, challan.currency)}</Text>
                    {challan.discount > 0 ? <Text style={styles.amountNote}>Includes {formatCurrency(challan.discount, challan.currency)} off</Text> : null}
                    {challan.lateFee > 0 ? <Text style={styles.amountNote}>Includes {formatCurrency(challan.lateFee, challan.currency)} late fee</Text> : null}
                  </View>
                  {challan.amountPaid > 0 && state !== 'Paid' ? (
                    <View style={styles.alignRight}>
                      <Text style={styles.amountLabel}>Balance due</Text>
                      <Text style={[styles.amount, { color: colors.danger }]}>{formatCurrency(challan.amountDue, challan.currency)}</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            );
          })
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function Detail({ icon, label, value, highlight }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; highlight?: string }) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={16} color={highlight ?? colors.textSecondary} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, highlight ? { color: highlight } : null]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  totalCard: { backgroundColor: colors.primary, borderColor: colors.primary, marginBottom: spacing.md },
  totalLabel: { ...typography.body, color: colors.primaryLight },
  totalValue: { ...typography.h1, color: colors.white, marginTop: 4 },
  totalHint: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs },
  card: { marginBottom: spacing.sm },
  cardOverdue: { borderColor: colors.danger + '66' },
  amountNote: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flex1: { flex: 1, paddingRight: spacing.sm },
  feeName: { ...typography.bodyBold, color: colors.textPrimary },
  challanNo: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  statusText: { ...typography.small, fontWeight: '700' },
  detailRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.md },
  detail: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  detailText: { marginLeft: spacing.xs + 2, flex: 1 },
  detailLabel: { ...typography.small, color: colors.textMuted },
  detailValue: { ...typography.bodyBold, color: colors.textPrimary, marginTop: 1 },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  alignRight: { alignItems: 'flex-end' },
  amountLabel: { ...typography.small, color: colors.textMuted },
  amount: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
});
