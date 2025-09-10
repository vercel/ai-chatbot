"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function TemplatesConsole(){
  const [personaId,setPersonaId]=useState("B1-RS")
  const [region,setRegion]=useState("SE")
  const [channel,setChannel]=useState("whatsapp")
  const [variables,setVariables]=useState<string>('{"persona_nome":"Renata","consumo_kWh_mes":"420","kit_nome":"Rooftop 5kWp","economia_pct":"28","payback_anos":"4","proposta_id":"abc123","contrato_id":"c789","link_curto":"https://y.sh/x"}')
  const [result,setResult]=useState<any>(null)
  async function call(api:string){
    const r=await fetch(api,{method:"POST",body:JSON.stringify({personaId,region,channel,variables:JSON.parse(variables),marketing:true})})
    setResult(await r.json())
  }
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input value={personaId} onChange={e=>setPersonaId(e.target.value)} placeholder="personaId"/>
        <Select value={region} onValueChange={setRegion as any}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="N">N</SelectItem><SelectItem value="NE">NE</SelectItem><SelectItem value="CO">CO</SelectItem><SelectItem value="SE">SE</SelectItem><SelectItem value="S">S</SelectItem></SelectContent></Select>
        <Select value={channel} onValueChange={setChannel as any}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="telegram">Telegram</SelectItem><SelectItem value="email">E-mail</SelectItem><SelectItem value="sms">SMS</SelectItem></SelectContent></Select>
        <div className="flex gap-2">
          <Button aria-label="Validar template" onClick={()=>call("/api/messaging/validate")} variant="outline">Validar</Button>
          <Button aria-label="Renderizar template" onClick={()=>call("/api/messaging/compose")}>Renderizar</Button>
        </div>
      </div>
      <Textarea rows={6} value={variables} onChange={e=>setVariables(e.target.value)} />
      <pre className="bg-muted p-4 rounded text-xs overflow-auto" aria-live="polite">{JSON.stringify(result,null,2)}</pre>
    </div>
  )
}
