"use client";

import { useState, useEffect } from 'react';
import { CsvBlock as CsvBlockType } from '@/lib/types';
import { useNotebook } from '@/lib/contexts/notebook-context';
import BlockWrapper from '@/components/ui/BlockWrapper';
import BlockControls from '@/components/ui/BlockControls';

interface CsvBlockProps {
  block: CsvBlockType;
}

interface CsvData {
  [key: string]: string | number;
}

export default function CsvBlock({ block }: CsvBlockProps) {
  const { updateBlock } = useNotebook();
  const [data, setData] = useState<CsvData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadCsvData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/files/${block.filePath}`);
        if (response.ok) {
          const csvContent = await response.json();
          
          // Parse CSV content
          const parsedData = parseCSV(csvContent.content);
          if (parsedData.length > 0) {
            setHeaders(Object.keys(parsedData[0]));
            setData(parsedData);
          } else {
            setHeaders([]);
            setData([]);
          }
        } else {
          setHeaders([]);
          setData([]);
        }
      } catch (error) {
        console.error('Failed to load CSV data:', error);
        setHeaders([]);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCsvData();
  }, [block.filePath]);
  
  // Basic CSV parser function
  const parseCSV = (csvString: string): CsvData[] => {
    if (!csvString.trim()) return [];
    
    const rows = csvString.split('\n');
    if (rows.length === 0) return [];
    
    const headers = rows[0].split(',').map(h => h.trim());
    
    const result: CsvData[] = [];
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;
      
      const values = rows[i].split(',').map(v => v.trim());
      const row: CsvData = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      result.push(row);
    }
    
    return result;
  };
  
  const handleSort = (column: string) => {
    const direction = block.sortColumn === column && block.sortDirection === 'asc' ? 'desc' : 'asc';
    
    updateBlock(block.id, {
      type: 'csv',
      sortColumn: column,
      sortDirection: direction
    });
    
    // Sort data locally
    const sortedData = [...data].sort((a, b) => {
      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setData(sortedData);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      // Save to file
      try {
        await fetch('/api/files', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: block.filePath,
            content
          })
        });
        
        // Parse and display locally
        const parsedData = parseCSV(content);
        if (parsedData.length > 0) {
          setHeaders(Object.keys(parsedData[0]));
          setData(parsedData);
        }
        
        // Update block
        updateBlock(block.id, {
          updated: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to save CSV file:', error);
      }
    };
    
    reader.readAsText(file);
  };
  
  return (
    <BlockWrapper block={block}>
      <div className="flex justify-end mb-2">
        <label className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 cursor-pointer">
          Upload CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
        <BlockControls block={block} />
      </div>
      
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      ) : headers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map(header => (
                  <th 
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center">
                      {header}
                      {block.sortColumn === header && (
                        <span className="ml-1">
                          {block.sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map(header => (
                    <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No CSV data available. Upload a CSV file to get started.
        </div>
      )}
    </BlockWrapper>
  );
} 