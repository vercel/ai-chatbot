import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  RouteIcon,
  StopIcon,
  CopyIcon,
  TrashIcon,
  EyeIcon,
  LockIcon,
} from '../../../../components/icons';
import { CANVAS_ARTIFACT_TYPES, type CanvasArtifactType } from '../../lib/canvas/artifacts';

interface CanvasToolbarProps {
  onAddArtifact: (type: CanvasArtifactType, position: { x: number; y: number }) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onConnectMode: () => void;
  onDisconnectMode: () => void;
  selectedArtifacts: string[];
  isConnectMode: boolean;
  className?: string;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

function ToolbarButton({
  icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
  shortcut
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-2 rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-blue-500 text-white shadow-lg'
          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
      `}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      {icon}
      {shortcut && (
        <span className="absolute -top-1 -right-1 text-xs bg-gray-800 text-white px-1 rounded">
          {shortcut}
        </span>
      )}
    </button>
  );
}

export function CanvasToolbar({
  onAddArtifact,
  onDeleteSelected,
  onDuplicateSelected,
  onToggleVisibility,
  onToggleLock,
  onConnectMode,
  onDisconnectMode,
  selectedArtifacts,
  isConnectMode,
  className = '',
}: CanvasToolbarProps) {
  const [showArtifactMenu, setShowArtifactMenu] = useState(false);

  const hasSelection = selectedArtifacts.length > 0;

  return (
    <div className={`fixed top-4 left-4 z-50 ${className}`}>
      <div className="flex flex-col gap-2">
        {/* Main Toolbar */}
        <motion.div
          className="flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Add Artifact Button */}
          <div className="relative">
            <ToolbarButton
              icon={<PlusIcon size={20} />}
              label="Adicionar Artefato"
              onClick={() => setShowArtifactMenu(!showArtifactMenu)}
              shortcut="A"
            />

            <AnimatePresence>
              {showArtifactMenu && (
                <motion.div
                  className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-48"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Artefatos
                  </div>

                  <div className="border-t border-gray-100 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onAddArtifact(CANVAS_ARTIFACT_TYPES.TEXT_BLOCK, { x: 100, y: 100 });
                        setShowArtifactMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="size-4 bg-blue-100 rounded flex items-center justify-center text-xs">📝</div>
                      <div>
                        <div className="font-medium text-gray-900">Bloco de Texto</div>
                        <div className="text-xs text-gray-500">Notas e conteúdo textual</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAddArtifact(CANVAS_ARTIFACT_TYPES.CODE_BLOCK, { x: 100, y: 100 });
                        setShowArtifactMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="size-4 bg-green-100 rounded flex items-center justify-center text-xs">💻</div>
                      <div>
                        <div className="font-medium text-gray-900">Bloco de Código</div>
                        <div className="text-xs text-gray-500">Snippets e algoritmos</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAddArtifact(CANVAS_ARTIFACT_TYPES.PROPOSAL_CARD, { x: 100, y: 100 });
                        setShowArtifactMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="size-4 bg-purple-100 rounded flex items-center justify-center text-xs">📋</div>
                      <div>
                        <div className="font-medium text-gray-900">Cartão de Proposta</div>
                        <div className="text-xs text-gray-500">Dados de propostas solares</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAddArtifact(CANVAS_ARTIFACT_TYPES.CHART, { x: 100, y: 100 });
                        setShowArtifactMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="size-4 bg-yellow-100 rounded flex items-center justify-center text-xs">📊</div>
                      <div>
                        <div className="font-medium text-gray-900">Gráfico</div>
                        <div className="text-xs text-gray-500">Visualizações de dados</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAddArtifact(CANVAS_ARTIFACT_TYPES.SIMULATION, { x: 100, y: 100 });
                        setShowArtifactMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="size-4 bg-red-100 rounded flex items-center justify-center text-xs">⚡</div>
                      <div>
                        <div className="font-medium text-gray-900">Simulação</div>
                        <div className="text-xs text-gray-500">Cálculos interativos</div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Connection Tools */}
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <ToolbarButton
            icon={<RouteIcon size={20} />}
            label="Conectar Artefatos"
            onClick={onConnectMode}
            isActive={isConnectMode}
            shortcut="L"
          />
          <ToolbarButton
            icon={<StopIcon size={20} />}
            label="Desconectar Artefatos"
            onClick={onDisconnectMode}
            disabled={!hasSelection}
          />

          {/* Selection Tools */}
          {hasSelection && (
            <>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <ToolbarButton
                icon={<CopyIcon size={20} />}
                label="Duplicar Seleção"
                onClick={onDuplicateSelected}
                shortcut="D"
              />
              <ToolbarButton
                icon={<EyeIcon size={20} />}
                label="Alternar Visibilidade"
                onClick={onToggleVisibility}
              />
              <ToolbarButton
                icon={<LockIcon size={20} />}
                label="Alternar Bloqueio"
                onClick={onToggleLock}
              />
              <ToolbarButton
                icon={<TrashIcon size={20} />}
                label="Excluir Seleção"
                onClick={onDeleteSelected}
                shortcut="Del"
              />
            </>
          )}
        </motion.div>

        {/* Status Bar */}
        {hasSelection && (
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {selectedArtifacts.length} artefato{selectedArtifacts.length > 1 ? 's' : ''} selecionado{selectedArtifacts.length > 1 ? 's' : ''}
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="font-medium mb-1">Dicas de Uso:</div>
          <ul className="space-y-1">
            <li>• Clique e arraste para mover</li>
            <li>• Ctrl+scroll para zoom</li>
            <li>• Shift+clique para seleção múltipla</li>
            <li>• Duplo-clique para editar</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

// Utility function to get cursor style based on mode
export function getCanvasCursor(isConnectMode: boolean, isDragging: boolean): string {
  if (isDragging) return 'grabbing';
  if (isConnectMode) return 'crosshair';
  return 'default';
}

// Utility function to get artifact selection style
export function getArtifactSelectionStyle(isSelected: boolean, isHovered: boolean) {
  if (isSelected) {
    return {
      borderColor: '#3b82f6',
      borderWidth: '2px',
      boxShadow: '0 0 0 1px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.15)',
    };
  }

  if (isHovered) {
    return {
      borderColor: '#9ca3af',
      borderWidth: '1px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    };
  }

  return {
    borderColor: '#e5e7eb',
    borderWidth: '1px',
  };
}