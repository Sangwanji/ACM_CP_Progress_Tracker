const jwt = require('jsonwebtoken');

const isProd = process.env.NODE_ENV === 'production';

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// If the frontend and API are on different domains (Vercel + Render),
// the cookie must be SameSite=None; Secure.
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

module.exports = { signToken, cookieOptions };
