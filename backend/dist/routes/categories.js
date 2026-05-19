"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// GET /api/categories — List all
router.get('/', (_req, res) => {
    try {
        const categories = (0, database_1.dbAll)('SELECT * FROM categories ORDER BY type, name');
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
// POST /api/categories — Create
router.post('/', (0, validation_1.validate)(validation_1.createCategorySchema), (req, res) => {
    try {
        const { name, type, icon } = req.body;
        const result = (0, database_1.dbRun)('INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)', name, type, icon || null);
        const category = (0, database_1.dbGet)('SELECT * FROM categories WHERE id = ?', result.lastInsertRowid);
        res.status(201).json(category);
    }
    catch (error) {
        if (error?.message?.includes('UNIQUE')) {
            res.status(409).json({ error: 'Category name already exists' });
            return;
        }
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});
// DELETE /api/categories/:id — Delete
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = (0, database_1.dbRun)('DELETE FROM categories WHERE id = ?', Number(id));
        if (result.changes === 0) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        res.json({ message: 'Category deleted' });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map