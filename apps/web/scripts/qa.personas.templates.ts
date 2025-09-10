import { loadDoc } from "@/lib/repo/personas-repo"
import { compose } from "@/lib/services/template-composer"

const doc = loadDoc()
const vars = { persona_nome:"Renata", consumo_kWh_mes:"420", kit_nome:"Rooftop 5kWp", economia_pct:"28", payback_anos:"4", proposta_id:"abc123", contrato_id:"c789", link_curto:"https://y.sh/x" }
let fail = false
for (const p of doc.personas) {
  for (const region of Object.keys(p.regions) as any[]) {
    for (const channel of ["whatsapp","telegram","email","sms"] as const) {
      try {
        const res = compose({ personaId:p.id, region, channel, variables:vars, marketing:true })
        if (res.compliance.status === "fail") { fail=true; console.error("FAIL", p.id, region, channel, res.compliance.errors) }
        else console.log("PASS", p.id, region, channel)
      } catch(e) { fail=true; console.error("ERR", p.id, region, channel, (e as any).message) }
    }
  }
}
if (fail) process.exit(1)
