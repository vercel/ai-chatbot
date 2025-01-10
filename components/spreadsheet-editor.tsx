'use client';

import React, { useEffect, useState, useRef, KeyboardEvent, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, PlusIcon, UploadIcon } from './icons';

interface SpreadsheetData {
  headers: string[];
  rows: string[][];
}

interface SpreadsheetEditorProps {
  content: string;
  saveContent: (updatedContent: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
}

const PureSpreadsheetEditor = ({
  content,
  saveContent,
  status,
  isCurrentVersion,
}: SpreadsheetEditorProps) => {
  const [data, setData] = useState<SpreadsheetData>(() => {
    try {
      const parsed = JSON.parse(content);
      return {
        headers: Array.isArray(parsed.headers) ? parsed.headers : ['A', 'B', 'C'],
        rows: Array.isArray(parsed.rows) ? parsed.rows.map((row: unknown) => 
          Array.isArray(row) ? row.map(cell => String(cell || '')) : new Array(parsed.headers?.length || 3).fill('')
        ) : [new Array(3).fill(''), new Array(3).fill('')]
      };
    } catch {
      return { headers: ['A', 'B', 'C'], rows: [['', '', ''], ['', '', '']] };
    }
  });

  // Memoize content update handler
  const handleContentUpdate = useCallback((newContent: string) => {
    try {
      const parsed = JSON.parse(newContent);
      if (parsed && typeof parsed === 'object') {
        setData(prevData => {
          const newData = {
            headers: Array.isArray(parsed.headers) ? parsed.headers.map((h: unknown) => String(h || '')) : prevData.headers,
            rows: Array.isArray(parsed.rows) ? parsed.rows.map((row: unknown) => 
              Array.isArray(row) ? row.map(cell => String(cell || '')) : new Array(parsed.headers?.length || prevData.headers.length).fill('')
            ) : prevData.rows
          };
          // Normalize rows
          newData.rows = newData.rows.map((row: string[]) => {
            const normalizedRow = [...row];
            while (normalizedRow.length < newData.headers.length) {
              normalizedRow.push('');
            }
            return normalizedRow.slice(0, newData.headers.length);
          });
          return newData;
        });
      }
    } catch (error) {
      console.error('Failed to parse updated content:', error);
    }
  }, []); // No dependencies needed as we use functional updates

  useEffect(() => {
    const currentContent = JSON.stringify({
      headers: data.headers,
      rows: data.rows
    });
    
    if (content && content !== currentContent) {
      handleContentUpdate(content);
    }
  }, [content, handleContentUpdate]);

  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
    value: string;
  } | null>(null);

  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState<number | null>(null);
  const [showRowMenu, setShowRowMenu] = useState<number | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize cell and header change handlers
  const handleHeaderChange = useCallback((index: number, value: string) => {
    setData(prevData => {
      const newData = {
        headers: [...prevData.headers],
        rows: [...prevData.rows]
      };
      newData.headers[index] = value;
      saveContent(JSON.stringify(newData), true);
      return newData;
    });
  }, [saveContent]);

