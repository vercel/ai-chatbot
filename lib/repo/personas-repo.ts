import fs from "node:fs"
import path from "node:path"
import { PersonasDoc, Persona, Region } from "@/lib/types/messaging"

let cache: { doc: PersonasDoc|null } = { doc: null }

export function loadDoc(): PersonasDoc {
  if (cache.doc) return cache.doc
  const p = path.resolve(process.cwd(), "lib/personas/personas.regioes.json")
  const raw = fs.readFileSync(p, "utf-8")
  const doc = JSON.parse(raw) as PersonasDoc
  if (!doc?.personas?.length) throw new Error("JSON inválido: personas vazio")
  cache.doc = doc
  return doc
}
export function reload() { cache.doc = null; return loadDoc() }
export function listPersonas(): Pick<Persona,"id"|"class"|"label"|"regions">[] {
  return loadDoc().personas.map(p => ({ id: p.id, class: p.class, label: p.label, regions: p.regions }))
}
export function getPersona(id: string): Persona|undefined {
  return loadDoc().personas.find(p => p.id === id)
}
export function getRegion(id: string, region: Region) {
  const p = getPersona(id)
  if (!p) return undefined
  return p.regions?.[region]
}
