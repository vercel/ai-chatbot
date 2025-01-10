'use client';

import React, {
  useEffect,
  useState,
  useRef,
  KeyboardEvent,
  useCallback,
  memo,
} from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, PlusIcon } from './icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

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
        headers: Array.isArray(parsed.headers)
          ? parsed.headers
          : ['A', 'B', 'C'],
        rows: Array.isArray(parsed.rows)
          ? parsed.rows.map((row: unknown) =>
              Array.isArray(row)
                ? row.map((cell) => String(cell || ''))
                : new Array(parsed.headers?.length || 3).fill(''),
            )
          : [new Array(3).fill(''), new Array(3).fill('')],
      };
    } catch {
      return {
        headers: ['A', 'B', 'C'],
        rows: [
          ['', '', ''],
          ['', '', ''],
        ],
      };
    }
  });

  // Track if we're currently processing a content update
  const isProcessingUpdate = useRef(false);
  // Track if we need to reprocess after current update
  const needsReprocess = useRef(false);
  // Debounce timer for saves
  const saveTimer = useRef<NodeJS.Timeout>();
  // Last saved content
  const lastSavedContent = useRef<string>(content);
  // Pending save
  const pendingSave = useRef<SpreadsheetData | null>(null);

  // Memoize content update handler
  const handleContentUpdate = useCallback((newContent: string) => {
    if (newContent === lastSavedContent.current) return;

    if (isProcessingUpdate.current) {
      needsReprocess.current = true;
      return;
    }

    isProcessingUpdate.current = true;
    try {
      const parsed = JSON.parse(newContent);
      if (parsed && typeof parsed === 'object') {
        setData((prevData) => {
          const newData = {
            headers: Array.isArray(parsed.headers)
              ? parsed.headers.map((h: unknown) => String(h || ''))
              : prevData.headers,
            rows: Array.isArray(parsed.rows)
              ? parsed.rows.map((row: unknown) =>
                  Array.isArray(row)
                    ? row.map((cell) => String(cell || ''))
                    : new Array(
                        parsed.headers?.length || prevData.headers.length,
                      ).fill(''),
                )
              : prevData.rows,
          };
          // Normalize rows
          newData.rows = newData.rows.map((row: string[]) => {
            const normalizedRow = [...row];
            while (normalizedRow.length < newData.headers.length) {
              normalizedRow.push('');
            }
            return normalizedRow.slice(0, newData.headers.length);
          });
          lastSavedContent.current = JSON.stringify(newData);
          return newData;
        });
      }
    } catch (error) {
      console.error('Failed to parse updated content:', error);
    } finally {
      isProcessingUpdate.current = false;
      if (needsReprocess.current) {
        needsReprocess.current = false;
        handleContentUpdate(newContent);
      }
    }
  }, []);

  // Debounced save handler with queue
  const debouncedSave = useCallback(
    (newData: SpreadsheetData, shouldDebounce: boolean) => {
      pendingSave.current = newData;

      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      const save = () => {
        if (!pendingSave.current) return;

        const contentToSave = JSON.stringify(pendingSave.current);
        if (contentToSave === lastSavedContent.current) return;

        lastSavedContent.current = contentToSave;
        saveContent(contentToSave, shouldDebounce);
        pendingSave.current = null;
      };

      if (shouldDebounce) {
        saveTimer.current = setTimeout(save, 5000);
      } else {
        save();
      }
    },
    [saveContent],
  );

  useEffect(() => {
    const currentContent = JSON.stringify({
      headers: data.headers,
      rows: data.rows,
    });

    if (
      content &&
      content !== currentContent &&
      content !== lastSavedContent.current &&
      !isProcessingUpdate.current
    ) {
      handleContentUpdate(content);
    }
  }, [content, handleContentUpdate]);

  useEffect(() => {
    // Cleanup save timer and perform final save on unmount
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      if (pendingSave.current) {
        const contentToSave = JSON.stringify(pendingSave.current);
        if (contentToSave !== lastSavedContent.current) {
          saveContent(contentToSave, false);
        }
      }
    };
  }, [saveContent]);

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

  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize cell and header change handlers
  const handleHeaderChange = useCallback(
    (index: number, value: string) => {
      setData((prevData) => {
        const newData = {
          headers: [...prevData.headers],
          rows: [...prevData.rows],
        };
        newData.headers[index] = value;
        debouncedSave(newData, true);
        return newData;
      });
    },
    [debouncedSave],
  );

  const handleCellChange = useCallback(
    (rowIndex: number, colIndex: number, value: string) => {
      setData((prevData) => {
        const newData = {
          headers: [...prevData.headers],
          rows: prevData.rows.map((row) => [...row]),
        };
        if (!newData.rows[rowIndex]) {
          newData.rows[rowIndex] = [];
        }
        newData.rows[rowIndex][colIndex] = value;
        debouncedSave(newData, true);
        return newData;
      });
    },
    [debouncedSave],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!selectedCell && !editingCell) return;

      const currentRow = editingCell?.row ?? selectedCell?.row ?? 0;
      const currentCol = editingCell?.col ?? selectedCell?.col ?? 0;
      let newRow = currentRow;
      let newCol = currentCol;

      switch (e.key) {
        case 'ArrowUp':
          if (editingCell) return; // Don't navigate while editing
          e.preventDefault();
          newRow = Math.max(0, currentRow - 1);
          break;
        case 'ArrowDown':
          if (editingCell) return; // Don't navigate while editing
          e.preventDefault();
          newRow = Math.min(data.rows.length - 1, currentRow + 1);
          break;
        case 'ArrowLeft':
          if (editingCell) return; // Don't navigate while editing
          e.preventDefault();
          newCol = Math.max(0, currentCol - 1);
          break;
        case 'ArrowRight':
          if (editingCell) return; // Don't navigate while editing
          e.preventDefault();
          newCol = Math.min(data.headers.length - 1, currentCol + 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (editingCell) {
            // If editing, save and move down
            handleCellChange(currentRow, currentCol, editingCell.value);
            setEditingCell(null);
            newRow = Math.min(data.rows.length - 1, currentRow + 1);
          } else {
            // If not editing, start editing current cell
            setEditingCell({
              row: currentRow,
              col: currentCol,
              value: data.rows[currentRow][currentCol],
            });
            return;
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (editingCell) {
            handleCellChange(currentRow, currentCol, editingCell.value);
            setEditingCell(null);
          }
          if (e.shiftKey) {
            if (currentCol > 0) {
              newCol = currentCol - 1;
            } else if (currentRow > 0) {
              newRow = currentRow - 1;
              newCol = data.headers.length - 1;
            }
          } else {
            if (currentCol < data.headers.length - 1) {
              newCol = currentCol + 1;
            } else if (currentRow < data.rows.length - 1) {
              newRow = currentRow + 1;
              newCol = 0;
            }
          }
          break;
        case 'Escape':
          if (editingCell) {
            e.preventDefault();
            setEditingCell(null);
          }
          return;
        default:
          if (
            !editingCell &&
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            // Start editing with the pressed key
            e.preventDefault();
            setEditingCell({
              row: currentRow,
              col: currentCol,
              value: e.key,
            });
            return;
          }
          return;
      }

      if (newRow !== currentRow || newCol !== currentCol) {
        setSelectedCell({ row: newRow, col: newCol });
      }
    },
    [
      selectedCell,
      editingCell,
      data.rows.length,
      data.headers.length,
      handleCellChange,
    ],
  );

  const addColumn = useCallback(
    (index?: number) => {
      setData((prevData) => {
        const insertAt =
          typeof index === 'number' ? index : prevData.headers.length;
        const newData = {
          headers: [...prevData.headers],
          rows: prevData.rows.map((row) => [...row]),
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

        newData.headers.splice(
          insertAt,
          0,
          getNextColumnName(prevData.headers.length),
        );
        newData.rows.forEach((row) => row.splice(insertAt, 0, ''));

        debouncedSave(newData, true);
        return newData;
      });
    },
    [debouncedSave],
  );

  const deleteColumn = useCallback(
    (index: number) => {
      setData((prevData) => {
        if (prevData.headers.length <= 1) return prevData;

        const newData = {
          headers: [...prevData.headers],
          rows: prevData.rows.map((row) => [...row]),
        };

        newData.headers.splice(index, 1);
        newData.rows.forEach((row) => row.splice(index, 1));

        debouncedSave(newData, true);
        return newData;
      });
    },
    [debouncedSave],
  );

  const addRow = useCallback(
    (index?: number) => {
      setData((prevData) => {
        const newData = {
          headers: [...prevData.headers],
          rows: [...prevData.rows],
        };
        const newRow = new Array(prevData.headers.length).fill('');

        if (typeof index === 'number') {
          newData.rows.splice(index, 0, newRow);
        } else {
          newData.rows.push(newRow);
        }

        debouncedSave(newData, true);
        return newData;
      });
    },
    [debouncedSave],
  );

  const deleteRow = useCallback(
    (index: number) => {
      setData((prevData) => {
        if (prevData.rows.length <= 1) return prevData;

        const newData = {
          headers: [...prevData.headers],
          rows: [...prevData.rows],
        };
        newData.rows.splice(index, 1);

        debouncedSave(newData, true);
        return newData;
      });
    },
    [debouncedSave],
  );

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
                  'border p-2 bg-muted min-w-[100px] relative group',
                  hoveredColumn === i && 'bg-muted/80',
                  'hover:cursor-pointer',
                )}
                onMouseEnter={() => setHoveredColumn(i)}
                onMouseLeave={() => setHoveredColumn(null)}
              >
                <div className="flex items-center justify-between">
                  <Input
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
                    className={cn(
                      'w-full text-center',
                      'h-auto px-0 py-0',
                      'border-0 rounded-none',
                      'bg-transparent',
                      'focus-visible:ring-0 focus-visible:ring-offset-0',
                      'placeholder:text-muted-foreground',
                      'transition-none animate-none',
                      'text-sm leading-none font-medium',
                    )}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 h-6 w-6"
                      >
                        <ChevronDownIcon size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => addColumn(i)}>
                        Insert column left
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addColumn(i + 1)}>
                        Insert column right
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteColumn(i)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete column
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </th>
            ))}
            <th className="w-10 bg-muted border p-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => addColumn()}
                    className="w-6 h-6"
                  >
                    <PlusIcon size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add column</TooltipContent>
              </Tooltip>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(hoveredRow === rowIndex && 'bg-muted/5')}
              onMouseEnter={() => setHoveredRow(rowIndex)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="border p-2 bg-muted text-center text-sm text-muted-foreground relative group">
                <div className="flex items-center justify-between">
                  <span>{rowIndex + 1}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 h-6 w-6"
                      >
                        <ChevronDownIcon size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => addRow(rowIndex)}>
                        Insert row above
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addRow(rowIndex + 1)}>
                        Insert row below
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteRow(rowIndex)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete row
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    'border p-2 min-w-[100px] relative select-none',
                    hoveredColumn === colIndex && 'bg-muted/5',
                    selectedCell?.row === rowIndex &&
                      selectedCell?.col === colIndex && [
                        // This needs some work to get it to animate properly
                        'before:absolute before:inset-[-1px] before:pointer-events-none',
                        'before:border-2 before:border-primary before:rounded-sm',
                        'before:origin-center before:transition-all before:duration-200',
                        'before:animate-in before:fade-in-0 before:zoom-in-[0.98]',
                        'after:absolute after:inset-[-1px] after:pointer-events-none',
                        'after:border-2 after:border-primary/20 after:rounded-sm',
                        'after:origin-center after:transition-all after:duration-300',
                        'after:animate-in after:fade-in-0 after:zoom-in-[1] after:delay-75',
                        'after:scale-[1.005]',
                      ],
                  )}
                  onClick={() => {
                    setSelectedCell({ row: rowIndex, col: colIndex });
                    setEditingCell({
                      row: rowIndex,
                      col: colIndex,
                      value: cell,
                    });
                  }}
                >
                  {editingCell?.row === rowIndex &&
                  editingCell?.col === colIndex ? (
                    <Input
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
                          handleCellChange(
                            rowIndex,
                            colIndex,
                            editingCell.value,
                          );
                          setEditingCell(null);
                          setSelectedCell({ row: rowIndex + 1, col: colIndex });
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                        } else if (e.key === 'Tab') {
                          e.preventDefault();
                          handleCellChange(
                            rowIndex,
                            colIndex,
                            editingCell.value,
                          );
                          setEditingCell(null);
                          setSelectedCell({
                            row: rowIndex,
                            col: e.shiftKey
                              ? Math.max(0, colIndex - 1)
                              : Math.min(data.headers.length - 1, colIndex + 1),
                          });
                        }
                      }}
                      className={cn(
                        'w-full',
                        'h-[1.5rem] px-0',
                        'border-0 rounded-none',
                        'bg-transparent',
                        'focus-visible:ring-0 focus-visible:ring-offset-0',
                        'placeholder:text-muted-foreground',
                        'transition-none animate-none',
                        'text-sm leading-none',
                        'flex items-center',
                      )}
                      autoFocus
                    />
                  ) : (
                    <div className="h-[1.5rem] text-sm leading-none flex items-center">
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
};

function areEqual(
  prevProps: SpreadsheetEditorProps,
  nextProps: SpreadsheetEditorProps,
) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);
