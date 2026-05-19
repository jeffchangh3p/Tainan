FROM node:20-alpine

WORKDIR /app

# Copy backend package.json and install production deps
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --omit=dev

# Copy pre-built backend
COPY backend/dist ./backend/dist

# Copy pre-built frontend
COPY frontend/dist ./frontend/dist

# Create data directory for SQLite
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/tainan.db

EXPOSE 8080

CMD ["node", "backend/dist/server.js"]
