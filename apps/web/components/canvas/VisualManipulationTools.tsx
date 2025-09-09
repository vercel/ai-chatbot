import React, { useState, useCallback } from 'react';import React, { useState, useCallback, MouseEvent } from 'react';import React, { useState, useCallback, MouseEvent } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { CanvasArtifact, type CanvasArtifactType } from '../../lib/canvas/artifacts';import { motion, AnimatePresence } from 'framer-motion';import { motion, AnimatePresence } from 'framer-motion';



interface VisualManipulationToolsProps {import {import {

  readonly artifacts: readonly CanvasArtifact[];

  readonly onArtifactUpdate: (artifactId: string, updates: Partial<CanvasArtifact>) => void;  CanvasArtifact,  CanvasArtifact,

  readonly onArtifactCreate: (type: CanvasArtifactType, position: { x: number; y: number }) => void;

  readonly onArtifactDelete: (artifactId: string) => void;  type CanvasArtifactType  type CanvasArtifactType

  readonly canvasRef: React.RefObject<HTMLDivElement>;

  readonly scale: number;} from '../../lib/canvas/artifacts';} from '../../lib/canvas/artifacts';

  readonly pan: { x: number; y: number };

}



export function VisualManipulationTools({type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

  artifacts,

  onArtifactUpdate,

  onArtifactCreate,

  onArtifactDelete,interface VisualManipulationToolsProps {interface VisualManipulationToolsProps {

  canvasRef,

  scale,  readonly artifacts: readonly CanvasArtifact[];  readonly artifacts: readonly CanvasArtifact[];

  pan,

}: VisualManipulationToolsProps) {  readonly onArtifactUpdate: (artifactId: string, updates: Partial<CanvasArtifact>) => void;  readonly onArtifactUpdate: (artifactId: string, updates: Partial<CanvasArtifact>) => void;

  const [selectedArtifacts, setSelectedArtifacts] = useState<Set<string>>(new Set());

  const [hoveredArtifact, setHoveredArtifact] = useState<string | null>(null);  readonly onArtifactCreate: (type: CanvasArtifactType, position: { x: number; y: number }) => void;  readonly onArtifactCreate: (type: CanvasArtifactType, position: { x: number; y: number }) => void;



  // Handle artifact selection  readonly onArtifactDelete: (artifactId: string) => void;  readonly onArtifactDelete: (artifactId: string) => void;

  const handleArtifactClick = useCallback((artifactId: string, event: React.MouseEvent) => {

    event.stopPropagation();  readonly canvasRef: React.RefObject<HTMLDivElement>;  readonly canvasRef: React.RefObject<HTMLDivElement>;



    if (event.ctrlKey || event.metaKey) {  readonly scale: number;  readonly scale: number;

      // Multi-select

      setSelectedArtifacts(prev => {  readonly pan: { x: number; y: number };  readonly pan: { x: number; y: number };

        const newSet = new Set(prev);

        if (newSet.has(artifactId)) {}}

          newSet.delete(artifactId);

        } else {

          newSet.add(artifactId);

        }interface DragState {interface DragState {

        return newSet;

      });  isDragging: boolean;  isDragging: boolean;

    } else {

      // Single select  artifactId: string | null;  artifactId: string | null;

      setSelectedArtifacts(new Set([artifactId]));

    }  startPosition: { x: number; y: number };  startPosition: { x: number; y: number };

  }, []);

  offset: { x: number; y: number };  offset: { x: number; y: number };

  // Handle canvas click to clear selection

  const handleCanvasClick = useCallback(() => {  isResizing: boolean;  isResizing: boolean;

    setSelectedArtifacts(new Set());

  }, []);  resizeHandle?: ResizeHandle;  resizeHandle?: ResizeHandle;



  // Handle keyboard shortcuts}}

  const handleKeyDown = useCallback((event: KeyboardEvent) => {

    if (event.key === 'Delete' && selectedArtifacts.size > 0) {

      selectedArtifacts.forEach(artifactId => {

        onArtifactDelete(artifactId);interface SelectionBox {interface SelectionBox {

      });

      setSelectedArtifacts(new Set());  start: { x: number; y: number };  start: { x: number; y: number };

    }

  end: { x: number; y: number };  end: { x: number; y: number };

    if (event.ctrlKey || event.metaKey) {

      if (event.key === 'a') {}}

        event.preventDefault();

        setSelectedArtifacts(new Set(artifacts.map(a => a.id)));

      }

      if (event.key === 'd') {export function VisualManipulationTools({export function VisualManipulationTools({

        event.preventDefault();

        // Duplicate selected artifacts  artifacts,  artifacts,

        selectedArtifacts.forEach(artifactId => {

          const artifact = artifacts.find(a => a.id === artifactId);  onArtifactUpdate,  onArtifactUpdate,

          if (artifact) {

            onArtifactCreate(artifact.type as CanvasArtifactType, {  onArtifactCreate,  onArtifactCreate,

              x: artifact.position.x + 20,

              y: artifact.position.y + 20,  onArtifactDelete,  onArtifactDelete,

            });

          }  canvasRef,  canvasRef,

        });

      }  scale,  scale,

    }

  }, [selectedArtifacts, artifacts, onArtifactDelete, onArtifactCreate]);  pan,  pan,



  React.useEffect(() => {}: VisualManipulationToolsProps) {}: VisualManipulationToolsProps) {

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);  const [dragState, setDragState] = useState<DragState>({  const [dragState, setDragState] = useState<DragState>({

  }, [handleKeyDown]);

    isDragging: false,    isDragging: false,

  return (

    <div className="absolute inset-0" onClick={handleCanvasClick}>    artifactId: null,    artifactId: null,

      {/* Enhanced Artifact Overlays */}

      {artifacts.map(artifact => (    startPosition: { x: 0, y: 0 },    startPosition: { x: 0, y: 0 },

        <ArtifactOverlay

          key={artifact.id}    offset: { x: 0, y: 0 },    offset: { x: 0, y: 0 },

          artifact={artifact}

          isSelected={selectedArtifacts.has(artifact.id)}    isResizing: false,    isResizing: false,

          isHovered={hoveredArtifact === artifact.id}

          onClick={(e) => handleArtifactClick(artifact.id, e)}  });  });

          onHover={() => setHoveredArtifact(artifact.id)}

          onLeave={() => setHoveredArtifact(null)}

        />

      ))}  const [selectedArtifacts, setSelectedArtifacts] = useState<Set<string>>(new Set());  const [selectedArtifacts, setSelectedArtifacts] = useState<Set<string>>(new Set());



      {/* Multi-selection indicator */}  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

      {selectedArtifacts.size > 1 && (

        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50">  const [isSelecting, setIsSelecting] = useState(false);  const [isSelecting, setIsSelecting] = useState(false);

          {selectedArtifacts.size} selecionados

        </div>  const [hoveredArtifact, setHoveredArtifact] = useState<string | null>(null);  const [hoveredArtifact, setHoveredArtifact] = useState<string | null>(null);

      )}

    </div>

  );

}  // Handle mouse down for selection  // Handle mouse down for selection



interface ArtifactOverlayProps {  const handleMouseDown = useCallback((event: MouseEvent) => {  const handleMouseDown = useCallback((event: MouseEvent) => {

  readonly artifact: CanvasArtifact;

  readonly isSelected: boolean;    if (event.target === canvasRef.current) {    if (event.target === canvasRef.current) {

  readonly isHovered: boolean;

  readonly onClick: (event: React.MouseEvent) => void;      const rect = canvasRef.current?.getBoundingClientRect();      const rect = canvasRef.current?.getBoundingClientRect();

  readonly onHover: () => void;

  readonly onLeave: () => void;      if (!rect) return;      if (!rect) return;

}



function ArtifactOverlay({

  artifact,      const position = {      const position = {

  isSelected,

  isHovered,        x: (event.clientX - rect.left - pan.x) / scale,        x: (event.clientX - rect.left - pan.x) / scale,

  onClick,

  onHover,        y: (event.clientY - rect.top - pan.y) / scale,        y: (event.clientY - rect.top - pan.y) / scale,

  onLeave,

}: ArtifactOverlayProps) {      };      };

  const showHandles = isSelected || isHovered;



  return (

    <div      setIsSelecting(true);      setIsSelecting(true);

      className="absolute pointer-events-auto"

      style={{      setSelectionBox({      setSelectionBox({

        left: artifact.position.x,

        top: artifact.position.y,        start: position,        start: position,

        width: artifact.size.width,

        height: artifact.size.height,        end: position,        end: position,

      }}

      onClick={onClick}      });      });

      onMouseEnter={onHover}

      onMouseLeave={onLeave}      setSelectedArtifacts(new Set());      setSelectedArtifacts(new Set());

    >

      {/* Selection border */}    }    }

      <AnimatePresence>

        {showHandles && (  }, [canvasRef, scale, pan]);  }, [canvasRef, scale, pan]);

          <motion.div

            className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"

            initial={{ opacity: 0, scale: 0.95 }}

            animate={{ opacity: 1, scale: 1 }}  // Handle mouse move for selection box  // Handle mouse move for selection box

            exit={{ opacity: 0, scale: 0.95 }}

            transition={{ duration: 0.15 }}  const handleMouseMove = useCallback((event: MouseEvent) => {  const handleMouseMove = useCallback((event: MouseEvent) => {

          />

        )}    if (isSelecting && selectionBox) {    if (isSelecting && selectionBox) {

      </AnimatePresence>

      const rect = canvasRef.current?.getBoundingClientRect();      const rect = canvasRef.current?.getBoundingClientRect();

      {/* Resize handles */}

      {showHandles && artifact.isResizable && (      if (!rect) return;      if (!rect) return;

        <div className="absolute inset-0 pointer-events-none">

          {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (

            <div

              key={handle}      const position = {      const position = {

              className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full"

              style={getHandlePosition(handle)}        x: (event.clientX - rect.left - pan.x) / scale,        x: (event.clientX - rect.left - pan.x) / scale,

            />

          ))}        y: (event.clientY - rect.top - pan.y) / scale,        y: (event.clientY - rect.top - pan.y) / scale,

        </div>

      )}      };      };



      {/* Drag indicator */}

      {showHandles && artifact.isDraggable && (

        <div className="absolute top-0 left-0 right-0 h-6 bg-blue-500 bg-opacity-20 rounded-t-lg flex items-center justify-center">      setSelectionBox(prev => prev ? { ...prev, end: position } : null);      setSelectionBox(prev => prev ? { ...prev, end: position } : null);

          <span className="text-xs text-blue-700 font-medium">Arraste</span>

        </div>

      )}

    </div>      // Update selected artifacts based on selection box      // Update selected artifacts based on selection box

  );

}      const newSelected = new Set<string>();      const newSelected = new Set<string>();



function getHandlePosition(handle: 'nw' | 'ne' | 'sw' | 'se') {      artifacts.forEach(artifact => {      artifacts.forEach(artifact => {

  switch (handle) {

    case 'nw':        if (isArtifactInSelectionBox(artifact, selectionBox.start, position)) {        if (isArtifactInSelectionBox(artifact, selectionBox.start, position)) {

      return { top: -6, left: -6 };

    case 'ne':          newSelected.add(artifact.id);          newSelected.add(artifact.id);

      return { top: -6, right: -6 };

    case 'sw':        }        }

      return { bottom: -6, left: -6 };

    case 'se':      });      });

      return { bottom: -6, right: -6 };

    default:      setSelectedArtifacts(newSelected);      setSelectedArtifacts(newSelected);

      return {};

  }    }    }

}
  }, [isSelecting, selectionBox, artifacts, scale, pan]);  }, [isSelecting, selectionBox, artifacts, scale, pan]);



  // Handle mouse up to finish selection  // Handle mouse up to finish selection

  const handleMouseUp = useCallback(() => {  const handleMouseUp = useCallback(() => {

    setIsSelecting(false);    setIsSelecting(false);

    setSelectionBox(null);    setSelectionBox(null);

  }, []);  }, []);



  // Check if artifact is within selection box  // Check if artifact is within selection box

  const isArtifactInSelectionBox = (  const isArtifactInSelectionBox = (

    artifact: CanvasArtifact,    artifact: CanvasArtifact,

    start: { x: number; y: number },    start: { x: number; y: number },

    end: { x: number; y: number }    end: { x: number; y: number }

  ): boolean => {  ): boolean => {

    const minX = Math.min(start.x, end.x);    const minX = Math.min(start.x, end.x);

    const maxX = Math.max(start.x, end.x);    const maxX = Math.max(start.x, end.x);

    const minY = Math.min(start.y, end.y);    const minY = Math.min(start.y, end.y);

    const maxY = Math.max(start.y, end.y);    const maxY = Math.max(start.y, end.y);



    const artifactRight = artifact.position.x + artifact.size.width;    const artifactRight = artifact.position.x + artifact.size.width;

    const artifactBottom = artifact.position.y + artifact.size.height;    const artifactBottom = artifact.position.y + artifact.size.height;



    return !(    return !(

      artifactRight < minX ||      artifactRight < minX ||

      artifact.position.x > maxX ||      artifact.position.x > maxX ||

      artifactBottom < minY ||      artifactBottom < minY ||

      artifact.position.y > maxY      artifact.position.y > maxY

    );    );

  };  };



  // Handle artifact drag start  // Handle artifact drag start

  const handleArtifactDragStart = useCallback((artifactId: string, event: MouseEvent) => {  const handleArtifactDragStart = useCallback((artifactId: string, event: MouseEvent) => {

    event.stopPropagation();    event.stopPropagation();

    const artifact = artifacts.find(a => a.id === artifactId);    const artifact = artifacts.find(a => a.id === artifactId);

    if (!artifact?.isDraggable) return;    if (!artifact?.isDraggable) return;



    const rect = canvasRef.current?.getBoundingClientRect();    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) return;    if (!rect) return;



    const startPosition = {    const startPosition = {

      x: (event.clientX - rect.left - pan.x) / scale,      x: (event.clientX - rect.left - pan.x) / scale,

      y: (event.clientY - rect.top - pan.y) / scale,      y: (event.clientY - rect.top - pan.y) / scale,

    };    };



    setDragState({    setDragState({

      isDragging: true,      isDragging: true,

      artifactId,      artifactId,

      startPosition,      startPosition,

      offset: {      offset: {

        x: startPosition.x - artifact.position.x,        x: startPosition.x - artifact.position.x,

        y: startPosition.y - artifact.position.y,        y: startPosition.y - artifact.position.y,

      },      },

      isResizing: false,      isResizing: false,

    });    });



    // Select only this artifact if not already selected    // Select only this artifact if not already selected

    if (!selectedArtifacts.has(artifactId)) {    if (!selectedArtifacts.has(artifactId)) {

      setSelectedArtifacts(new Set([artifactId]));      setSelectedArtifacts(new Set([artifactId]));

    }    }

  }, [artifacts, canvasRef, scale, pan, selectedArtifacts]);  }, [artifacts, canvasRef, scale, pan, selectedArtifacts]);



  // Handle artifact drag move  // Handle artifact drag move

  const handleArtifactDragMove = useCallback((event: MouseEvent) => {  const handleArtifactDragMove = useCallback((event: MouseEvent) => {

    if (!dragState.isDragging || !dragState.artifactId) return;    if (!dragState.isDragging || !dragState.artifactId) return;



    const rect = canvasRef.current?.getBoundingClientRect();    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) return;    if (!rect) return;



    const currentPosition = {    const currentPosition = {

      x: (event.clientX - rect.left - pan.x) / scale,      x: (event.clientX - rect.left - pan.x) / scale,

      y: (event.clientY - rect.top - pan.y) / scale,      y: (event.clientY - rect.top - pan.y) / scale,

    };    };



    const newPosition = {    const newPosition = {

      x: currentPosition.x - dragState.offset.x,      x: currentPosition.x - dragState.offset.x,

      y: currentPosition.y - dragState.offset.y,      y: currentPosition.y - dragState.offset.y,

    };    };



    // Update all selected artifacts    // Update all selected artifacts

    selectedArtifacts.forEach(artifactId => {    selectedArtifacts.forEach(artifactId => {

      const artifact = artifacts.find(a => a.id === artifactId);      const artifact = artifacts.find(a => a.id === artifactId);

      if (artifact) {      if (artifact) {

        const deltaX = newPosition.x - artifact.position.x;        const deltaX = newPosition.x - artifact.position.x;

        const deltaY = newPosition.y - artifact.position.y;        const deltaY = newPosition.y - artifact.position.y;

        onArtifactUpdate(artifactId, {        onArtifactUpdate(artifactId, {

          position: {          position: {

            x: artifact.position.x + deltaX,            x: artifact.position.x + deltaX,

            y: artifact.position.y + deltaY,            y: artifact.position.y + deltaY,

          },          },

        });        });

      }      }

    });    });

  }, [dragState, selectedArtifacts, artifacts, onArtifactUpdate, scale, pan]);  }, [dragState, selectedArtifacts, artifacts, onArtifactUpdate, scale, pan]);



  // Handle artifact drag end  // Handle artifact drag end

  const handleArtifactDragEnd = useCallback(() => {  const handleArtifactDragEnd = useCallback(() => {

    if (dragState.isDragging) {    if (dragState.isDragging) {

      // Snap to grid      // Snap to grid

      selectedArtifacts.forEach(artifactId => {      selectedArtifacts.forEach(artifactId => {

        const artifact = artifacts.find(a => a.id === artifactId);        const artifact = artifacts.find(a => a.id === artifactId);

        if (artifact) {        if (artifact) {

          const snappedPosition = {          const snappedPosition = {

            x: Math.round(artifact.position.x / 20) * 20,            x: Math.round(artifact.position.x / 20) * 20,

            y: Math.round(artifact.position.y / 20) * 20,            y: Math.round(artifact.position.y / 20) * 20,

          };          };

          onArtifactUpdate(artifactId, { position: snappedPosition });          onArtifactUpdate(artifactId, { position: snappedPosition });

        }        }

      });      });

    }    }



    setDragState({    setDragState({

      isDragging: false,      isDragging: false,

      artifactId: null,      artifactId: null,

      startPosition: { x: 0, y: 0 },      startPosition: { x: 0, y: 0 },

      offset: { x: 0, y: 0 },      offset: { x: 0, y: 0 },

      isResizing: false,      isResizing: false,

    });    });

  }, [dragState, selectedArtifacts, artifacts, onArtifactUpdate]);  }, [dragState, selectedArtifacts, artifacts, onArtifactUpdate]);



  // Handle resize start  // Handle resize start

  const handleResizeStart = useCallback((artifactId: string, handle: ResizeHandle, event: MouseEvent) => {  const handleResizeStart = useCallback((artifactId: string, handle: ResizeHandle, event: MouseEvent) => {

    event.stopPropagation();    event.stopPropagation();

    setDragState({    setDragState({

      isDragging: false,      isDragging: false,

      artifactId,      artifactId,

      startPosition: { x: event.clientX, y: event.clientY },      startPosition: { x: event.clientX, y: event.clientY },

      offset: { x: 0, y: 0 },      offset: { x: 0, y: 0 },

      isResizing: true,      isResizing: true,

      resizeHandle: handle,      resizeHandle: handle,

    });    });

  }, []);  }, []);



  // Handle resize move  // Handle resize move

  const handleResizeMove = useCallback((event: MouseEvent) => {  const handleResizeMove = useCallback((event: MouseEvent) => {

    if (!dragState.isResizing || !dragState.artifactId || !dragState.resizeHandle) return;    if (!dragState.isResizing || !dragState.artifactId || !dragState.resizeHandle) return;



    const artifact = artifacts.find(a => a.id === dragState.artifactId);    const artifact = artifacts.find(a => a.id === dragState.artifactId);

    if (!artifact) return;    if (!artifact) return;



    const deltaX = event.clientX - dragState.startPosition.x;    const deltaX = event.clientX - dragState.startPosition.x;

    const deltaY = event.clientY - dragState.startPosition.y;    const deltaY = event.clientY - dragState.startPosition.y;



    let newSize = { ...artifact.size };    let newSize = { ...artifact.size };

    let newPosition = { ...artifact.position };    let newPosition = { ...artifact.position };



    switch (dragState.resizeHandle) {    switch (dragState.resizeHandle) {

      case 'se':      case 'se':

        newSize.width = Math.max(100, artifact.size.width + deltaX / scale);        newSize.width = Math.max(100, artifact.size.width + deltaX / scale);

        newSize.height = Math.max(100, artifact.size.height + deltaY / scale);        newSize.height = Math.max(100, artifact.size.height + deltaY / scale);

        break;        break;

      case 'sw':      case 'sw':

        newSize.width = Math.max(100, artifact.size.width - deltaX / scale);        newSize.width = Math.max(100, artifact.size.width - deltaX / scale);

        newSize.height = Math.max(100, artifact.size.height + deltaY / scale);        newSize.height = Math.max(100, artifact.size.height + deltaY / scale);

        newPosition.x = artifact.position.x + deltaX / scale;        newPosition.x = artifact.position.x + deltaX / scale;

        break;        break;

      case 'ne':      case 'ne':

        newSize.width = Math.max(100, artifact.size.width + deltaX / scale);        newSize.width = Math.max(100, artifact.size.width + deltaX / scale);

        newSize.height = Math.max(100, artifact.size.height - deltaY / scale);        newSize.height = Math.max(100, artifact.size.height - deltaY / scale);

        newPosition.y = artifact.position.y + deltaY / scale;        newPosition.y = artifact.position.y + deltaY / scale;

        break;        break;

      case 'nw':      case 'nw':

        newSize.width = Math.max(100, artifact.size.width - deltaX / scale);        newSize.width = Math.max(100, artifact.size.width - deltaX / scale);

        newSize.height = Math.max(100, artifact.size.height - deltaY / scale);        newSize.height = Math.max(100, artifact.size.height - deltaY / scale);

        newPosition.x = artifact.position.x + deltaX / scale;        newPosition.x = artifact.position.x + deltaX / scale;

        newPosition.y = artifact.position.y + deltaY / scale;        newPosition.y = artifact.position.y + deltaY / scale;

        break;        break;

    }    }



    onArtifactUpdate(dragState.artifactId, {    onArtifactUpdate(dragState.artifactId, {

      size: newSize,      size: newSize,

      position: newPosition,      position: newPosition,

    });    });

  }, [dragState, artifacts, onArtifactUpdate, scale]);  }, [dragState, artifacts, onArtifactUpdate, scale]);



  // Handle resize end  // Handle resize end

  const handleResizeEnd = useCallback(() => {  const handleResizeEnd = useCallback(() => {

    setDragState({    setDragState({

      isDragging: false,      isDragging: false,

      artifactId: null,      artifactId: null,

      startPosition: { x: 0, y: 0 },      startPosition: { x: 0, y: 0 },

      offset: { x: 0, y: 0 },      offset: { x: 0, y: 0 },

      isResizing: false,      isResizing: false,

    });    });

  }, []);  }, []);



  // Handle keyboard shortcuts  // Handle keyboard shortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {  const handleKeyDown = useCallback((event: KeyboardEvent) => {

    if (event.key === 'Delete' && selectedArtifacts.size > 0) {    if (event.key === 'Delete' && selectedArtifacts.size > 0) {

      selectedArtifacts.forEach(artifactId => {      selectedArtifacts.forEach(artifactId => {

        onArtifactDelete(artifactId);        onArtifactDelete(artifactId);

      });      });

      setSelectedArtifacts(new Set());      setSelectedArtifacts(new Set());

    }    }



    if (event.ctrlKey || event.metaKey) {    if (event.ctrlKey || event.metaKey) {

      if (event.key === 'a') {      if (event.key === 'a') {

        event.preventDefault();        event.preventDefault();

        setSelectedArtifacts(new Set(artifacts.map(a => a.id)));        setSelectedArtifacts(new Set(artifacts.map(a => a.id)));

      }      }

      if (event.key === 'd') {      if (event.key === 'd') {

        event.preventDefault();        event.preventDefault();

        // Duplicate selected artifacts        // Duplicate selected artifacts

        selectedArtifacts.forEach(artifactId => {        selectedArtifacts.forEach(artifactId => {

          const artifact = artifacts.find(a => a.id === artifactId);          const artifact = artifacts.find(a => a.id === artifactId);

          if (artifact) {          if (artifact) {

            onArtifactCreate(artifact.type as CanvasArtifactType, {            onArtifactCreate(artifact.type as CanvasArtifactType, {

              x: artifact.position.x + 20,              x: artifact.position.x + 20,

              y: artifact.position.y + 20,              y: artifact.position.y + 20,

            });            });

          }          }

        });        });

      }      }

    }    }

  }, [selectedArtifacts, artifacts, onArtifactDelete, onArtifactCreate]);  }, [selectedArtifacts, artifacts, onArtifactDelete, onArtifactCreate]);



  React.useEffect(() => {  React.useEffect(() => {

    document.addEventListener('keydown', handleKeyDown);    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);    return () => document.removeEventListener('keydown', handleKeyDown);

  }, [handleKeyDown]);  }, [handleKeyDown]);



  return (  return (

    <>    <>

      {/* Selection Box */}      {/* Selection Box */}

      <AnimatePresence>      <AnimatePresence>

        {selectionBox && (        {selectionBox && (

          <motion.div          <motion.div

            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none selection-overlay"            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none selection-overlay"

            style={{            style={{

              left: Math.min(selectionBox.start.x, selectionBox.end.x),              left: Math.min(selectionBox.start.x, selectionBox.end.x),

              top: Math.min(selectionBox.start.y, selectionBox.end.y),              top: Math.min(selectionBox.start.y, selectionBox.end.y),

              width: Math.abs(selectionBox.end.x - selectionBox.start.x),              width: Math.abs(selectionBox.end.x - selectionBox.start.x),

              height: Math.abs(selectionBox.end.y - selectionBox.start.y),              height: Math.abs(selectionBox.end.y - selectionBox.start.y),

            }}            }}

            initial={{ opacity: 0 }}            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}            exit={{ opacity: 0 }}

          />          />

        )}        )}

      </AnimatePresence>      </AnimatePresence>



      {/* Enhanced Artifact Overlays */}      {/* Enhanced Artifact Overlays */}

      {artifacts.map(artifact => (      {artifacts.map(artifact => (

        <ArtifactOverlay        <ArtifactOverlay

          key={artifact.id}          key={artifact.id}

          artifact={artifact}          artifact={artifact}

          isSelected={selectedArtifacts.has(artifact.id)}          isSelected={selectedArtifacts.has(artifact.id)}

          isHovered={hoveredArtifact === artifact.id}          isHovered={hoveredArtifact === artifact.id}

          onMouseDown={(e) => handleArtifactDragStart(artifact.id, e)}          onMouseDown={(e) => handleArtifactDragStart(artifact.id, e)}

          onResizeStart={handleResizeStart}          onResizeStart={handleResizeStart}

          onHover={() => setHoveredArtifact(artifact.id)}          onHover={() => setHoveredArtifact(artifact.id)}

          onLeave={() => setHoveredArtifact(null)}          onLeave={() => setHoveredArtifact(null)}

        />        />

      ))}      ))}



      {/* Multi-selection handles */}      {/* Multi-selection handles */}

      {selectedArtifacts.size > 1 && (      {selectedArtifacts.size > 1 && (

        <MultiSelectionHandles        <MultiSelectionHandles

          artifacts={artifacts.filter(a => selectedArtifacts.has(a.id))}          artifacts={artifacts.filter(a => selectedArtifacts.has(a.id))}

          onUpdate={onArtifactUpdate}          onUpdate={onArtifactUpdate}

        />        />

      )}      )}

    </>    </>

  );  );

}}



