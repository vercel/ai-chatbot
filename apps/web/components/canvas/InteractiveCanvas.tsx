import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CanvasArtifact,
  renderArtifact,
  CANVAS_ARTIFACT_TYPES,
  type CanvasArtifactType,
} from '../../lib/canvas/artifacts';
import './ArtifactRenderers';

interface InteractiveCanvasProps {
  readonly artifacts: readonly CanvasArtifact[];
  readonly onArtifactUpdate: (
    artifactId: string,
    updates: Partial<CanvasArtifact>,
  ) => void;
  readonly onArtifactCreate: (
    type: CanvasArtifactType,
    position: { x: number; y: number },
  ) => void;
  readonly onArtifactDelete: (artifactId: string) => void;
  readonly onConnectionCreate: (sourceId: string, targetId: string) => void;
  readonly onConnectionDelete: (sourceId: string, targetId: string) => void;
  readonly onArtifactsCopy?: (artifactIds: string[]) => void;
  readonly onArtifactsPaste?: (artifacts: CanvasArtifact[]) => void;
  readonly onUndo?: () => void;
  readonly onRedo?: () => void;
  readonly className?: string;
}

interface DragState {
  isDragging: boolean;
  artifactId: string | null;
  startPosition: { x: number; y: number };
  offset: { x: number; y: number };
  isMultiSelect: boolean;
  selectedIds: string[];
}

interface ConnectionLine {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
}

interface ContextMenuState {
  isVisible: boolean;
  position: { x: number; y: number };
  targetArtifactId?: string;
  selectedArtifacts: string[];
}

