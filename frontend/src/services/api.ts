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
