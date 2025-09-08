'use client';

import { useState } from 'react';
import { TextEditor } from '../text-editor';
import { useArtifact } from '@/hooks/artifacts/use-artifact';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Download,
  Upload,
  Menu,
  Copy,
  MoreVertical,
  FileCode,
  FileJson,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function ArtifactPanel() {
  const {
    artifacts,
    activeArtifact,
    activeArtifactId,
    setActiveArtifactId,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    duplicateArtifact,
    saveToCloud,
    isLoading
  } = useArtifact();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArtifacts = artifacts.filter(artifact =>
    artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artifact.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    if (!activeArtifact) return;
    
    const blob = new Blob([activeArtifact.content], { 
      type: activeArtifact.type === 'markdown' ? 'text/markdown' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.title}.${activeArtifact.type === 'markdown' ? 'md' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Documento exportado!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const content = await file.text();
      const type = file.name.endsWith('.md') ? 'markdown' : 
                   file.name.endsWith('.json') ? 'code' : 'text';
      
      const artifact = createArtifact(file.name.replace(/\.[^/.]+$/, ''), type);
      updateArtifact(artifact.id, { content });
      toast.success('Documento importado!');
    };
    input.click();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <FileCode className="h-4 w-4 flex-shrink-0" />;
      case 'markdown':
        return <FileText className="h-4 w-4 flex-shrink-0" />;
      default:
        return <FileText className="h-4 w-4 flex-shrink-0" />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar com lista de documentos */}
      <div className={`
        ${sidebarOpen ? 'w-64' : 'w-0'} 
        transition-all duration-200 border-r bg-gray-50 dark:bg-gray-900
        overflow-hidden flex flex-col
      `}>
        {/* Header da sidebar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Documentos</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handleImport}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Importar documento"
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                onClick={() => createArtifact()}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Novo documento"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Lista de documentos */}
        <div className="flex-1 overflow-auto p-2">
          <div className="space-y-1">
            {filteredArtifacts.map(artifact => (
              <div
                key={artifact.id}
                className={`
                  group p-2 rounded cursor-pointer flex items-center justify-between
                  ${activeArtifactId === artifact.id 
                    ? 'bg-blue-100 dark:bg-blue-900' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                onClick={() => setActiveArtifactId(artifact.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getIcon(artifact.type)}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {artifact.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(artifact.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => duplicateArtifact(artifact.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setActiveArtifactId(artifact.id);
                      handleExport();
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => deleteArtifact(artifact.id)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          {filteredArtifacts.length === 0 && (
            <div className="text-center mt-8">
              <FileText className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Nenhum documento encontrado' : 'Nenhum documento ainda'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => createArtifact()}
                  className="mt-2 text-sm text-blue-500 hover:text-blue-600"
                >
                  Criar primeiro documento
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b px-4 py-2 flex items-center justify-between bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {activeArtifact && (
              <input
                value={activeArtifact.title}
                onChange={(e) => updateArtifact(activeArtifact.id, { title: e.target.value })}
                className="px-2 py-1 bg-transparent font-medium focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 rounded"
                placeholder="Título do documento"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeArtifact && (
              <>
                <select
                  value={activeArtifact.type}
                  onChange={(e) => updateArtifact(activeArtifact.id, { 
                    type: e.target.value as 'text' | 'code' | 'markdown' 
                  })}
                  className="px-2 py-1 text-sm border rounded"
                >
                  <option value="text">Texto</option>
                  <option value="markdown">Markdown</option>
                  <option value="code">Código</option>
                </select>

                <button
                  onClick={handleExport}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  title="Exportar"
                >
                  <Download className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => saveToCloud(activeArtifact.id)}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
                  title="Salvar na nuvem"
                >
                  <Upload className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
          {activeArtifact ? (
            <TextEditor
              content={activeArtifact.content}
              onChange={(content) => updateArtifact(activeArtifact.id, { content })}
              onSave={() => saveToCloud(activeArtifact.id)}
              showPreview={activeArtifact.type === 'markdown'}
              placeholder="Comece a escrever seu documento..."
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nenhum documento selecionado
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Crie um novo documento ou selecione um existente
                </p>
                <button
                  onClick={() => createArtifact()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Criar Novo Documento
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}