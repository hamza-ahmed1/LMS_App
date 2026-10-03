import { apiClient } from '@/api/client';
import { AttendanceRecord, StudentCourse } from '@/types';

/** GET /api/attendance/student/{studentId}/courses */
export async function getStudentCourses(studentId: string): Promise<StudentCourse[]> {
  const { data } = await apiClient.get<StudentCourse[]>(`/api/attendance/student/${studentId}/courses`);
  return data;
}

/** GET /api/Attendance/student/{studentId}?courseId={courseId} */
export async function getCourseAttendance(studentId: string, courseId: string): Promise<AttendanceRecord[]> {
  const { data } = await apiClient.get<AttendanceRecord[]>(`/api/Attendance/student/${studentId}`, {
    params: { courseId },
  });
  return data;
}
