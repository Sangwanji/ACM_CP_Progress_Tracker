const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

function buildAuth({ allowPendingPasswordChange }) {
  return async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const { sub } = jwt.verify(token, process.env.JWT_SECRET);

      // Load from DB on every request so role changes and deactivation apply immediately.
      // Cheap at this scale.
      const user = await prisma.user.findUnique({
        where: { id: sub },
        select: {
          id: true, name: true, email: true, role: true,
          isAdmin: true, isActive: true, mustChangePassword: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      if (user.mustChangePassword && !allowPendingPasswordChange) {
        return res.status(403).json({ error: 'Password change required', code: 'MUST_CHANGE_PASSWORD' });
      }

      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  };
}

// Normal protected routes: blocked until the temporary password is changed.
const requireAuth = buildAuth({ allowPendingPasswordChange: false });
// Only for /auth/me and /auth/change-password.
const requireAuthPending = buildAuth({ allowPendingPasswordChange: true });

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Forbidden' });

const requireAdmin = (req, res, next) =>
  req.user.isAdmin ? next() : res.status(403).json({ error: 'Admin only' });

module.exports = { requireAuth, requireAuthPending, requireRole, requireAdmin };
