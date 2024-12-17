// function catchErrorTyped<T, E extends new (message?: string) => Error>(
//   promise: Promise<T>,
//   errorsToCatch?: E[]
// ): Promise<[undefined,T] | [InstanceType<E>]> {
//   return promise
//     .then(data => {
//       return [undefined, data] as [undefined,T];
//     })
//     .catch(error => {
//       if (errorsToCatch == undefined) {
//         return [error]
//       }
//
//       if (errorsToCatch.some(e => error instanceof e)) {
//         return [error]
//       }
//
//       throw error
//     })
// }

import { storeDocumentsInPinecone } from "@/lib/chat/embeddingsProviders";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch('https://lextgpt-puppeteer.onrender.com/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();

    await storeDocumentsInPinecone(data.slice(0,10));

    return NextResponse.json({ success: true, data:'data' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// [
//   {
//     "process": "\n\tRESP 1913638\n\t",
//     "relator": "Ministro GURGEL DE FARIA (1160)",
//     "classe": "S1 - PRIMEIRA SEÇÃO",
//     "ementa": " \n\t\t\"A contratação de servidores públicos temporários sem concurso\npúblico, mas baseada em legislação local, por si só, não configura a\nimprobidade administrativa prevista no art. 11 da Lei 8.429/1992,\npor estar ausente o elemento subjetivo (dolo) necessário para a\nconfiguração do ato de improbidade violador dos princípios da\nadministração pública\".Veja o Tema Repetitivo 1108\n\t\t",
//     "acordao": "\n\t\t\n\n\t\tPROCESSUAL CIVIL E ADMINISTRATIVO. RECURSO ESPECIAL REPRESENTATIVODA CONTROVÉRSIA. IMPROBIDADE. CONTRATAÇÃO DE SERVIDOR TEMPORÁRIO.AUTORIZAÇÃO. LEI LOCAL. DOLO. AFASTAMENTO.1. Em face dos princípios a que está submetida a administração pública (art. 37 da CF/1988) e tendo em vista a supremacia deles, sendo representantes daquela os agentes públicos passíveis de serem alcançados pela lei de improbidade, o legislador ordinário quis impedir o ajuizamento de ações temerárias, evitando, com isso, além de eventuais perseguições políticas e o descrédito social de atos ou decisões político-administrativos,
//     "link": "https://processo.stj.jus.br/processo/pesquisa/?num_registro=202003436012%27"
//   },
//   {
//     "process": "\n\tRESP 1926832\n\t",
//     "relator": "Ministro GURGEL DE FARIA (1160)",
//     "classe": "S1 - PRIMEIRA SEÇÃO",
//     "ementa": " \n\t\t\"A contratação de servidores públicos temporários sem concurso\npúblico, mas baseada em legislação local, por si só, não configura a\nimprobidade administrativa prevista no art. 11 da Lei n. 8.429/1992,\npor estar ausente o elemento subjetivo (dolo) necessário para a\nconfiguração do ato de improbidade violador dos princípios da\nadministração pública\".Veja o Tema Repetitivo 1108\n\t\t",
//     "acordao": "\n\t\t\n\n\t\tPROCESSUAL CIVIL E ADMINISTRATIVO. RECURSO ESPECIAL REPRESENTATIVODA CONTROVÉRSIA. IMPROBIDADE. CONTRATAÇÃO DE SERVIDOR TEMPORÁRIO.AUTORIZAÇÃO. LEI LOCAL. DOLO. AFASTAMENTO.1. Em face dos princípios a que está submetida a administração pública (art. 37 da CF/1988) e tendo em vista a supremacia deles, sendo representantes daquela os agentes públicos passíveis de serem alcançados pela lei de improbidade, o legislador ordinário quis impedir o ajuizamento de ações temerárias, evitando, com isso, al",
//     "link": "https://processo.stj.jus.br/processo/pesquisa/?num_registro=202100720958%27"
//   },