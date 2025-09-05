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

function generateIntentProbabilities(rng, tieHint = false) {
  // Generate 3 base probabilities then normalize
  const raw = [rng(), rng(), rng()];
  let s = raw[0] + raw[1] + raw[2] || 1;
  let p = raw.map(x => x / s);

  if (tieHint) {
    // deterministically pick a tie type and create a close tie
    const tieType = Math.floor(rng() * 3);
    const base = 0.38 + rng() * 0.08; // ~0.38-0.46
    const small = 0.02 + rng() * 0.06; // small perturbation
    const other = Math.max(0.02, 1 - base * 2 - small);
    if (tieType === 0) {
      p = [base + small / 2, base - small / 2, other];
    } else if (tieType === 1) {
      p = [other, base + small / 2, base - small / 2];
    } else {
      p = [base + small / 2, other, base - small / 2];
    }
  }

  // normalize & round
  s = p.reduce((a, b) => a + b, 0) || 1;
  p = p.map(x => x / s);
  return {
    expansion: Number(p[0].toFixed(4)),
    optimization: Number(p[1].toFixed(4)),
    new_project: Number(p[2].toFixed(4))
  };
}

// Small utility: generate a radar SVG (1280x720) showing 3 probabilities
function generateRadarSVG(probabilities, leadId) {
  const w = 1280;
  const h = 720;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.32;
  const labels = ['expansion', 'optimization', 'new_project'];
  const vals = [probabilities.expansion, probabilities.optimization, probabilities.new_project];

  const points = vals.map((v, i) => {
    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2; // start at top
    const x = cx + Math.cos(angle) * radius * v;
    const y = cy + Math.sin(angle) * radius * v;
    return `${x},${y}`;
  }).join(' ');

  // Axis lines and labels
  const axes = labels.map((lab, i) => {
    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const lx = cx + Math.cos(angle) * (radius + 40);
    const ly = cy + Math.sin(angle) * (radius + 40);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#ccc" stroke-width="2"/>` +
      `<text x="${lx}" y="${ly}" font-family="Arial" font-size="20" text-anchor="middle">${lab}</text>`;
  }).join('\n');

  const valueLabels = vals.map((v, i) => {
    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const lx = cx + Math.cos(angle) * (radius * 0.6);
    const ly = cy + Math.sin(angle) * (radius * 0.6) + 6;
    return `<text x="${lx}" y="${ly}" font-family="Arial" font-size="18" fill="#111" text-anchor="middle">${(v*100).toFixed(1)}%</text>`;
  }).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">\n` +
    `<rect width="100%" height="100%" fill="#ffffff"/>\n` +
    `${axes}\n` +
    `<polygon points="${points}" fill="#2b82ff55" stroke="#1f5fb433" stroke-width="4"/>\n` +
    `${valueLabels}\n` +
    `<text x="${cx}" y="40" font-family="Arial" font-size="22" text-anchor="middle">Radar - ${leadId}</text>\n` +
    `</svg>`;
  return svg;
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
  // deterministically choose 3 indices (within the 15) to be tie-cases
  const tiePositions = [];
  while (tiePositions.length < 3) {
    const p = Math.floor(rng() * 15);
    if (!tiePositions.includes(p)) tiePositions.push(p);
  }

  selectedLeads.forEach((lead, idx) => {
    const tieHint = tiePositions.includes(idx);
    const probabilities = generateIntentProbabilities(rng, tieHint);
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
    // generate radar SVG (and try PNG)
    const svg = generateRadarSVG(probabilities, lead.lead_id);
    const svgName = `${lead.lead_id}_IntentClassified_${ts}.svg`;
    const svgPath = path.join(outDir, svgName);
    fs.writeFileSync(svgPath, svg, 'utf8');

    // try to convert SVG -> PNG using sharp if available
    let pngPath = null;
    try {
      const sharp = require('sharp');
      const pngName = `${lead.lead_id}_IntentClassified_${ts}.png`;
      pngPath = path.join(outDir, pngName);
      // rasterize at 1280x720 (720p) - keep aspect
      sharp(Buffer.from(svg)).resize(1280, 720).png().toFile(pngPath);
    } catch (e) {
      console.warn('PNG conversion skipped (sharp not installed or failed):', e.message);
      pngPath = null;
    }

    // include asset paths in metadata
    intentData.assets = { svg: path.relative(path.join(__dirname,'..','data','mocks','outputs'), svgPath) };
    if (pngPath) intentData.assets.png = path.relative(path.join(__dirname,'..','data','mocks','outputs'), pngPath);

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