import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransaction, getCategories, createCategory } from '../services/api';
import type { Category, TransactionFormData } from '../types';
import { FAMILY_MEMBERS } from '../types';
import ReceiptUpload from '../components/ReceiptUpload';
import VoiceMemo from '../components/VoiceMemo';

function getTodayDate(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function AddTransaction() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [voiceMemo, setVoiceMemo] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');

  const [form, setForm] = useState<TransactionFormData>({
    amount: '',
    type: 'expense',
    category_id: null,
    person: '',
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
      // If custom category, create it first
      let categoryId = form.category_id;
      if (categoryId === -1 && customCategory.trim()) {
        const newCat = await createCategory({
          name: customCategory.trim(),
          type: form.type,
          icon: form.type === 'income' ? '💵' : '📝',
        });
        categoryId = newCat.id;
        // Refresh categories
        const cats = await getCategories();
        setCategories(cats);
      }

      await createTransaction({
        amount,
        type: form.type,
        category_id: categoryId === -1 ? null : categoryId,
        person: form.person || null,
        description: form.description || null,
        receipt_image: receiptImage,
        voice_memo: voiceMemo,
        date: form.date,
      });

      showToast('✅ Transaction saved!', 'success');

      // Reset form
      setForm({
        amount: '',
        type: form.type,
        category_id: null,
        person: form.person,
        description: '',
        date: getTodayDate(),
      });
      setReceiptImage(null);
      setVoiceMemo(null);
      setCustomCategory('');

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

          {/* Person */}
          <div className="form-group">
            <label className="form-label" htmlFor="person">Person 人員</label>
            <select
              id="person"
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

          {/* Receipt Image */}
          <div className="form-group">
            <label className="form-label">Receipt 收據</label>
            <ReceiptUpload image={receiptImage} onChange={setReceiptImage} />
          </div>

          {/* Voice Memo */}
          <div className="form-group">
            <label className="form-label">Voice Memo 錄音備忘</label>
            <VoiceMemo audio={voiceMemo} onChange={setVoiceMemo} />
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
