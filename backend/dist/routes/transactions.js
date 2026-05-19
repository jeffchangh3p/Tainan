"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Helper: write to audit log
function logAction(action, detail) {
    try {
        (0, database_1.dbRun)('INSERT INTO audit_log (action, detail) VALUES (?, ?)', action, detail || null);
    }
    catch (e) {
        console.error('Audit log error:', e);
    }
}
// GET /api/transactions — List with filters
router.get('/', (req, res) => {
    try {
        let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
        const params = [];
        if (req.query.type) {
            query += ' AND t.type = ?';
            params.push(req.query.type);
        }
        if (req.query.categoryId) {
            query += ' AND t.category_id = ?';
            params.push(Number(req.query.categoryId));
        }
        if (req.query.startDate) {
            query += ' AND t.date >= ?';
            params.push(req.query.startDate);
        }
        if (req.query.endDate) {
            query += ' AND t.date <= ?';
            params.push(req.query.endDate);
        }
        if (req.query.search) {
            query += ' AND t.description LIKE ?';
            params.push(`%${req.query.search}%`);
        }
        if (req.query.person) {
            query += ' AND t.person = ?';
            params.push(req.query.person);
        }
        query += ' ORDER BY t.date DESC, t.created_at DESC';
        // Pagination
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const transactions = (0, database_1.dbAll)(query, ...params);
        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM transactions t WHERE 1=1`;
        const countParams = [];
        if (req.query.type) {
            countQuery += ' AND t.type = ?';
            countParams.push(req.query.type);
        }
        if (req.query.categoryId) {
            countQuery += ' AND t.category_id = ?';
            countParams.push(Number(req.query.categoryId));
        }
        if (req.query.startDate) {
            countQuery += ' AND t.date >= ?';
            countParams.push(req.query.startDate);
        }
        if (req.query.endDate) {
            countQuery += ' AND t.date <= ?';
            countParams.push(req.query.endDate);
        }
        if (req.query.search) {
            countQuery += ' AND t.description LIKE ?';
            countParams.push(`%${req.query.search}%`);
        }
        const countResult = (0, database_1.dbGet)(countQuery, ...countParams);
        const total = countResult?.total || 0;
        res.json({
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
// POST /api/transactions — Create
router.post('/', (0, validation_1.validate)(validation_1.createTransactionSchema), (req, res) => {
    try {
        const { amount, type, category_id, person, description, date } = req.body;
        const result = (0, database_1.dbRun)(`INSERT INTO transactions (amount, type, category_id, person, description, date) VALUES (?, ?, ?, ?, ?, ?)`, amount, type, category_id || null, person || null, description || null, date);
        const transaction = (0, database_1.dbGet)(`SELECT t.*, c.name as category_name, c.icon as category_icon
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`, result.lastInsertRowid);
        res.status(201).json(transaction);
        logAction('CREATE', `NT$${amount} ${type} — ${transaction.category_name || 'N/A'} — ${transaction.person || ''} — ${date}`);
    }
    catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});
// PUT /api/transactions/:id — Update
router.put('/:id', (0, validation_1.validate)(validation_1.updateTransactionSchema), (req, res) => {
    try {
        const { id } = req.params;
        const existing = (0, database_1.dbGet)('SELECT * FROM transactions WHERE id = ?', Number(id));
        if (!existing) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        const fields = req.body;
        const updates = [];
        const values = [];
        if (fields.amount !== undefined) {
            updates.push('amount = ?');
            values.push(fields.amount);
        }
        if (fields.type !== undefined) {
            updates.push('type = ?');
            values.push(fields.type);
        }
        if (fields.category_id !== undefined) {
            updates.push('category_id = ?');
            values.push(fields.category_id);
        }
        if (fields.person !== undefined) {
            updates.push('person = ?');
            values.push(fields.person);
        }
        if (fields.description !== undefined) {
            updates.push('description = ?');
            values.push(fields.description);
        }
        if (fields.date !== undefined) {
            updates.push('date = ?');
            values.push(fields.date);
        }
        if (updates.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }
        updates.push("updated_at = datetime('now')");
        values.push(Number(id));
        (0, database_1.dbRun)(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, ...values);
        const updated = (0, database_1.dbGet)(`SELECT t.*, c.name as category_name, c.icon as category_icon
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`, Number(id));
        res.json(updated);
        logAction('UPDATE', `#${id} → NT$${updated.amount} ${updated.type} — ${updated.person || ''} — ${updated.date}`);
    }
    catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});
// DELETE /api/transactions/:id — Delete
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = (0, database_1.dbRun)('DELETE FROM transactions WHERE id = ?', Number(id));
        if (result.changes === 0) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        res.json({ message: 'Transaction deleted' });
        logAction('DELETE', `#${id}`);
    }
    catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});
