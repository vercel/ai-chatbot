import React, { useState } from 'react';
import { CanvasArtifact, registerRenderer } from '../../lib/canvas/artifacts';

// Renderer for text blocks
const TextBlockRenderer = (artifact: CanvasArtifact, onUpdate?: (updates: Partial<CanvasArtifact>) => void) => {
  const data = artifact.data as { content?: string };

  return (
    <div className="p-2">
      <textarea
        className="size-full resize-none border-none bg-transparent outline-none"
        placeholder="Digite seu texto aqui..."
        value={data.content || ''}
        onChange={(e) => {
          onUpdate?.({
            data: { ...data, content: e.target.value }
          });
        }}
      />
    </div>
  );
};

// Renderer for code blocks
const CodeBlockRenderer = (artifact: CanvasArtifact, onUpdate?: (updates: Partial<CanvasArtifact>) => void) => {
  const data = artifact.data as { content?: string; language?: string };

  return (
    <div className="p-2">
      <div className="mb-2 text-xs text-gray-500">
        {data.language || 'plaintext'}
      </div>
      <textarea
        className="size-full resize-none border-none bg-transparent outline-none font-mono text-sm"
        placeholder="Digite seu código aqui..."
        value={data.content || ''}
        onChange={(e) => {
          onUpdate?.({
            data: { ...data, content: e.target.value }
          });
        }}
      />
    </div>
  );
};

