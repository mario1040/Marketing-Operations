import express from 'express';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT || 3000);
const distPath = path.resolve(process.cwd(), 'dist');

app.use(express.static(distPath, {
  index: false,
  maxAge: '1h',
}));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Marketing Operations frontend listening on 0.0.0.0:${port}`);
});
