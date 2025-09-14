
export interface KBDoc {
  title: string;
  content: string;
  sourceUrl?: string;
}

export interface KBResult {
  title: string;
  snippet: string;
  score: number;
  sourceUrl?: string;
}

// In-memory TF-IDF index
let docs: KBDoc[] = [];
let docTermFreq: Array<Map<string, number>> = [];
let docNorm: number[] = [];
const df = new Map<string, number>();
let N = 0;

const STOP = new Set<string>([
  'a','o','os','as','de','da','do','das','dos','e','é','ser','em','um','uma','para','por','com','na','no','nas','nos','ao','à','às','ou','se','que','quero','qual','sobre','meu','minha','seu','sua','nosso','nossa','depois','antes','onde','como','quando','porque','pra','pro','lá','aqui'
]);

function tokenize(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\p{Diacritic}]/gu, '')
    .split(/[^a-z0-9@.+]+/i)
    .filter(Boolean)
    .filter(t => !STOP.has(t));
  return tokens;
}

function idf(term: string): number {
  const d = df.get(term) || 0;
  if (d === 0) return 0;
  return Math.log((1 + N) / (1 + d)) + 1;
}

export function loadKB(newDocs: KBDoc[]) {
  docs = [...newDocs];
  N = docs.length;
  docTermFreq = [];
  docNorm = [];
  df.clear();

  // Build term frequencies and document frequencies
  for (const d of docs) {
    const tf = new Map<string, number>();
    const tokens = tokenize(d.title + ' ' + d.content);
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    docTermFreq.push(tf);
    for (const t of new Set(tokens)) df.set(t, (df.get(t) || 0) + 1);
  }
  // Precompute norms
  for (const tf of docTermFreq) {
    let sum = 0;
    for (const [t, f] of tf) {
      const w = f * idf(t);
      sum += w * w;
    }
    docNorm.push(Math.sqrt(sum) || 1);
  }
}

export function search(query: string, topK = 3): KBResult[] {
  const qtf = new Map<string, number>();
  const qtoks = tokenize(query);
  for (const t of qtoks) qtf.set(t, (qtf.get(t) || 0) + 1);
  let qnorm = 0;
  for (const [t, f] of qtf) {
    const w = f * idf(t);
    qnorm += w * w;
  }
  qnorm = Math.sqrt(qnorm) || 1;

  const scores: number[] = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    const tf = docTermFreq[i];
    let dot = 0;
    for (const [t, f] of qtf) {
      const wq = f * idf(t);
      const wd = (tf.get(t) || 0) * idf(t);
      dot += wq * wd;
    }
    scores[i] = dot / (docNorm[i] * qnorm);
  }

  const pairs = scores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s).slice(0, topK);
  return pairs
    .filter(p => p.s > 0)
    .map(({ s, i }) => ({
      title: docs[i].title,
      snippet: docs[i].content.slice(0, 200),
      score: Number(s.toFixed(4)),
      sourceUrl: docs[i].sourceUrl,
    }));
}

// Legacy adapter used by some tests
export interface KbSnippet { snippet: string }
export async function kb_search(query: string): Promise<KbSnippet[]> {
  return search(query, 1).map(r => ({ snippet: r.snippet }));
}

// Seed minimal KB including official contacts
const DEFAULT_KB: KBDoc[] = [
  {
    title: 'Contatos Oficiais — Yello Solar Hub',
    content:
      'Telefone WhatsApp Yello Solar Hub — Compliance e Suporte: +55 (21) 97920-9021. ' +
      'Empresa Principal: +55 (21) 99637-1563. ' +
      'E-mails: fernando@yellosolarhub.com, contato@yellosolarhub.com.',
    sourceUrl: 'https://yellosolarhub.com/contatos',
  },
];

loadKB(DEFAULT_KB);