// Enhanced artifact overlay with resize handles// Enhanced artifact overlay with resize handles

interface ArtifactOverlayProps {interface ArtifactOverlayProps {

  readonly artifact: CanvasArtifact;  readonly artifact: CanvasArtifact;

  readonly isSelected: boolean;  readonly isSelected: boolean;

  readonly isHovered: boolean;  readonly isHovered: boolean;

  readonly onMouseDown: (event: MouseEvent) => void;  readonly onMouseDown: (event: MouseEvent) => void;

  readonly onResizeStart: (artifactId: string, handle: ResizeHandle, event: MouseEvent) => void;  readonly onResizeStart: (artifactId: string, handle: ResizeHandle, event: MouseEvent) => void;

  readonly onHover: () => void;  readonly onHover: () => void;

  readonly onLeave: () => void;  readonly onLeave: () => void;

}}



function ArtifactOverlay({function ArtifactOverlay({

  artifact,  artifact,

  isSelected,  isSelected,

  isHovered,  isHovered,

  onMouseDown,  onMouseDown,

  onResizeStart,  onResizeStart,

  onHover,  onHover,

  onLeave,  onLeave,

}: ArtifactOverlayProps) {}: ArtifactOverlayProps) {

  const showHandles = isSelected || isHovered;  const showHandles = isSelected || isHovered;



  return (  return (

    <div    <div

      className="absolute pointer-events-none artifact-overlay"      className="absolute pointer-events-none artifact-overlay"

      style={{      style={{

        left: artifact.position.x,        left: artifact.position.x,

        top: artifact.position.y,        top: artifact.position.y,

        width: artifact.size.width,        width: artifact.size.width,

        height: artifact.size.height,        height: artifact.size.height,

      }}      }}

      onMouseEnter={onHover}      onMouseEnter={onHover}

      onMouseLeave={onLeave}      onMouseLeave={onLeave}

    >    >

      {/* Selection border */}      {/* Selection border */}

      <AnimatePresence>      <AnimatePresence>

        {showHandles && (        {showHandles && (

          <motion.div          <motion.div

            className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none selection-border"            className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none selection-border"

            initial={{ opacity: 0, scale: 0.95 }}            initial={{ opacity: 0, scale: 0.95 }}

            animate={{ opacity: 1, scale: 1 }}            animate={{ opacity: 1, scale: 1 }}

            exit={{ opacity: 0, scale: 0.95 }}            exit={{ opacity: 0, scale: 0.95 }}

            transition={{ duration: 0.15 }}            transition={{ duration: 0.15 }}

          />          />

        )}        )}

      </AnimatePresence>      </AnimatePresence>



      {/* Resize handles */}      {/* Resize handles */}

      {showHandles && artifact.isResizable && (      {showHandles && artifact.isResizable && (

        <>        <>

          {/* Corner handles */}          {/* Corner handles */}

          {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (          {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (

            <motion.button            <motion.button

              key={handle}              key={handle}

              type="button"              type="button"

              className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-pointer pointer-events-auto resize-handle"              className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-pointer pointer-events-auto resize-handle"

              style={{              style={{

                ...getHandlePosition(handle, artifact.size),                ...getHandlePosition(handle, artifact.size),

              }}              }}

              initial={{ scale: 0 }}              initial={{ scale: 0 }}

              animate={{ scale: 1 }}              animate={{ scale: 1 }}

              exit={{ scale: 0 }}              exit={{ scale: 0 }}

              whileHover={{ scale: 1.2 }}              whileHover={{ scale: 1.2 }}

              onMouseDown={(e) => {              onMouseDown={(e) => {

                e.stopPropagation();                e.stopPropagation();

                onResizeStart(artifact.id, handle, e);                onResizeStart(artifact.id, handle, e);

              }}              }}

              aria-label={`Resize ${handle} handle`}              aria-label={`Resize ${handle} handle`}

            />            />

          ))}          ))}

        </>        </>

      )}      )}



      {/* Drag handle */}      {/* Drag handle */}

      {showHandles && artifact.isDraggable && (      {showHandles && artifact.isDraggable && (

        <motion.div        <motion.div

          className="absolute top-0 left-0 right-0 h-6 bg-blue-500 bg-opacity-20 cursor-move pointer-events-auto rounded-t-lg drag-handle"          className="absolute top-0 left-0 right-0 h-6 bg-blue-500 bg-opacity-20 cursor-move pointer-events-auto rounded-t-lg drag-handle"

          initial={{ opacity: 0 }}          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}          animate={{ opacity: 1 }}

          exit={{ opacity: 0 }}          exit={{ opacity: 0 }}

          onMouseDown={onMouseDown}          onMouseDown={onMouseDown}

        />        />

      )}      )}

    </div>    </div>

  );  );

}}



