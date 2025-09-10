import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./compose/route"

const vars = { persona_nome:"Renata", consumo_kWh_mes:"420", kit_nome:"Rooftop 5kWp", economia_pct:"28", payback_anos:"4", proposta_id:"abc123", contrato_id:"c789", link_curto:"https://y.sh/x" }

async function call(body:any){
  const req = new NextRequest("http://test",{method:"POST",body:JSON.stringify(body)})
  return POST(req)
}

describe("/api/messaging/compose", () => {
  it("happy path per channel", async () => {
    for (const channel of ["whatsapp","telegram","email","sms"] as const) {
      const res = await call({ personaId:"B1-RS", region:"SE", channel, variables:vars })
      expect(res.status).toBe(200)
    }
  })
  it("persona inexistente", async () => {
    const res = await call({ personaId:"X", region:"SE", channel:"sms", variables:vars })
    expect(res.status).toBe(400)
  })
  it("região inválida", async () => {
    const res = await call({ personaId:"B1-RS", region:"XX", channel:"sms", variables:vars })
    expect(res.status).toBe(400)
  })
  it("canal inválido", async () => {
    const res = await call({ personaId:"B1-RS", region:"SE", channel:"foo", variables:vars })
    expect(res.status).toBe(400)
  })
  it("compliance fail retorna 422", async () => {
    const res = await call({ personaId:"B1-RS", region:"SE", channel:"sms", variables:{...vars, link_curto:"x".repeat(200)}, marketing:true })
    expect(res.status).toBe(422)
  })
})
