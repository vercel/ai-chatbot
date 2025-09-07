/**
 * Claude Tools for Generative UI
 * Tools que o Claude pode executar para gerar componentes UI dinâmicos
 */

export interface ToolResult {
  type: string;
  data: any;
}

// Weather Tool
export async function getWeather(location: string): Promise<ToolResult> {
  // Simulação de API de clima
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const weatherData = {
    location,
    temperature: Math.floor(Math.random() * 30) + 10,
    condition: ['Ensolarado', 'Nublado', 'Chuvoso', 'Parcialmente nublado'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 40) + 40,
    windSpeed: Math.floor(Math.random() * 20) + 5,
    forecast: [
      { hour: '7am', temp: 18 },
      { hour: '10am', temp: 22 },
      { hour: '1pm', temp: 26 },
      { hour: '4pm', temp: 24 },
      { hour: '7pm', temp: 20 },
    ]
  };
  
  return {
    type: 'weather',
    data: weatherData
  };
}


// Code Execution Tool (simulated)
export async function runCode(code: string, language: string): Promise<ToolResult> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulação de execução de código
  const outputs = {
    python: `>>> ${code}\nHello from Python!`,
    javascript: `> ${code}\n"Hello from JavaScript!"`,
    typescript: `> ${code}\n"Hello from TypeScript!"`,
  };
  
  return {
    type: 'code',
    data: {
      language,
      code,
      output: outputs[language as keyof typeof outputs] || 'Language not supported'
    }
  };
}

// Search Tool
export async function search(query: string): Promise<ToolResult> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const results = [
    {
      title: `Resultado 1 para "${query}"`,
      snippet: 'Este é um snippet do primeiro resultado da busca...',
      url: 'https://example.com/1'
    },
    {
      title: `Resultado 2 para "${query}"`,
      snippet: 'Este é um snippet do segundo resultado da busca...',
      url: 'https://example.com/2'
    },
    {
      title: `Resultado 3 para "${query}"`,
      snippet: 'Este é um snippet do terceiro resultado da busca...',
      url: 'https://example.com/3'
    }
  ];
  
  return {
    type: 'search',
    data: {
      query,
      results
    }
  };
}

// Registro de todas as tools disponíveis
export const availableTools = {
  getWeather,
  runCode,
  search
};

// Helper para executar tool baseado no nome
export async function executeTool(toolName: string, args: any): Promise<ToolResult | null> {
  try {
    switch(toolName) {
      case 'getWeather':
        return await getWeather(args.location || args);
      case 'runCode':
        return await runCode(args.code || args, args.language || 'javascript');
      case 'search':
        return await search(args.query || args);
      default:
        return null;
    }
  } catch (error) {
    console.error(`Erro ao executar tool ${toolName}:`, error);
    return null;
  }
}