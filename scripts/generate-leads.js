const fs = require('node:fs');
const path = require('node:path');

// PRNG determinístico
function mulberry32(a) {
  return () => {
    let t = a + 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Cache de dados IBGE (exemplo hardcoded)
const ibgeCache = {
  SP: { state_id: '35', cities: ['São Paulo', 'Campinas', 'Santo André'] },
  RJ: {
    state_id: '33',
    cities: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
  },
  MG: { state_id: '31', cities: ['Belo Horizonte', 'Uberlândia', 'Contagem'] },
  PR: { state_id: '41', cities: ['Curitiba', 'Londrina', 'Maringá'] },
  RS: { state_id: '43', cities: ['Porto Alegre', 'Caxias do Sul', 'Pelotas'] },
  BA: {
    state_id: '29',
    cities: ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
  },
  PE: {
    state_id: '26',
    cities: ['Recife', 'Jaboatão dos Guararapes', 'Olinda'],
  },
};

// Cache de irradiância (exemplo hardcoded baseado em dados reais aproximados)
const irradianceCache = {
  SP: { pvgis: 5.2, nasa: 5.1 },
  RJ: { pvgis: 5.0, nasa: 4.9 },
  MG: { pvgis: 5.3, nasa: 5.2 },
  PR: { pvgis: 4.8, nasa: 4.7 },
  RS: { pvgis: 4.5, nasa: 4.4 },
  BA: { pvgis: 5.8, nasa: 5.7 },
  PE: { pvgis: 5.6, nasa: 5.5 },
};

function generateCSV(leads_pf, leads_pj, outDir) {
  const Papa = require('papaparse');
  const allLeads = [...leads_pf, ...leads_pj];
  const csvData = allLeads.map((lead) => ({
    lead_id: lead.lead_id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    cpf: lead.cpf || '',
    cnpj: lead.cnpj || '',
    street: lead.address.street,
    number: lead.address.number,
    city: lead.address.city,
    state: lead.address.state,
    cep: lead.address.cep,
    lat: lead.coordinates.lat,
    lon: lead.coordinates.lon,
    system_size_kWp: lead.proposal.system_size_kWp,
    annual_production_kWh: lead.proposal.annual_production_kWh,
    coverage_pct: lead.proposal.coverage_pct,
    payback_years: lead.proposal.payback_years,
    estimated_cost_brl: lead.proposal.estimated_cost_brl,
    created_at: lead.created_at,
  }));

  const csv = Papa.unparse(csvData);
  const csvPath = path.join(outDir, '..', 'leads', 'leads_all.csv');
  fs.writeFileSync(csvPath, csv);
}

function generateGeoJSON(leads_pf, leads_pj, outDir) {
  const allLeads = [...leads_pf, ...leads_pj];
  const features = allLeads.map((lead) => ({
    type: 'Feature',
    properties: {
      lead_id: lead.lead_id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      cpf: lead.cpf || '',
      cnpj: lead.cnpj || '',
      street: lead.address.street,
      number: lead.address.number,
      city: lead.address.city,
      state: lead.address.state,
      cep: lead.address.cep,
      system_size_kWp: lead.proposal.system_size_kWp,
      annual_production_kWh: lead.proposal.annual_production_kWh,
      coverage_pct: lead.proposal.coverage_pct,
      payback_years: lead.proposal.payback_years,
      estimated_cost_brl: lead.proposal.estimated_cost_brl,
      created_at: lead.created_at,
    },
    geometry: {
      type: 'Point',
      coordinates: [lead.coordinates.lon, lead.coordinates.lat],
    },
  }));

  const geojson = {
    type: 'FeatureCollection',
    features: features,
  };

  const geojsonPath = path.join(outDir, '..', 'leads', 'leads_all.geojson');
  fs.writeFileSync(geojsonPath, JSON.stringify(geojson, null, 2));
}

function generateSVG(leads_pf, leads_pj, outDir) {
  const allLeads = [...leads_pf, ...leads_pj];
  const width = 800;
  const height = 600;

  // Simple projection (Brazil bounds approx)
  const minLon = -74;
  const maxLon = -35;
  const minLat = -34;
  const maxLat = 5;
  const scaleX = width / (maxLon - minLon);
  const scaleY = height / (maxLat - minLat);

  const points = allLeads
    .map((lead) => {
      const x = Math.max(
        0,
        Math.min(width, (lead.coordinates.lon - minLon) * scaleX),
      );
      const y = Math.max(
        0,
        Math.min(height, height - (lead.coordinates.lat - minLat) * scaleY),
      );
      return `<circle cx="${x}" cy="${y}" r="3" fill="blue" title="${lead.lead_id}"/>`;
    })
    .join('');

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    ${points}
  </svg>`;

  const svgPath = path.join(outDir, '..', 'leads', 'leads_map.svg');
  fs.writeFileSync(svgPath, svg);
}

function padLeadId(n) {
  return `L${String(n).padStart(6, '0')}`;
}

function sample(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function formatCPF(rng) {
  const nums = Array.from({ length: 11 }, () => Math.floor(rng() * 10));
  return (
    `${nums.slice(0, 3).join('')}.${nums.slice(3, 6).join('')}.${nums.slice(6, 9).join('')}-${nums.slice(9, 11).join('')}`
  );
}

function formatCNPJ(rng) {
  const nums = Array.from({ length: 14 }, () => Math.floor(rng() * 10));
  return (
    `${nums.slice(0, 2).join('')}.${nums.slice(2, 5).join('')}.${nums.slice(5, 8).join('')}/${nums.slice(8, 12).join('')}-${nums.slice(12, 14).join('')}`
  );
}

function makePhone(rng, ddd) {
  // 9-digit mobiles common pattern
  const rest = Array.from({ length: 9 }, () => Math.floor(rng() * 10)).join('');
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

function formatCEP(rng, valid = true) {
  const nums = Array.from({ length: 8 }, () => Math.floor(rng() * 10));
  if (!valid) nums[0] = 9; // force unlikely
  return `${nums.slice(0, 5).join('')}-${nums.slice(5).join('')}`;
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

function generate(seed, outDir) {
  const rng = mulberry32(seed);
  const states = {
    SP: { dd: '11' },
    RJ: { dd: '21' },
    MG: { dd: '31' },
    PR: { dd: '41' },
    RS: { dd: '51' },
    BA: { dd: '71' },
    PE: { dd: '81' },
  };
  const stateKeys = Object.keys(states);

  const leads_pf = [];
  const leads_pj = [];

  const total = 30;
  for (let i = 1; i <= total; i++) {
    const { lead, valid, state } = generateLead(rng, i, states, stateKeys);

    if (i > 20) {
      leads_pj.push(lead);
    } else {
      leads_pf.push(lead);
    }

    const outInvest = path.join(outDir, 'investigation');
    if (!fs.existsSync(outInvest)) fs.mkdirSync(outInvest, { recursive: true });
    const now = new Date();
    const ts = tsForFilename(now);

    injectViolations(lead, valid, rng);
    const { schemaValid, ajvErrors } = validateLead(lead, valid);
    writeArtifacts(lead, schemaValid, ajvErrors, rng, outInvest, ts, state);
  }

  const mocksDir = path.join(outDir, '..', 'leads');
  if (!fs.existsSync(mocksDir)) fs.mkdirSync(mocksDir, { recursive: true });

  fs.writeFileSync(
    path.join(mocksDir, 'leads_pf.json'),
    JSON.stringify(leads_pf, null, 2),
  );
  fs.writeFileSync(
    path.join(mocksDir, 'leads_pj.json'),
    JSON.stringify(leads_pj, null, 2),
  );

  // Generate additional formats
  generateCSV(leads_pf, leads_pj, outDir);
  generateGeoJSON(leads_pf, leads_pj, outDir);
  generateSVG(leads_pf, leads_pj, outDir);

  console.log(
    'Generated',
    leads_pf.length,
    'PF and',
    leads_pj.length,
    'PJ leads in',
    mocksDir,
  );
}

function generateAddress(rng, state, ddd, valid) {
  const city = `${state} City ${randomInt(rng, 1, 50)}`;
  return {
    street: `Rua ${Math.floor(rng() * 1000) + 1}`,
    number: String(randomInt(rng, 1, 9999)),
    complement: '',
    city: city,
    state: state,
    cep: formatCEP(rng, valid),
  };
}

function generateProposal(rng) {
  return {
    system_size_kWp: Number((rng() * 10 + 2).toFixed(2)),
    annual_production_kWh: Number((rng() * 12000 + 2000).toFixed(0)),
    coverage_pct: Number((rng() * 80 + 10).toFixed(1)),
    payback_years: Number((rng() * 8 + 3).toFixed(1)),
    estimated_cost_brl: Number((rng() * 50000 + 20000).toFixed(2)),
  };
}

function generateLead(rng, i, states, stateKeys) {
  const isPJ = i > 20;
  const lead_id = padLeadId(i);
  const state = sample(rng, stateKeys);
  const ddd = states[state].dd;
  const valid = rng() > 0.1;

  const address = generateAddress(rng, state, ddd, valid);
  const name = isPJ ? `Empresa ${lead_id}` : `Pessoa ${lead_id}`;
  const email = valid
    ? `${name.toLowerCase().replace(/\s+/g, '')}@example.com`
    : `${name.toLowerCase()}_at_example.com`;
  const phone = valid ? makePhone(rng, ddd) : '(00) 1234-567';
  const proposal = generateProposal(rng);

  const lead = {
    lead_id,
    name,
    email,
    phone,
    address,
    proposal,
    created_at: isoNow(rng),
  };

  if (isPJ) {
    lead.cnpj = formatCNPJ(rng);
  } else {
    lead.cpf = formatCPF(rng);
  }

  return { lead, valid, state, ddd };
}

function injectViolations(lead, valid, rng) {
  if (!valid) {
    const v = Math.floor(rng() * 3);
    if (v === 0) {
      lead.email = lead.email.replace('@', '_at_');
    } else if (v === 1) {
      lead.phone = '(00) 1234-567';
    } else {
      lead.address.cep = lead.address.cep.replace('-', '');
    }
  }
}

function validateLead(lead, valid) {
  let ajvErrors = null;
  let schemaValid = valid;
  try {
    const Ajv = require('ajv');
    const addFormats = require('ajv-formats');
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'data', 'schemas', 'lead.schema.json'),
        'utf8',
      ),
    );
    const validate = ajv.compile(schema);
    const ok = validate(lead);
    schemaValid = ok;
    if (!ok) ajvErrors = validate.errors;
  } catch (e) {
    console.warn('Schema validation failed, falling back:', e.message);
  }
  return { schemaValid, ajvErrors };
}

function writeArtifacts(
  lead,
  schemaValid,
  ajvErrors,
  rng,
  outInvest,
  ts,
  state,
) {
  const validObj = {
    lead_id: lead.lead_id,
    valid: schemaValid,
    violations: schemaValid ? [] : ajvErrors || ['invalid_contact'],
    normalized_fields: { email: lead.email.toLowerCase() },
    confidence: schemaValid ? 0.98 : 0.3,
    rules_version: 'v1.0',
    checked_at: isoNow(rng),
  };
  fs.writeFileSync(
    path.join(outInvest, `${lead.lead_id}_LeadDataValidated_${ts}.json`),
    JSON.stringify(validObj, null, 2),
  );

  const coords = [
    Number((-55 + rng() * 20).toFixed(6)),
    Number((-25 + rng() * 30).toFixed(6)),
  ];
  lead.coordinates = { lat: coords[1], lon: coords[0] };

  const provider = sample(rng, ['PVGIS', 'NASA_POWER']);
  const irradiance = irradianceCache[state][provider.toLowerCase()];
  const enrich = {
    lead_id: lead.lead_id,
    geocode: { lat: coords[1], lon: coords[0], provider: provider },
    territorial: {
      ibge_ids: {
        state: ibgeCache[state].state_id,
        city: String(randomInt(rng, 3500000, 3599999)),
      },
      city_name: sample(rng, ibgeCache[state].cities),
    },
    economics: { bcb_sgs: { inflation: 3.5 + rng() * 2 } },
    irradiance: {
      provider: provider,
      value_kWh_m2_day: irradiance,
      meta: {
        tilt: 20 + Math.floor(rng() * 20),
        azimuth: Math.floor(rng() * 360),
      },
    },
    provenance: ['generated'],
    enriched_at: isoNow(rng),
  };
  fs.writeFileSync(
    path.join(outInvest, `${lead.lead_id}_LeadProfileEnriched_${ts}.json`),
    JSON.stringify(enrich, null, 2),
  );
}

if (require.main === module) {
  const seed = Number.parseInt(process.argv[2] || '42', 10);
  const out = path.join(__dirname, '..', 'data', 'mocks', 'outputs');
  generate(seed, out);
}
