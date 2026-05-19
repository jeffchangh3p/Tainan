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
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
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
