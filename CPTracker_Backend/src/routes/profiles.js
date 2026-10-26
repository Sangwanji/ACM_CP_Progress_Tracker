const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { menteeIdsOf } = require('../lib/mentorship');

router.use(requireAuth);

const userInclude = {
  profile: true,
  mentorLinks: { select: { expert: { select: { id: true, name: true } } } },
};

function shape(user, showPhone) {
  const p = user.profile || {};
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    year: p.year ?? null,
    branch: p.branch ?? null,
    rollNo: p.rollNo ?? null,
    ...(showPhone ? { phone: p.phone ?? null } : {}),
    leetcodeHandle: p.leetcodeHandle ?? null,
    codeforcesHandle: p.codeforcesHandle ?? null,
    codechefHandle: p.codechefHandle ?? null,
    bio: p.bio ?? null,
    avatarUrl: p.avatarUrl ?? null,
    mentors: user.mentorLinks.map((l) => l.expert),
  };
}

// Phone: the person, admins, and the person's own experts
async function phoneVisibleIds(viewer) {
  if (viewer.isAdmin) return 'all';
  const ids = new Set([viewer.id]);
  if (viewer.role === 'EXPERT') (await menteeIdsOf(viewer.id)).forEach((id) => ids.add(id));
  return ids;
}
const canSeePhone = (visible, id) => visible === 'all' || visible.has(id);

// List scholars and fellows (optional ?role=SCHOLAR or ?role=FELLOW)
router.get('/', async (req, res) => {
  const roles = ['SCHOLAR', 'FELLOW'].includes(req.query.role) ? [req.query.role] : ['SCHOLAR', 'FELLOW'];
  const users = await prisma.user.findMany({
    where: { role: { in: roles }, isActive: true },
    include: userInclude,
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
  const visible = await phoneVisibleIds(req.user);
  res.json({ profiles: users.map((u) => shape(u, canSeePhone(visible, u.id))) });
});

router.get('/:userId', async (req, res) => {
  const id = Number(req.params.userId);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Profile not found' });

  const user = await prisma.user.findUnique({ where: { id }, include: userInclude });
  const hidden =
    !user ||
    (!user.isActive && !req.user.isAdmin) ||
    (user.role === 'ADMIN' && user.id !== req.user.id && !req.user.isAdmin);
  if (hidden) return res.status(404).json({ error: 'Profile not found' });

  const visible = await phoneVisibleIds(req.user);
  res.json({ profile: shape(user, canSeePhone(visible, user.id)) });
});

// Edit: yourself, or any profile if you are an admin. Empty string clears a field.
const optional = (schema) => z.preprocess((v) => (v === '' ? null : v), schema.nullable().optional());
const handle = optional(z.string().regex(/^[A-Za-z0-9_.-]{1,40}$/, 'Invalid handle'));

const profileSchema = z.object({
  year: optional(z.number().int().min(1).max(5)),
  branch: optional(z.string().max(60)),
  rollNo: optional(z.string().max(30)),
  phone: optional(z.string().regex(/^\+?[0-9][0-9 ()-]{6,19}$/, 'Invalid phone number')),
  leetcodeHandle: handle,
  codeforcesHandle: handle,
  codechefHandle: handle,
  bio: optional(z.string().max(500)),
  avatarUrl: optional(z.string().url().max(500).refine((u) => u.startsWith('https://'), 'Avatar link must start with https://')),
}).refine((d) => Object.keys(d).length > 0, 'Nothing to update');

router.patch('/:userId', async (req, res) => {
  const id = Number(req.params.userId);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Profile not found' });
  if (id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'You can only edit your own profile' });
  }

  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return res.status(404).json({ error: 'Profile not found' });

  await prisma.profile.upsert({
    where: { userId: id },
    update: parsed.data,
    create: { userId: id, ...parsed.data },
  });

  const user = await prisma.user.findUnique({ where: { id }, include: userInclude });
  res.json({ profile: shape(user, true) }); // editor is the owner or an admin, so the phone is visible
});

module.exports = router;