import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransaction, getCategories } from '../services/api';
import type { Category, TransactionFormData } from '../types';

function getTodayDate(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function AddTransaction() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState<TransactionFormData>({
    amount: '',
    type: 'expense',
    category_id: null,
    description: '',
    date: getTodayDate(),
  });

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const filteredCategories = categories.filter(c => c.type === form.type);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!form.date) {
      showToast('Please select a date', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createTransaction({
        amount,
        type: form.type,
        category_id: form.category_id,
        description: form.description || null,
        date: form.date,
      });

      showToast('✅ Transaction saved!', 'success');

      // Reset form
      setForm({
        amount: '',
        type: form.type,
        category_id: null,
        description: '',
        date: getTodayDate(),
      });

      // Navigate after short delay
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error('Error saving transaction:', err);
      showToast('❌ Failed to save. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Record</h1>
          <p className="page-subtitle">新增收支紀錄 — Add a new financial record</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          {/* Type Toggle */}
          <div className="form-group">
            <label className="form-label">Type 類型</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`type-toggle-btn income ${form.type === 'income' ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, type: 'income', category_id: null }))}
              >
                💰 Income 收入
              </button>
              <button
                type="button"
                className={`type-toggle-btn expense ${form.type === 'expense' ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, type: 'expense', category_id: null }))}
              >
                💸 Expense 支出
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label" htmlFor="amount">Amount 金額</label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">NT$</span>
              <input
                id="amount"
                type="number"
                className="form-input amount-input"
                placeholder="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                min="0"
                step="1"
                required
              />
            </div>
          </div>

          <div className="form-row">
            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="category">Category 分類</label>
              <select
                id="category"
                className="form-select"
                value={form.category_id ?? ''}
                onChange={e => setForm(f => ({
                  ...f,
                  category_id: e.target.value ? Number(e.target.value) : null,
                }))}
              >
                <option value="">— Select —</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="date">Date 日期</label>
              <input
                id="date"
                type="date"
                className="form-input"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">Note 備註</label>
            <textarea
              id="description"
              className="form-textarea"
              placeholder="Optional description..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? '⏳ Saving...' : '✅ Save Record'}
          </button>
        </form>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
