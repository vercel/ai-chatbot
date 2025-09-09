import React from 'react';
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

// Renderer for simulations
const SimulationRenderer = (artifact: CanvasArtifact, onUpdate?: (updates: Partial<CanvasArtifact>) => void) => {
  const data = artifact.data as { title?: string; status?: 'idle' | 'running' | 'completed' };

  const getStatusClasses = (status?: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
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
      default:
        return 'Parada';
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          <input
            type="text"
            className="w-full border-none bg-transparent outline-none"
            placeholder="Título da simulação"
            value={data.title || ''}
            onChange={(e) => {
              onUpdate?.({
                data: { ...data, title: e.target.value }
              });
            }}
          />
        </h3>
        <div className={`px-2 py-1 rounded text-xs ${getStatusClasses(data.status)}`}>
          {getStatusText(data.status)}
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => {
            onUpdate?.({
              data: { ...data, status: 'running' }
            });
            // Simulate running for 2 seconds
            setTimeout(() => {
              onUpdate?.({
                data: { ...data, status: 'completed' }
              });
            }, 2000);
          }}
        >
          {data.status === 'running' ? 'Executando...' : 'Executar Simulação'}
        </button>
      </div>
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