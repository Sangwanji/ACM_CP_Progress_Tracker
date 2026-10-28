const prisma = require('./prisma');

const taskInclude = {
  createdBy: { select: { id: true, name: true } },
  assignments: {
    orderBy: { id: 'asc' },
    include: {
      assignee: {
        select: { id: true, name: true, role: true, mentorLinks: { select: { expertId: true } } },
      },
       reviewedBy: { select: { id: true, name: true } },
    },
  },
};

const isOverdue = (status, deadline) =>
  (status === 'TODO' || status === 'IN_PROGRESS') && new Date(deadline) < new Date();

// The creator and admins see every assignee. Other experts see only their own mentees.
function formatTask(task, user) {
  const seeAll = user.isAdmin || task.createdById === user.id;
  const { assignments, ...rest } = task;
  return {
    ...rest,
    assignments: assignments
      .filter((a) => seeAll || a.assignee.mentorLinks.some((l) => l.expertId === user.id))
      .map((a) => ({
        id: a.id,
        assignee: { id: a.assignee.id, name: a.assignee.name, role: a.assignee.role },
        status: a.status,
        overdue: isOverdue(a.status, task.deadline),
        submissionLink: a.submissionLink,
        assigneeNote: a.assigneeNote,
        expertFeedback: a.expertFeedback,
        reviewedBy: a.reviewedBy,
        reviewedAt: a.reviewedAt,
        completedAt: a.completedAt,
        updatedAt: a.updatedAt,
      })),
  };
}

// Returns the task only if this user may see it, otherwise null (reported as 404)
async function loadVisibleTask(id, user) {
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) return null;
  if (user.isAdmin || task.createdById === user.id) return task;
  const mine = task.assignments.some((a) => a.assignee.mentorLinks.some((l) => l.expertId === user.id));
  return mine ? task : null;
}

module.exports = { taskInclude, isOverdue, formatTask, loadVisibleTask };