import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
import Card from '@/components/Card';
import { LoadingView, ErrorView, EmptyView } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { getExamResults } from '@/api/marks';
import { getApiErrorMessage } from '@/api/client';
import { ExamResult } from '@/types';
import { colors, radius, spacing, typography } from '@/theme/theme';

function scoreColor(pct: number) {
  if (pct >= 80) return colors.success;
  if (pct >= 50) return colors.warning;
  return colors.danger;
}

export default function MarksScreen() {
  const { student } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!student?.studentId) return;
    setError(null);
    try {
      const data = await getExamResults(student.studentId);
      setResults(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your exam results.'));
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

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingView label="Loading your marks..." />
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
        <Text style={styles.title}>Marks</Text>

        {results.length === 0 ? (
          <EmptyView icon="document-text-outline" message="No exam results published yet." />
        ) : (
          results.map((r) => {
            const total = r.exam?.totalMarks ?? 0;
            const pct = total > 0 ? Math.round((r.obtainMarks / total) * 100) : 0;
            const color = scoreColor(pct);
            return (
              <Card key={r.examResultId} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex1}>
                    <Text style={styles.examTitle} numberOfLines={2}>
                      {r.exam?.title ?? 'Exam'}
                    </Text>
                    {r.exam?.examDate && (
                      <Text style={styles.examDate}>{new Date(r.exam.examDate).toLocaleDateString()}</Text>
                    )}
                    {!r.exam?.isPublished && <Text style={styles.unpublished}>Not yet published</Text>}
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.scoreText, { color }]}>
                      {r.isAbsent ? 'Absent' : `${r.obtainMarks}/${total}`}
                    </Text>
                  </View>
                </View>
                {r.remarks ? <Text style={styles.remarks}>{r.remarks}</Text> : null}
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
  card: { marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flex1: { flex: 1, paddingRight: spacing.sm },
  examTitle: { ...typography.bodyBold, color: colors.textPrimary },
  examDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  unpublished: { ...typography.small, color: colors.warning, marginTop: 4 },
  scoreBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  scoreText: { ...typography.bodyBold },
  remarks: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
});
