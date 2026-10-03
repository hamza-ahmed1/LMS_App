import { apiClient } from '@/api/client';
import { StudentProfile } from '@/types';

/**
 * GET /api/student/{userId}
 * The doc's sample calls this with the *user* id (the id returned
 * from login), not the studentId — the response then gives us the
 * studentId used by every other screen.
 */
export async function getStudentProfile(userId: string): Promise<StudentProfile> {
  const { data } = await apiClient.get<StudentProfile>(`/api/student/${userId}`);
  return data;
}
