'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface Artifact {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'markdown';
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    language?: string;
    tags?: string[];
  };
}

export function useArtifact() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar artifacts do localStorage na montagem
  useEffect(() => {
    const stored = localStorage.getItem('artifacts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setArtifacts(parsed.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt)
        })));
        if (parsed.length > 0 && !activeArtifactId) {
          setActiveArtifactId(parsed[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar artifacts:', error);
      }
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    if (artifacts.length > 0) {
      localStorage.setItem('artifacts', JSON.stringify(artifacts));
    }
  }, [artifacts]);

  const createArtifact = useCallback((title: string = 'Novo Documento', type: Artifact['type'] = 'text') => {
    const newArtifact: Artifact = {
      id: `artifact-${Date.now()}`,
      title,
      content: '',
      type,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setArtifacts(prev => [...prev, newArtifact]);
    setActiveArtifactId(newArtifact.id);
    toast.success('Documento criado!');
    
    return newArtifact;
  }, []);

  const updateArtifact = useCallback((id: string, updates: Partial<Artifact>) => {
    setArtifacts(prev => prev.map(artifact => 
      artifact.id === id 
        ? { ...artifact, ...updates, updatedAt: new Date() }
        : artifact
    ));
  }, []);

  const deleteArtifact = useCallback((id: string) => {
    setArtifacts(prev => {
      const filtered = prev.filter(a => a.id !== id);
      
      // Se deletou o ativo, selecionar outro
      if (activeArtifactId === id && filtered.length > 0) {
        setActiveArtifactId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveArtifactId(null);
      }
      
      return filtered;
    });
    
    toast.success('Documento removido');
  }, [activeArtifactId]);

  const saveToCloud = useCallback(async (artifactId: string) => {
    const artifact = artifacts.find(a => a.id === artifactId);
    if (!artifact) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/artifacts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artifact)
      });

      if (response.ok) {
        toast.success('Salvo na nuvem!');
      }
    } catch (error) {
      toast.error('Erro ao salvar');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [artifacts]);

  const loadFromCloud = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/artifacts/load');
      if (response.ok) {
        const data = await response.json();
        setArtifacts(data.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt)
        })));
        toast.success('Documentos carregados!');
      }
    } catch (error) {
      toast.error('Erro ao carregar');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const duplicateArtifact = useCallback((id: string) => {
    const artifact = artifacts.find(a => a.id === id);
    if (!artifact) return;

    const newArtifact = createArtifact(`${artifact.title} (cópia)`, artifact.type);
    updateArtifact(newArtifact.id, { content: artifact.content, metadata: artifact.metadata });
  }, [artifacts, createArtifact, updateArtifact]);

  const activeArtifact = artifacts.find(a => a.id === activeArtifactId);

  return {
    artifacts,
    activeArtifact,
    activeArtifactId,
    setActiveArtifactId,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    duplicateArtifact,
    saveToCloud,
    loadFromCloud,
    isLoading
  };
}