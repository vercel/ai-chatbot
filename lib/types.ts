// Base Block interface
export interface Block {
  id: string;
  type: 'markdown' | 'python' | 'csv';
  title?: string;
  filePath: string;
  position: number;
  created: string;
  updated: string;
}

// Type-specific block interfaces
export interface MarkdownBlock extends Block {
  type: 'markdown';
  editMode: boolean; // Track edit/view mode state
}

export interface PythonBlock extends Block {
  type: 'python';
  output?: string; // Store execution results
  isExecuting?: boolean; // Execution state
}

export interface CsvBlock extends Block {
  type: 'csv';
  sortColumn?: string; // Current sort column
  sortDirection?: 'asc' | 'desc'; // Sort direction
}

export interface Notebook {
  id: string;
  title: string;
  blocks: (MarkdownBlock | PythonBlock | CsvBlock)[];
  files: {
    path: string;
    type: string;
  }[];
} 