// Multi-selection handles for group operations// Multi-selection handles for group operations

interface MultiSelectionHandlesProps {interface MultiSelectionHandlesProps {

  readonly artifacts: readonly CanvasArtifact[];  readonly artifacts: readonly CanvasArtifact[];

  readonly onUpdate: (artifactId: string, updates: Partial<CanvasArtifact>) => void;  readonly onUpdate: (artifactId: string, updates: Partial<CanvasArtifact>) => void;

}}



function MultiSelectionHandles({ artifacts, onUpdate }: MultiSelectionHandlesProps) {function MultiSelectionHandles({ artifacts, onUpdate }: MultiSelectionHandlesProps) {

  if (artifacts.length === 0) return null;  if (artifacts.length === 0) return null;



  // Calculate bounding box  // Calculate bounding box

  const minX = Math.min(...artifacts.map(a => a.position.x));  const minX = Math.min(...artifacts.map(a => a.position.x));

  const minY = Math.min(...artifacts.map(a => a.position.y));  const minY = Math.min(...artifacts.map(a => a.position.y));

  const maxX = Math.max(...artifacts.map(a => a.position.x + a.size.width));  const maxX = Math.max(...artifacts.map(a => a.position.x + a.size.width));

  const maxY = Math.max(...artifacts.map(a => a.position.y + a.size.height));  const maxY = Math.max(...artifacts.map(a => a.position.y + a.size.height));



  return (  return (

    <div    <div

      className="absolute border-2 border-dashed border-blue-300 rounded-lg pointer-events-none multi-selection"      className="absolute border-2 border-dashed border-blue-300 rounded-lg pointer-events-none multi-selection"

      style={{      style={{

        left: minX - 5,        left: minX - 5,

        top: minY - 5,        top: minY - 5,

        width: maxX - minX + 10,        width: maxX - minX + 10,

        height: maxY - minY + 10,        height: maxY - minY + 10,

      }}      }}

    >    >

      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium selection-count">      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium selection-count">

        {artifacts.length} selecionados        {artifacts.length} selecionados

      </div>      </div>

    </div>    </div>

  );  );

}}



