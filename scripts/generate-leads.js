const fs = require('fs');
const path = require('path');

// Deterministic PRNG based on seed
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function padLeadId(n) {
  return 'L' + String(n).padStart(6, '0');
}

function sample(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function randomInt(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }

function formatCPF(rng) {
  const nums = Array.from({length:11}, () => Math.floor(rng()*10));
  return nums.slice(0,3).join('') + '.' + nums.slice(3,6).join('') + '.' + nums.slice(6,9).join('') + '-' + nums.slice(9,11).join('');
}

function formatCNPJ(rng) {
  const nums = Array.from({length:14}, () => Math.floor(rng()*10));
  return nums.slice(0,2).join('') + '.' + nums.slice(2,5).join('') + '.' + nums.slice(5,8).join('') + '/' + nums.slice(8,12).join('') + '-' + nums.slice(12,14).join('');
}

function makePhone(rng, ddd) {
  // 9-digit mobiles common pattern
  const rest = Array.from({length:9}, () => Math.floor(rng()*10)).join('');
  return `(${ddd}) ${rest.slice(0,5)}-${rest.slice(5)}`;
}

function formatCEP(rng, valid=true) {
  const nums = Array.from({length:8}, () => Math.floor(rng()*10));
  if (!valid) nums[0] = 9; // force unlikely
  return nums.slice(0,5).join('') + '-' + nums.slice(5).join('');
}

function isoNow(rng, offsetDays=0) {
  const base = Date.now() - Math.floor(rng()*1000*60*60*24*365);
  const d = new Date(base + offsetDays*24*3600*1000);
  return d.toISOString();
}

function tsForFilename(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth()+1).padStart(2,'0');
  const dd = String(d.getUTCDate()).padStart(2,'0');
  const hh = String(d.getUTCHours()).padStart(2,'0');
  const min = String(d.getUTCMinutes()).padStart(2,'0');
  const ss = String(d.getUTCSeconds()).padStart(2,'0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

function generate(seed, outDir) {
  const rng = mulberry32(seed);
  const states = {
    'SP': {dd: '11'}, 'RJ': {dd: '21'}, 'MG': {dd: '31'}, 'PR': {dd: '41'}, 'RS': {dd: '51'},
    'BA': {dd: '71'}, 'PE': {dd: '81'}
  };
  const stateKeys = Object.keys(states);

  const leads_pf = [];
  const leads_pj = [];

  const total = 30;
  for (let i=1;i<=total;i++) {
    const isPJ = i > 20; // 20 PF, 10 PJ
    const lead_id = padLeadId(i);
    const state = sample(rng, stateKeys);
    const ddd = states[state].dd;
    const city = state + ' City ' + randomInt(rng,1,50);
    const valid = rng() > 0.10; // 10% invalid

    const address = {
      street: 'Rua ' + (Math.floor(rng()*1000)+1),
      number: String(randomInt(rng,1,9999)),
      complement: '',
      city: city,
      state: state,
      cep: formatCEP(rng, valid)
    };

    const name = isPJ ? ('Empresa ' + lead_id) : ('Pessoa ' + lead_id);
    const email = valid ? `${name.toLowerCase().replace(/\s+/g,'')}@example.com` : `${name.toLowerCase()}_at_example.com`;
    const phone = valid ? makePhone(rng, ddd) : '(00) 1234-567';

    const proposal = {
      system_size_kWp: Number((rng()*10 + 2).toFixed(2)),
      annual_production_kWh: Number((rng()*12000 + 2000).toFixed(0)),
      coverage_pct: Number((rng()*80 + 10).toFixed(1)),
      payback_years: Number((rng()*8 + 3).toFixed(1)),
      estimated_cost_brl: Number((rng()*50000 + 20000).toFixed(2))
    };

    const lead = {
      lead_id,
      name,
      email,
      phone,
      address,
      proposal,
      created_at: isoNow(rng)
    };

    if (isPJ) {
      lead.cnpj = formatCNPJ(rng);
      leads_pj.push(lead);
    } else {
      lead.cpf = formatCPF(rng);
      leads_pf.push(lead);
    }

    // Write individual enrichment/validation artifacts
    const outInvest = path.join(outDir, 'investigation');
    if (!fs.existsSync(outInvest)) fs.mkdirSync(outInvest, { recursive: true });
    // Timestamp for filenames
    const now = new Date();
    const ts = tsForFilename(now);

    // Prepare validation object; try to use AJV if available to validate against schema
    let ajvErrors = null;
    let schemaValid = valid;
    try {
      const Ajv = require('ajv');
      const addFormats = require('ajv-formats');
      const ajv = new Ajv({ allErrors: true, strict: false });
      addFormats(ajv);
      const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'schemas', 'lead.schema.json'), 'utf8'));
      const validate = ajv.compile(schema);
      const ok = validate(lead);
      schemaValid = ok;
      if (!ok) ajvErrors = validate.errors;
    } catch (e) {
      // Ajv not installed or error - fall back to basic validity flag
      // console.warn('AJV not available, skipping full schema validation');
    }

    const validObj = {
      lead_id,
      valid: schemaValid,
      violations: schemaValid ? [] : (ajvErrors || [ 'invalid_contact' ]),
      normalized_fields: { email: email.toLowerCase() },
      confidence: schemaValid ? 0.98 : 0.3,
      rules_version: 'v1.0',
      checked_at: isoNow(rng)
    };
    fs.writeFileSync(path.join(outInvest, `${lead_id}_LeadDataValidated_${ts}.json`), JSON.stringify(validObj, null, 2));

    const coords = [Number((-35 + rng()*30).toFixed(6)), Number((-15 + rng()*25).toFixed(6))];
    // Inject some violation types when invalid
    if (!valid) {
      // randomly choose a violation type
      const v = Math.floor(rng()*3);
      if (v === 0) {
        // malformed email
        lead.email = lead.email.replace('@', '_at_');
      } else if (v === 1) {
        lead.phone = '(00) 1234-567';
      } else {
        lead.address.cep = lead.address.cep.replace('-', '');
      }
    }

    // attach coordinates (schema requires)
    lead.coordinates = { lat: coords[1], lon: coords[0] };

    const enrich = {
      lead_id,
      geocode: { lat: coords[1], lon: coords[0], provider: sample(rng, ['PVGIS','NASA_POWER']) },
      territorial: { ibge_ids: { state: '35', city: String(randomInt(rng, 3500000, 3599999)) } },
      economics: { bcb_sgs: { inflation: 3.5 } },
      irradiance: { provider: sample(rng, ['PVGIS','NASA_POWER']), meta: { tilt: 20 } },
      provenance: [ 'generated' ],
      enriched_at: isoNow(rng)
    };
    fs.writeFileSync(path.join(outInvest, `${lead_id}_LeadProfileEnriched_${ts}.json`), JSON.stringify(enrich, null, 2));
  }

  const mocksDir = path.join(outDir, '..', 'leads');
  if (!fs.existsSync(mocksDir)) fs.mkdirSync(mocksDir, { recursive: true });

  fs.writeFileSync(path.join(mocksDir, 'leads_pf.json'), JSON.stringify(leads_pf, null, 2));
  fs.writeFileSync(path.join(mocksDir, 'leads_pj.json'), JSON.stringify(leads_pj, null, 2));

  console.log('Generated', leads_pf.length, 'PF and', leads_pj.length, 'PJ leads in', mocksDir);
}

