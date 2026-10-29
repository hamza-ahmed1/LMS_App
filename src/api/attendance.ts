import { apiClient } from '@/api/client';
import { AttendanceRecord, AttendanceStatus, StudentCourse } from '@/types';

/** GET /api/attendance/student/{studentId}/courses */
export async function getStudentCourses(studentId: string): Promise<StudentCourse[]> {
  const { data } = await apiClient.get<StudentCourse[]>(`/api/attendance/student/${studentId}/courses`);
  return data;
}

// Backend enum order (AttendanceStatus): Present = 0, Absent = 1, Late = 2, Leave = 3
const STATUS_BY_NUMBER: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Leave'];

type RawAttendance = {
  attendanceId?: string;
  attendanceDate?: string;
  status?: number | string;
  remarks?: string | null;
  courseId?: string;
  courseName?: string | null;
};

/** The API sends the date as attendanceDate and the status as a number; map both to what the screen shows. */
function normalizeRecord(raw: RawAttendance): AttendanceRecord {
  const status =
    typeof raw.status === 'number'
      ? STATUS_BY_NUMBER[raw.status] ?? 'Present'
      : ((STATUS_BY_NUMBER.find((s) => s.toLowerCase() === String(raw.status ?? '').toLowerCase()) ?? 'Present') as AttendanceStatus);
  return {
    attendanceId: raw.attendanceId ?? '',
    date: raw.attendanceDate ?? '',
    status,
    remarks: raw.remarks ?? null,
    courseId: raw.courseId ?? '',
    courseName: raw.courseName ?? null,
  };
}

/** GET /api/Attendance/student/{studentId}?courseId={courseId} — newest first */
export async function getCourseAttendance(studentId: string, courseId: string): Promise<AttendanceRecord[]> {
  const { data } = await apiClient.get<RawAttendance[]>(`/api/Attendance/student/${studentId}`, {
    params: { courseId },
  });
  return data.map(normalizeRecord);
}

/** Same rule as the backend summary: late still counts as attended. */
export function summarizeAttendance(records: AttendanceRecord[]) {
  const count = (status: AttendanceStatus) => records.filter((r) => r.status === status).length;
  const total = records.length;
  const present = count('Present');
  const late = count('Late');
  return {
    total,
    present,
    absent: count('Absent'),
    late,
    leave: count('Leave'),
    rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
  };
}
