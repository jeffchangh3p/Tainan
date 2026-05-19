import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOverview, getMonthlySummary, getCategorySummary, getTransactions } from '../services/api';
import { MonthlyChart, CategoryChart } from '../components/SummaryChart';
import TransactionCard from '../components/TransactionCard';
import type { OverviewSummary, MonthlySummary, CategorySummary, Transaction } from '../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Dashboard() {
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ov, mon, cat, recent] = await Promise.all([
          getOverview(),
          getMonthlySummary(6),
          getCategorySummary({ type: 'expense' }),
          getTransactions({ limit: 5 }),
        ]);
        setOverview(ov);
        setMonthly(mon);
        setCategoryData(cat);
        setRecentTransactions(recent.data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">父親的財務總覽 — Father's financial overview</p>
        </div>
        <Link to="/add" className="btn btn-primary btn-lg">
          ➕ New Record
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid stagger-children">
        <div className="card stat-card income">
          <div className="stat-label">本月收入 This Month Income</div>
          <div className="stat-value income">
            {formatCurrency(overview?.currentMonth.income || 0)}
          </div>
          <div className="stat-sub">
            All time: {formatCurrency(overview?.allTime.income || 0)}
          </div>
        </div>

        <div className="card stat-card expense">
          <div className="stat-label">本月支出 This Month Expense</div>
          <div className="stat-value expense">
            {formatCurrency(overview?.currentMonth.expense || 0)}
          </div>
          <div className="stat-sub">
            All time: {formatCurrency(overview?.allTime.expense || 0)}
          </div>
        </div>

        <div className="card stat-card balance">
          <div className="stat-label">本月結餘 This Month Balance</div>
          <div className={`stat-value ${(overview?.currentMonth.balance || 0) >= 0 ? 'balance' : 'negative'}`}>
            {formatCurrency(overview?.currentMonth.balance || 0)}
          </div>
          <div className="stat-sub">
            {overview?.allTime.transactions || 0} total records
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📊 Monthly Income vs Expense</h2>
          </div>
          <div className="chart-container">
            {monthly.length > 0 ? (
              <MonthlyChart data={monthly} />
            ) : (
              <div className="empty-state">
                <p>Add transactions to see charts</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🍩 Expense by Category</h2>
          </div>
          <div className="chart-container">
            <CategoryChart data={categoryData} />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🕐 Recent Transactions</h2>
          <Link to="/history" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            View All →
          </Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="transaction-list">
            {recentTransactions.map(tx => (
              <TransactionCard key={tx.id} transaction={tx} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No records yet</h3>
            <p>Start by adding your first financial record</p>
          </div>
        )}
      </div>
    </div>
  );
}