// Utility function to get resize handle positions// Utility function to get resize handle positions

function getHandlePosition(handle: ResizeHandle, size: { width: number; height: number }) {function getHandlePosition(handle: ResizeHandle, size: { width: number; height: number }) {

  switch (handle) {  switch (handle) {

    case 'nw':    case 'nw':

      return { top: -6, left: -6 };      return { top: -6, left: -6 };

    case 'ne':    case 'ne':

      return { top: -6, right: -6 };      return { top: -6, right: -6 };

    case 'sw':    case 'sw':

      return { bottom: -6, left: -6 };      return { bottom: -6, left: -6 };

    case 'se':    case 'se':

      return { bottom: -6, right: -6 };      return { bottom: -6, right: -6 };

    default:    default:

      return {};      return {};

  }  }

}}

interface VisualManipulationToolsProps {
  artifacts: CanvasArtifact[];
  onArtifactUpdate: (artifactId: string, updates: Partial<CanvasArtifact>) => void;
  onArtifactCreate: (type: CanvasArtifactType, position: { x: number; y: number }) => void;
  onArtifactDelete: (artifactId: string) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  scale: number;
  pan: { x: number; y: number };
}

interface DragState {
  isDragging: boolean;
  artifactId: string | null;
  startPosition: { x: number; y: number };
  offset: { x: number; y: number };
  isResizing: boolean;
  resizeHandle?: 'nw' | 'ne' | 'sw' | 'se';
}

