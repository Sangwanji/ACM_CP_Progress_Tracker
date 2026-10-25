const { isOverdue } = require('./tasks');

// assignments: [{ status, task: { deadline } }]
function summarize(assignments) {
  const stats = {
    total: assignments.length,
    todo: 0, inProgress: 0, submitted: 0, done: 0,
    overdue: 0, completionRate: 0, nextDeadline: null,
  };
  for (const a of assignments) {
    if (a.status === 'TODO') stats.todo++;
    else if (a.status === 'IN_PROGRESS') stats.inProgress++;
    else if (a.status === 'SUBMITTED') stats.submitted++;
    else if (a.status === 'DONE') stats.done++;

    const open = a.status === 'TODO' || a.status === 'IN_PROGRESS';
    const deadline = new Date(a.task.deadline);
    if (isOverdue(a.status, deadline)) stats.overdue++;
    else if (open && (!stats.nextDeadline || deadline < stats.nextDeadline)) stats.nextDeadline = deadline;
  }
  stats.completionRate = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  return stats;
}

module.exports = { summarize };