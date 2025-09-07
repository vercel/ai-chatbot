'use client';

import { Editor } from '@tiptap/core';
import { useState } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Undo,
  Redo,
  Save,
  Eye,
  EyeOff,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor;
  onSave?: () => void;
  showPreview?: boolean;
}

export function Toolbar({ editor, onSave, showPreview: showPreviewProp = false }: ToolbarProps) {
  const [showPreview, setShowPreview] = useState(showPreviewProp);

  const ToolButton = ({ 
    onClick, 
    active = false, 
    disabled = false, 
    children,
    title
  }: { 
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded transition-colors
        ${active 
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
  );

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-1 flex items-center gap-1 flex-wrap bg-gray-50 dark:bg-gray-800">
      {/* Formatação de texto */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Negrito (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Itálico (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive('highlight')}
        title="Realçar"
      >
        <Highlighter className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Cabeçalhos */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Título 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Título 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Título 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Listas e citação */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Lista com marcadores"
      >
        <List className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Citação"
      >
        <Quote className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Bloco de código"
      >
        <Code className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Alinhamento */}
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        title="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        title="Centralizar"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        title="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Desfazer/Refazer */}
      <ToolButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Desfazer (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolButton>

      <ToolButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Refazer (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolButton>

      {/* Ações à direita */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Editor' : 'Preview'}
        </button>

        {onSave && (
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
        )}
      </div>
    </div>
  );
}