interface SelectionBox {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export function VisualManipulationTools({
  artifacts,
  onArtifactUpdate,
  onArtifactCreate,
  onArtifactDelete,
  canvasRef,
  scale,
  pan,
}: VisualManipulationToolsProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    artifactId: null,
    startPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    isResizing: false,
  });

  const [selectedArtifacts, setSelectedArtifacts] = useState<Set<string>>(new Set());
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoveredArtifact, setHoveredArtifact] = useState<string | null>(null);

  // Handle mouse down for selection
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.target === canvasRef.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const position = {
        x: (event.clientX - rect.left - pan.x) / scale,
        y: (event.clientY - rect.top - pan.y) / scale,
      };

      setIsSelecting(true);
      setSelectionBox({
        start: position,
        end: position,
      });
      setSelectedArtifacts(new Set());
    }
  }, [canvasRef, scale, pan]);

  // Handle mouse move for selection box
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isSelecting && selectionBox) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const position = {
        x: (event.clientX - rect.left - pan.x) / scale,
        y: (event.clientY - rect.top - pan.y) / scale,
      };

      setSelectionBox(prev => prev ? { ...prev, end: position } : null);

      // Update selected artifacts based on selection box
      const newSelected = new Set<string>();
      artifacts.forEach(artifact => {
        if (isArtifactInSelectionBox(artifact, selectionBox.start, position)) {
          newSelected.add(artifact.id);
        }
      });
      setSelectedArtifacts(newSelected);
    }
  }, [isSelecting, selectionBox, artifacts, scale, pan]);

  // Handle mouse up to finish selection
  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionBox(null);
  }, []);

  // Check if artifact is within selection box
  const isArtifactInSelectionBox = (
    artifact: CanvasArtifact,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): boolean => {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    const artifactRight = artifact.position.x + artifact.size.width;
    const artifactBottom = artifact.position.y + artifact.size.height;

    return !(
      artifactRight < minX ||
      artifact.position.x > maxX ||
      artifactBottom < minY ||
      artifact.position.y > maxY
    );
  };

  // Handle artifact drag start
  const handleArtifactDragStart = useCallback((artifactId: string, event: MouseEvent) => {
    event.stopPropagation();
    const artifact = artifacts.find(a => a.id === artifactId);
    if (!artifact?.isDraggable) return;

    const rect = canvasRef.current!.getBoundingClientRect();
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
      isResizing: false,
    });

    // Select only this artifact if not already selected
    if (!selectedArtifacts.has(artifactId)) {
      setSelectedArtifacts(new Set([artifactId]));
    }
  }, [artifacts, canvasRef, scale, pan, selectedArtifacts]);

  // Handle artifact drag move
  const handleArtifactDragMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.artifactId) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const currentPosition = {
      x: (event.clientX - rect.left - pan.x) / scale,
      y: (event.clientY - rect.top - pan.y) / scale,
    };

    const newPosition = {
      x: currentPosition.x - dragState.offset.x,
      y: currentPosition.y - dragState.offset.y,
    };

    // Update all selected artifacts
    selectedArtifacts.forEach(artifactId => {
      const artifact = artifacts.find(a => a.id === artifactId);
      if (artifact) {
        const deltaX = newPosition.x - artifact.position.x;
        const deltaY = newPosition.y - artifact.position.y;
        onArtifactUpdate(artifactId, {
          position: {
            x: artifact.position.x + deltaX,
            y: artifact.position.y + deltaY,
          },
        });
      }
    });
  }, [dragState, selectedArtifacts, artifacts, onArtifactUpdate, scale, pan]);

  // Handle artifact drag end
  const handleArtifactDragEnd = useCallback(() => {
    if (dragState.isDragging) {
      // Snap to grid
      selectedArtifacts.forEach(artifactId => {
        const artifact = artifacts.find(a => a.id === artifactId);
        if (artifact) {
          const snappedPosition = {
            x: Math.round(artifact.position.x / 20) * 20,
            y: Math.round(artifact.position.y / 20) * 20,
          };
          onArtifactUpdate(artifactId, { position: snappedPosition });
        }
      });
    }

    setDragState({
      isDragging: false,
      artifactId: null,
      startPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      isResizing: false,
    });
  }, [dragState, selectedArtifacts, artifacts, onArtifactUpdate]);

  // Handle resize start
  const handleResizeStart = useCallback((artifactId: string, handle: 'nw' | 'ne' | 'sw' | 'se', event: MouseEvent) => {
    event.stopPropagation();
    setDragState({
      isDragging: false,
      artifactId,
      startPosition: { x: event.clientX, y: event.clientY },
      offset: { x: 0, y: 0 },
      isResizing: true,
      resizeHandle: handle,
    });
  }, []);

  // Handle resize move
  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!dragState.isResizing || !dragState.artifactId || !dragState.resizeHandle) return;

    const artifact = artifacts.find(a => a.id === dragState.artifactId);
    if (!artifact) return;

    const deltaX = event.clientX - dragState.startPosition.x;
    const deltaY = event.clientY - dragState.startPosition.y;

    let newSize = { ...artifact.size };
    let newPosition = { ...artifact.position };

    switch (dragState.resizeHandle) {
      case 'se':
        newSize.width = Math.max(100, artifact.size.width + deltaX / scale);
        newSize.height = Math.max(100, artifact.size.height + deltaY / scale);
        break;
      case 'sw':
        newSize.width = Math.max(100, artifact.size.width - deltaX / scale);
        newSize.height = Math.max(100, artifact.size.height + deltaY / scale);
        newPosition.x = artifact.position.x + deltaX / scale;
        break;
      case 'ne':
        newSize.width = Math.max(100, artifact.size.width + deltaX / scale);
        newSize.height = Math.max(100, artifact.size.height - deltaY / scale);
        newPosition.y = artifact.position.y + deltaY / scale;
        break;
      case 'nw':
        newSize.width = Math.max(100, artifact.size.width - deltaX / scale);
        newSize.height = Math.max(100, artifact.size.height - deltaY / scale);
        newPosition.x = artifact.position.x + deltaX / scale;
        newPosition.y = artifact.position.y + deltaY / scale;
        break;
    }

    onArtifactUpdate(dragState.artifactId, {
      size: newSize,
      position: newPosition,
    });
  }, [dragState, artifacts, onArtifactUpdate, scale]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      artifactId: null,
      startPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      isResizing: false,
    });
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' && selectedArtifacts.size > 0) {
      selectedArtifacts.forEach(artifactId => {
        onArtifactDelete(artifactId);
      });
      setSelectedArtifacts(new Set());
    }

    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'a') {
        event.preventDefault();
        setSelectedArtifacts(new Set(artifacts.map(a => a.id)));
      }
      if (event.key === 'd') {
        event.preventDefault();
        // Duplicate selected artifacts
        selectedArtifacts.forEach(artifactId => {
          const artifact = artifacts.find(a => a.id === artifactId);
          if (artifact) {
            onArtifactCreate(artifact.type as CanvasArtifactType, {
              x: artifact.position.x + 20,
              y: artifact.position.y + 20,
            });
          }
        });
      }
    }
  }, [selectedArtifacts, artifacts, onArtifactDelete, onArtifactCreate]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Selection Box */}
      <AnimatePresence>
        {selectionBox && (
          <motion.div
            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
            style={{
              left: Math.min(selectionBox.start.x, selectionBox.end.x),
              top: Math.min(selectionBox.start.y, selectionBox.end.y),
              width: Math.abs(selectionBox.end.x - selectionBox.start.x),
              height: Math.abs(selectionBox.end.y - selectionBox.start.y),
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Enhanced Artifact Overlays */}
      {artifacts.map(artifact => (
        <ArtifactOverlay
          key={artifact.id}
          artifact={artifact}
          isSelected={selectedArtifacts.has(artifact.id)}
          isHovered={hoveredArtifact === artifact.id}
          onMouseDown={(e) => handleArtifactDragStart(artifact.id, e)}
          onResizeStart={handleResizeStart}
          onHover={() => setHoveredArtifact(artifact.id)}
          onLeave={() => setHoveredArtifact(null)}
        />
      ))}

      {/* Multi-selection handles */}
      {selectedArtifacts.size > 1 && (
        <MultiSelectionHandles
          artifacts={artifacts.filter(a => selectedArtifacts.has(a.id))}
          onUpdate={onArtifactUpdate}
        />
      )}
    </>
  );
}

// Enhanced artifact overlay with resize handles
interface ArtifactOverlayProps {
  artifact: CanvasArtifact;
  isSelected: boolean;
  isHovered: boolean;
  onMouseDown: (event: MouseEvent) => void;
  onResizeStart: (artifactId: string, handle: 'nw' | 'ne' | 'sw' | 'se', event: MouseEvent) => void;
  onHover: () => void;
  onLeave: () => void;
}

function ArtifactOverlay({
  artifact,
  isSelected,
  isHovered,
  onMouseDown,
  onResizeStart,
  onHover,
  onLeave,
}: ArtifactOverlayProps) {
  const showHandles = isSelected || isHovered;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: artifact.position.x,
        top: artifact.position.y,
        width: artifact.size.width,
        height: artifact.size.height,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Selection border */}
      <AnimatePresence>
        {showHandles && (
          <motion.div
            className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* Resize handles */}
      {showHandles && artifact.isResizable && (
        <>
          {/* Corner handles */}
          {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
            <motion.div
              key={handle}
              className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-pointer pointer-events-auto"
              style={{
                ...getHandlePosition(handle, artifact.size),
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.2 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(artifact.id, handle, e);
              }}
            />
          ))}
        </>
      )}

      {/* Drag handle */}
      {showHandles && artifact.isDraggable && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-6 bg-blue-500 bg-opacity-20 cursor-move pointer-events-auto rounded-t-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onMouseDown}
        />
      )}
    </div>
  );
}

