const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole, requireAdmin } = require('../middleware/auth');
const { allActiveExperts } = require('../lib/mentorship');

const userSelect = {
  id: true, name: true, email: true, role: true,
  isAdmin: true, isActive: true, createdAt: true,
  mentorLinks: { select: { expertId: true } },
};
const format = ({ mentorLinks, ...u }) => ({ ...u, mentorIds: mentorLinks.map((l) => l.expertId) });

const tempPassword = () => crypto.randomBytes(6).toString('base64url');
const idParam = (req) => Number(req.params.id);

// Admin: everyone. Expert: anyone they mentor. Scholars/fellows: forbidden.
router.get('/', requireAuth, requireRole('ADMIN', 'EXPERT'), async (req, res) => {
  const where = req.user.isAdmin
    ? {}
    : { mentorLinks: { some: { expertId: req.user.id } } };
  const users = await prisma.user.findMany({ where, select: userSelect, orderBy: { id: 'asc' } });
  res.json({ users: users.map(format) });
});

// ---------------- Admin management ----------------

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  role: z.enum(['ADMIN', 'EXPERT', 'SCHOLAR', 'FELLOW']),
  isAdmin: z.boolean().optional(), // lets an EXPERT also be an admin
  mentorIds: z.array(z.number().int()).optional(),
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, email, role } = parsed.data;
  const mentorIds = [...new Set(parsed.data.mentorIds || [])];

  const needsMentors = role === 'SCHOLAR' || role === 'FELLOW';
  if (needsMentors && !(await allActiveExperts(mentorIds))) {
    return res.status(400).json({ error: 'Scholars and fellows need at least one active expert as mentor' });
  }

  const password = tempPassword();
  try {
    const user = await prisma.user.create({
      data: {
        name, email, role,
        isAdmin: role === 'ADMIN' ? true : !!parsed.data.isAdmin,
        passwordHash: await bcrypt.hash(password, 12),
        mustChangePassword: true,
        profile: { create: {} },
        mentorLinks: needsMentors
          ? { create: mentorIds.map((expertId) => ({ expertId })) }
          : undefined,
      },
      select: userSelect,
    });
    // The temporary password is shown once; share it privately.
    res.status(201).json({ user: format(user), temporaryPassword: password });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    throw e;
  }
});

// Replace the full set of experts for a scholar/fellow
router.put('/:id/mentors', requireAuth, requireAdmin, async (req, res) => {
  const parsed = z.object({ mentorIds: z.array(z.number().int()).min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'mentorIds (at least one) required' });
  const mentorIds = [...new Set(parsed.data.mentorIds)];

  const target = await prisma.user.findUnique({ where: { id: idParam(req) } });
  if (!target || !['SCHOLAR', 'FELLOW'].includes(target.role)) {
    return res.status(400).json({ error: 'Only scholars and fellows have mentors' });
  }
  if (!(await allActiveExperts(mentorIds))) {
    return res.status(400).json({ error: 'All mentors must be active experts' });
  }

  await prisma.$transaction([
    prisma.mentorship.deleteMany({ where: { menteeId: target.id } }),
    prisma.mentorship.createMany({
      data: mentorIds.map((expertId) => ({ expertId, menteeId: target.id })),
    }),
  ]);
  const user = await prisma.user.findUnique({ where: { id: target.id }, select: userSelect });
  res.json({ user: format(user) });
});

router.patch('/:id/active', requireAuth, requireAdmin, async (req, res) => {
  const parsed = z.object({ isActive: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'isActive required' });
  if (idParam(req) === req.user.id) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }
  const user = await prisma.user.update({
    where: { id: idParam(req) }, data: { isActive: parsed.data.isActive }, select: userSelect,
  });
  res.json({ user: format(user) });
});

router.post('/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  const password = tempPassword();
  await prisma.user.update({
    where: { id: idParam(req) },
    data: { passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true },
  });
  res.json({ temporaryPassword: password });
});

module.exports = router;