import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// ── Route imports ─────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import touristRoutes from './routes/tourist.js';
import blogRoutes from './routes/blogs.js';
import workshopBookingRoutes from './routes/bookingRoutes.js';

import artistAuthRoutes from './routes/artistAuth.js';
import craftRoutes from './routes/crafts.js';
import reviewRoutes from './routes/reviews.js';
import analyticsRoutes from './routes/analytics.js';
import activityRoutes from './routes/activity.js';
import chatRoutes from './routes/chat.js';
import adminAuthRoutes from './routes/adminAuth.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import artistRoutes from './routes/artistRoutes.js';
import artistsRoutes from './routes/artists.js';

const app = express();

// CORS: allow the Vite dev server and any local ports
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email', 'x-user-role', 'x-username'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/tourist/auth', authRoutes);
app.use('/api/tourist', touristRoutes);
app.use('/api/tourist/blogs', blogRoutes);
app.use('/api/bookings', workshopBookingRoutes);
app.use('/api/artist/auth', artistAuthRoutes);
app.use('/api/crafts', craftRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/artists', artistsRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'LankaCrafts Tourist API',
    timestamp: new Date().toISOString(),
  });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// express-async-errors automatically passes async errors here
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);

  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: `${field} already exists.` });
  }
  if (err.message === 'Unsupported file type.') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File exceeds 30MB limit.' });
  }

  res.status(500).json({ error: 'Internal server error.' });
});

// ── MongoDB connection + server start ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(` MongoDB connected...`);
    app.listen(PORT, () => {
      console.log(` LankaCrafts Tourist API running on http://localhost:${PORT}`);
      console.log(`  Health: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB connection failed:', err.message);
    process.exit(1);
  });
