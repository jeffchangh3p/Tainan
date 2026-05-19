import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database';
import transactionsRouter from './routes/transactions';
import categoriesRouter from './routes/categories';
import summaryRouter from './routes/summary';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Initialize database
initializeDatabase();
console.log('✅ Database initialized');

// API Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/summary', summaryRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🏛️  Tainan Financial Tracker API`);
  console.log(`   Running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
