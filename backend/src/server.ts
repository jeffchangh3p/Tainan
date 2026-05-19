import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './db/database';
import transactionsRouter from './routes/transactions';
import categoriesRouter from './routes/categories';
import summaryRouter from './routes/summary';
import logsRouter from './routes/logs';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/logs', logsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files (production build)
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// SPA catch-all: serve index.html for any non-API route (React Router)
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Initialize database (async) then start server
async function start() {
  await initializeDatabase();
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

export default app;