// GET /api/transactions/export — Export all as CSV
router.get('/export', (_req, res) => {
    try {
        const transactions = (0, database_1.dbAll)(`
      SELECT t.date, t.type, t.amount, t.person,
             c.name as category_name, t.description
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.created_at DESC
    `);
        // BOM for Excel UTF-8 compatibility
        const BOM = '\uFEFF';
        const header = 'date,type,amount,person,category,description';
        const rows = transactions.map((t) => {
            const desc = (t.description || '').replace(/"/g, '""');
            const cat = (t.category_name || '').replace(/"/g, '""');
            const person = (t.person || '').replace(/"/g, '""');
            return `${t.date},${t.type},${t.amount},"${person}","${cat}","${desc}"`;
        });
        const csv = BOM + header + '\n' + rows.join('\n');
        const today = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="tainan_${today}.csv"`);
        res.send(csv);
        logAction('EXPORT', `${transactions.length} records exported`);
    }
    catch (error) {
        console.error('Error exporting:', error);
        res.status(500).json({ error: 'Failed to export' });
    }
});
// POST /api/transactions/import — Import from CSV
router.post('/import', (req, res) => {
    try {
        const { csv } = req.body;
        if (!csv || typeof csv !== 'string') {
            res.status(400).json({ error: 'Missing csv field' });
            return;
        }
        // Parse CSV (handle BOM)
        const raw = csv.replace(/^\uFEFF/, '');
        const lines = raw.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
            res.status(400).json({ error: 'CSV must have header + at least 1 data row' });
            return;
        }
        // Parse header
        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        const dateIdx = header.indexOf('date');
        const typeIdx = header.indexOf('type');
        const amountIdx = header.indexOf('amount');
        const personIdx = header.indexOf('person');
        const categoryIdx = header.indexOf('category');
        const descIdx = header.indexOf('description');
        if (dateIdx < 0 || typeIdx < 0 || amountIdx < 0) {
            res.status(400).json({ error: 'CSV must have date, type, amount columns' });
            return;
        }
        // Get category lookup map
        const categories = (0, database_1.dbAll)('SELECT id, name, type FROM categories');
        const catMap = new Map();
        for (const c of categories) {
            catMap.set(c.name, c.id);
        }
        let imported = 0;
        let skipped = 0;
        const errors = [];
        for (let i = 1; i < lines.length; i++) {
            try {
                const fields = parseCSVLine(lines[i]);
                const date = fields[dateIdx]?.trim();
                const type = fields[typeIdx]?.trim();
                const amount = parseFloat(fields[amountIdx]?.trim());
                const person = personIdx >= 0 ? fields[personIdx]?.trim() || null : null;
                const category = categoryIdx >= 0 ? fields[categoryIdx]?.trim() || null : null;
                const description = descIdx >= 0 ? fields[descIdx]?.trim() || null : null;
                if (!date || !type || !amount || amount <= 0) {
                    skipped++;
                    errors.push(`Row ${i + 1}: invalid date/type/amount`);
                    continue;
                }
                if (type !== 'income' && type !== 'expense') {
                    skipped++;
                    errors.push(`Row ${i + 1}: type must be income or expense`);
                    continue;
                }
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    skipped++;
                    errors.push(`Row ${i + 1}: date must be YYYY-MM-DD`);
                    continue;
                }
                const categoryId = category ? (catMap.get(category) || null) : null;
                (0, database_1.dbRun)(`INSERT INTO transactions (amount, type, category_id, person, description, date) VALUES (?, ?, ?, ?, ?, ?)`, amount, type, categoryId, person, description, date);
                imported++;
            }
            catch (rowErr) {
                skipped++;
                errors.push(`Row ${i + 1}: ${String(rowErr)}`);
            }
        }
        res.json({
            message: `Imported ${imported} records, skipped ${skipped}`,
            imported,
            skipped,
            errors: errors.slice(0, 10),
        });
        logAction('IMPORT', `${imported} imported, ${skipped} skipped`);
    }
    catch (error) {
        console.error('Error importing:', error);
        res.status(500).json({ error: 'Failed to import' });
    }
});
// Helper: parse a CSV line respecting quoted fields
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else if (ch === '"') {
                inQuotes = false;
            }
            else {
                current += ch;
            }
        }
        else {
            if (ch === '"') {
                inQuotes = true;
            }
            else if (ch === ',') {
                fields.push(current);
                current = '';
            }
            else {
                current += ch;
            }
        }
    }
    fields.push(current);
    return fields;
}
exports.default = router;
//# sourceMappingURL=transactions.js.map