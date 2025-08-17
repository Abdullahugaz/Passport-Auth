// src/app.js
import 'dotenv/config.js';
import express from 'express';
import passport from 'passport';
import authRoutes from './routes/auth.js';
import './config/passport.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);

export default app;
