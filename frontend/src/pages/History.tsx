import { useState, useEffect, useCallback, useRef } from 'react';
import { getTransactions, getCategories, deleteTransaction, updateTransaction, exportCSV, importCSV, getLogs } from '../services/api';
import type { AuditLog } from '../services/api';
import TransactionCard from '../components/TransactionCard';
import EditModal from '../components/EditModal';
import type { Transaction, Category, PaginatedResponse } from '../types';

export default function History() {
  const [result, setResult] = useState<PaginatedResponse<Transaction> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: filters.page, limit: 15 };
      if (filters.type) params.type = filters.type;
      if (filters.categoryId) params.categoryId = Number(filters.categoryId);
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const data = await getTransactions(params);
      setResult(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDelete(id: number) {
    if (!window.confirm('確定刪除此紀錄？ Are you sure you want to delete this record?')) return;
    try {
      await deleteTransaction(id);
      showToast('🗑️ Record deleted 紀錄已刪除', 'success');
      fetchData();
    } catch (err) {
      console.error('Error deleting:', err);
      showToast('❌ Failed to delete', 'error');
    }
  }

  async function handleSaveEdit(id: number, data: {
    amount: number;
    type: 'income' | 'expense';
    category_id: number | null;
    person: string | null;
    description: string | null;
    receipt_image: string | null;
    date: string;
  }) {
    try {
      await updateTransaction(id, data);
      showToast('✅ Record updated 紀錄已更新', 'success');
      setEditingTx(null);
      fetchData();
    } catch (err) {
      console.error('Error updating:', err);
      showToast('❌ Failed to update', 'error');
    }
  }

  function handleFilterChange(key: string, value: string) {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  }

  async function handleExport() {
    try {
      await exportCSV();
      showToast('📥 CSV exported 匯出成功', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('❌ Export failed', 'error');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importCSV(text);
      showToast(`📤 ${result.message}`, result.skipped > 0 ? 'error' : 'success');
      fetchData();
    } catch (err) {
      console.error('Import error:', err);
      showToast('❌ Import failed', 'error');
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function fetchLogs() {
    try {
      const data = await getLogs(50);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }

  const transactions = result?.data || [];
  const pagination = result?.pagination;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">
            収支歷史紀錄 — All financial records
            {pagination && ` (${pagination.total} total)`}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            📥 Export 匯出
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            📤 Import 匯入
          </button>
          <button
            className={`btn ${showLogs ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}
          >
            📝 Logs 日誌
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Search notes..."
          value={filters.search}
          onChange={e => handleFilterChange('search', e.target.value)}
          style={{ minWidth: '200px' }}
        />

        <select
          className="form-select"
          value={filters.type}
          onChange={e => handleFilterChange('type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="income">💰 Income</option>
          <option value="expense">💸 Expense</option>
        </select>

        <select
          className="form-select"
          value={filters.categoryId}
          onChange={e => handleFilterChange('categoryId', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="form-input"
          value={filters.startDate}
          onChange={e => handleFilterChange('startDate', e.target.value)}
          title="Start date"
        />

        <input
          type="date"
          className="form-input"
          value={filters.endDate}
          onChange={e => handleFilterChange('endDate', e.target.value)}
          title="End date"
        />

        {(filters.type || filters.categoryId || filters.startDate || filters.endDate || filters.search) && (
          <button
            className="btn btn-secondary"
            onClick={() => setFilters({ type: '', categoryId: '', startDate: '', endDate: '', search: '', page: 1 })}
            style={{ fontSize: '0.85rem' }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : transactions.length > 0 ? (
        <>
          <div className="transaction-list">
            {transactions.map(tx => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                onDelete={handleDelete}
                onEdit={setEditingTx}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={pagination.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              >
                ← Prev
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No records found</h3>
            <p>
              {filters.type || filters.categoryId || filters.startDate || filters.endDate || filters.search
                ? 'Try adjusting your filters'
                : 'Start by adding your first record'}
            </p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && (
        <EditModal
          transaction={editingTx}
          categories={categories}
          onSave={handleSaveEdit}
          onClose={() => setEditingTx(null)}
        />
      )}

      {/* Audit Logs */}
      {showLogs && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">📝 Operation Log 操作日誌</h3>
            <button className="btn btn-secondary" onClick={fetchLogs} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
              ↻ Refresh
            </button>
          </div>
          {logs.length > 0 ? (
            <div className="log-list">
              {logs.map(log => (
                <div key={log.id} className="log-entry">
                  <span className={`log-action log-action-${log.action.toLowerCase()}`}>
                    {log.action}
                  </span>
                  <span className="log-detail">{log.detail || '—'}</span>
                  <span className="log-time">
                    {new Date(log.created_at + 'Z').toLocaleString('zh-TW')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No logs yet</p>
          )}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
