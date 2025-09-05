'use client';

import { useState, useEffect } from 'react';
import { X, Save, Download, Copy, Play } from 'lucide-react';
import type { ArtifactPanelProps } from '@/lib/artifacts/types';

export function ArtifactPanel({ artifact, onUpdate, onClose }: ArtifactPanelProps) {
  const [content, setContent] = useState(artifact.content);
  const [title, setTitle] = useState(artifact.title);
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    setContent(artifact.content);
    setTitle(artifact.title);
  }, [artifact]);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== artifact.content || title !== artifact.title) {
        onUpdate({ content, title, updatedAt: new Date() });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, title, artifact, onUpdate]);

  const handleExecute = async () => {
    if (artifact.type !== 'code') return;
    
    setIsExecuting(true);
    setOutput('Executando...\n');
    
    try {
      const result = executeCode(content, artifact.language || 'javascript');
      setOutput(result);
    } catch (error: any) {
      setOutput(`Erro: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const executeCode = (code: string, language: string): string => {
    if (language !== 'javascript') {
      return `Linguagem ${language} ainda não suportada`;
    }

    let outputBuffer = '';
    const customConsole = {
      log: (...args: any[]) => {
        outputBuffer += args.map(a => 
          typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
        ).join(' ') + '\n';
      },
      error: (...args: any[]) => {
        outputBuffer += '[ERROR] ' + args.join(' ') + '\n';
      }
    };

    try {
      const func = new Function('console', code);
      func(customConsole);
      return outputBuffer || 'Código executado sem output';
    } catch (error: any) {
      return `Erro de execução: ${error.message}`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-')}.${artifact.type === 'code' ? 'js' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w).length;
  const charCount = content.length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent outline-none"
        />
        
        <div className="flex items-center gap-2">
          {artifact.type === 'code' && (
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="p-2 hover:bg-muted rounded-lg transition"
              title="Executar código"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-muted rounded-lg transition"
            title="Copiar"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-muted rounded-lg transition"
            title="Baixar"
          >
            <Download className="h-4 w-4" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor */}
        <div className={artifact.type === 'code' && output ? "h-2/3" : "h-full"}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`
              w-full h-full p-4 resize-none outline-none
              ${artifact.type === 'code' 
                ? 'font-mono text-sm bg-gray-900 text-gray-100' 
                : 'font-sans bg-background'
              }
            `}
            placeholder={
              artifact.type === 'code' 
                ? '// Escreva seu código aqui...' 
                : 'Comece a escrever...'
            }
            spellCheck={artifact.type !== 'code'}
          />
        </div>

        {/* Output Console for Code */}
        {artifact.type === 'code' && output && (
          <div className="h-1/3 border-t bg-black">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <span className="text-xs text-gray-400">Console Output</span>
              <button
                onClick={() => setOutput('')}
                className="text-xs text-gray-400 hover:text-white"
              >
                Limpar
              </button>
            </div>
            <pre className="p-3 text-green-400 font-mono text-sm overflow-auto h-full">
              {output}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {artifact.type === 'text' ? (
            <span>{wordCount} palavras, {charCount} caracteres</span>
          ) : (
            <span>JavaScript</span>
          )}
        </div>
        <div>
          Salvo automaticamente
        </div>
      </div>
    </div>
  );
}