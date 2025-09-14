import express from 'express';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 4000);
const TOKEN = process.env.MCP_TOKEN || 'dev-token';

const sent = new Map<string, { at: number; body: any }>();

app.get('/health', (_req, res) => {
  res.json({ ok: true, now: Date.now() });
});

app.post('/send', (req, res) => {
  const auth = req.headers['authorization'] || '';
  if (!auth.toString().startsWith(`Bearer `)) return res.status(401).json({ error: 'unauthorized' });
  const tok = auth.toString().slice(7);
  if (tok !== TOKEN) return res.status(403).json({ error: 'forbidden' });

  const id = (req.headers['idempotency-key'] as string) || req.body?.id || `sim-${Date.now()}`;
  if (sent.has(id)) {
    return res.json({ status: 'sent', id, deduped: true });
  }
  sent.set(id, { at: Date.now(), body: req.body });
  return res.json({ status: 'sent', id });
});

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`MCP simulator listening on http://localhost:${PORT}`);
  });
}

export default app;

