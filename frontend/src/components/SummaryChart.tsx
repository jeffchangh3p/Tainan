import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { MonthlySummary, CategorySummary } from '../types';

const COLORS = [
  '#f5b942', '#e8952e', '#34d399', '#60a5fa', '#a78bfa',
  '#f87171', '#fb923c', '#fbbf24', '#4ade80', '#818cf8',
];

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `$${(amount / 10000).toFixed(1)}萬`;
  return `$${amount.toLocaleString()}`;
}

interface MonthlyChartProps {
  data: MonthlySummary[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map(d => ({
    month: d.month.substring(5), // "01", "02", etc.
    收入: d.total_income,
    支出: d.total_expense,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" stroke="#5e5e73" fontSize={12} />
        <YAxis stroke="#5e5e73" fontSize={12} tickFormatter={formatCurrency} />
        <Tooltip
          contentStyle={{
            background: '#1a1a24',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
        />
        <Bar dataKey="收入" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="支出" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CategoryChartProps {
  data: CategorySummary[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.map(d => ({
    name: d.category_name || 'Other',
    value: d.total,
  }));

  if (chartData.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px 20px' }}>
        <p>No data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#1a1a24',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
        />
        <Legend
          wrapperStyle={{ fontSize: '0.8rem', color: '#9a9aaf' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
