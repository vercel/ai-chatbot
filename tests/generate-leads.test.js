import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// Helper to run the generator
function runGenerator(seed) {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'generate-leads.js');
  execSync(`node ${scriptPath} ${seed}`, { stdio: 'pipe' });
}

describe('Lead Generator', () => {
  it('should generate deterministic leads with same seed', () => {
    const seed = 42;
    runGenerator(seed);

    const leadsPath1 = path.join(__dirname, '..', 'data', 'mocks', 'leads', 'leads_pf.json');
    const leads1 = JSON.parse(fs.readFileSync(leadsPath1, 'utf8'));

    runGenerator(seed);

    const leadsPath2 = path.join(__dirname, '..', 'data', 'mocks', 'leads', 'leads_pf.json');
    const leads2 = JSON.parse(fs.readFileSync(leadsPath2, 'utf8'));

    // Compare deterministic fields, ignoring timestamps
    leads1.forEach((lead, i) => {
      const lead2 = leads2[i];
      expect(lead.lead_id).toBe(lead2.lead_id);
      expect(lead.name).toBe(lead2.name);
      expect(lead.email).toBe(lead2.email);
      expect(lead.phone).toBe(lead2.phone);
      expect(lead.cpf).toBe(lead2.cpf);
      expect(lead.address).toEqual(lead2.address);
      expect(lead.proposal).toEqual(lead2.proposal);
      expect(lead.coordinates).toEqual(lead2.coordinates);
    });
  });

  it('should generate 20 PF and 10 PJ leads', () => {
    const seed = 123;
    runGenerator(seed);

    const pfPath = path.join(__dirname, '..', 'data', 'mocks', 'leads', 'leads_pf.json');
    const pjPath = path.join(__dirname, '..', 'data', 'mocks', 'leads', 'leads_pj.json');

    const pfLeads = JSON.parse(fs.readFileSync(pfPath, 'utf8'));
    const pjLeads = JSON.parse(fs.readFileSync(pjPath, 'utf8'));

    expect(pfLeads).toHaveLength(20);
    expect(pjLeads).toHaveLength(10);
  });

  it('should generate leads with correct format', () => {
    const seed = 456;
    runGenerator(seed);

    const pfPath = path.join(__dirname, '..', 'data', 'mocks', 'leads', 'leads_pf.json');
    const pfLeads = JSON.parse(fs.readFileSync(pfPath, 'utf8'));

    const lead = pfLeads[0];
    expect(lead).toHaveProperty('lead_id');
    expect(lead.lead_id).toMatch(/^L\d{6}$/);
    expect(lead).toHaveProperty('name');
    expect(lead).toHaveProperty('email');
    expect(lead).toHaveProperty('phone');
    expect(lead).toHaveProperty('address');
    expect(lead).toHaveProperty('proposal');
    expect(lead).toHaveProperty('coordinates');
    expect(lead).toHaveProperty('created_at');
    expect(lead).toHaveProperty('cpf'); // PF lead
  });

  it('should generate enrichment artifacts', () => {
    const seed = 789;
    runGenerator(seed);

    const investPath = path.join(__dirname, '..', 'data', 'mocks', 'outputs', 'investigation');
    const files = fs.readdirSync(investPath);

    const enrichedFiles = files.filter(f => f.includes('LeadProfileEnriched'));
    expect(enrichedFiles.length).toBeGreaterThan(0);

    const enrichedFile = path.join(investPath, enrichedFiles[0]);
    const enriched = JSON.parse(fs.readFileSync(enrichedFile, 'utf8'));

    expect(enriched).toHaveProperty('lead_id');
    expect(enriched).toHaveProperty('geocode');
    expect(enriched).toHaveProperty('territorial');
    expect(enriched).toHaveProperty('irradiance');
    expect(enriched).toHaveProperty('economics');
  });
});