'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KnowledgeDocument, KnowledgeChunk } from '@/lib/db/schema';
import { KnowledgeUpload } from '@/components/knowledge-upload';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown, FileText, Headphones, Globe, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

interface KnowledgeTableProps {
  initialDocuments: KnowledgeDocument[];
  chunks?: Record<string, KnowledgeChunk[]>;
}

type SortField = 'type' | 'title' | 'status' | 'createdAt' | 'size';
type SortDirection = 'asc' | 'desc';

export function KnowledgeTable({ initialDocuments, chunks = {} }: KnowledgeTableProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(initialDocuments);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Function to calculate total character count
  const getTotalCharCount = () => {
    let total = 0;
    documents.forEach(doc => {
      const size = getDocumentSize(doc, false);
      if (typeof size === 'number') {
        total += size;
      }
    });
    return total.toLocaleString();
  };
  
  // Get character count for a single document
  const getDocumentSize = (doc: KnowledgeDocument, formatted = true) => {
    // First try to get size from chunks if available
    const docChunks = chunks[doc.id];
    let size = 0;
    
    if (docChunks && docChunks.length > 0) {
      docChunks.forEach(chunk => {
        size += chunk.content.length;
      });
    } else {
      // Parse the fileSize field if it contains a number followed by 'chars'
      if (doc.fileSize && doc.fileSize.includes('chars')) {
        const match = doc.fileSize.match(/(\d+)\s*chars/);
        if (match && match[1]) {
          size = parseInt(match[1], 10);
        }
      } else {
        // Fallback to approximation if no fileSize information
        size = doc.description?.length || 0;
      }
    }
    
    return formatted ? size.toLocaleString() : size;
  };
  
  // Get source type icon
  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="size-4 mr-2" />;
      case 'audio':
        return <Headphones className="size-4 mr-2" />;
      case 'url':
        return <Globe className="size-4 mr-2" />;
      case 'pdf':
        return <FileIcon className="size-4 mr-2" />;
      default:
        return <FileText className="size-4 mr-2" />;
    }
  };
  
  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset direction to desc
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Sort documents when sort parameters change
  useEffect(() => {
    const sortedDocs = [...initialDocuments].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'type':
          comparison = a.sourceType.localeCompare(b.sourceType);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
        const sizeA = getDocumentSize(a, false) as number;
        const sizeB = getDocumentSize(b, false) as number;
        comparison = sizeA - sizeB;
        break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setDocuments(sortedDocs);
  }, [sortField, sortDirection, initialDocuments, chunks]);
  
  // Get the sort icon
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="ml-2 size-4" />;
    }
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 size-4" />
      : <ArrowDown className="ml-2 size-4" />;
  };

  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <KnowledgeUpload onSuccess={() => router.refresh()} />
      </div>
      
      <div className="mb-4 text-sm">
        <span className="dark:text-cornsilk-300 text-gray-700">Total Characters: </span>
        <span className="font-semibold dark:text-cornsilk-100 text-gray-900">{getTotalCharCount()}</span>
      </div>
      
      <div className="border dark:border-hunter_green-500 border-gray-200 rounded-md overflow-hidden w-full">
        <Table>
          <TableHeader className="dark:bg-hunter_green-600 bg-gray-100">
            <TableRow>
              <TableHead onClick={() => handleSort('type')} className="cursor-pointer dark:text-white">
                <div className="flex items-center">
                  Type {getSortIcon('type')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('title')} className="cursor-pointer dark:text-white">
                <div className="flex items-center">
                  Title {getSortIcon('title')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('status')} className="cursor-pointer dark:text-white">
                <div className="flex items-center">
                  Status {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('createdAt')} className="cursor-pointer dark:text-white">
                <div className="flex items-center">
                  Date Added {getSortIcon('createdAt')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('size')} className="cursor-pointer dark:text-white">
                <div className="flex items-center">
                  Size {getSortIcon('size')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 dark:text-white text-gray-700">
                  No documents in your knowledge base yet.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow 
                  key={doc.id} 
                  className="cursor-pointer hover:dark:bg-hunter_green-500/50 hover:bg-gray-100 dark:text-white"
                  onClick={() => router.push(`/knowledge/${doc.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center">
                      {getSourceTypeIcon(doc.sourceType)}
                      <span className="capitalize font-medium">{doc.sourceType}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.title}</TableCell>
                  <TableCell>
                  <span className={`${
                  doc.status === 'processing' ? 'dark:text-yellow-400 text-yellow-600 font-medium' :
                  doc.status === 'completed' ? 'dark:text-green-400 text-green-600 font-medium' :
                  'dark:text-red-400 text-red-600 font-medium'
                  }`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getDocumentSize(doc)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {documents.length > 0 && (
            <TableCaption className="dark:bg-hunter_green-500/20 bg-gray-100 py-2 font-medium dark:text-white">
              {documents.length} document{documents.length !== 1 ? 's' : ''} in your knowledge base
            </TableCaption>
          )}
        </Table>
      </div>
    </div>
  );
}