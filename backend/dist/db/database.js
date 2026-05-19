"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.dbAll = dbAll;
exports.dbGet = dbGet;
exports.dbRun = dbRun;
const client_1 = require("@libsql/client");
// Turso cloud DB URL and token from environment variables
const TURSO_URL = process.env.TURSO_DATABASE_URL || '';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || '';
if (!TURSO_URL) {
    console.error('❌ TURSO_DATABASE_URL is not set!');
    process.exit(1);
}
console.log(`📂 Database: ${TURSO_URL}`);
const client = (0, client_1.createClient)({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
});
async function initializeDatabase() {
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
        try {
            await client.execute(sql);
        }
        catch (_e) { /* column exists */ }
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
async function dbAll(sql, ...params) {
    const result = await client.execute({ sql, args: params });
    return result.rows;
}
async function dbGet(sql, ...params) {
    const result = await client.execute({ sql, args: params });
    return result.rows[0];
}
async function dbRun(sql, ...params) {
    const result = await client.execute({ sql, args: params });
    return {
        lastInsertRowid: Number(result.lastInsertRowid) || 0,
        changes: result.rowsAffected,
    };
}
exports.default = { dbAll, dbGet, dbRun };
//# sourceMappingURL=database.js.map