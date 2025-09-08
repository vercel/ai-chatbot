/**
 * Componentes com lazy loading para otimização de bundle
 */
'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading component comum
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full p-8">
    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
  </div>
);

// Lazy load do sistema de Artifacts (pesado)
export const LazyArtifactPanel = dynamic(
  () => import('@/components/artifacts/artifact-panel').then(mod => mod.ArtifactPanel),
  {
    loading: LoadingSpinner,
    ssr: false, // Desabilitar SSR para componentes pesados do cliente
  }
);

// Removido temporariamente - chat-with-artifacts precisa de resizable que não existe
// export const LazyChatWithArtifacts = dynamic(
//   () => import('@/components/chat/chat-with-artifacts').then(mod => mod.ChatWithArtifacts),
//   {
//     loading: LoadingSpinner,
//     ssr: false,
//   }
// );

// Lazy load do Editor de Texto
export const LazyTextEditor = dynamic(
  () => import('@/components/text-editor').then(mod => mod.TextEditor),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Lazy load do Preview Markdown
export const LazyMarkdownPreview = dynamic(
  () => import('@/components/text-editor/markdown-preview').then(mod => mod.MarkdownPreview),
  {
    loading: LoadingSpinner,
    ssr: true, // Pode ser renderizado no servidor
  }
);

// Lazy load de componentes de chat pesados
export const LazyGenerativeChat = dynamic(
  () => import('@/components/chat/GenerativeChat').then(mod => ({ 
    default: mod.default 
  })),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Lazy load do Monaco Editor (se usado)
export const LazyCodeEditor = dynamic(
  () => import('@/components/code-editor').then(mod => ({ 
    default: mod.default 
  })),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Lazy load de modais pesados
export const LazySessionConfigModal = dynamic(
  () => import('@/components/session/SessionConfigModal').then(mod => ({ 
    default: mod.default 
  })),
  {
    loading: () => null, // Modal não precisa de loading
    ssr: false,
  }
);

// Lazy load de componentes de UI pesados
export const LazyDataGrid = dynamic(
  () => import('react-data-grid'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Removido - componente charts não existe
// export const LazyCharts = dynamic(
//   () => import('@/components/charts').then(mod => ({ 
//     default: mod.default 
//   })),
//   {
//     loading: LoadingSpinner,
//     ssr: false,
//   }
// );