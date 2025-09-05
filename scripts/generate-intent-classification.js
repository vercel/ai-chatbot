const fs = require('node:fs');
const path = require('node:path');

// PRNG determinístico
function mulberry32(a) {
  return () => {
    let t = a + 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function sample(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function isoNow(rng, offsetDays = 0) {
  const base = Date.now() - Math.floor(rng() * 1000 * 60 * 60 * 24 * 365);
  const d = new Date(base + offsetDays * 24 * 3600 * 1000);
  return d.toISOString();
}

function tsForFilename(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

function generateIntentProbabilities(rng) {
  // Generate 3 probabilities that sum to 1
  let probs = [];
  let sum = 0;

  // Generate base probabilities
  for (let i = 0; i < 3; i++) {
    const p = rng();
    probs.push(p);
    sum += p;
  }

  // Normalize to sum = 1
  probs = probs.map(p => p / sum);

  // Create close ties for at least 3 cases (every 5th lead)
  if (Math.floor(rng() * 5) === 0) {
    const tieType = Math.floor(rng() * 3);
    if (tieType === 0) {
      // Tie between expansion and optimization
      const base = 0.4 + rng() * 0.1;
      const diff = (rng() - 0.5) * 0.05;
      probs = [base + diff, base - diff, 0.2 + rng() * 0.1];
    } else if (tieType === 1) {
      // Tie between optimization and new project
      const base = 0.4 + rng() * 0.1;
      const diff = (rng() - 0.5) * 0.05;
      probs = [0.2 + rng() * 0.1, base + diff, base - diff];
    } else {
      // Tie between expansion and new project
      const base = 0.4 + rng() * 0.1;
      const diff = (rng() - 0.5) * 0.05;
      probs = [base + diff, 0.2 + rng() * 0.1, base - diff];
    }
    // Re-normalize
    sum = probs.reduce((a, b) => a + b, 0);
    probs = probs.map(p => p / sum);
  }

  return {
    expansion: Number(probs[0].toFixed(4)),
    optimization: Number(probs[1].toFixed(4)),
    new_project: Number(probs[2].toFixed(4))
  };
}

function determineIntents(probabilities) {
  const probs = Object.entries(probabilities);
  probs.sort((a, b) => b[1] - a[1]);

  return {
    primary_intent: probs[0][0],
    secondary_intent: probs[1][0]
  };
}

function generateIntentClassification(seed, leads) {
  const rng = mulberry32(seed);

  // Select 15 leads deterministically
  const selectedLeads = [];
  const indices = [];
  while (indices.length < 15) {
    const idx = Math.floor(rng() * leads.length);
    if (!indices.includes(idx)) {
      indices.push(idx);
      selectedLeads.push(leads[idx]);
    }
  }

  const outDir = path.join(__dirname, '..', 'data', 'mocks', 'outputs', 'investigation', 'outputs_IntentClassified');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const now = new Date();
  const ts = tsForFilename(now);

  selectedLeads.forEach(lead => {
    const probabilities = generateIntentProbabilities(rng);
    const intents = determineIntents(probabilities);
    const confidence = 0.55 + rng() * 0.43; // 0.55 to 0.98

    const intentData = {
      lead_id: lead.lead_id,
      primary_intent: intents.primary_intent,
      secondary_intent: intents.secondary_intent,
      probabilities: probabilities,
      confidence: Number(confidence.toFixed(3)),
      source: 'intent-classification-model-v1.0',
      classified_at: isoNow(rng)
    };

    const filename = `${lead.lead_id}_IntentClassified_${ts}.json`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(intentData, null, 2));
  });

  console.log(`Generated intent classifications for ${selectedLeads.length} leads in ${outDir}`);
  return selectedLeads;
}

if (require.main === module) {
  // Load leads from MP-01
  const leadsPfPath = path.join(__dirname, '..', 'data', 'mocks', 'leads', 'leads_pf.json');
  const leadsPjPath = path.join(__dirname, '..', 'data', 'mocks', 'leads', 'leads_pj.json');

  let allLeads = [];

  if (fs.existsSync(leadsPfPath)) {
    const pfLeads = JSON.parse(fs.readFileSync(leadsPfPath, 'utf8'));
    allLeads = allLeads.concat(pfLeads);
  }

  if (fs.existsSync(leadsPjPath)) {
    const pjLeads = JSON.parse(fs.readFileSync(leadsPjPath, 'utf8'));
    allLeads = allLeads.concat(pjLeads);
  }

  if (allLeads.length === 0) {
    console.error('No leads found from MP-01. Please run MP-01 first.');
    process.exit(1);
  }

  const seed = 73;
  generateIntentClassification(seed, allLeads);
}