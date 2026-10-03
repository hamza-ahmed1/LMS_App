import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '@/components/ScreenContainer';
import Card from '@/components/Card';
import SectionTitle from '@/components/SectionTitle';
import { LoadingView, ErrorView, EmptyView } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { getStudentCourses, getCourseAttendance } from '@/api/attendance';
import { getApiErrorMessage } from '@/api/client';
import { AttendanceRecord, StudentCourse } from '@/types';
import { colors, radius, spacing, typography } from '@/theme/theme';

function statusColor(status: string) {
  const s = status?.toLowerCase?.() ?? '';
  if (s.includes('present')) return colors.success;
  if (s.includes('absent')) return colors.danger;
  if (s.includes('leave')) return colors.warning;
  return colors.textMuted;
}

export default function AttendanceScreen() {
  const { student } = useAuth();

  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourses = useCallback(async () => {
    if (!student?.studentId) return;
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const data = await getStudentCourses(student.studentId);
      setCourses(data);
      if (data.length > 0) setSelectedCourseId((prev) => prev ?? data[0].courseId);
    } catch (err) {
      setCoursesError(getApiErrorMessage(err, 'Could not load your courses.'));
    } finally {
      setCoursesLoading(false);
    }
  }, [student?.studentId]);

  const loadRecords = useCallback(
    async (courseId: string) => {
      if (!student?.studentId) return;
      setRecordsLoading(true);
      setRecordsError(null);
      try {
        const data = await getCourseAttendance(student.studentId, courseId);
        setRecords(data);
      } catch (err) {
        setRecordsError(getApiErrorMessage(err, 'Could not load attendance for this course.'));
      } finally {
        setRecordsLoading(false);
      }
    },
    [student?.studentId]
  );

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourseId) loadRecords(selectedCourseId);
  }, [selectedCourseId, loadRecords]);

  const summary = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status?.toLowerCase?.().includes('present')).length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, pct };
  }, [records]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCourses();
    if (selectedCourseId) await loadRecords(selectedCourseId);
    setRefreshing(false);
  }, [loadCourses, loadRecords, selectedCourseId]);

  if (coursesLoading) {
    return (
      <ScreenContainer>
        <LoadingView label="Loading your courses..." />
      </ScreenContainer>
    );
  }

  if (coursesError) {
    return (
      <ScreenContainer>
        <ErrorView message={coursesError} onRetry={loadCourses} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Attendance</Text>
        {(student?.majorSubject || student?.section) && (
          <Text style={styles.classLabel}>
            Class: {student?.majorSubject ?? student?.section ?? 'N/A'}
          </Text>
        )}

        <SectionTitle title="Registered Courses" />
        {courses.length === 0 ? (
          <EmptyView icon="book-outline" message="No registered courses found." />
        ) : (
          <FlatList
            data={courses}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.teacherSectionCourseId}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item }) => {
              const active = item.courseId === selectedCourseId;
              return (
                <TouchableOpacity
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedCourseId(item.courseId)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.courseName}</Text>
                  <Text style={[styles.chipSubtext, active && styles.chipTextActive]}>{item.sectionName}</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {selectedCourseId && (
          <>
            <SectionTitle title="Attendance Summary" />
            <Card style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.total}</Text>
                <Text style={styles.summaryLabel}>Classes</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.present}</Text>
                <Text style={styles.summaryLabel}>Present</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.pct}%</Text>
                <Text style={styles.summaryLabel}>Rate</Text>
              </View>
            </Card>

            <SectionTitle title="Records" />
            {recordsLoading ? (
              <LoadingView label="Loading records..." />
            ) : recordsError ? (
              <ErrorView message={recordsError} onRetry={() => loadRecords(selectedCourseId)} />
            ) : records.length === 0 ? (
              <EmptyView icon="calendar-outline" message="No attendance records yet for this course." />
            ) : (
              records.map((rec, idx) => (
                <Card key={rec.attendanceId ?? idx} style={styles.recordCard}>
                  <View style={styles.recordRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.recordDate}>
                      {rec.date ? new Date(rec.date).toLocaleDateString() : 'Unknown date'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor(rec.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor(rec.status) }]}>{rec.status ?? 'N/A'}</Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary },
  classLabel: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  chipRow: { paddingVertical: spacing.xs, gap: spacing.sm },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    minWidth: 130,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodyBold, color: colors.textPrimary },
  chipSubtext: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  chipTextActive: { color: colors.white },
  summaryCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { ...typography.h2, color: colors.textPrimary },
  summaryLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: colors.border },
  recordCard: { marginBottom: spacing.sm, paddingVertical: spacing.sm },
  recordRow: { flexDirection: 'row', alignItems: 'center' },
  recordDate: { ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  statusText: { ...typography.small, fontWeight: '700' },
});
