import { useState, useEffect } from 'react';
import type { Transaction, Category } from '../types';
import { FAMILY_MEMBERS } from '../types';
import { createCategory, getCategories } from '../services/api';
import ReceiptUpload from './ReceiptUpload';

interface Props {
  transaction: Transaction;
  categories: Category[];
  onSave: (id: number, data: {
    amount: number;
    type: 'income' | 'expense';
    category_id: number | null;
    person: string | null;
    description: string | null;
    receipt_image: string | null;
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
  const [receiptImage, setReceiptImage] = useState<string | null>(transaction.receipt_image || null);
  const [saving, setSaving] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [localCategories, setLocalCategories] = useState(categories);

  const filteredCategories = localCategories.filter(c => c.type === form.type);

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
      // If custom category, create it first
      let categoryId = form.category_id;
      if (categoryId === -1 && customCategory.trim()) {
        const newCat = await createCategory({
          name: customCategory.trim(),
          type: form.type,
          icon: form.type === 'income' ? '💵' : '📝',
        });
        categoryId = newCat.id;
        const cats = await getCategories();
        setLocalCategories(cats);
      }

      await onSave(transaction.id, {
        amount,
        type: form.type,
        category_id: categoryId === -1 ? null : categoryId,
        person: form.person || null,
        description: form.description || null,
        receipt_image: receiptImage,
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
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({
                    ...f,
                    category_id: val === '' ? null : Number(val),
                  }));
                  if (val !== '-1') setCustomCategory('');
                }}
              >
                <option value="">— Select —</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
                <option value="-1">➕ New 新增...</option>
              </select>
              {form.category_id === -1 && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter category name..."
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  style={{ marginTop: '8px' }}
                  autoFocus
                />
              )}
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

          {/* Receipt Image */}
          <div className="form-group">
            <label className="form-label">Receipt 收據</label>
            <ReceiptUpload image={receiptImage} onChange={setReceiptImage} />
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
