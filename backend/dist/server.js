"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./db/database");
const transactions_1 = __importDefault(require("./routes/transactions"));
const categories_1 = __importDefault(require("./routes/categories"));
const summary_1 = __importDefault(require("./routes/summary"));
const logs_1 = __importDefault(require("./routes/logs"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '50mb' }));
// Request logging
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});
// API Routes
app.use('/api/transactions', transactions_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/summary', summary_1.default);
app.use('/api/logs', logs_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve frontend static files (production build)
const frontendDist = path_1.default.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express_1.default.static(frontendDist));
// SPA catch-all: serve index.html for any non-API route (React Router)
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(frontendDist, 'index.html'));
});
// Initialize database (async) then start server
async function start() {
    await (0, database_1.initializeDatabase)();
    console.log('✅ Database initialized');
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`\n🏛️  Tainan Financial Tracker`);
        console.log(`   Running at http://localhost:${PORT}`);
        console.log(`   API:  http://localhost:${PORT}/api/health`);
        console.log(`   UI:   http://localhost:${PORT}\n`);
    });
}
start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=server.js.map