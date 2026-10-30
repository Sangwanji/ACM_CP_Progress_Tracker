const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { signToken, cookieOptions } = require('../lib/token');
const { requireAuthPending } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

const loginSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Use at least 8 characters'),
});

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  isAdmin: u.isAdmin, mustChangePassword: u.mustChangePassword,
});

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email or password' });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Same message for unknown email, wrong password, and deactivated account
  const ok = user && user.isActive && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  res.cookie('token', signToken(user.id), cookieOptions);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  const { maxAge, ...opts } = cookieOptions;
  res.clearCookie('token', opts);
  res.json({ ok: true });
});

router.get('/me', requireAuthPending, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      mentorLinks: {
        where: { expert: { isActive: true } },
        select: { expert: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  res.json({
    user: { ...publicUser(user), mentors: user.mentorLinks.map((l) => l.expert) },
  });
});

router.post('/change-password', requireAuthPending, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { currentPassword, newPassword } = parsed.data;
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from the current one' });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12), mustChangePassword: false },
  });
  res.json({ ok: true });
});

module.exports = router;
