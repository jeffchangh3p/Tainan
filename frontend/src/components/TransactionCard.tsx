import type { Transaction } from '../types';

interface Props {
  transaction: Transaction;
  onDelete?: (id: number) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  });
}

export default function TransactionCard({ transaction, onDelete }: Props) {
  const isIncome = transaction.type === 'income';

  return (
    <div className="transaction-item">
      <div className={`transaction-icon ${transaction.type}`}>
        {transaction.category_icon || (isIncome ? '💰' : '💸')}
      </div>
      <div className="transaction-info">
        <div className="transaction-category">
          {transaction.category_name || (isIncome ? 'Income' : 'Expense')}
        </div>
        {transaction.description && (
          <div className="transaction-description">{transaction.description}</div>
        )}
      </div>
      <div className="transaction-meta">
        <div className={`transaction-amount ${transaction.type}`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </div>
        <div className="transaction-date">{formatDate(transaction.date)}</div>
      </div>
      {onDelete && (
        <div className="transaction-actions">
          <button
            className="btn btn-danger btn-icon"
            onClick={() => onDelete(transaction.id)}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}
