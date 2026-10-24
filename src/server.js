const app = require('./app');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
