import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PencilEditIcon,
  RouteIcon,
  StopIcon,
  CopyIcon,
  TrashIcon,
  InfoIcon,
} from '../../../../components/icons';

interface AdvancedEditorProps {
  readonly content: string;
  readonly onContentChange: (content: string) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly placeholder?: string;
  readonly className?: string;
}

interface ToolbarButtonProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly onClick: () => void;
  readonly isActive?: boolean;
  readonly disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, isActive = false, disabled = false }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-md transition-all duration-200
        ${isActive
          ? 'bg-blue-500 text-white shadow-sm'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      `}
      title={label}
    >
      {icon}
    </button>
  );
}

export function AdvancedEditor({
  content,
  onContentChange,
  onSave,
  onCancel,
  placeholder = 'Digite seu conteúdo aqui...',
  className = '',
}: AdvancedEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = useCallback((formatType: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = '';
    let newCursorPos = end;

    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText || 'texto em negrito'}**`;
        newCursorPos = start + formattedText.length;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'texto em itálico'}*`;
        newCursorPos = start + formattedText.length;
        break;
      case 'underline':
        formattedText = `<u>${selectedText || 'texto sublinhado'}</u>`;
        newCursorPos = start + formattedText.length;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'código'}\``;
        newCursorPos = start + formattedText.length;
        break;
      case 'link':
        formattedText = `[${selectedText || 'texto do link'}](url)`;
        newCursorPos = start + formattedText.length;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'citação'}`;
        newCursorPos = start + formattedText.length;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'item da lista'}`;
        newCursorPos = start + formattedText.length;
        break;
      case 'ordered-list':
        formattedText = `1. ${selectedText || 'item da lista ordenada'}`;
        newCursorPos = start + formattedText.length;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    onContentChange(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content, onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormat('underline');
          break;
        case 'k':
          e.preventDefault();
          handleFormat('link');
          break;
        case 'Enter':
          if (e.shiftKey) {
            e.preventDefault();
            onSave();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
      }
    }
  }, [handleFormat, onSave, onCancel]);

  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6',
    '#EC4899', '#F43F5E', '#84CC16', '#10B981'
  ];

  const insertColor = (color: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const colorText = `<span style="color: ${color}">${selectedText || 'texto colorido'}</span>`;
    const newContent = content.substring(0, start) + colorText + content.substring(end);
    onContentChange(newContent);

    setShowColorPicker(false);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + colorText.length, start + colorText.length);
    }, 0);
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Editor Avançado</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={isFullscreen ? 'Sair do modo tela cheia' : 'Modo tela cheia'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Cancelar (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 p-3 border-b border-gray-200 overflow-x-auto">
          <ToolbarButton
            icon={<BoldIcon size={16} />}
            label="Negrito (Ctrl+B)"
            onClick={() => handleFormat('bold')}
          />
          <ToolbarButton
            icon={<ItalicIcon size={16} />}
            label="Itálico (Ctrl+I)"
            onClick={() => handleFormat('italic')}
          />
          <ToolbarButton
            icon={<UnderlineIcon size={16} />}
            label="Sublinhado (Ctrl+U)"
            onClick={() => handleFormat('underline')}
          />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <ToolbarButton
            icon={<ListIcon size={16} />}
            label="Lista"
            onClick={() => handleFormat('list')}
          />
          <ToolbarButton
            icon={<ListOrderedIcon size={16} />}
            label="Lista Ordenada"
            onClick={() => handleFormat('ordered-list')}
          />
          <ToolbarButton
            icon={<QuoteIcon size={16} />}
            label="Citação"
            onClick={() => handleFormat('quote')}
          />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <ToolbarButton
            icon={<CodeIcon size={16} />}
            label="Código"
            onClick={() => handleFormat('code')}
          />
          <ToolbarButton
            icon={<LinkIcon size={16} />}
            label="Link (Ctrl+K)"
            onClick={() => handleFormat('link')}
          />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <div className="relative">
            <ToolbarButton
              icon={<PaletteIcon size={16} />}
              label="Cor do Texto"
              onClick={() => setShowColorPicker(!showColorPicker)}
              isActive={showColorPicker}
            />

            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => insertColor(color)}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                        title={`Cor ${color}`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Editor */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`
              w-full resize-none border-0 outline-none text-gray-900 placeholder-gray-500
              ${isFullscreen ? 'h-96' : 'h-48'}
              text-sm leading-relaxed
            `}
            style={{ minHeight: isFullscreen ? '400px' : '200px' }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            {content.length} caracteres • Shift+Enter para salvar • Esc para cancelar
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Utility function to render formatted content
export function renderFormattedContent(content: string): React.ReactNode {
  // Simple markdown-like rendering
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">
          {line.substring(2)}
        </blockquote>
      );
    } else if (line.startsWith('- ') || /^\d+\.\s/.test(line)) {
      elements.push(
        <li key={index} className="ml-4 my-1">
          {line.replace(/^[-]\s|^(\d+\.)\s/, '')}
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<br key={index} />);
    } else {
      // Handle inline formatting
      let processedLine = line;

      // Bold
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Italic
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Code
      processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');

      // Links
      processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:underline">$1</a>');

      elements.push(
        <div
          key={index}
          className="my-1"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    }
  });

  return <div className="prose prose-sm max-w-none">{elements}</div>;
}