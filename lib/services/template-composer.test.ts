import { describe, it, expect } from "vitest"
import { compose } from "./template-composer"

const baseVars = { persona_nome:"Renata", consumo_kWh_mes:"420", kit_nome:"Rooftop 5kWp", economia_pct:"28", payback_anos:"4", proposta_id:"abc123", contrato_id:"c789", link_curto:"https://y.sh/x" }

describe("template-composer", () => {
  it("WA body >1024 chars fails", () => {
    const vars = { ...baseVars, persona_nome: "a".repeat(2000) }
    const res = compose({ personaId:"B1-RS", region:"SE", channel:"whatsapp", variables:vars })
    expect(res.compliance.status).toBe("fail")
  })
  it("SMS >160 chars fails", () => {
    const vars = { ...baseVars, link_curto: "x".repeat(200) }
    const res = compose({ personaId:"B1-RS", region:"SE", channel:"sms", variables:vars, marketing:true })
    expect(res.compliance.status).toBe("fail")
  })
  it("WA marketing adds opt-out", () => {
    const res = compose({ personaId:"B1-RS", region:"SE", channel:"whatsapp", variables:baseVars, marketing:true })
    expect(res.rendered.body).toMatch(/SAIR p\/ descad\./)
  })
  it("email subject and preheader are truncated", () => {
    const vars = { ...baseVars, kit_nome: "K".repeat(100) }
    const res = compose({ personaId:"B1-RS", region:"SE", channel:"email", variables:vars })
    expect(res.rendered.subject.length).toBeLessThanOrEqual(78)
    expect(res.rendered.preheader.length).toBeLessThanOrEqual(110)
  })
})
