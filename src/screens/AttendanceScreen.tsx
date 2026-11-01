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

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  Present: colors.success,
  Late: colors.warning,
  Leave: colors.secondary,
  Absent: colors.danger,
};

function formatAttendanceDate(value: string): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
}

const rateText = (total: number, rate: number) => (total > 0 ? `${rate}%` : '–');

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
    () => (selectedCourseId ? records.filter((record) => record.courseId === selectedCourseId) : records),
    [records, selectedCourseId]
  );
  const summary = useMemo(() => summarizeAttendance(shownRecords), [shownRecords]);

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
        <View style={styles.titleRow}>
          <Text style={styles.title}>Attendance</Text>
          {student?.section ? (
            <Text style={styles.classLabel} numberOfLines={1}>
              {student.section}
            </Text>
          ) : null}
        </View>

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

            <View style={styles.strip}>
              <StripCell value={summary.total} label="Classes" />
              <StripCell value={summary.present} label="Present" color={colors.success} />
              <StripCell value={summary.late} label="Late" color={colors.warning} />
              <StripCell value={summary.leave} label="Leave" color={colors.secondary} />
              <StripCell value={summary.absent} label="Absent" color={colors.danger} />
              <StripCell value={rateText(summary.total, summary.rate)} label="Rate" color={colors.primary} />
            </View>

            {selectedCourse ? (
              shownRecords.length === 0 ? (
                <EmptyView icon="calendar-outline" message="No attendance records yet for this subject." />
              ) : (
                <View style={styles.table}>
                  <View style={styles.headRow}>
                    <Text style={[styles.headCell, styles.colDate]}>Date</Text>
                    <Text style={[styles.headCell, styles.colStatus]}>Status</Text>
                    <Text style={[styles.headCell, styles.colFill]}>Remarks</Text>
                  </View>
                  {shownRecords.map((record) => (
                    <View key={record.attendanceId} style={styles.dataRow}>
                      <Text style={[styles.cell, styles.colDate]} numberOfLines={1}>
                        {formatAttendanceDate(record.date)}
                      </Text>
                      <View style={[styles.colStatus, styles.statusCell]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[record.status] }]} />
                        <Text style={styles.cell}>{record.status}</Text>
                      </View>
                      <Text style={[styles.cellMuted, styles.colFill]} numberOfLines={2}>
                        {record.remarks || '–'}
                      </Text>
                    </View>
                  ))}
                </View>
              )
            ) : (
              <View style={styles.table}>
                <View style={styles.headRow}>
                  <Text style={[styles.headCell, styles.colFill]}>Subject</Text>
                  <Text style={[styles.headCell, styles.colCount]}>P</Text>
                  <Text style={[styles.headCell, styles.colCount]}>A</Text>
                  <Text style={[styles.headCell, styles.colCount]}>L</Text>
                  <Text style={[styles.headCell, styles.colCount]}>LV</Text>
                  <Text style={[styles.headCell, styles.colRate]}>%</Text>
                </View>
                {courseRows.map(({ course, summary: row }) => (
                  <TouchableOpacity
                    key={course.teacherSectionCourseId}
                    style={styles.tapRow}
                    onPress={() => setSelectedCourseId(course.courseId)}
                    accessibilityRole="button"
                    accessibilityLabel={`${course.courseName}: ${row.present} present, ${row.absent} absent, ${row.late} late, ${row.leave} on leave. Tap for dates.`}
                  >
                    <View style={styles.colFill}>
                      <Text style={styles.cellStrong} numberOfLines={1}>
                        {course.courseName}
                      </Text>
                      {course.courseCode ? (
                        <Text style={styles.cellTiny} numberOfLines={1}>
                          {course.courseCode}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.cellNumber, styles.colCount]}>{row.present}</Text>
                    <Text style={[styles.cellNumber, styles.colCount]}>{row.absent}</Text>
                    <Text style={[styles.cellNumber, styles.colCount]}>{row.late}</Text>
                    <Text style={[styles.cellNumber, styles.colCount]}>{row.leave}</Text>
                    <Text style={[styles.cellRate, styles.colRate]}>{rateText(row.total, row.rate)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.hint}>
              {selectedCourse ? 'Late arrivals count as attended.' : 'P present, A absent, L late, LV leave. Late counts as attended.'}
            </Text>
          </>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(false)} accessibilityLabel="Close subject list">
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select subject</Text>
            <FlatList
              data={[null, ...courseRows]}
              keyExtractor={(item) => item?.course.teacherSectionCourseId ?? 'all'}
              renderItem={({ item }) => {
                const courseId = item?.course.courseId ?? null;
                const active = courseId === selectedCourseId;
                return (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => pickCourse(courseId)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={styles.colFill}>
                      <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={1}>
                        {item?.course.courseName ?? 'All subjects'}
                      </Text>
                      {item?.course.teacherName ? (
                        <Text style={styles.cellTiny} numberOfLines={1}>
                          {item.course.teacherName}
                        </Text>
                      ) : null}
                    </View>
                    {item ? <Text style={styles.optionRate}>{rateText(item.summary.total, item.summary.rate)}</Text> : null}
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} style={styles.optionCheck} /> : null}
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

function StripCell({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <View style={styles.stripCell}>
      <Text style={[styles.stripValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.stripLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.sm + 4, paddingBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  classLabel: { flex: 1, fontSize: 12, color: colors.textSecondary, marginLeft: spacing.sm, textAlign: 'right' },
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
  strip: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  stripCell: { flex: 1, alignItems: 'center' },
  stripValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  stripLabel: { fontSize: 10, color: colors.textMuted },
  table: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.primaryLight },
  headCell: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  colFill: { flex: 1, minWidth: 0 },
  colDate: { width: 104 },
  colStatus: { width: 76 },
  colCount: { width: 26, textAlign: 'center' },
  colRate: { width: 42, textAlign: 'right' },
  statusCell: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  cell: { fontSize: 12, color: colors.textPrimary },
  cellStrong: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  cellMuted: { fontSize: 12, color: colors.textSecondary },
  cellTiny: { fontSize: 11, color: colors.textMuted },
  cellNumber: { fontSize: 13, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  cellRate: { fontSize: 13, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { maxHeight: '75%', backgroundColor: colors.surface, borderRadius: radius.sm, overflow: 'hidden' },
  sheetTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, paddingHorizontal: spacing.sm + 4, paddingVertical: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  optionText: { fontSize: 14, color: colors.textPrimary },
  optionTextActive: { fontWeight: '700', color: colors.primary },
  optionRate: { fontSize: 13, color: colors.textSecondary, marginLeft: spacing.sm },
  optionCheck: { marginLeft: spacing.sm },
});
