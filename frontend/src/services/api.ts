import axios from 'axios';
import type {
  Transaction,
  Category,
  PaginatedResponse,
  MonthlySummary,
  CategorySummary,
  OverviewSummary,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Transactions
export async function getTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<PaginatedResponse<Transaction>> {
  const { data } = await api.get('/transactions', { params });
  return data;
}

export async function createTransaction(tx: {
  amount: number;
  type: 'income' | 'expense';
  category_id?: number | null;
  person?: string | null;
  description?: string | null;
  date: string;
}): Promise<Transaction> {
  const { data } = await api.post('/transactions', tx);
  return data;
}

export async function updateTransaction(
  id: number,
  tx: Partial<{
    amount: number;
    type: 'income' | 'expense';
    category_id: number | null;
    person: string | null;
    description: string | null;
    date: string;
  }>
): Promise<Transaction> {
  const { data } = await api.put(`/transactions/${id}`, tx);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await api.delete(`/transactions/${id}`);
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get('/categories');
  return data;
}

export async function createCategory(cat: {
  name: string;
  type: 'income' | 'expense';
  icon?: string | null;
}): Promise<Category> {
  const { data } = await api.post('/categories', cat);
  return data;
}

// Summary
export async function getMonthlySummary(months?: number): Promise<MonthlySummary[]> {
  const { data } = await api.get('/summary/monthly', { params: { months } });
  return data;
}

export async function getCategorySummary(params?: {
  type?: string;
  startDate?: string;
  endDate?: string;
}): Promise<CategorySummary[]> {
  const { data } = await api.get('/summary/category', { params });
  return data;
}

export async function getOverview(): Promise<OverviewSummary> {
  const { data } = await api.get('/summary/overview');
  return data;
}

// Export / Import
export async function exportCSV(): Promise<void> {
  const response = await api.get('/transactions/export', { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `tainan_${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importCSV(csvText: string): Promise<{
  message: string;
  imported: number;
  skipped: number;
  errors: string[];
}> {
  const { data } = await api.post('/transactions/import', { csv: csvText });
  return data;
}

// Audit Logs
export interface AuditLog {
  id: number;
  action: string;
  detail: string | null;
  created_at: string;
}

export async function getLogs(limit?: number): Promise<AuditLog[]> {
  const { data } = await api.get('/logs', { params: { limit } });
  return data;
}
