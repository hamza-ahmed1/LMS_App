import { apiClient } from '@/api/client';
import { ExamResult } from '@/types';

/**
 * GET /api/Examresult/student={studentId}
 * NOTE: per the requirements doc this endpoint literally embeds
 * "student=" followed by the id in the path segment (not a normal
 * "/student/{id}" route or a "?student=" query string) — reproduced
 * here exactly as specified.
 */
export async function getExamResults(studentId: string): Promise<ExamResult[]> {
  const { data } = await apiClient.get<ExamResult[]>(`/api/Examresult/student=${studentId}`);
  return data;
}