function generateAddress(rng, state, ddd, valid) {
  const city = state + ' City ' + randomInt(rng, 1, 50);
  return {
    street: 'Rua ' + (Math.floor(rng() * 1000) + 1),
    number: String(randomInt(rng, 1, 9999)),
    complement: '',
    city: city,
    state: state,
    cep: formatCEP(rng, valid)
  };
}

function generateProposal(rng) {
  return {
    system_size_kWp: Number((rng() * 10 + 2).toFixed(2)),
    annual_production_kWh: Number((rng() * 12000 + 2000).toFixed(0)),
    coverage_pct: Number((rng() * 80 + 10).toFixed(1)),
    payback_years: Number((rng() * 8 + 3).toFixed(1)),
    estimated_cost_brl: Number((rng() * 50000 + 20000).toFixed(2))
  };
}

function generateLead(rng, i, states, stateKeys) {
  const isPJ = i > 20;
  const lead_id = padLeadId(i);
  const state = sample(rng, stateKeys);
  const ddd = states[state].dd;
  const valid = rng() > 0.10;

  const address = generateAddress(rng, state, ddd, valid);
  const name = isPJ ? ('Empresa ' + lead_id) : ('Pessoa ' + lead_id);
  const email = valid ? `${name.toLowerCase().replace(/\s+/g, '')}@example.com` : `${name.toLowerCase()}_at_example.com`;
  const phone = valid ? makePhone(rng, ddd) : '(00) 1234-567';
  const proposal = generateProposal(rng);

  const lead = {
    lead_id,
    name,
    email,
    phone,
    address,
    proposal,
    created_at: isoNow(rng)
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
    const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'schemas', 'lead.schema.json'), 'utf8'));
    const validate = ajv.compile(schema);
    const ok = validate(lead);
    schemaValid = ok;
    if (!ok) ajvErrors = validate.errors;
  } catch (e) {
    // Fall back
  }
  return { schemaValid, ajvErrors };
}

function writeArtifacts(lead, schemaValid, ajvErrors, rng, outInvest, ts) {
  const validObj = {
    lead_id: lead.lead_id,
    valid: schemaValid,
    violations: schemaValid ? [] : (ajvErrors || ['invalid_contact']),
    normalized_fields: { email: lead.email.toLowerCase() },
    confidence: schemaValid ? 0.98 : 0.3,
    rules_version: 'v1.0',
    checked_at: isoNow(rng)
  };
  fs.writeFileSync(path.join(outInvest, `${lead.lead_id}_LeadDataValidated_${ts}.json`), JSON.stringify(validObj, null, 2));

  const coords = [Number((-35 + rng() * 30).toFixed(6)), Number((-15 + rng() * 25).toFixed(6))];
  lead.coordinates = { lat: coords[1], lon: coords[0] };

  const enrich = {
    lead_id: lead.lead_id,
    geocode: { lat: coords[1], lon: coords[0], provider: sample(rng, ['PVGIS', 'NASA_POWER']) },
    territorial: { ibge_ids: { state: '35', city: String(randomInt(rng, 3500000, 3599999)) } },
    economics: { bcb_sgs: { inflation: 3.5 } },
    irradiance: { provider: sample(rng, ['PVGIS', 'NASA_POWER']), meta: { tilt: 20 } },
    provenance: ['generated'],
    enriched_at: isoNow(rng)
  };
  fs.writeFileSync(path.join(outInvest, `${lead.lead_id}_LeadProfileEnriched_${ts}.json`), JSON.stringify(enrich, null, 2));
}

if (require.main === module) {
  const seed = parseInt(process.argv[2] || '42', 10);
  const out = path.join(__dirname, '..', 'data', 'mocks', 'outputs');
  generate(seed, out);
}
