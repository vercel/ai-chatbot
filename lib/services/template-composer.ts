import { ComposeRequest, ComposeResponse, RegionSpec } from "@/lib/types/messaging"
import { getRegion } from "@/lib/repo/personas-repo"

const WA_BODY_MAX = 1024
const WA_HEADER_MAX = 60
const SMS_MAX = 160
const EMAIL_SUBJ_MAX = 78
const EMAIL_PRE_MAX = 110

function render(text: string, vars: Record<string,string> = {}) {
  const used: string[] = []
  const rendered = text.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    used.push(k)
    return (vars[k] ?? `{{${k}}}`)
  })
  return { rendered, used }
}
function hasURLInBody(text: string) { return /\bhttps?:\/\//i.test(text) }
function ensureOptOut(text: string, marketing?: boolean) {
  if (!marketing) return text
  if (/SAIR|STOP|CANCEL/i.test(text)) return text
  return (text?.trim?.() || "") + " SAIR p/ descad."
}

export function compose(req: ComposeRequest): ComposeResponse {
  const spec = getRegion(req.personaId, req.region) as RegionSpec|undefined
  if (!spec) throw new Error("Persona/região não encontrada")

  let raw: Record<string, any> = {}
  let rendered: Record<string, string> = {}
  let placeholdersUsed: string[] = []
  const errors: string[] = []

  if (req.channel === "whatsapp") {
    const w = spec.whatsapp
    if (!w?.body) throw new Error("WhatsApp sem body no JSON")
    const header = w.header ?? ""
    const headerR = header ? render(header, req.variables) : { rendered: "", used: [] }
    const bodyR = render(ensureOptOut(w.body, req.marketing), req.variables)
    const footerR = w.footer ? render(ensureOptOut(w.footer, req.marketing), req.variables) : { rendered: "", used: [] }
    raw = { header: w.header, body: w.body, footer: w.footer, cta: w.cta }
    rendered = { header: headerR.rendered, body: bodyR.rendered, footer: footerR.rendered }
    placeholdersUsed = [...new Set([...headerR.used, ...bodyR.used, ...footerR.used])]
    if (rendered.body.length > WA_BODY_MAX) errors.push(`WhatsApp body > ${WA_BODY_MAX} chars`)
    if (header && header.length > WA_HEADER_MAX) errors.push(`WhatsApp header > ${WA_HEADER_MAX} chars`)
    if (hasURLInBody(w.body) && !w.cta?.url_template) errors.push("WhatsApp: link no body sem CTA URL")
  }

  if (req.channel === "sms") {
    const base = ensureOptOut(spec.sms ?? "", req.marketing)
    const r = render(base, req.variables)
    raw = { sms: spec.sms }
    rendered = { sms: r.rendered }
    placeholdersUsed = r.used
    if (rendered.sms.length > SMS_MAX) errors.push(`SMS > ${SMS_MAX} chars`)
  }

  if (req.channel === "email") {
    const e = spec.email
    if (!e?.subject) throw new Error("E-mail sem subject no JSON")
    const subj = render(e.subject, req.variables).rendered
    const pre = e.preheader ? render(e.preheader, req.variables).rendered : ""
    raw = { subject: e.subject, preheader: e.preheader }
    rendered = {
      subject: subj.length > EMAIL_SUBJ_MAX ? subj.slice(0, EMAIL_SUBJ_MAX - 1) + "…" : subj,
      preheader: pre.length > EMAIL_PRE_MAX ? pre.slice(0, EMAIL_PRE_MAX - 1) + "…" : pre
    }
    placeholdersUsed = [] // opcional: coletar usados do render()
  }

  if (req.channel === "telegram") {
    const t = spec.telegram
    if (!t?.text) throw new Error("Telegram sem text no JSON")
    const tR = render(t.text, req.variables)
    raw = { text: t.text, keyboard: t.keyboard ?? [] }
    rendered = { text: tR.rendered }
    placeholdersUsed = tR.used
    if ((t.keyboard?.length ?? 0) > 4) errors.push("Telegram: >4 botões na mesma linha")
  }

  return {
    channel: req.channel,
    raw, rendered, placeholdersUsed,
    compliance: { status: errors.length ? "fail" : "pass", errors }
  }
}
