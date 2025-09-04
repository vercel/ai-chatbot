/**
 * Integração com MCP (Model Context Protocol)
 * Processa respostas do Claude que usam ferramentas MCP
 */

export interface MCPToolCall {
  server: string;
  tool: string;
  args: Record<string, any>;
  result?: any;
}

export interface WeatherMCPResult {
  konum: {
    enlem: number;
    boylam: number;
    ulke: string;
    ad: string;
  };
  hava: Array<{
    id: number;
    ana: string;
    aciklama: string;
    ikon: string;
  }>;
  ana: {
    sicaklik: number;
    hissedilen: number;
    sicaklik_min: number;
    sicaklik_max: number;
    basinc: number;
    deniz_seviyesi?: number;
    yer_seviyesi?: number;
    nem: number;
  };
  ruzgar: {
    hiz: number;
    yon: number;
    ust?: number;
  };
  bulutlar: {
    hepsi: number;
  };
  gorunurluk: number;
  yagmur?: {
    '1h'?: number;
    '3h'?: number;
  };
  kar?: {
    '1h'?: number;
    '3h'?: number;
  };
  dt: number;
  sys: {
    ulke: string;
    gun_dogumu: number;
    gun_batimi: number;
  };
  saat_dilimi: number;
  id: number;
  ad: string;
  kod: number;
}

/**
 * Detecta chamadas MCP no texto da resposta
 */
export function detectMCPCall(text: string): MCPToolCall | null {
  // Padrão: "server - tool_name (MCP)(args)"
  const mcpPattern = /(\w+(?:-\w+)*)\s*-\s*([\w_]+)\s*\(MCP\)\((.*?)\)/s;
  const match = text.match(mcpPattern);
  
  if (!match) return null;
  
  const [, server, tool, argsStr] = match;
  
  // Tenta parsear os argumentos
  let args: Record<string, any> = {};
  try {
    // Remove quebras de linha e espaços extras
    const cleanArgs = argsStr.replace(/\s+/g, ' ').trim();
    // Converte formato Python para JSON
    const jsonStr = cleanArgs
      .replace(/(\w+):/g, '"$1":')
      .replace(/'/g, '"');
    args = JSON.parse(`{${jsonStr}}`);
  } catch (e) {
    // Se falhar, tenta parsear manualmente
    const pairs = argsStr.matchAll(/(\w+):\s*"([^"]+)"/g);
    for (const [, key, value] of pairs) {
      args[key] = value;
    }
  }
  
  return { server, tool, args };
}

/**
 * Detecta resultado MCP no texto (JSON embutido)
 */
export function detectMCPResult(text: string): any | null {
  // Procura por blocos JSON no texto
  const jsonPattern = /\{[\s\S]*?\}(?=\s*[●•]|$)/;
  const match = text.match(jsonPattern);
  
  if (!match) return null;
  
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return null;
  }
}

/**
 * Converte resultado MCP de clima para formato da aplicação
 */
export function convertMCPWeatherToUI(result: WeatherMCPResult): any {
  return {
    location: result.ad || result.konum?.ad || 'Desconhecido',
    temperature: Math.round(result.ana?.sicaklik || 0),
    condition: result.hava?.[0]?.aciklama || result.hava?.[0]?.ana || 'Desconhecido',
    humidity: result.ana?.nem || 0,
    windSpeed: Math.round((result.ruzgar?.hiz || 0) * 3.6), // m/s para km/h
    pressure: result.ana?.basinc || 0,
    visibility: (result.gorunurluk || 0) / 1000, // metros para km
    feelsLike: Math.round(result.ana?.hissedilen || 0),
    forecast: [], // MCP não retorna previsão horária
    source: 'MCP'
  };
}

/**
 * Processa resposta do Claude identificando uso de MCP
 */
export function processMCPResponse(text: string): {
  cleanText: string;
  mcpCall?: MCPToolCall;
  mcpResult?: any;
  uiData?: any;
} {
  const mcpCall = detectMCPCall(text);
  const mcpResult = detectMCPResult(text);
  
  // Remove a chamada MCP e resultado do texto
  let cleanText = text;
  if (mcpCall) {
    cleanText = cleanText.replace(/(\w+(?:-\w+)*)\s*-\s*([\w_]+)\s*\(MCP\)\((.*?)\)/s, '');
  }
  if (mcpResult) {
    cleanText = cleanText.replace(/\{[\s\S]*?\}(?=\s*[●•]|$)/, '');
  }
  
  // Converte resultado para formato UI se for clima
  let uiData;
  if (mcpCall?.tool === 'get_weather_by_city' && mcpResult) {
    uiData = {
      type: 'weather',
      data: convertMCPWeatherToUI(mcpResult)
    };
  }
  
  return {
    cleanText: cleanText.trim(),
    mcpCall,
    mcpResult,
    uiData
  };
}