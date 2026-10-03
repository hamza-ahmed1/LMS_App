import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
import Card from '@/components/Card';
import { LoadingView, ErrorView, EmptyView } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { getPendingInvoices } from '@/api/fees';
import { getApiErrorMessage } from '@/api/client';
import { Invoice } from '@/types';
import { colors, radius, spacing, typography } from '@/theme/theme';

function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export default function FeeChalanScreen() {
  const { student } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!student?.studentId) return;
    setError(null);
    try {
      const data = await getPendingInvoices(student.studentId);
      setInvoices(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your fee chalans.'));
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

  const totalDue = useMemo(
    () => invoices.filter((i) => i.status === 0).reduce((sum, i) => sum + (i.feeType?.amount ?? 0), 0),
    [invoices]
  );
  const currency = invoices[0]?.feeType?.currency ?? 'PKR';

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingView label="Loading your fee chalans..." />
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
        <Text style={styles.title}>Fee Chalan</Text>

        {invoices.length > 0 && (
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Pending</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalDue, currency)}</Text>
          </Card>
        )}

        {invoices.length === 0 ? (
          <EmptyView icon="receipt-outline" message="No pending fee chalans. You're all caught up!" />
        ) : (
          invoices.map((inv) => {
            const paid = inv.status === 1;
            return (
              <Card key={inv.afId} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex1}>
                    <Text style={styles.feeName}>{inv.feeType?.name ?? 'Fee'}</Text>
                    <Text style={styles.feeMeta}>
                      {inv.feeType?.per ? `Per ${inv.feeType.per} • ` : ''}
                      {inv.feeType?.academicTerm ?? ''}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, paid ? styles.paidBadge : styles.unpaidBadge]}>
                    <Text style={[styles.statusText, paid ? styles.paidText : styles.unpaidText]}>
                      {paid ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amount}>
                    {formatCurrency(inv.feeType?.amount ?? 0, inv.feeType?.currency ?? 'PKR')}
                  </Text>
                  <Text style={styles.createdAt}>
                    Issued {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                  </Text>
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

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  totalCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  totalLabel: { ...typography.body, color: colors.primaryLight },
  totalValue: { ...typography.h1, color: colors.white, marginTop: 4 },
  card: { marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flex1: { flex: 1, paddingRight: spacing.sm },
  feeName: { ...typography.bodyBold, color: colors.textPrimary },
  feeMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  paidBadge: { backgroundColor: colors.success + '20' },
  unpaidBadge: { backgroundColor: colors.danger + '20' },
  statusText: { ...typography.small, fontWeight: '700' },
  paidText: { color: colors.success },
  unpaidText: { color: colors.danger },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  amount: { ...typography.h3, color: colors.textPrimary },
  createdAt: { ...typography.small, color: colors.textMuted },
});
