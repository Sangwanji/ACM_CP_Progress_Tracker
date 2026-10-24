require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ---- EDIT THIS: real names and emails ---------------------------------------
// Pure admins: manage accounts and mentors, but are not experts and have no mentees
const ADMINS = [
  { name: 'Yuvraj Singh Chauhan', email: 'chairperson@acmiiitu.in' },
];

// key = a local label used only for wiring mentors below
const EXPERTS = [
  { key: 'e1', name: 'Saksham Sangwan',  email: 'vicechairperson@acmiiitu.in',  isAdmin: true },
  { key: 'e2', name: 'Aryan Raj', email: '24113@iiitu.ac.in' },
  { key: 'e3', name: 'Shaurya Pandey', email: '24363@iiitu.ac.in' },
  { key: 'e4', name: 'Shivansh Pandey', email: '24266@iiitu.ac.in' },
];

// One scholar under each of three experts
const SCHOLARS = [
  { name: 'Krishna Malhotra', email: '25btec036@iiitu.ac.in', mentors: ['e3'] },
  { name: 'Vaibhav Shukla', email: '25btcs145@iiitu.ac.in', mentors: ['e4'] },
  { name: 'Harshit Gupta', email: '25btcy012@iiitu.ac.in', mentors: ['e2'] },
];

// Placeholder split (3 under one expert, 2 under another). Adjust to your real split.
const FELLOWS = [
  { name: 'Naman Gupta', email: '26btcs083@iiitu.ac.in', mentors: ['e1','e4'] },
  { name: 'Kratika Saxena', email: '26btcs070@iiitu.ac.in', mentors: ['e2','e3'] },
  { name: 'Chandra Veer Singh', email: '26btcs044@iiitu.ac.in', mentors: ['e2','e3'] },
  { name: 'Paras Santani', email: '26btcs091@iiitu.ac.in', mentors: ['e2','e3'] },
  { name: 'Nitika Gupta', email: '26btec045@iiitu.ac.in', mentors: ['e1','e4'] },
];
// -----------------------------------------------------------------------------

const tempPassword = () => crypto.randomBytes(6).toString('base64url'); // 8 chars

async function upsertUser({ name, email, role, isAdmin = false, mentorIds = [], year }) {
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    console.log(`skip (exists): ${normalized}`);
    return { user: existing, password: null };
  }
  const password = tempPassword();
  const user = await prisma.user.create({
    data: {
      name, email: normalized, role, isAdmin,
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: true,
      profile: { create: { year } },
      mentorLinks: { create: mentorIds.map((expertId) => ({ expertId })) },
    },
  });
  return { user, password };
}

async function main() {
  const creds = [];
  const idByKey = {};

  for (const a of ADMINS) {
    const { user, password } = await upsertUser({ ...a, role: 'ADMIN', isAdmin: true });
    if (password) creds.push(`ADMIN    ${user.email}  ${password}`);
  }
  for (const e of EXPERTS) {
    const { user, password } = await upsertUser({ ...e, role: 'EXPERT', year: 3 });
    idByKey[e.key] = user.id;
    if (password) creds.push(`EXPERT   ${user.email}  ${password}`);
  }
  for (const s of SCHOLARS) {
    const { user, password } = await upsertUser({ ...s, role: 'SCHOLAR', mentorIds: s.mentors.map((k) => idByKey[k]), year: 2 });
    if (password) creds.push(`SCHOLAR  ${user.email}  ${password}`);
  }
  for (const f of FELLOWS) {
    const { user, password } = await upsertUser({ ...f, role: 'FELLOW', mentorIds: f.mentors.map((k) => idByKey[k]), year: 1 });
    if (password) creds.push(`FELLOW   ${user.email}  ${password}`);
  }

  if (creds.length) {
    fs.writeFileSync('seed-credentials.txt', creds.join('\n') + '\n');
    console.log(`\nCreated ${creds.length} users. Temporary passwords saved to seed-credentials.txt`);
    console.log('Share each one privately. Everyone must change it on first login.');
  } else {
    console.log('Nothing new to create.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
