import { apiClient } from '@/api/client';
import { FeeChallan } from '@/types';

/**
 * GET /api/invoice/history/{studentId}
 * The student's fee challans (invoices), newest due date first. Each carries the fee month/year
 * and due date from the challan record itself.
 */
export async function getFeeChallans(studentId: string): Promise<FeeChallan[]> {
  const { data } = await apiClient.get<FeeChallan[]>(`/api/invoice/history/${studentId}`);
  return data;
}
