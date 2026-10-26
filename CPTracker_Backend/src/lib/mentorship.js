const prisma = require('./prisma');

async function isMentorOf(expertId, menteeId) {
  const link = await prisma.mentorship.findUnique({
    where: { expertId_menteeId: { expertId, menteeId } },
  });
  return !!link;
}

async function menteeIdsOf(expertId) {
  const rows = await prisma.mentorship.findMany({ where: { expertId }, select: { menteeId: true } });
  return rows.map((r) => r.menteeId);
}

// True only if every id is a distinct, active EXPERT
async function allActiveExperts(ids) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return false;
  const count = await prisma.user.count({
    where: { id: { in: unique }, role: 'EXPERT', isActive: true },
  });
  return count === unique.length;
}

module.exports = { isMentorOf, menteeIdsOf, allActiveExperts };