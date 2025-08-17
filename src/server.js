// src/server.js
import 'dotenv/config.js';
import express from 'express';
import passport from 'passport';
import authRoutes from './routes/auth.js';
import './config/passport.js';
import { connectAndSync } from './config/db.js';

const app = express();

// middleware
app.use(express.json());
app.use(passport.initialize());

// ✅ health FIRST (easy to confirm server is up before DB)
app.get('/health', (_req, res) => res.json({ ok: true }));

// routes
app.use('/api/auth', authRoutes);

const { PORT = 1000 } = process.env;

(async () => {
  try {
    await connectAndSync();
    console.log('MySQL connected & models synced');
    app.listen(PORT, () =>
      console.log(`API on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('DB init error', err);
    process.exit(1);
  }
})();
