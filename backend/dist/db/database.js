"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.dbAll = dbAll;
exports.dbGet = dbGet;
exports.dbRun = dbRun;
const sql_js_1 = __importDefault(require("sql.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_PATH = path_1.default.join(__dirname, '..', '..', 'data', 'tainan.db');
// Ensure data directory exists
const dataDir = path_1.default.dirname(DB_PATH);
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
let db;
// Helper to persist database to disk
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs_1.default.writeFileSync(DB_PATH, buffer);
    }
}
// Auto-save every 30 seconds
setInterval(saveDatabase, 30000);
// Save on process exit
process.on('exit', saveDatabase);
process.on('SIGINT', () => { saveDatabase(); process.exit(); });
process.on('SIGTERM', () => { saveDatabase(); process.exit(); });
async function initializeDatabase() {
    const SQL = await (0, sql_js_1.default)();
    // Load existing database or create new one
    if (fs_1.default.existsSync(DB_PATH)) {
        const fileBuffer = fs_1.default.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
        console.log('📂 Loaded existing database');
    }
    else {
        db = new SQL.Database();
        console.log('🆕 Created new database');
    }
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    // Create tables
    db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      person TEXT,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Migration: add person column to existing databases
    try {
        db.run('ALTER TABLE transactions ADD COLUMN person TEXT');
        console.log('📝 Added person column to transactions');
    }
    catch (_e) {
        // Column already exists — OK
    }
    // Migration: add receipt_image column
    try {
        db.run('ALTER TABLE transactions ADD COLUMN receipt_image TEXT');
        console.log('🖼️ Added receipt_image column to transactions');
    }
    catch (_e) {
        // Column already exists — OK
    }
    db.run('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)');
    db.run('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)');
    // Audit log table
    db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      detail TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Seed default categories if table is empty
    const result = db.exec('SELECT COUNT(*) as count FROM categories');
    const count = result[0]?.values[0]?.[0];
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
            db.run('INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)', [name, type, icon]);
        }
        saveDatabase();
        console.log('✅ Seeded default categories');
    }
    saveDatabase();
}
// Wrapper functions to match the better-sqlite3 API used by routes
function dbAll(sql, ...params) {
    const stmt = db.prepare(sql);
    if (params.length > 0)
        stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}
function dbGet(sql, ...params) {
    const results = dbAll(sql, ...params);
    return results[0];
}
function dbRun(sql, ...params) {
    db.run(sql, params);
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] || 0;
    const changes = db.getRowsModified();
    saveDatabase();
    return { lastInsertRowid: lastId, changes };
}
exports.default = { dbAll, dbGet, dbRun };
//# sourceMappingURL=database.js.map