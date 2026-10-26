const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isMentorOf } = require('../lib/mentorship');
const { isOverdue } = require('../lib/tasks');

const idParam = (req) => Number(req.params.id);

const present = (a) => ({
  id: a.id,
  status: a.status,
  overdue: isOverdue(a.status, a.task.deadline),
  submissionLink: a.submissionLink,
  assigneeNote: a.assigneeNote,
  expertFeedback: a.expertFeedback,
  reviewedBy: a.reviewedBy,   // NEW
  reviewedAt: a.reviewedAt,   // NEW
  completedAt: a.completedAt,
  updatedAt: a.updatedAt,
  task: a.task,
});

const taskSelect = {
  select: {
    id: true, title: true, description: true, problemLinks: true,
    difficulty: true, deadline: true, createdById: true,
    createdBy: { select: { id: true, name: true } },
  },
};

// NEW: shared include, used by every query below
const include = {
  task: taskSelect,
  reviewedBy: { select: { id: true, name: true } },
};

// Scholar/fellow: my tasks, soonest deadline first
router.get('/mine', requireAuth, requireRole('SCHOLAR', 'FELLOW'), async (req, res) => {
  const rows = await prisma.taskAssignment.findMany({
    where: { assigneeId: req.user.id },
    include,
    orderBy: { task: { deadline: 'asc' } },
  });
  res.json({ assignments: rows.map(present) });
});

// Scholar/fellow: update my own progress
const progressSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'SUBMITTED']).optional(),
  submissionLink: z.string().url().max(500).nullable().optional(),
  assigneeNote: z.string().max(1000).nullable().optional(),
}).refine((d) => Object.keys(d).length > 0, 'Nothing to update');

router.patch('/:id', requireAuth, requireRole('SCHOLAR', 'FELLOW'), async (req, res) => {
  const parsed = progressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const a = await prisma.taskAssignment.findFirst({
    where: { id: idParam(req), assigneeId: req.user.id },
  });
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  if (a.status === 'DONE') {
    return res.status(409).json({ error: 'Already marked done. Ask your expert to reopen it.' });
  }

  const link = parsed.data.submissionLink !== undefined ? parsed.data.submissionLink : a.submissionLink;
  if (parsed.data.status === 'SUBMITTED' && !link) {
    return res.status(400).json({ error: 'Add a submission link before submitting' });
  }

  const updated = await prisma.taskAssignment.update({
    where: { id: a.id },
    data: parsed.data,
    include,
  });
  res.json({ assignment: present(updated) });
});

// Expert: give feedback, mark done, or reopen
const reviewSchema = z.object({
  decision: z.enum(['DONE', 'REOPEN']).optional(),
  feedback: z.string().max(2000).optional(),
}).refine((d) => d.decision || d.feedback !== undefined, 'Provide a decision or feedback');

router.patch('/:id/review', requireAuth, requireRole('EXPERT'), async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const a = await prisma.taskAssignment.findUnique({
    where: { id: idParam(req) },
    include,
  });
  if (!a) return res.status(404).json({ error: 'Assignment not found' });

  const allowed = a.task.createdById === req.user.id || (await isMentorOf(req.user.id, a.assigneeId));
  if (!allowed) return res.status(403).json({ error: 'You are not an expert of this person' });

  const data = {};
  if (parsed.data.feedback !== undefined) data.expertFeedback = parsed.data.feedback;
  if (parsed.data.decision === 'DONE') { data.status = 'DONE'; data.completedAt = new Date(); }
  if (parsed.data.decision === 'REOPEN') { data.status = 'IN_PROGRESS'; data.completedAt = null; }

  // NEW: record who reviewed and when
  data.reviewedById = req.user.id;
  data.reviewedAt = new Date();

  const updated = await prisma.taskAssignment.update({
    where: { id: a.id }, data, include,
  });
  res.json({ assignment: present(updated) });
});

module.exports = router;