// Multi-selection handles for group operations
interface MultiSelectionHandlesProps {
  artifacts: CanvasArtifact[];
  onUpdate: (artifactId: string, updates: Partial<CanvasArtifact>) => void;
}

function MultiSelectionHandles({ artifacts, onUpdate }: MultiSelectionHandlesProps) {
  if (artifacts.length === 0) return null;

  // Calculate bounding box
  const minX = Math.min(...artifacts.map(a => a.position.x));
  const minY = Math.min(...artifacts.map(a => a.position.y));
  const maxX = Math.max(...artifacts.map(a => a.position.x + a.size.width));
  const maxY = Math.max(...artifacts.map(a => a.position.y + a.size.height));

  return (
    <div
      className="absolute border-2 border-dashed border-blue-300 rounded-lg pointer-events-none"
      style={{
        left: minX - 5,
        top: minY - 5,
        width: maxX - minX + 10,
        height: maxY - minY + 10,
      }}
    >
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium">
        {artifacts.length} selecionados
      </div>
    </div>
  );
}

// Utility function to get resize handle positions
function getHandlePosition(handle: 'nw' | 'ne' | 'sw' | 'se', size: { width: number; height: number }) {
  switch (handle) {
    case 'nw':
      return { top: -6, left: -6 };
    case 'ne':
      return { top: -6, right: -6 };
    case 'sw':
      return { bottom: -6, left: -6 };
    case 'se':
      return { bottom: -6, right: -6 };
    default:
      return {};
  }
}