const router = require('express').Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isOverdue } = require('../lib/tasks');
const { summarize } = require('../lib/stats');

router.use(requireAuth);

// Scholar/fellow: my own dashboard
router.get('/me', requireRole('SCHOLAR', 'FELLOW'), async (req, res) => {
  const rows = await prisma.taskAssignment.findMany({
    where: { assigneeId: req.user.id },
    include: {
      task: { select: { id: true, title: true, difficulty: true, deadline: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  const brief = (a) => ({
    assignmentId: a.id, taskId: a.task.id, title: a.task.title,
    difficulty: a.task.difficulty, deadline: a.task.deadline, status: a.status,
  });
  const byDeadline = (x, y) => new Date(x.task.deadline) - new Date(y.task.deadline);
  const open = rows.filter((a) => a.status === 'TODO' || a.status === 'IN_PROGRESS').sort(byDeadline);

  res.json({
    stats: summarize(rows),
    overdue: open.filter((a) => isOverdue(a.status, a.task.deadline)).map(brief),
    upcoming: open.filter((a) => !isOverdue(a.status, a.task.deadline)).slice(0, 5).map(brief),
    awaitingReview: rows.filter((a) => a.status === 'SUBMITTED').map(brief),
    recentFeedback: rows
      .filter((a) => a.expertFeedback)
      .sort((x, y) => new Date(y.reviewedAt || 0) - new Date(x.reviewedAt || 0))
      .slice(0, 5)
      .map((a) => ({
        assignmentId: a.id, title: a.task.title, feedback: a.expertFeedback,
        reviewedBy: a.reviewedBy, reviewedAt: a.reviewedAt,
      })),
  });
});

// Expert: own mentees. Admin: everyone.
router.get('/overview', requireRole('EXPERT', 'ADMIN'), async (req, res) => {
  const where = {
    role: { in: ['SCHOLAR', 'FELLOW'] },
    isActive: true,
    ...(req.user.isAdmin ? {} : { mentorLinks: { some: { expertId: req.user.id } } }),
  };
  const mentees = await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, role: true,
      mentorLinks: { select: { expert: { select: { id: true, name: true } } } },
      assignments: { select: { status: true, task: { select: { deadline: true } } } },
    },
  });

  const cards = mentees.map((m) => ({
    id: m.id, name: m.name, email: m.email, role: m.role,
    mentors: m.mentorLinks.map((l) => l.expert),
    stats: summarize(m.assignments),
  }));
  cards.sort((a, b) => b.stats.overdue - a.stats.overdue || a.name.localeCompare(b.name));

  const totals = { total: 0, todo: 0, inProgress: 0, submitted: 0, done: 0, overdue: 0, completionRate: 0 };
  for (const c of cards) {
    for (const k of ['total', 'todo', 'inProgress', 'submitted', 'done', 'overdue']) totals[k] += c.stats[k];
  }
  totals.completionRate = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;

  res.json({ totals, mentees: cards });
});

// Expert: submissions waiting for me to review (own mentees only), oldest first
router.get('/review-queue', requireRole('EXPERT'), async (req, res) => {
  const rows = await prisma.taskAssignment.findMany({
    where: {
      status: 'SUBMITTED',
      assignee: { isActive: true, mentorLinks: { some: { expertId: req.user.id } } },
    },
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      task: { select: { id: true, title: true, deadline: true, createdBy: { select: { id: true, name: true } } } },
    },
    orderBy: { updatedAt: 'asc' },
  });

  res.json({
    count: rows.length,
    queue: rows.map((a) => ({
      assignmentId: a.id,
      assignee: a.assignee,
      task: a.task,
      submissionLink: a.submissionLink,
      assigneeNote: a.assigneeNote,
      submittedAt: a.updatedAt,
      late: new Date(a.updatedAt) > new Date(a.task.deadline),
    })),
  });
});

module.exports = router;