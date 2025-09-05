'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { ArtifactPanel } from '@/components/artifacts/ArtifactPanel';

interface Artifact {
  id: string;
  type: 'text' | 'code';
  title: string;
  content: string;
  language?: string;
  createdAt: Date;
}

export default function CanvasPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(50); // percentage

  const activeArtifact = artifacts.find(a => a.id === activeArtifactId);

  const createNewArtifact = (type: 'text' | 'code') => {
    const newArtifact: Artifact = {
      id: `artifact-${Date.now()}`,
      type,
      title: type === 'text' ? 'Novo Documento' : 'Novo Código',
      content: '',
      language: type === 'code' ? 'javascript' : undefined,
      createdAt: new Date()
    };
    
    setArtifacts([...artifacts, newArtifact]);
    setActiveArtifactId(newArtifact.id);
    setIsPanelOpen(true);
  };

  const updateArtifact = (id: string, updates: Partial<Artifact>) => {
    setArtifacts(artifacts.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  };

  const deleteArtifact = (id: string) => {
    setArtifacts(artifacts.filter(a => a.id !== id));
    if (activeArtifactId === id) {
      setActiveArtifactId(artifacts.length > 1 ? artifacts[0].id : null);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Side - Canvas Controls & Preview */}
      <div className={`flex-1 flex flex-col ${isPanelOpen ? `w-[${100-panelWidth}%]` : 'w-full'}`}>
        {/* Header */}
        <header className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Canvas - Workspace Interativo</h1>
              <p className="text-muted-foreground mt-1">
                Crie e edite documentos e código em tempo real
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => createNewArtifact('text')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                Novo Documento
              </button>
              
              <button
                onClick={() => createNewArtifact('code')}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                Novo Código
              </button>
            </div>
          </div>
        </header>

        {/* Artifact Tabs */}
        {artifacts.length > 0 && (
          <div className="border-b px-4 py-2 flex items-center gap-2 overflow-x-auto">
            {artifacts.map(artifact => (
              <div
                key={artifact.id}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition
                  ${activeArtifactId === artifact.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                  }
                `}
                onClick={() => setActiveArtifactId(artifact.id)}
              >
                <span className="text-sm font-medium">{artifact.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteArtifact(artifact.id);
                  }}
                  className="hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center">
          {artifacts.length === 0 ? (
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold mb-2">Nenhum artifact criado</h2>
              <p className="text-muted-foreground mb-6">
                Crie um novo documento ou código para começar
              </p>
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => createNewArtifact('text')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  Criar Documento
                </button>
                <button
                  onClick={() => createNewArtifact('code')}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
                >
                  Criar Código
                </button>
              </div>
            </div>
          ) : !isPanelOpen && activeArtifact ? (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">{activeArtifact.title}</h2>
              <pre className="whitespace-pre-wrap">{activeArtifact.content || 'Vazio...'}</pre>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              {activeArtifact ? 'Editando no painel lateral →' : 'Selecione um artifact'}
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground p-2 rounded-l-lg hover:opacity-90 transition"
      >
        {isPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Right Side - Artifact Panel */}
      {isPanelOpen && activeArtifact && (
        <div className={`border-l bg-background`} style={{ width: `${panelWidth}%` }}>
          <ArtifactPanel
            artifact={activeArtifact}
            onUpdate={(updates) => updateArtifact(activeArtifact.id, updates)}
            onClose={() => setIsPanelOpen(false)}
          />
        </div>
      )}
    </div>
  );
}