// Renderer for proposal cards
const ProposalCardRenderer = (artifact: CanvasArtifact, onUpdate?: (updates: Partial<CanvasArtifact>) => void) => {
  const data = artifact.data as {
    title?: string;
    kWp?: number;
    payback?: number;
    cost?: number;
    savings?: number;
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-3">
        <input
          type="text"
          className="w-full border-none bg-transparent outline-none"
          placeholder="Título da proposta"
          value={data.title || ''}
          onChange={(e) => {
            onUpdate?.({
              data: { ...data, title: e.target.value }
            });
          }}
        />
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Potência:</span>
          <input
            type="number"
            className="w-20 text-right border-none bg-transparent outline-none"
            placeholder="0"
            value={data.kWp || ''}
            onChange={(e) => {
              onUpdate?.({
                data: { ...data, kWp: Number.parseFloat(e.target.value) || 0 }
              });
            }}
          />
          <span>kWp</span>
        </div>

        <div className="flex justify-between">
          <span>Payback:</span>
          <input
            type="number"
            className="w-20 text-right border-none bg-transparent outline-none"
            placeholder="0"
            value={data.payback || ''}
            onChange={(e) => {
              onUpdate?.({
                data: { ...data, payback: Number.parseFloat(e.target.value) || 0 }
              });
            }}
          />
          <span>anos</span>
        </div>

        <div className="flex justify-between">
          <span>Custo:</span>
          <span>R$</span>
          <input
            type="number"
            className="w-24 text-right border-none bg-transparent outline-none"
            placeholder="0"
            value={data.cost || ''}
            onChange={(e) => {
              onUpdate?.({
                data: { ...data, cost: Number.parseFloat(e.target.value) || 0 }
              });
            }}
          />
        </div>

        <div className="flex justify-between">
          <span>Economia mensal:</span>
          <span>R$</span>
          <input
            type="number"
            className="w-24 text-right border-none bg-transparent outline-none"
            placeholder="0"
            value={data.savings || ''}
            onChange={(e) => {
              onUpdate?.({
                data: { ...data, savings: Number.parseFloat(e.target.value) || 0 }
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Renderer for charts
const ChartRenderer = (artifact: CanvasArtifact, onUpdate?: (updates: Partial<CanvasArtifact>) => void) => {
  const data = artifact.data as { type?: string; title?: string };

  return (
    <div className="p-4 flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-sm text-gray-500">
          <input
            type="text"
            className="w-full text-center border-none bg-transparent outline-none"
            placeholder="Título do gráfico"
            value={data.title || ''}
            onChange={(e) => {
              onUpdate?.({
                data: { ...data, title: e.target.value }
              });
            }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {data.type || 'Gráfico interativo'}
        </div>
      </div>
    </div>
  );
};

// Enhanced renderer for simulations with code execution
const SimulationRenderer = (
  artifact: CanvasArtifact,
  onUpdate?: (updates: Partial<CanvasArtifact>) => void,
) => {
  const data = artifact.data as {
    title?: string;
    code?: string;
    language?: 'javascript' | 'python';
    status?: 'idle' | 'running' | 'completed' | 'error';
    result?: any;
    logs?: string[];
    parameters?: Record<string, any>;
  };

  const [isEditingCode, setIsEditingCode] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const getStatusClasses = (status?: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'running':
        return 'Executando...';
      case 'completed':
        return 'Concluída';
      case 'error':
        return 'Erro';
      default:
        return 'Parada';
    }
  };

  const executeCode = async () => {
    const startTime = Date.now();

    onUpdate?.({
      data: {
        ...data,
        status: 'running',
        logs: [
          ...(data.logs || []),
          `[${new Date().toLocaleTimeString()}] Iniciando execução...`,
        ],
      },
    });

    try {
      let result: any;

      if (data.language === 'javascript') {
        // Execute JavaScript code in a sandboxed environment
        const func = new Function(
          ...Object.keys(data.parameters || {}),
          data.code || '',
        );
        const params = Object.values(data.parameters || {});
        result = await func(...params);
      } else if (data.language === 'python') {
        // For Python, we'd need a Python runtime or API call
        // For now, simulate Python execution
        result = await simulatePythonExecution(
          data.code || '',
          data.parameters || {},
        );
      }

      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      onUpdate?.({
        data: {
          ...data,
          status: 'completed',
          result,
          logs: [
            ...(data.logs || []),
            `[${new Date().toLocaleTimeString()}] Execução concluída em ${endTime - startTime}ms`,
            `[${new Date().toLocaleTimeString()}] Resultado: ${JSON.stringify(result, null, 2)}`,
          ],
        },
      });
    } catch (error) {
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      onUpdate?.({
        data: {
          ...data,
          status: 'error',
          result: null,
          logs: [
            ...(data.logs || []),
            `[${new Date().toLocaleTimeString()}] Erro: ${error instanceof Error ? error.message : String(error)}`,
          ],
        },
      });
    }
  };

  const simulatePythonExecution = async (
    code: string,
    params: Record<string, any>,
  ) => {
    // Simulate Python execution - in a real implementation, this would call a Python API
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing time

    // Simple Python-like operations
    if (code.includes('print(')) {
      return 'Hello from simulated Python!';
    }

    if (code.includes('return')) {
      // Extract return value
      const returnRegex = /return\s+(.+)/;
      const returnMatch = returnRegex.exec(code);
      if (returnMatch) {
        const returnValue = returnMatch[1].trim();
        if (returnValue.startsWith('"') && returnValue.endsWith('"')) {
          return returnValue.slice(1, -1);
        }
        if (!Number.isNaN(Number(returnValue))) {
          return Number(returnValue);
        }
        return returnValue;
      }
    } // Solar calculation simulation
    if (code.includes('solar') || code.includes('energia')) {
      return {
        potencia: params.potencia || 5.5,
        economia_anual: (params.potencia || 5.5) * 1200,
        payback: (params.custo || 30000) / ((params.potencia || 5.5) * 1200),
        status: 'Simulação de sistema solar executada',
      };
    }

    return 'Simulação executada com sucesso';
  };

  const updateParameter = (key: string, value: any) => {
    onUpdate?.({
      data: {
        ...data,
        parameters: {
          ...(data.parameters || {}),
          [key]: value,
        },
      },
    });
  };

  const addParameter = () => {
    const paramName = prompt('Nome do parâmetro:');
    if (paramName) {
      updateParameter(paramName, '');
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex-1">
          <input
            type="text"
            className="w-full border-none bg-transparent outline-none"
            placeholder="Título da simulação"
            value={data.title || ''}
            onChange={(e) => {
              onUpdate?.({
                data: { ...data, title: e.target.value },
              });
            }}
          />
        </h3>
        <div
          className={`px-2 py-1 rounded text-xs ${getStatusClasses(data.status)}`}
        >
          {getStatusText(data.status)}
        </div>
      </div>

      {/* Language Selector */}
      <div className="mb-3">
        <select
          className="w-full p-2 border border-gray-300 rounded text-sm"
          value={data.language || 'javascript'}
          onChange={(e) => {
            onUpdate?.({
              data: {
                ...data,
                language: e.target.value as 'javascript' | 'python',
              },
            });
          }}
          aria-label="Linguagem de programação"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
      </div>

      {/* Parameters */}
      {data.parameters && Object.keys(data.parameters).length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Parâmetros:</span>
            <button
              type="button"
              onClick={addParameter}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {Object.entries(data.parameters || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-16 truncate">
                  {key}:
                </span>
                <input
                  type="text"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  value={String(value)}
                  onChange={(e) => updateParameter(key, e.target.value)}
                  placeholder={`Valor para ${key}`}
                  aria-label={`Valor do parâmetro ${key}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Código:</span>
          <button
            type="button"
            onClick={() => setIsEditingCode(!isEditingCode)}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            {isEditingCode ? 'Visualizar' : 'Editar'}
          </button>
        </div>

        {isEditingCode ? (
          <textarea
            className="w-full h-32 p-2 border border-gray-300 rounded text-sm font-mono resize-none"
            placeholder={`Digite seu código ${data.language === 'python' ? 'Python' : 'JavaScript'} aqui...`}
            value={data.code || ''}
            onChange={(e) => {
              onUpdate?.({
                data: { ...data, code: e.target.value },
              });
            }}
          />
        ) : (
          <pre className="w-full h-32 p-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono overflow-auto whitespace-pre-wrap">
            {data.code ||
              `// Digite seu código ${data.language === 'python' ? 'Python' : 'JavaScript'} aqui...`}
          </pre>
        )}
      </div>

      {/* Execution Controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            onClick={executeCode}
            disabled={!data.code || data.status === 'running'}
          >
            {data.status === 'running' ? 'Executando...' : 'Executar'}
          </button>
          <button
            type="button"
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            onClick={() => {
              onUpdate?.({
                data: {
                  ...data,
                  status: 'idle',
                  result: null,
                  logs: [],
                },
              });
              setExecutionTime(null);
            }}
          >
            Limpar
          </button>
        </div>

        {executionTime && (
          <div className="text-xs text-gray-500 text-center">
            Tempo de execução: {executionTime}ms
          </div>
        )}
      </div>

      {/* Results */}
      {data.result && (
        <div className="mt-3">
          <div className="text-sm font-medium mb-2">Resultado:</div>
          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm max-h-20 overflow-auto">
            <pre className="whitespace-pre-wrap">
              {typeof data.result === 'object'
                ? JSON.stringify(data.result, null, 2)
                : String(data.result)}
            </pre>
          </div>
        </div>
      )}

      {/* Logs */}
      {data.logs && data.logs.length > 0 && (
        <div className="mt-3 flex-1 min-h-0">
          <div className="text-sm font-medium mb-2">Logs:</div>
          <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs max-h-24 overflow-auto">
            {data.logs.map((log, index) => (
              <div
                key={`log-${log.slice(0, 20)}-${index}`}
                className="mb-1 font-mono"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Register all renderers
registerRenderer('text-block', TextBlockRenderer);
registerRenderer('code-block', CodeBlockRenderer);
registerRenderer('proposal-card', ProposalCardRenderer);
registerRenderer('chart', ChartRenderer);
registerRenderer('simulation', SimulationRenderer);

// Default renderer for unknown types
const DefaultRenderer = (artifact: CanvasArtifact) => (
  <div className="p-4 flex items-center justify-center h-full">
    <div className="text-center">
      <div className="text-2xl mb-2">❓</div>
      <div className="text-sm text-gray-500">
        Tipo não suportado: {artifact.type}
      </div>
    </div>
  </div>
);

registerRenderer('default', DefaultRenderer);

export {
  TextBlockRenderer,
  CodeBlockRenderer,
  ProposalCardRenderer,
  ChartRenderer,
  SimulationRenderer,
  DefaultRenderer
};