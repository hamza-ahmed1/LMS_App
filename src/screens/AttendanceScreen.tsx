import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '@/components/ScreenContainer';
import Card from '@/components/Card';
import SectionTitle from '@/components/SectionTitle';
import { LoadingView, ErrorView, EmptyView } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { getStudentCourses, getCourseAttendance, summarizeAttendance } from '@/api/attendance';
import { getApiErrorMessage } from '@/api/client';
import { AttendanceRecord, AttendanceStatus, StudentCourse } from '@/types';
import { colors, radius, spacing, typography } from '@/theme/theme';

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  Present: colors.success,
  Late: colors.warning,
  Leave: colors.secondary,
  Absent: colors.danger,
};

function formatAttendanceDate(value: string): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'Date not recorded';
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AttendanceScreen() {
  const { student } = useAuth();
  const { width } = useWindowDimensions();
  // Two course cards per row on phones, three on wider screens
  const columns = width >= 600 ? 3 : 2;

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
        setRecords(await getCourseAttendance(student.studentId, courseId));
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

  const summary = useMemo(() => summarizeAttendance(records), [records]);
  const selectedCourse = courses.find((c) => c.courseId === selectedCourseId);

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

  const cardWidth = `${100 / columns}%` as const;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Attendance</Text>
        {student?.section ? <Text style={styles.classLabel}>{student.section}</Text> : null}

        <SectionTitle title="Registered Courses" subtitle={`${courses.length} courses · tap one to see its attendance`} />
        {courses.length === 0 ? (
          <EmptyView icon="book-outline" message="No registered courses found." />
        ) : (
          <View style={styles.grid}>
            {courses.map((item) => {
              const active = item.courseId === selectedCourseId;
              return (
                <View key={item.teacherSectionCourseId} style={[styles.gridCell, { width: cardWidth }]}>
                  <TouchableOpacity
                    style={[styles.courseCard, active && styles.courseCardActive]}
                    onPress={() => setSelectedCourseId(item.courseId)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.courseName, active && styles.textOnPrimary]} numberOfLines={2}>
                      {item.courseName}
                    </Text>
                    <Text style={[styles.courseCode, active && styles.textOnPrimaryMuted]} numberOfLines={1}>
                      {item.courseCode || 'No code'}
                    </Text>
                    {item.teacherName ? (
                      <Text style={[styles.courseTeacher, active && styles.textOnPrimaryMuted]} numberOfLines={1}>
                        {item.teacherName}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {selectedCourseId && (
          <>
            <SectionTitle title="Attendance Summary" subtitle={selectedCourse ? selectedCourse.courseName : undefined} />
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <SummaryItem value={summary.total} label="Classes" />
                <SummaryItem value={summary.present} label="Present" color={colors.success} />
                <SummaryItem value={summary.late} label="Late" color={colors.warning} />
                <SummaryItem value={summary.absent} label="Absent" color={colors.danger} />
              </View>
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>Attendance rate</Text>
                <Text style={styles.rateValue}>{summary.rate}%</Text>
              </View>
              <View style={styles.rateTrack}>
                <View style={[styles.rateFill, { width: `${summary.rate}%` }]} />
              </View>
              <Text style={styles.rateHint}>Late arrivals count as attended.</Text>
            </Card>

            <SectionTitle title="Records" />
            {recordsLoading ? (
              <LoadingView label="Loading records..." />
            ) : recordsError ? (
              <ErrorView message={recordsError} onRetry={() => loadRecords(selectedCourseId)} />
            ) : records.length === 0 ? (
              <EmptyView icon="calendar-outline" message="No attendance records yet for this course." />
            ) : (
              records.map((rec) => (
                <Card key={rec.attendanceId} style={styles.recordCard}>
                  <View style={styles.recordRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                    <View style={styles.recordText}>
                      <Text style={styles.recordDate}>{formatAttendanceDate(rec.date)}</Text>
                      {rec.remarks ? <Text style={styles.recordRemarks}>{rec.remarks}</Text> : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[rec.status] + '20' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLOR[rec.status] }]}>{rec.status}</Text>
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

function SummaryItem({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary },
  classLabel: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  gridCell: { padding: spacing.xs },
  courseCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    minHeight: 84,
  },
  courseCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  courseName: { ...typography.bodyBold, color: colors.textPrimary },
  courseCode: { ...typography.small, color: colors.primary, fontWeight: '700', marginTop: 4 },
  courseTeacher: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  textOnPrimary: { color: colors.white },
  textOnPrimaryMuted: { color: 'rgba(255,255,255,0.85)' },
  summaryCard: { paddingVertical: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { ...typography.h2, color: colors.textPrimary },
  summaryLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.md },
  rateLabel: { ...typography.bodyBold, color: colors.textSecondary },
  rateValue: { ...typography.h3, color: colors.primary },
  rateTrack: { height: 8, borderRadius: radius.full, backgroundColor: colors.primaryLight, marginTop: spacing.sm, overflow: 'hidden' },
  rateFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  rateHint: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
  recordCard: { marginBottom: spacing.sm, paddingVertical: spacing.sm },
  recordRow: { flexDirection: 'row', alignItems: 'center' },
  recordText: { flex: 1, marginLeft: spacing.sm },
  recordDate: { ...typography.body, color: colors.textPrimary },
  recordRemarks: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  statusText: { ...typography.small, fontWeight: '700' },
});
