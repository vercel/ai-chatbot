import express from 'express';
import { blueprint, type Phase } from './blueprint';

const app = express();
const port = process.env.PORT || 3001;

app.get('/journey/:phase', (req, res) => {
  const phase = req.params.phase as Phase;
  const nodes = blueprint[phase];
  if (!nodes) {
    return res.status(404).json({ error: 'Phase not found' });
  }
  res.json(nodes);
});

app.listen(port, () => {
  console.log(`REST API listening on port ${port}`);
});
