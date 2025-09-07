'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import { useEffect, useCallback } from 'react';
import { Toolbar } from './toolbar';
import { MarkdownPreview } from './markdown-preview';

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  showPreview?: boolean;
  editable?: boolean;
  placeholder?: string;
}

export function TextEditor({
  content,
  onChange,
  onSave,
  showPreview = false,
  editable = true,
  placeholder = 'Comece a escrever...'
}: TextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        }
      }),
      Highlight,
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer hover:text-blue-600'
        }
      })
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 dark:prose-invert'
      }
    }
  });

  // Atualizar conteúdo quando prop mudar
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  // Auto-save com debounce
  const handleAutoSave = useCallback(() => {
    if (onSave) {
      const timer = setTimeout(() => {
        onSave();
      }, 2000); // Auto-save após 2 segundos de inatividade
      
      return () => clearTimeout(timer);
    }
  }, [onSave]);

  useEffect(() => {
    const cleanup = handleAutoSave();
    return cleanup;
  }, [content, handleAutoSave]);

  if (!editor) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <Toolbar editor={editor} onSave={onSave} showPreview={showPreview} />
      
      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div className="grid grid-cols-2 h-full divide-x divide-gray-200 dark:divide-gray-700">
            <div className="overflow-auto">
              <EditorContent editor={editor} placeholder={placeholder} />
            </div>
            <div className="overflow-auto p-4 bg-gray-50 dark:bg-gray-800">
              <MarkdownPreview content={editor.getText()} />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <EditorContent editor={editor} placeholder={placeholder} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>{content.length} caracteres</span>
        <span>{content.split(/\s+/).filter(Boolean).length} palavras</span>
        <span className="text-green-500">Auto-save ativado</span>
      </div>
    </div>
  );
}