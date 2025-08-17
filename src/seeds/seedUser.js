// src/seeds/seedUser.js
import 'dotenv/config.js';
import bcrypt from 'bcrypt';
import { connectAndSync, sequelize } from '../config/db.js';   // <-- FIXED
import User from '../models/User.js';                           // <-- FIXED

async function run() {
  try {
    await connectAndSync();

    const email = 'admin@gmail.com';
    const plainPassword = '12345678!';
    const name = 'Abdullah';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`User ${email} already exists with id=${existing.id}`);
    } else {
      const passwordHash = await bcrypt.hash(plainPassword, 12);
      const user = await User.create({ email, passwordHash, name });
      console.log(`✅ Seeded user: ${user.email} / password: ${plainPassword}`);
    }
  } catch (err) {
    console.error('Seed failed', err);
  } finally {
    await sequelize.close();
  }
}

run();
