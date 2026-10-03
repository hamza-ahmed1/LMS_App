import { apiClient } from '@/api/client';
import { Invoice } from '@/types';

/** GET /api/invoice/pending/{studentId} */
export async function getPendingInvoices(studentId: string): Promise<Invoice[]> {
  const { data } = await apiClient.get<Invoice[]>(`/api/invoice/pending/${studentId}`);
  return data;
}
