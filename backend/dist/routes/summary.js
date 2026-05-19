"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
// GET /api/summary/monthly — Monthly income/expense totals
router.get('/monthly', async (req, res) => {
    try {
        const months = Number(req.query.months) || 12;
        const summary = await (0, database_1.dbAll)(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
      FROM transactions
      WHERE date >= date('now', '-' || ? || ' months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `, months);
        res.json(summary);
    }
    catch (error) {
        console.error('Error fetching monthly summary:', error);
        res.status(500).json({ error: 'Failed to fetch monthly summary' });
    }
});
// GET /api/summary/category — Breakdown by category
router.get('/category', async (req, res) => {
    try {
        let query = `
      SELECT c.id as category_id, c.name as category_name, c.icon as category_icon,
        t.type, SUM(t.amount) as total, COUNT(*) as count
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE 1=1
    `;
        const params = [];
        if (req.query.type) {
            query += ' AND t.type = ?';
            params.push(req.query.type);
        }
        if (req.query.startDate) {
            query += ' AND t.date >= ?';
            params.push(req.query.startDate);
        }
        if (req.query.endDate) {
            query += ' AND t.date <= ?';
            params.push(req.query.endDate);
        }
        query += ' GROUP BY c.id, t.type ORDER BY total DESC';
        const summary = await (0, database_1.dbAll)(query, ...params);
        res.json(summary);
    }
    catch (error) {
        console.error('Error fetching category summary:', error);
        res.status(500).json({ error: 'Failed to fetch category summary' });
    }
});
// GET /api/summary/overview — Quick overview stats
router.get('/overview', async (_req, res) => {
    try {
        const currentMonth = await (0, database_1.dbGet)(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as month_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as month_expense
      FROM transactions WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `);
        const allTime = await (0, database_1.dbGet)(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(*) as total_transactions
      FROM transactions
    `);
        res.json({
            currentMonth: {
                income: Number(currentMonth?.month_income) || 0,
                expense: Number(currentMonth?.month_expense) || 0,
                balance: (Number(currentMonth?.month_income) || 0) - (Number(currentMonth?.month_expense) || 0),
            },
            allTime: {
                income: Number(allTime?.total_income) || 0,
                expense: Number(allTime?.total_expense) || 0,
                balance: (Number(allTime?.total_income) || 0) - (Number(allTime?.total_expense) || 0),
                transactions: Number(allTime?.total_transactions) || 0,
            },
        });
    }
    catch (error) {
        console.error('Error fetching overview:', error);
        res.status(500).json({ error: 'Failed to fetch overview' });
    }
});
// GET /api/summary/person — Subtotal per person
router.get('/person', async (req, res) => {
    try {
        let query = `
      SELECT COALESCE(person, '(unassigned)') as person,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net,
        COUNT(*) as count
      FROM transactions WHERE 1=1
    `;
        const params = [];
        if (req.query.startDate) {
            query += ' AND date >= ?';
            params.push(req.query.startDate);
        }
        if (req.query.endDate) {
            query += ' AND date <= ?';
            params.push(req.query.endDate);
        }
        query += ' GROUP BY person ORDER BY total_expense DESC';
        const summary = await (0, database_1.dbAll)(query, ...params);
        res.json(summary);
    }
    catch (error) {
        console.error('Error fetching person summary:', error);
        res.status(500).json({ error: 'Failed to fetch person summary' });
    }
});
exports.default = router;
//# sourceMappingURL=summary.js.map