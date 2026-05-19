import type { Transaction } from '../types';

interface Props {
  transaction: Transaction;
  onDelete?: (id: number) => void;
  onEdit?: (transaction: Transaction) => void;
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

export default function TransactionCard({ transaction, onDelete, onEdit }: Props) {
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
      {(onEdit || onDelete) && (
        <div className="transaction-actions">
          {onEdit && (
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => onEdit(transaction)}
              title="Edit"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              className="btn btn-danger btn-icon"
              onClick={() => onDelete(transaction.id)}
              title="Delete"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
}