export function InteractiveCanvas({
  artifacts,
  onArtifactUpdate,
  onArtifactCreate,
  onArtifactDelete,
  onConnectionCreate,
  onConnectionDelete,
  onArtifactsCopy,
  onArtifactsPaste,
  onUndo,
  onRedo,
  className = '',
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    artifactId: null,
    startPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    isMultiSelect: false,
    selectedIds: [],
  });
  const [connectionLines, setConnectionLines] = useState<ConnectionLine[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    selectedArtifacts: [],
  });
  const [clipboard, setClipboard] = useState<CanvasArtifact[]>([]);
  const [selectionBox, setSelectionBox] = useState<{
    isSelecting: boolean;
    startPos: { x: number; y: number };
    currentPos: { x: number; y: number };
  } | null>(null);

  // Update connection lines when artifacts change
  useEffect(() => {
    const lines: ConnectionLine[] = [];
    artifacts.forEach((artifact: CanvasArtifact) => {
      artifact.connections.forEach((targetId: string) => {
        const targetArtifact = artifacts.find(
          (a: CanvasArtifact) => a.id === targetId,
        );
        if (targetArtifact) {
          lines.push({
            id: `${artifact.id}-${targetId}`,
            sourceId: artifact.id,
            targetId,
            sourcePos: {
              x: artifact.position.x + artifact.size.width / 2,
              y: artifact.position.y + artifact.size.height / 2,
            },
            targetPos: {
              x: targetArtifact.position.x + targetArtifact.size.width / 2,
              y: targetArtifact.position.y + targetArtifact.size.height / 2,
            },
          });
        }
      });
    });
    setConnectionLines(lines);
  }, [artifacts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            if (dragState.selectedIds.length > 0) {
              e.preventDefault();
              const selectedArtifacts = artifacts.filter((a) =>
                dragState.selectedIds.includes(a.id),
              );
              setClipboard(selectedArtifacts);
              onArtifactsCopy?.(dragState.selectedIds);
            }
            break;
          case 'v':
            if (clipboard.length > 0) {
              e.preventDefault();
              onArtifactsPaste?.(clipboard);
            }
            break;
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              onRedo?.();
            } else {
              e.preventDefault();
              onUndo?.();
            }
            break;
          case 'a': {
            e.preventDefault();
            const allIds = artifacts.map((a) => a.id);
            setDragState((prev) => ({
              ...prev,
              selectedIds: allIds,
            }));
            break;
          }
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            dragState.selectedIds.forEach((id) => onArtifactDelete(id));
            setDragState((prev) => ({ ...prev, selectedIds: [] }));
            break;
        }
      } else if (e.key === 'Escape') {
        setDragState((prev) => ({ ...prev, selectedIds: [] }));
        setContextMenu((prev) => ({ ...prev, isVisible: false }));
        setSelectionBox(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    artifacts,
    dragState.selectedIds,
    clipboard,
    onArtifactsCopy,
    onArtifactsPaste,
    onUndo,
    onRedo,
    onArtifactDelete,
  ]);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const position = {
          x: (event.clientX - rect.left - pan.x) / scale,
          y: (event.clientY - rect.top - pan.y) / scale,
        };

        // Clear selection if clicking on empty canvas
        if (!event.shiftKey) {
          setDragState((prev) => ({ ...prev, selectedIds: [] }));
        }

        // Create context menu or default artifact
        if (event.button === 2) {
          // Right click
          setContextMenu({
            isVisible: true,
            position: { x: event.clientX, y: event.clientY },
            selectedArtifacts: [],
          });
        } else {
          onArtifactCreate(CANVAS_ARTIFACT_TYPES.TEXT_BLOCK, position);
        }
      }
    },
    [pan, scale, onArtifactCreate],
  );

  const handleCanvasMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === canvasRef.current && event.button === 0) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const position = {
          x: (event.clientX - rect.left - pan.x) / scale,
          y: (event.clientY - rect.top - pan.y) / scale,
        };

        setSelectionBox({
          isSelecting: true,
          startPos: position,
          currentPos: position,
        });
      }
    },
    [pan, scale],
  );

  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (selectionBox?.isSelecting) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const position = {
          x: (event.clientX - rect.left - pan.x) / scale,
          y: (event.clientY - rect.top - pan.y) / scale,
        };

        setSelectionBox((prev) =>
          prev ? { ...prev, currentPos: position } : null,
        );
      }
    },
    [selectionBox, pan, scale],
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (selectionBox?.isSelecting) {
      const bounds = {
        left: Math.min(selectionBox.startPos.x, selectionBox.currentPos.x),
        top: Math.min(selectionBox.startPos.y, selectionBox.currentPos.y),
        right: Math.max(selectionBox.startPos.x, selectionBox.currentPos.x),
        bottom: Math.max(selectionBox.startPos.y, selectionBox.currentPos.y),
      };

      const selectedIds = artifacts
        .filter(
          (artifact) =>
            artifact.position.x < bounds.right &&
            artifact.position.x + artifact.size.width > bounds.left &&
            artifact.position.y < bounds.bottom &&
            artifact.position.y + artifact.size.height > bounds.top,
        )
        .map((artifact) => artifact.id);

      setDragState((prev) => ({ ...prev, selectedIds }));
      setSelectionBox(null);
    }
  }, [selectionBox, artifacts]);

  const handleArtifactClick = useCallback(
    (artifactId: string, event: React.MouseEvent) => {
      event.stopPropagation();

      if (event.shiftKey) {
        setDragState((prev) => ({
          ...prev,
          selectedIds: prev.selectedIds.includes(artifactId)
            ? prev.selectedIds.filter((id) => id !== artifactId)
            : [...prev.selectedIds, artifactId],
        }));
      } else {
        setDragState((prev) => ({
          ...prev,
          selectedIds: [artifactId],
        }));
      }
    },
    [],
  );

  const handleArtifactDragStart = useCallback(
    (artifactId: string, event: React.PointerEvent) => {
      const artifact = artifacts.find((a) => a.id === artifactId);
      if (!artifact?.isDraggable) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const startPosition = {
        x: (event.clientX - rect.left - pan.x) / scale,
        y: (event.clientY - rect.top - pan.y) / scale,
      };

      const isMultiSelect =
        dragState.selectedIds.includes(artifactId) &&
        dragState.selectedIds.length > 1;

      setDragState({
        isDragging: true,
        artifactId,
        startPosition,
        offset: {
          x: startPosition.x - artifact.position.x,
          y: startPosition.y - artifact.position.y,
        },
        isMultiSelect,
        selectedIds: isMultiSelect ? dragState.selectedIds : [artifactId],
      });

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [artifacts, pan, scale, dragState.selectedIds],
  );

  const handleArtifactDragMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragState.isDragging || !dragState.artifactId) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentPosition = {
        x: (event.clientX - rect.left - pan.x) / scale,
        y: (event.clientY - rect.top - pan.y) / scale,
      };

      if (dragState.isMultiSelect) {
        // Move all selected artifacts
        const primaryArtifact = artifacts.find(
          (a) => a.id === dragState.artifactId,
        );
        if (!primaryArtifact) return;

        const deltaX = currentPosition.x - dragState.startPosition.x;
        const deltaY = currentPosition.y - dragState.startPosition.y;

        dragState.selectedIds.forEach((id) => {
          const artifact = artifacts.find((a) => a.id === id);
          if (artifact) {
            const newPosition = {
              x: artifact.position.x + deltaX,
              y: artifact.position.y + deltaY,
            };
            onArtifactUpdate(id, { position: newPosition });
          }
        });

        setDragState((prev) => ({
          ...prev,
          startPosition: currentPosition,
        }));
      } else {
        // Move single artifact
        const newPosition = {
          x: currentPosition.x - dragState.offset.x,
          y: currentPosition.y - dragState.offset.y,
        };

        onArtifactUpdate(dragState.artifactId, { position: newPosition });
      }
    },
    [dragState, pan, scale, artifacts, onArtifactUpdate],
  );

  const handleArtifactDragEnd = useCallback(() => {
    if (dragState.isDragging && dragState.artifactId) {
      // Snap to grid
      dragState.selectedIds.forEach((id) => {
        const artifact = artifacts.find((a) => a.id === id);
        if (artifact) {
          const snappedPosition = {
            x: Math.round(artifact.position.x / 20) * 20,
            y: Math.round(artifact.position.y / 20) * 20,
          };
          onArtifactUpdate(id, { position: snappedPosition });
        }
      });
    }

    setDragState({
      isDragging: false,
      artifactId: null,
      startPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      isMultiSelect: false,
      selectedIds: dragState.selectedIds,
    });
  }, [dragState, artifacts, onArtifactUpdate]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!event.ctrlKey) return;
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.5), 2));
  }, []);

  const handleConnectionStart = useCallback((artifactId: string) => {
    setIsConnecting(true);
    setConnectionSource(artifactId);
  }, []);

  const handleConnectionEnd = useCallback(
    (artifactId: string) => {
      if (isConnecting && connectionSource && connectionSource !== artifactId) {
        onConnectionCreate(connectionSource, artifactId);
      }
      setIsConnecting(false);
      setConnectionSource(null);
    },
    [isConnecting, connectionSource, onConnectionCreate],
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, artifactId?: string) => {
      event.preventDefault();
      const selectedArtifacts = artifactId
        ? [artifactId]
        : dragState.selectedIds;

      setContextMenu({
        isVisible: true,
        position: { x: event.clientX, y: event.clientY },
        targetArtifactId: artifactId,
        selectedArtifacts,
      });
    },
    [dragState.selectedIds],
  );

  const handleContextMenuAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'delete':
          contextMenu.selectedArtifacts.forEach((id) => onArtifactDelete(id));
          break;
        case 'duplicate':
          contextMenu.selectedArtifacts.forEach((id) => {
            const artifact = artifacts.find((a) => a.id === id);
            if (artifact) {
              const duplicate = {
                ...artifact,
                id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                position: {
                  x: artifact.position.x + 20,
                  y: artifact.position.y + 20,
                },
              };
              onArtifactCreate(
                artifact.type as CanvasArtifactType,
                duplicate.position,
              );
            }
          });
          break;
        case 'bring-to-front':
          contextMenu.selectedArtifacts.forEach((id) => {
            const maxZ = Math.max(...artifacts.map((a) => a.zIndex));
            onArtifactUpdate(id, { zIndex: maxZ + 1 });
          });
          break;
        case 'send-to-back':
          contextMenu.selectedArtifacts.forEach((id) => {
            const minZ = Math.min(...artifacts.map((a) => a.zIndex));
            onArtifactUpdate(id, { zIndex: minZ - 1 });
          });
          break;
      }
      setContextMenu((prev) => ({ ...prev, isVisible: false }));
    },
    [
      contextMenu.selectedArtifacts,
      artifacts,
      onArtifactDelete,
      onArtifactCreate,
      onArtifactUpdate,
    ],
  );

  const selectedBounds = useMemo(() => {
    if (dragState.selectedIds.length === 0) return null;

    const selectedArtifacts = artifacts.filter((a) =>
      dragState.selectedIds.includes(a.id),
    );
    if (selectedArtifacts.length === 0) return null;

    const left = Math.min(...selectedArtifacts.map((a) => a.position.x));
    const top = Math.min(...selectedArtifacts.map((a) => a.position.y));
    const right = Math.max(
      ...selectedArtifacts.map((a) => a.position.x + a.size.width),
    );
    const bottom = Math.max(
      ...selectedArtifacts.map((a) => a.position.y + a.size.height),
    );

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
    };
  }, [dragState.selectedIds, artifacts]);

  return (
    <main
      ref={canvasRef}
      role="application"
      aria-label="Interactive canvas for creating and editing artifacts"
      className={`relative size-full overflow-hidden bg-gray-50 dark:bg-gray-900 ${className}`}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onWheel={handleWheel}
      onPointerMove={handleArtifactDragMove}
      onPointerUp={handleArtifactDragEnd}
      onContextMenu={(e) => handleContextMenu(e)}
      onKeyDown={(e) => {
        // Handle keyboard navigation
        if (
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight'
        ) {
          e.preventDefault();
          // Handle arrow key navigation for selected artifacts
        }
      }}
      style={{
        backgroundSize: `${20 * scale}px ${20 * scale}px`,
        backgroundImage: `
          linear-gradient(to right, #e5e7eb 1px, transparent 1px),
          linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
        `,
        transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
        transformOrigin: '0 0',
      }}
    >
      {/* Selection Box */}
      {selectionBox?.isSelecting && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
          style={{
            left: Math.min(selectionBox.startPos.x, selectionBox.currentPos.x),
            top: Math.min(selectionBox.startPos.y, selectionBox.currentPos.y),
            width: Math.abs(
              selectionBox.currentPos.x - selectionBox.startPos.x,
            ),
            height: Math.abs(
              selectionBox.currentPos.y - selectionBox.startPos.y,
            ),
          }}
        />
      )}

      {/* Multi-selection Bounds */}
      {selectedBounds && dragState.selectedIds.length > 1 && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none rounded"
          style={{
            left: selectedBounds.left - 4,
            top: selectedBounds.top - 4,
            width: selectedBounds.width + 8,
            height: selectedBounds.height + 8,
          }}
        >
          <div className="absolute -top-6 left-0 text-xs text-blue-600 font-medium">
            {dragState.selectedIds.length} selecionados
          </div>
        </div>
      )}

      {/* Connection Lines */}
      <svg className="absolute inset-0 pointer-events-none">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
        </defs>
        {connectionLines.map((line) => (
          <line
            key={line.id}
            x1={line.sourcePos.x}
            y1={line.sourcePos.y}
            x2={line.targetPos.x}
            y2={line.targetPos.y}
            stroke="#6b7280"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        ))}
      </svg>

      {/* Artifacts */}
      <AnimatePresence>
        {artifacts.map((artifact) => (
          <motion.div
            key={artifact.id}
            className={`absolute border-2 rounded-lg shadow-lg bg-white dark:bg-gray-800 ${
              dragState.selectedIds.includes(artifact.id)
                ? 'border-blue-500 ring-2 ring-blue-500/50'
                : 'border-gray-300 dark:border-gray-600'
            } ${artifact.isDraggable ? 'cursor-move' : 'cursor-default'}`}
            style={{
              left: artifact.position.x,
              top: artifact.position.y,
              width: artifact.size.width,
              height: artifact.size.height,
              zIndex: artifact.zIndex,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            drag={artifact.isDraggable}
            dragMomentum={false}
            onPointerDown={(e) => handleArtifactDragStart(artifact.id, e)}
            onClick={(e) => handleArtifactClick(artifact.id, e)}
            onDoubleClick={() => handleConnectionStart(artifact.id)}
            onPointerEnter={() =>
              isConnecting && handleConnectionEnd(artifact.id)
            }
            onContextMenu={(e) => handleContextMenu(e, artifact.id)}
          >
            {/* Artifact Header */}
            <div className="flex items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-700 rounded-t-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {artifact.type.replace('-', ' ').toUpperCase()}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onArtifactDelete(artifact.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Artifact Content */}
            <div className="p-2 h-full overflow-hidden">
              {renderArtifact(artifact, (updates: Partial<CanvasArtifact>) =>
                onArtifactUpdate(artifact.id, updates),
              )}
            </div>

            {/* Resize Handle */}
            {artifact.isResizable && (
              <div
                className="absolute bottom-0 right-0 size-4 cursor-se-resize"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  // Handle resize logic here
                }}
              >
                <div className="size-full bg-gray-400 rounded-tl" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Connection Preview */}
      {isConnecting &&
        connectionSource &&
        (() => {
          const sourceArtifact = artifacts.find(
            (a) => a.id === connectionSource,
          );
          return sourceArtifact ? (
            <ConnectionPreview
              sourceArtifact={sourceArtifact}
              mousePosition={{ x: 0, y: 0 }} // This would need to be tracked
            />
          ) : null;
        })()}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.isVisible && (
          <motion.div
            className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 z-50"
            style={{
              left: contextMenu.position.x,
              top: contextMenu.position.y,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.selectedArtifacts.length > 0 ? (
              <>
                <ContextMenuItem
                  label={
                    contextMenu.selectedArtifacts.length > 1
                      ? `Excluir (${contextMenu.selectedArtifacts.length})`
                      : 'Excluir'
                  }
                  onClick={() => handleContextMenuAction('delete')}
                  icon="🗑️"
                />
                <ContextMenuItem
                  label="Duplicar"
                  onClick={() => handleContextMenuAction('duplicate')}
                  icon="📋"
                />
                <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                <ContextMenuItem
                  label="Trazer para frente"
                  onClick={() => handleContextMenuAction('bring-to-front')}
                  icon="⬆️"
                />
                <ContextMenuItem
                  label="Enviar para trás"
                  onClick={() => handleContextMenuAction('send-to-back')}
                  icon="⬇️"
                />
              </>
            ) : (
              <>
                <ContextMenuItem
                  label="Novo bloco de texto"
                  onClick={() => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      const position = {
                        x: (contextMenu.position.x - rect.left - pan.x) / scale,
                        y: (contextMenu.position.y - rect.top - pan.y) / scale,
                      };
                      onArtifactCreate(
                        CANVAS_ARTIFACT_TYPES.TEXT_BLOCK,
                        position,
                      );
                    }
                    setContextMenu((prev) => ({ ...prev, isVisible: false }));
                  }}
                  icon="📝"
                />
                <ContextMenuItem
                  label="Novo bloco de código"
                  onClick={() => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      const position = {
                        x: (contextMenu.position.x - rect.left - pan.x) / scale,
                        y: (contextMenu.position.y - rect.top - pan.y) / scale,
                      };
                      onArtifactCreate(
                        CANVAS_ARTIFACT_TYPES.CODE_BLOCK,
                        position,
                      );
                    }
                    setContextMenu((prev) => ({ ...prev, isVisible: false }));
                  }}
                  icon="💻"
                />
                <ContextMenuItem
                  label="Novo cartão de proposta"
                  onClick={() => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      const position = {
                        x: (contextMenu.position.x - rect.left - pan.x) / scale,
                        y: (contextMenu.position.y - rect.top - pan.y) / scale,
                      };
                      onArtifactCreate(
                        CANVAS_ARTIFACT_TYPES.PROPOSAL_CARD,
                        position,
                      );
                    }
                    setContextMenu((prev) => ({ ...prev, isVisible: false }));
                  }}
                  icon="📊"
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

interface ConnectionPreviewProps {
  readonly sourceArtifact: CanvasArtifact;
  readonly mousePosition: { x: number; y: number };
}

function ConnectionPreview({
  sourceArtifact,
  mousePosition,
}: ConnectionPreviewProps) {
  const sourcePos = {
    x: sourceArtifact.position.x + sourceArtifact.size.width / 2,
    y: sourceArtifact.position.y + sourceArtifact.size.height / 2,
  };

  return (
    <svg className="absolute inset-0 pointer-events-none">
      <line
        x1={sourcePos.x}
        y1={sourcePos.y}
        x2={mousePosition.x}
        y2={mousePosition.y}
        stroke="#3b82f6"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
    </svg>
  );
}

interface ContextMenuItemProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly icon: string;
}

function ContextMenuItem({ label, onClick, icon }: ContextMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
    >
      <span>{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}