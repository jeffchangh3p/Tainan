import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'tainan.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  `);

  // Seed default categories if table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)');
    const seedCategories = db.transaction(() => {
      // Income categories
      insert.run('薪資 Salary', 'income', '💰');
      insert.run('退休金 Pension', 'income', '🏦');
      insert.run('租金收入 Rental', 'income', '🏠');
      insert.run('利息 Interest', 'income', '📈');
      insert.run('紅包 Gift', 'income', '🧧');
      insert.run('其他收入 Other Income', 'income', '💵');

      // Expense categories
      insert.run('餐飲 Food', 'expense', '🍜');
      insert.run('醫療 Medical', 'expense', '🏥');
      insert.run('水電瓦斯 Utilities', 'expense', '💡');
      insert.run('交通 Transport', 'expense', '🚗');
      insert.run('保險 Insurance', 'expense', '🛡️');
      insert.run('日用品 Groceries', 'expense', '🛒');
      insert.run('房屋修繕 Home Repair', 'expense', '🔧');
      insert.run('娛樂 Entertainment', 'expense', '🎭');
      insert.run('孝親費 Filial Piety', 'expense', '❤️');
      insert.run('其他支出 Other Expense', 'expense', '📋');
    });
    seedCategories();
    console.log('✅ Seeded default categories');
  }
}

export default db;
