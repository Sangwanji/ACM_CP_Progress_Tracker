require('dotenv').config();
require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const prisma = require('./lib/prisma');


const app = express();

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 4);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/tasks', require('./routes/tasks'));
app.use('/assignments', require('./routes/assignments'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/profiles', require('./routes/profiles'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;
