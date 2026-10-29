import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

type CourseOption = { id: string; name: string; code?: string | null; count: number };

export default function MarksScreen() {
  const { student } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!student?.studentId) return;
    setError(null);
    try {
      setResults(await getExamResults(student.studentId));
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

  // One chip per course that has exams
  const courses = useMemo<CourseOption[]>(() => {
    const byId = new Map<string, CourseOption>();
    results.forEach((r) => {
      const id = r.exam.courseId;
      const existing = byId.get(id);
      if (existing) existing.count += 1;
      else byId.set(id, { id, name: r.exam.courseName || 'Course', code: r.exam.courseCode, count: 1 });
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [results]);

  const visible = selectedCourse === 'all' ? results : results.filter((r) => r.exam.courseId === selectedCourse);

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

        {courses.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Chip label="All courses" count={results.length} active={selectedCourse === 'all'} onPress={() => setSelectedCourse('all')} />
            {courses.map((course) => (
              <Chip
                key={course.id}
                label={course.code ? `${course.name} · ${course.code}` : course.name}
                count={course.count}
                active={selectedCourse === course.id}
                onPress={() => setSelectedCourse(course.id)}
              />
            ))}
          </ScrollView>
        )}

        {visible.length === 0 ? (
          <EmptyView icon="document-text-outline" message="No exams for this course yet." />
        ) : (
          visible.map((r) => <ResultCard key={r.examResultId} result={r} showCourse={selectedCourse === 'all'} />)
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function Chip({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.chipCount, active && styles.chipCountActive]}>
        <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ResultCard({ result, showCourse }: { result: ExamResult; showCourse: boolean }) {
  const { exam } = result;
  const total = exam.totalMarks ?? 0;
  const published = result.isPublished && result.obtainMarks !== null;
  const pct = published && total > 0 ? Math.round(((result.obtainMarks ?? 0) / total) * 100) : 0;
  const color = scoreColor(pct);

  return (
    <Card style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.flex1}>
          {showCourse ? <Text style={styles.course}>{exam.courseName}{exam.courseCode ? ` · ${exam.courseCode}` : ''}</Text> : null}
          <Text style={styles.examTitle} numberOfLines={2}>
            {exam.title}
          </Text>
          <Text style={styles.examMeta}>
            {exam.examType ? `${exam.examType} · ` : ''}
            {exam.examDate ? new Date(exam.examDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </Text>
        </View>

        {!result.isPublished ? (
          <View style={styles.pendingBadge}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : result.isAbsent ? (
          <View style={[styles.scoreBadge, { backgroundColor: colors.danger + '20' }]}>
            <Text style={[styles.scoreText, { color: colors.danger }]}>Absent</Text>
          </View>
        ) : (
          <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.scoreText, { color }]}>{`${result.obtainMarks}/${total}`}</Text>
            <Text style={[styles.scorePct, { color }]}>{pct}%</Text>
          </View>
        )}
      </View>

      {!result.isPublished ? (
        <Text style={styles.unpublished}>Result not published yet. Your marks will appear here once your teacher publishes them.</Text>
      ) : result.remarks ? (
        <Text style={styles.remarks}>{result.remarks}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  chipRow: { paddingBottom: spacing.md, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs + 2,
    maxWidth: 240,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, fontWeight: '600', color: colors.textPrimary, flexShrink: 1 },
  chipTextActive: { color: colors.white },
  chipCount: { marginLeft: spacing.sm, backgroundColor: colors.primaryLight, borderRadius: radius.full, minWidth: 22, paddingHorizontal: 6, paddingVertical: 1, alignItems: 'center' },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipCountText: { ...typography.small, fontWeight: '700', color: colors.primary },
  chipCountTextActive: { color: colors.white },
  card: { marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flex1: { flex: 1, paddingRight: spacing.sm },
  course: { ...typography.small, color: colors.primary, fontWeight: '700', marginBottom: 2 },
  examTitle: { ...typography.bodyBold, color: colors.textPrimary },
  examMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  scoreBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, alignItems: 'center' },
  scoreText: { ...typography.bodyBold },
  scorePct: { ...typography.small, fontWeight: '700' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.background },
  pendingText: { ...typography.small, color: colors.textMuted, fontWeight: '700' },
  unpublished: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  remarks: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
});
