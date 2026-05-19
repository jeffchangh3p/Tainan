import { useState, useEffect } from 'react';
import type { Transaction, Category } from '../types';
import { FAMILY_MEMBERS } from '../types';

interface Props {
  transaction: Transaction;
  categories: Category[];
  onSave: (id: number, data: {
    amount: number;
    type: 'income' | 'expense';
    category_id: number | null;
    person: string | null;
    description: string | null;
    date: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function EditModal({ transaction, categories, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    amount: String(transaction.amount),
    type: transaction.type as 'income' | 'expense',
    category_id: transaction.category_id,
    person: transaction.person || '',
    description: transaction.description || '',
    date: transaction.date,
  });
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter(c => c.type === form.type);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;

    setSaving(true);
    try {
      await onSave(transaction.id, {
        amount,
        type: form.type,
        category_id: form.category_id,
        person: form.person || null,
        description: form.description || null,
        date: form.date,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">✏️ Edit Record 編輯紀錄</h2>

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
            <label className="form-label">Amount 金額</label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">NT$</span>
              <input
                type="number"
                className="form-input amount-input"
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
              <label className="form-label">Category 分類</label>
              <select
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
              <label className="form-label">Date 日期</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Person */}
          <div className="form-group">
            <label className="form-label">Person 人員</label>
            <select
              className="form-select"
              value={form.person}
              onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
            >
              <option value="">— Select —</option>
              {FAMILY_MEMBERS.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          {/* Description */}
          <div className="form-group">
            <label className="form-label">Note 備註</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel 取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Saving...' : '✅ Save 儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
