import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '@/components/ScreenContainer';
import { LoadingView, ErrorView, EmptyView } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { getStudentCourses, getAllAttendance, summarizeAttendance } from '@/api/attendance';
import { getApiErrorMessage } from '@/api/client';
import { AttendanceRecord, AttendanceStatus, StudentCourse } from '@/types';
import { colors, radius, spacing } from '@/theme/theme';

const STATUS_LETTER: Record<AttendanceStatus, string> = { Present: 'P', Absent: 'A', Late: 'L', Leave: 'LV' };

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  Present: colors.success,
  Late: colors.warning,
  Leave: colors.secondary,
  Absent: colors.danger,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2-Oct-2026" */
function formatAttendanceDate(value: string): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'Not recorded';
  return `${date.getDate()}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

/** Bar colour by how good the attendance is */
const rateColor = (rate: number) => (rate >= 75 ? colors.success : rate >= 50 ? colors.warning : colors.danger);

export default function AttendanceScreen() {
  const { student } = useAuth();

  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // null = all subjects
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!student?.studentId) return;
    setError(null);
    try {
      const [courseData, recordData] = await Promise.all([getStudentCourses(student.studentId), getAllAttendance(student.studentId)]);
      setCourses(courseData);
      setRecords(recordData);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your attendance.'));
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

  const courseRows = useMemo(
    () =>
      courses.map((course) => ({
        course,
        summary: summarizeAttendance(records.filter((record) => record.courseId === course.courseId)),
      })),
    [courses, records]
  );

  const selectedCourse = courses.find((course) => course.courseId === selectedCourseId);
  const shownRecords = useMemo(
    () => (selectedCourseId ? records.filter((record) => record.courseId === selectedCourseId) : []),
    [records, selectedCourseId]
  );
  const summary = useMemo(() => summarizeAttendance(shownRecords), [shownRecords]);
  const overall = useMemo(() => summarizeAttendance(records), [records]);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingView label="Loading attendance..." />
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

  const pickCourse = (courseId: string | null) => {
    setSelectedCourseId(courseId);
    setPickerOpen(false);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Attendance</Text>

        {courses.length === 0 ? (
          <EmptyView icon="book-outline" message="No registered courses found." />
        ) : (
          <>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Subject: ${selectedCourse?.courseName ?? 'All subjects'}. Tap to change.`}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {selectedCourse?.courseName ?? 'All subjects'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {selectedCourse ? (
              <>
                <Text style={styles.summaryLine}>
                  {summary.total} classes · {summary.total > 0 ? `${summary.rate}% attended` : 'no attendance yet'}
                </Text>
                {shownRecords.length === 0 ? (
                  <EmptyView icon="calendar-outline" message="No attendance records yet for this subject." />
                ) : (
                  <View style={styles.table}>
                    <View style={[styles.row, styles.headRow]}>
                      <Text style={[styles.cell, styles.dateCell, styles.headText]}>Date</Text>
                      <Text style={[styles.cell, styles.statusCell, styles.headText]}>Status</Text>
                    </View>
                    {shownRecords.map((record) => (
                      <View key={record.attendanceId} style={styles.row}>
                        <Text style={[styles.cell, styles.dateCell]}>{formatAttendanceDate(record.date)}</Text>
                        <Text
                          style={[styles.cell, styles.statusCell, styles.statusText, { color: STATUS_COLOR[record.status] }]}
                          accessibilityLabel={record.status}
                        >
                          {STATUS_LETTER[record.status]}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.hint}>P present · A absent · L late · LV leave. Late counts as attended.</Text>
              </>
            ) : (
              <View style={styles.graph}>
                <Text style={styles.graphTitle}>
                  Attendance by subject{overall.total > 0 ? ` · overall ${overall.rate}%` : ''}
                </Text>
                {courseRows.map(({ course, summary: row }) => (
                  <TouchableOpacity
                    key={course.teacherSectionCourseId}
                    style={styles.barRow}
                    onPress={() => setSelectedCourseId(course.courseId)}
                    accessibilityRole="button"
                    accessibilityLabel={`${course.courseName}: ${row.total > 0 ? `${row.rate} percent` : 'no attendance yet'}. Tap for dates.`}
                  >
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {course.courseName}
                    </Text>
                    <View style={styles.barTrack}>
                      {row.total > 0 ? <View style={[styles.barFill, { width: `${Math.max(row.rate, 2)}%`, backgroundColor: rateColor(row.rate) }]} /> : null}
                    </View>
                    <Text style={styles.barValue}>{row.total > 0 ? `${row.rate}%` : '–'}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.hint}>Tap a subject to see its dates.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(false)} accessibilityLabel="Close subject list">
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select subject</Text>
            <FlatList
              data={[null, ...courses]}
              keyExtractor={(item) => item?.teacherSectionCourseId ?? 'all'}
              renderItem={({ item }) => {
                const courseId = item?.courseId ?? null;
                const active = courseId === selectedCourseId;
                return (
                  <TouchableOpacity style={styles.option} onPress={() => pickCourse(courseId)} accessibilityRole="button" accessibilityState={{ selected: active }}>
                    <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={1}>
                      {item?.courseName ?? 'All subjects'}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.sm + 4, paddingBottom: spacing.lg },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  dropdownText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginRight: spacing.sm },
  summaryLine: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm },

  // Simple bordered two-column table
  table: { marginTop: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border },
  headRow: { borderTopWidth: 0, backgroundColor: colors.primaryLight },
  cell: { paddingVertical: 7, paddingHorizontal: spacing.sm, fontSize: 13, color: colors.textPrimary },
  dateCell: { flex: 1, borderRightWidth: 1, borderRightColor: colors.border },
  statusCell: { width: 72, textAlign: 'center' },
  headText: { fontWeight: '700', color: colors.textSecondary },
  statusText: { fontWeight: '700' },

  graph: { marginTop: spacing.sm, padding: spacing.sm + 4, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm },
  graphTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  barLabel: { width: 104, fontSize: 12, color: colors.textPrimary, marginRight: spacing.sm },
  barTrack: { flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.background, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  barValue: { width: 42, textAlign: 'right', fontSize: 12, fontWeight: '700', color: colors.textPrimary },

  hint: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { maxHeight: '75%', backgroundColor: colors.surface, borderRadius: radius.sm, overflow: 'hidden' },
  sheetTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, paddingHorizontal: spacing.sm + 4, paddingVertical: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: spacing.sm + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  optionText: { flex: 1, fontSize: 14, color: colors.textPrimary },
  optionTextActive: { fontWeight: '700', color: colors.primary },
});
