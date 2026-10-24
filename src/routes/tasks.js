const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { taskInclude, formatTask, loadVisibleTask } = require('../lib/tasks');

// All task routes: experts and admins only
router.use(requireAuth, requireRole('EXPERT', 'ADMIN'));

const idParam = (req) => Number(req.params.id);

// every id must be an active mentee of this expert
async function areOwnMentees(expertId, ids) {
  const unique = [...new Set(ids)];
  const count = await prisma.mentorship.count({
    where: { expertId, menteeId: { in: unique }, mentee: { isActive: true } },
  });
  return count === unique.length;
}

const taskFields = {
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  problemLinks: z.array(z.string().url()).max(20).default([]),
  difficulty: z.string().max(30).optional(),
};

const createSchema = z.object({
  ...taskFields,
  deadline: z.coerce.date().refine((d) => d > new Date(), 'Deadline must be in the future'),
  assigneeIds: z.array(z.number().int()).min(1, 'Assign to at least one person'),
});

const updateSchema = z.object({
  ...taskFields,
  deadline: z.coerce.date(),
}).partial();

// Create a task and its assignments in one go
router.post('/', requireRole('EXPERT'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { assigneeIds, ...fields } = parsed.data;
  const ids = [...new Set(assigneeIds)];

  if (!(await areOwnMentees(req.user.id, ids))) {
    return res.status(400).json({ error: 'You can only assign tasks to your own active mentees' });
  }

  const task = await prisma.task.create({
    data: {
      ...fields,
      createdById: req.user.id,
      assignments: { create: ids.map((assigneeId) => ({ assigneeId })) },
    },
    include: taskInclude,
  });
  res.status(201).json({ task: formatTask(task, req.user) });
});

// Admin: all tasks. Expert: tasks they created, or that involve one of their mentees.
router.get('/', async (req, res) => {
  const where = req.user.isAdmin ? {} : {
    OR: [
      { createdById: req.user.id },
      { assignments: { some: { assignee: { mentorLinks: { some: { expertId: req.user.id } } } } } },
    ],
  };
  const tasks = await prisma.task.findMany({ where, include: taskInclude, orderBy: { deadline: 'asc' } });
  res.json({ tasks: tasks.map((t) => formatTask(t, req.user)) });
});

router.get('/:id', async (req, res) => {
  const task = await loadVisibleTask(idParam(req), req.user);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task: formatTask(task, req.user) });
});

// Edit and delete: the creator only
async function loadOwnTask(req, res) {
  const task = await loadVisibleTask(idParam(req), req.user);
  if (!task) { res.status(404).json({ error: 'Task not found' }); return null; }
  if (task.createdById !== req.user.id) {
    res.status(403).json({ error: 'Only the creator can change this task' });
    return null;
  }
  return task;
}

router.patch('/:id', requireRole('EXPERT'), async (req, res) => {
  const task = await loadOwnTask(req, res);
  if (!task) return;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const updated = await prisma.task.update({
    where: { id: task.id }, data: parsed.data, include: taskInclude,
  });
  res.json({ task: formatTask(updated, req.user) });
});

// Deleting a task also deletes every assignee's progress on it
router.delete('/:id', requireRole('EXPERT'), async (req, res) => {
  const task = await loadOwnTask(req, res);
  if (!task) return;
  await prisma.task.delete({ where: { id: task.id } });
  res.json({ ok: true });
});

// Add more assignees to an existing task
router.post('/:id/assign', requireRole('EXPERT'), async (req, res) => {
  const task = await loadOwnTask(req, res);
  if (!task) return;
  const parsed = z.object({ assigneeIds: z.array(z.number().int()).min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'assigneeIds (at least one) required' });
  const ids = [...new Set(parsed.data.assigneeIds)];

  if (!(await areOwnMentees(req.user.id, ids))) {
    return res.status(400).json({ error: 'You can only assign tasks to your own active mentees' });
  }
  await prisma.taskAssignment.createMany({
    data: ids.map((assigneeId) => ({ taskId: task.id, assigneeId })),
    skipDuplicates: true,
  });
  const fresh = await loadVisibleTask(task.id, req.user);
  res.json({ task: formatTask(fresh, req.user) });
});

// Remove one assignee (their progress on this task is deleted)
router.delete('/:id/assignees/:assigneeId', requireRole('EXPERT'), async (req, res) => {
  const task = await loadOwnTask(req, res);
  if (!task) return;
  await prisma.taskAssignment.deleteMany({
    where: { taskId: task.id, assigneeId: Number(req.params.assigneeId) },
  });
  res.json({ ok: true });
});

module.exports = router;