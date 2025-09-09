import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  readonly onArtifactUpdate: (artifactId: string, updates: Partial<CanvasArtifact>) => void;
  readonly onArtifactCreate: (type: CanvasArtifactType, position: { x: number; y: number }) => void;
  readonly onArtifactDelete: (artifactId: string) => void;
  readonly onConnectionCreate: (sourceId: string, targetId: string) => void;
  readonly onConnectionDelete: (sourceId: string, targetId: string) => void;
  readonly className?: string;
}

interface DragState {
  isDragging: boolean;
  artifactId: string | null;
  startPosition: { x: number; y: number };
  offset: { x: number; y: number };
}

interface ConnectionLine {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
}

export function InteractiveCanvas({
  artifacts,
  onArtifactUpdate,
  onArtifactCreate,
  onArtifactDelete,
  onConnectionCreate,
  onConnectionDelete,
  className = '',
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    artifactId: null,
    startPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
  });
  const [connectionLines, setConnectionLines] = useState<ConnectionLine[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan] = useState({ x: 0, y: 0 });

  // Update connection lines when artifacts change
  useEffect(() => {
    const lines: ConnectionLine[] = [];
    artifacts.forEach((artifact: CanvasArtifact) => {
      artifact.connections.forEach((targetId: string) => {
        const targetArtifact = artifacts.find((a: CanvasArtifact) => a.id === targetId);
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

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: (event.clientX - rect.left - pan.x) / scale,
        y: (event.clientY - rect.top - pan.y) / scale,
      };

      // Create context menu or default artifact
      onArtifactCreate(CANVAS_ARTIFACT_TYPES.TEXT_BLOCK, position);
    }
  }, [pan, scale, onArtifactCreate]);

  const handleArtifactDragStart = useCallback((artifactId: string, event: React.PointerEvent) => {
    const artifact = artifacts.find(a => a.id === artifactId);
    if (!artifact?.isDraggable) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startPosition = {
      x: (event.clientX - rect.left - pan.x) / scale,
      y: (event.clientY - rect.top - pan.y) / scale,
    };

    setDragState({
      isDragging: true,
      artifactId,
      startPosition,
      offset: {
        x: startPosition.x - artifact.position.x,
        y: startPosition.y - artifact.position.y,
      },
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  }, [artifacts, pan, scale]);

  const handleArtifactDragMove = useCallback((event: React.PointerEvent) => {
    if (!dragState.isDragging || !dragState.artifactId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentPosition = {
      x: (event.clientX - rect.left - pan.x) / scale,
      y: (event.clientY - rect.top - pan.y) / scale,
    };

    const newPosition = {
      x: currentPosition.x - dragState.offset.x,
      y: currentPosition.y - dragState.offset.y,
    };

    onArtifactUpdate(dragState.artifactId, { position: newPosition });
  }, [dragState, pan, scale, onArtifactUpdate]);

  const handleArtifactDragEnd = useCallback(() => {
    if (dragState.isDragging && dragState.artifactId) {
      // Snap to grid
      const artifact = artifacts.find(a => a.id === dragState.artifactId);
      if (artifact) {
        const snappedPosition = {
          x: Math.round(artifact.position.x / 20) * 20,
          y: Math.round(artifact.position.y / 20) * 20,
        };
        onArtifactUpdate(dragState.artifactId, { position: snappedPosition });
      }
    }

    setDragState({
      isDragging: false,
      artifactId: null,
      startPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
    });
  }, [dragState, artifacts, onArtifactUpdate]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!event.ctrlKey) return;
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * zoomFactor, 0.5), 2));
  }, []);

  const handleConnectionStart = useCallback((artifactId: string) => {
    setIsConnecting(true);
    setConnectionSource(artifactId);
  }, []);

  const handleConnectionEnd = useCallback((artifactId: string) => {
    if (isConnecting && connectionSource && connectionSource !== artifactId) {
      onConnectionCreate(connectionSource, artifactId);
    }
    setIsConnecting(false);
    setConnectionSource(null);
  }, [isConnecting, connectionSource, onConnectionCreate]);

  return (
    <div
      ref={canvasRef}
      className={`relative size-full overflow-hidden bg-gray-50 dark:bg-gray-900 ${className}`}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onPointerMove={handleArtifactDragMove}
      onPointerUp={handleArtifactDragEnd}
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
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6b7280"
            />
          </marker>
        </defs>
        {connectionLines.map(line => (
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
        {artifacts.map(artifact => (
          <motion.div
            key={artifact.id}
            className={`absolute border-2 rounded-lg shadow-lg bg-white dark:bg-gray-800 ${
              artifact.isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'
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
            onDoubleClick={() => handleConnectionStart(artifact.id)}
            onPointerEnter={() => isConnecting && handleConnectionEnd(artifact.id)}
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
              {renderArtifact(artifact, (updates: Partial<CanvasArtifact>) => onArtifactUpdate(artifact.id, updates))}
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
      {isConnecting && connectionSource && (
        (() => {
          const sourceArtifact = artifacts.find(a => a.id === connectionSource);
          return sourceArtifact ? (
            <ConnectionPreview
              sourceArtifact={sourceArtifact}
              mousePosition={{ x: 0, y: 0 }} // This would need to be tracked
            />
          ) : null;
        })()
      )}
    </div>
  );
}

interface ConnectionPreviewProps {
  readonly sourceArtifact: CanvasArtifact;
  readonly mousePosition: { x: number; y: number };
}

function ConnectionPreview({ sourceArtifact, mousePosition }: ConnectionPreviewProps) {
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