#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

// Simple seeded RNG
function mulberry32(a: number) {
  return () => {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function pad(n: number, w=6){return n.toString().padStart(w,'0')}

function nowIso(){ return new Date().toISOString() }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dataDir = path.resolve(__dirname, '..', 'data')
const mocksDir = path.join(dataDir, 'mocks')
const outputsDir = path.join(dataDir, 'outputs')
const schemasDir = path.join(dataDir, 'schemas')

for (const d of [dataDir, mocksDir, outputsDir, schemasDir]){
  if(!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
}

const argv = process.argv.slice(2)
let seed = 42
for (let i=0;i<argv.length;i++){
  if (argv[i]==='--seed' && argv[i+1]) seed = Number.parseInt(argv[i+1],10)
}

const rnd = mulberry32(seed)

// Generate deterministic lead_id
const leadNum = Math.floor(rnd()*999999)
const lead_id = `L${pad(leadNum)}`

// Generate fake but formatted CPF/CEP
function genCpf(){
  const a = Math.floor(rnd()*900)+100
  const b = Math.floor(rnd()*900)+100
  const c = Math.floor(rnd()*900)+100
  const d = Math.floor(rnd()*90)+10
  return `${a}.${b}.${c}-${d}`
}

function genCep(){
  const a = Math.floor(rnd()*90000)+10000
  const b = Math.floor(rnd()*900)+100
  return `${a}-${b}`
}

function brl(n:number){ return Number(n.toFixed(2)) }

// Build payload according to schema
const proposal = {
  system_size_kWp: brl( Math.round((rnd()*10 + 1)*100)/100 ),
  annual_production_kWh: Math.round((rnd()*12000 + 1000)),
  coverage_pct: Math.round(rnd()*100),
  payback_years: Math.round(rnd()*12 + 1),
  estimated_cost_brl: brl(Math.round((rnd()*60000 + 5000)*100)/100)
}

const lead = {
  lead_id,
  name: `Cliente ${lead_id}`,
  email: `cliente.${lead_id.toLowerCase()}@exemplo.com`,
  phone: `+55 11 9${Math.floor(rnd()*90000000+10000000)}`,
  cpf: genCpf(),
  address: {
    street: 'Rua do Sol',
    number: `${Math.floor(rnd()*900)+1}`,
    complement: 'Apto 101',
    city: 'São Paulo',
    state: 'SP',
    cep: genCep()
  },
  proposal,
  notes: 'Fixture gerada para testes visuais. Dados fictícios e mascarados.',
  created_at: nowIso()
}

// validate against schema
const ajv = new Ajv({ allErrors: true, strict: true })
addFormats(ajv)
const schemaPath = path.join(schemasDir, 'lead.schema.json')
const schema = JSON.parse(fs.readFileSync(schemaPath,'utf8'))
const validate = ajv.compile(schema)
const valid = validate(lead)
if(!valid){
  console.error('Validation failed:', validate.errors)
  process.exit(2)
}

// File naming: {lead_id}_{Artifact}_{YYYYMMDD_HHMMSS}.{ext}
function fmtDateForFile(d:Date){
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth()+1).padStart(2,'0')
  const dd = String(d.getUTCDate()).padStart(2,'0')
  const hh = String(d.getUTCHours()).padStart(2,'0')
  const min = String(d.getUTCMinutes()).padStart(2,'0')
  const ss = String(d.getUTCSeconds()).padStart(2,'0')
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`
}

const ts = fmtDateForFile(new Date())
const baseName = `${lead_id}_Lead_${ts}`

// write JSON
const jsonPath = path.join(mocksDir, `${baseName}.json`)
fs.writeFileSync(jsonPath, JSON.stringify(lead, null, 2), 'utf8')

// write CSV minimal (one row)
const csvPath = path.join(outputsDir, `${baseName}.csv`)
const csvHeader = ['lead_id','name','email','phone','cpf','street','number','city','state','cep','system_size_kWp','annual_production_kWh','coverage_pct','payback_years','estimated_cost_brl','created_at']
const csvRow = [
  lead.lead_id, lead.name, lead.email, lead.phone, lead.cpf,
  lead.address.street, lead.address.number, lead.address.city, lead.address.state, lead.address.cep,
  String(lead.proposal.system_size_kWp), String(lead.proposal.annual_production_kWh), String(lead.proposal.coverage_pct), String(lead.proposal.payback_years), String(lead.proposal.estimated_cost_brl), lead.created_at
]
fs.writeFileSync(csvPath, `${csvHeader.join(',')}\n${csvRow.join(',')}`, 'utf8')

// write GeoJSON point for the address (fake coords deterministic)
const lat = -23.5 + (rnd()-0.5)
const lon = -46.6 + (rnd()-0.5)
const geo = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { lead_id: lead.lead_id, city: lead.address.city, cep: lead.address.cep },
      geometry: { type: 'Point', coordinates: [lon, lat] }
    }
  ]
}
const geoPath = path.join(outputsDir, `${baseName}.geojson`)
fs.writeFileSync(geoPath, JSON.stringify(geo, null, 2), 'utf8')

console.log('Fixtures generated:')
console.log(' JSON ->', jsonPath)
console.log(' CSV  ->', csvPath)
console.log(' GEO  ->', geoPath)

// Note: PNG generation for cards is left as future enhancement. Could render headless with Puppeteer.
