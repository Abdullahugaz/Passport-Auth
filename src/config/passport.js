import 'dotenv/config.js';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error('JWT_SECRET is missing');

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ where: { email: email.toLowerCase() } });
        if (!user) return done(null, false, { message: 'Invalid credentials' });
        const ok = await user.validatePassword(password);
        if (!ok) return done(null, false, { message: 'Invalid credentials' });
        return done(null, user);
      } catch (e) { return done(e); }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
      ignoreExpiration: false,      // ⬅️ explicitly enforce expiry
      algorithms: ['HS256'],        // ⬅️ match jsonwebtoken default
      clockTolerance: 5             // ⬅️ optional small skew
    },
    async (payload, done) => {
      try {
        const user = await User.findByPk(payload.sub);
        if (!user) return done(null, false);
        return done(null, user);
      } catch (e) { return done(e, false); }
    }
  )
);