  const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setData(prevData => {
      const newData = {
        headers: [...prevData.headers],
        rows: prevData.rows.map(row => [...row])
      };
      if (!newData.rows[rowIndex]) {
        newData.rows[rowIndex] = [];
      }
      newData.rows[rowIndex][colIndex] = value;
      saveContent(JSON.stringify(newData), true);
      return newData;
    });
  }, [saveContent]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(data.rows.length - 1, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(data.headers.length - 1, col + 1);
        break;
      case 'Enter':
        if (!editingCell) {
          setEditingCell({ row, col, value: data.rows[row][col] });
        }
        break;
      case 'Escape':
        setEditingCell(null);
        break;
      default:
        return;
    }

    if (newRow !== row || newCol !== col) {
      e.preventDefault();
      setSelectedCell({ row: newRow, col: newCol });
      setEditingCell(null);
    }
  }, [selectedCell, data.rows.length, data.headers.length, editingCell]);

  const addColumn = useCallback((index?: number) => {
    setData(prevData => {
      const insertAt = typeof index === 'number' ? index : prevData.headers.length;
      const newData = {
        headers: [...prevData.headers],
        rows: prevData.rows.map(row => [...row])
      };
      
      // Generate next column name (A, B, C, ..., Z, AA, AB, ...)
      const getNextColumnName = (n: number) => {
        let name = '';
        while (n >= 0) {
          name = String.fromCharCode(65 + (n % 26)) + name;
          n = Math.floor(n / 26) - 1;
        }
        return name;
      };

      newData.headers.splice(insertAt, 0, getNextColumnName(prevData.headers.length));
      newData.rows.forEach(row => row.splice(insertAt, 0, ''));
      
      saveContent(JSON.stringify(newData), true);
      return newData;
    });
  }, [saveContent]);

  const deleteColumn = useCallback((index: number) => {
    setData(prevData => {
      if (prevData.headers.length <= 1) return prevData;

      const newData = {
        headers: [...prevData.headers],
        rows: prevData.rows.map(row => [...row])
      };

      newData.headers.splice(index, 1);
      newData.rows.forEach(row => row.splice(index, 1));
      
      saveContent(JSON.stringify(newData), true);
      return newData;
    });
  }, [saveContent]);

  const addRow = useCallback((index?: number) => {
    setData(prevData => {
      const newData = {
        headers: [...prevData.headers],
        rows: [...prevData.rows]
      };
      const newRow = new Array(prevData.headers.length).fill('');
      
      if (typeof index === 'number') {
        newData.rows.splice(index, 0, newRow);
      } else {
        newData.rows.push(newRow);
      }
      
      saveContent(JSON.stringify(newData), true);
      return newData;
    });
  }, [saveContent]);

  const deleteRow = useCallback((index: number) => {
    setData(prevData => {
      if (prevData.rows.length <= 1) return prevData;

      const newData = {
        headers: [...prevData.headers],
        rows: [...prevData.rows]
      };
      newData.rows.splice(index, 1);
      
      saveContent(JSON.stringify(newData), true);
      return newData;
    });
  }, [saveContent]);

  if (!isCurrentVersion || status === 'streaming') {
    return (
      <div className="w-full overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="w-10 bg-muted border p-2"></th>
              {data.headers.map((header, i) => (
                <th key={i} className="border p-2 bg-muted min-w-[100px]">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="border p-2 bg-muted text-center text-sm text-muted-foreground">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border p-2 min-w-[100px]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div 
      className="w-full overflow-x-auto"
      ref={editorRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <table className="min-w-full border-collapse relative">
        <thead>
          <tr>
            <th className="w-10 bg-muted border p-2"></th>
            {data.headers.map((header, i) => (
              <th 
                key={i} 
                className={cn(
                  "border p-2 bg-muted min-w-[100px] relative group",
                  hoveredColumn === i && "bg-muted/80",
                  "hover:cursor-pointer"
                )}
                onMouseEnter={() => setHoveredColumn(i)}
                onMouseLeave={() => setHoveredColumn(null)}
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleHeaderChange(i, e.target.value);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      e.target.select();
                    }}
                    className="w-full bg-transparent focus:outline-none text-center"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowColumnMenu(showColumnMenu === i ? null : i);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronDownIcon size={16} />
                  </button>
                </div>
                {showColumnMenu === i && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-popover border rounded-md shadow-md z-10">
                    <button
                      onClick={() => { addColumn(i); setShowColumnMenu(null); }}
                      className="w-full px-3 py-2 text-left hover:bg-muted"
                    >
                      Insert column left
                    </button>
                    <button
                      onClick={() => { addColumn(i + 1); setShowColumnMenu(null); }}
                      className="w-full px-3 py-2 text-left hover:bg-muted"
                    >
                      Insert column right
                    </button>
                    <button
                      onClick={() => { deleteColumn(i); setShowColumnMenu(null); }}
                      className="w-full px-3 py-2 text-left hover:bg-muted text-destructive"
                    >
                      Delete column
                    </button>
                  </div>
                )}
              </th>
            ))}
            <th className="w-10 bg-muted border p-2">
              <button
                onClick={() => addColumn()}
                className="w-6 h-6 flex items-center justify-center hover:bg-primary/10 rounded transition-colors"
                title="Add column"
              >
                <PlusIcon size={16} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              className={cn(hoveredRow === rowIndex && "bg-muted/5")}
              onMouseEnter={() => setHoveredRow(rowIndex)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="border p-2 bg-muted text-center text-sm text-muted-foreground relative group">
                <div className="flex items-center justify-between">
                  <span>{rowIndex + 1}</span>
                  <button
                    onClick={() => setShowRowMenu(showRowMenu === rowIndex ? null : rowIndex)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronDownIcon size={16} />
                  </button>
                </div>
                {showRowMenu === rowIndex && (
                  <div className="absolute top-0 left-full ml-1 w-40 bg-popover border rounded-md shadow-md z-10">
                    <button
                      onClick={() => { addRow(rowIndex); setShowRowMenu(null); }}
                      className="w-full px-3 py-2 text-left hover:bg-muted"
                    >
                      Insert row above
                    </button>
                    <button
                      onClick={() => { addRow(rowIndex + 1); setShowRowMenu(null); }}
                      className="w-full px-3 py-2 text-left hover:bg-muted"
                    >
                      Insert row below
                    </button>
                    <button
                      onClick={() => { deleteRow(rowIndex); setShowRowMenu(null); }}
                      className="w-full px-3 py-2 text-left hover:bg-muted text-destructive"
                    >
                      Delete row
                    </button>
                  </div>
                )}
              </td>
              {row.map((cell, colIndex) => (
                <td 
                  key={colIndex} 
                  className={cn(
                    "border p-2 min-w-[100px] relative select-none",
                    hoveredColumn === colIndex && "bg-muted/5",
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex && [
                      "before:absolute before:inset-[-1px] before:pointer-events-none", 
                      "before:border-2 before:border-primary before:rounded-sm",
                      "before:origin-center before:transition-all before:duration-200",
                      "before:animate-in before:fade-in-0 before:zoom-in-[0.98]",
                      "after:absolute after:inset-[-1px] after:pointer-events-none",
                      "after:border-2 after:border-primary/20 after:rounded-sm", 
                      "after:origin-center after:transition-all after:duration-300",
                      "after:animate-in after:fade-in-0 after:zoom-in-[1] after:delay-75",
                      "after:scale-[1.005]"
                    ]
                  )}
                  onClick={() => {
                    setSelectedCell({ row: rowIndex, col: colIndex });
                    setEditingCell({ row: rowIndex, col: colIndex, value: cell });
                  }}
                >
                  {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editingCell.value}
                      onChange={(e) =>
                        setEditingCell({
                          ...editingCell,
                          value: e.target.value,
                        })
                      }
                      onBlur={() => {
                        handleCellChange(rowIndex, colIndex, editingCell.value);
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCellChange(rowIndex, colIndex, editingCell.value);
                          setEditingCell(null);
                          setSelectedCell({ row: rowIndex + 1, col: colIndex });
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                        } else if (e.key === 'Tab') {
                          e.preventDefault();
                          handleCellChange(rowIndex, colIndex, editingCell.value);
                          setEditingCell(null);
                          setSelectedCell({ 
                            row: rowIndex, 
                            col: e.shiftKey ? Math.max(0, colIndex - 1) : Math.min(data.headers.length - 1, colIndex + 1) 
                          });
                        }
                      }}
                      className="w-full bg-transparent focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <div className="min-h-[1.5rem]">
                      {cell}
                    </div>
                  )}
                </td>
              ))}
              <td className="w-10 border p-2 bg-muted">
                <button
                  onClick={() => addRow(rowIndex + 1)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center hover:bg-primary/10 rounded transition-colors"
                  title="Add row below"
                >
                  <PlusIcon size={16} />
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td className="w-10 border p-2 bg-muted">
              <button
                onClick={() => addRow()}
                className="w-6 h-6 flex items-center justify-center hover:bg-primary/10 rounded transition-colors"
                title="Add row"
              >
                <PlusIcon size={16} />
              </button>
            </td>
            {data.headers.map((_, i) => (
              <td key={i} className="border p-2 bg-muted"></td>
            ))}
            <td className="w-10 border p-2 bg-muted"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function areEqual(prevProps: SpreadsheetEditorProps, nextProps: SpreadsheetEditorProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);