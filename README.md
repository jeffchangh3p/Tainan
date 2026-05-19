# 🏛️ Tainan — Family Financial Tracker

A full-stack web application to record and track financial transactions for the family. Built with React + TypeScript (frontend) and Node.js + Express + SQLite (backend).

## 📁 Project Structure

```
Tainan/
├── frontend/     # Vite + React + TypeScript
├── backend/      # Node.js + Express + SQLite
└── README.md
```

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
# API runs at http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# UI runs at http://localhost:5173
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions (query: `startDate`, `endDate`, `type`, `categoryId`) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/summary/monthly` | Monthly income/expense totals |
| GET | `/api/summary/category` | Breakdown by category |

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Recharts, React Router
- **Backend**: Node.js, Express, TypeScript, better-sqlite3, Zod
- **Database**: SQLite (file-based, zero-config)

## 📄 License

Private — Family use only.
