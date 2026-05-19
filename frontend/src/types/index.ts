export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  created_at: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category_id: number | null;
  category_name?: string;
  category_icon?: string;
  person: string | null;
  description: string | null;
  receipt_image: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MonthlySummary {
  month: string;
  total_income: number;
  total_expense: number;
  net: number;
}

export interface CategorySummary {
  category_id: number;
  category_name: string;
  category_icon: string | null;
  type: string;
  total: number;
  count: number;
}

export interface OverviewSummary {
  currentMonth: {
    income: number;
    expense: number;
    balance: number;
  };
  allTime: {
    income: number;
    expense: number;
    balance: number;
    transactions: number;
  };
}

export interface TransactionFormData {
  amount: string;
  type: 'income' | 'expense';
  category_id: number | null;
  person: string;
  description: string;
  date: string;
}

export const FAMILY_MEMBERS = [
  '張金蓓',
  '張金蕾',
  '張金莉',
  '張潤檯',
];
