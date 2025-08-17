// src/tests/auth.test.js

import jwt from 'jsonwebtoken';
import request from 'supertest';

// --- Set env BEFORE imports that read it
process.env.JWT_SECRET = 'test_secret_please_change';
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_NAME = 'passport_auth';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASS = process.env.DB_PASS || '';
process.env.NODE_ENV = 'test';

// Dynamic imports AFTER env is set (paths fixed for src/tests/*)
const { default: app } = await import('../app.js');
const { sequelize } = await import('../config/db.js');
const { default: User } = await import('../models/User.js');

describe('Auth API', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('POST /api/auth/signup creates user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'alice@example.com', password: 'StrongPassw0rd!', name: 'Alice' })
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ email: 'alice@example.com', name: 'Alice' });
    expect(typeof res.body.token).toBe('string');
  });

  test('POST /api/auth/login returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'StrongPassw0rd!' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
  });

  test('GET /api/auth/me with valid token works', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'StrongPassw0rd!' })
      .expect(200);

    const token = login.body.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body.user.email).toBe('alice@example.com');
  });

  test('GET /api/auth/me rejects expired token', async () => {
    let user = await User.findOne({ where: { email: 'bob@example.com' } });
    if (!user) {
      user = await User.create({ email: 'bob@example.com', name: 'Bob', passwordHash: '' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1s' }
    );

    await new Promise(r => setTimeout(r, 1500));

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(['Token expired', 'Unauthorized']).toContain(res.body.message);
  });
});
