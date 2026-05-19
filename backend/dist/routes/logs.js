"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
// GET /api/logs — Get audit log entries
router.get('/', (req, res) => {
    try {
        const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
        const logs = (0, database_1.dbAll)(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`, limit);
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});
exports.default = router;
//# sourceMappingURL=logs.js.map