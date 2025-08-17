// src/routes/auth.js
import 'dotenv/config.js';
import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = Router();

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error('JWT_SECRET is missing (check your .env)');

// ---- helper: sign 2-minute JWT
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '2m' } // 2 minutes
  );
}

// ---- helper: require JWT with clear expired message
const requireJwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      if (info && (info.name === 'TokenExpiredError' || info.message === 'jwt expired')) {
        return res.status(401).json({
          message: 'Token expired',
          ...(info.expiredAt ? { expiredAt: info.expiredAt } : {})
        });
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Min 8 chars'),
    body('name').optional().isString().isLength({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;

    try {
      const existing = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existing) return res.status(409).json({ message: 'Email already in use' });

      const user = User.build({
        email: email.toLowerCase(),
        name: name?.trim() || null,
        passwordHash: ''
      });
      await user.setPassword(password);
      await user.save();

      const token = signToken(user);
      res.status(201).json({ user: user.toSafeJSON(), token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail(), body('password').isString().isLength({ min: 1 })],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  passport.authenticate('local', { session: false }),
  (req, res) => {
    const token = signToken(req.user);
    res.json({ user: req.user.toSafeJSON(), token });
  }
);

// GET /api/auth/me (protected)
router.get('/me', requireJwt, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

export default router;
