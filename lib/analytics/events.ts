export function emitTemplateRequested(p:any){ console.log(JSON.stringify({evt:"template_requested", ...p})) }
export function emitTemplateRendered(p:any){ console.log(JSON.stringify({evt:"template_rendered", ...p})) }
export function emitComplianceFailed(p:any){ console.log(JSON.stringify({evt:"compliance_failed", ...p})) }
