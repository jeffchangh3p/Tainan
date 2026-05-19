import { createClient, type Client } from '@libsql/client';

// Turso cloud DB URL and token from environment variables
const TURSO_URL = process.env.TURSO_DATABASE_URL || '';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

if (!TURSO_URL) {
  console.error('❌ TURSO_DATABASE_URL is not set!');
  process.exit(1);
}

console.log(`📂 Database: ${TURSO_URL}`);

const client: Client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

export async function initializeDatabase(): Promise<void> {
  // Enable foreign keys
  await client.execute('PRAGMA foreign_keys = ON');

  // Create tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      person TEXT,
      description TEXT,
      receipt_image TEXT,
      voice_memo TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)');

  // Audit log table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      detail TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: add columns if missing (safe for existing DBs)
  const migrations = [
    'ALTER TABLE transactions ADD COLUMN person TEXT',
    'ALTER TABLE transactions ADD COLUMN receipt_image TEXT',
    'ALTER TABLE transactions ADD COLUMN voice_memo TEXT',
  ];
  for (const sql of migrations) {
    try { await client.execute(sql); } catch (_e) { /* column exists */ }
  }

  // Seed default categories if table is empty
  const result = await client.execute('SELECT COUNT(*) as count FROM categories');
  const count = Number(result.rows[0]?.count) || 0;

  if (count === 0) {
    const categories = [
      // Income
      ['薪資 Salary', 'income', '💰'],
      ['退休金 Pension', 'income', '🏦'],
      ['租金收入 Rental', 'income', '🏠'],
      ['利息 Interest', 'income', '📈'],
      ['紅包 Gift', 'income', '🧧'],
      ['其他收入 Other Income', 'income', '💵'],
      // Expense
      ['餐飲 Food', 'expense', '🍜'],
      ['醫療 Medical', 'expense', '🏥'],
      ['水電瓦斯 Utilities', 'expense', '💡'],
      ['交通 Transport', 'expense', '🚗'],
      ['保險 Insurance', 'expense', '🛡️'],
      ['日用品 Groceries', 'expense', '🛒'],
      ['房屋修繕 Home Repair', 'expense', '🔧'],
      ['娛樂 Entertainment', 'expense', '🎭'],
      ['孝親費 Filial Piety', 'expense', '❤️'],
      ['其他支出 Other Expense', 'expense', '📋'],
    ];

    for (const [name, type, icon] of categories) {
      await client.execute({
        sql: 'INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)',
        args: [name, type, icon],
      });
    }
    console.log('✅ Seeded default categories');
  }

  console.log('✅ Database initialized (Turso cloud)');
}

// Async wrapper functions used by all routes
export async function dbAll(sql: string, ...params: any[]): Promise<any[]> {
  const result = await client.execute({ sql, args: params });
  return result.rows as any[];
}

export async function dbGet(sql: string, ...params: any[]): Promise<any | undefined> {
  const result = await client.execute({ sql, args: params });
  return result.rows[0] as any | undefined;
}

export async function dbRun(sql: string, ...params: any[]): Promise<{ lastInsertRowid: number; changes: number }> {
  const result = await client.execute({ sql, args: params });
  return {
    lastInsertRowid: Number(result.lastInsertRowid) || 0,
    changes: result.rowsAffected,
  };
}

export default { dbAll, dbGet, dbRun };
