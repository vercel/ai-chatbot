'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { extractTextFromPdf, loadPdfJs } from '@/lib/knowledge/browser/pdfExtractor';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PdfTextExtractorProps {
  file: File;
  onTextExtracted: (text: string) => void;
  onCancel: () => void;
}

export function PdfTextExtractor({ file, onTextExtracted, onCancel }: PdfTextExtractorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Pre-load PDF.js when component mounts
  useEffect(() => {
    loadPdfJs().catch(err => {
      console.error('Failed to load PDF.js:', err);
      setError('Failed to load PDF processing library. Please try again later.');
    });
  }, []);

  // Extract text from PDF when file changes
  useEffect(() => {
    if (!file) return;
    
    const processFile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Extract text from the PDF file
        const text = await extractTextFromPdf(file);
        setExtractedText(text);
        
        // Auto-proceed if text is extracted successfully
        if (text.trim().length > 0) {
          onTextExtracted(text);
        } else {
          setError('No text could be extracted from this PDF. It may be scanned or contain only images.');
        }
      } catch (err) {
        console.error('Error extracting text from PDF:', err);
        setError('Failed to extract text from PDF. Please try again or use a different file.');
      } finally {
        setIsLoading(false);
      }
    };
    
    processFile();
  }, [file, onTextExtracted]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Extracting text from PDF</h3>
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
      
      {isLoading && (
        <div className="p-4 text-center">
          <div className="animate-pulse">
            <p>Extracting text from {file.name}...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment for large files</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <p className="text-red-700">{error}</p>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (extractedText.trim().length > 0) {
                onTextExtracted(extractedText);
              } else {
                toast.error('No text was extracted from this PDF.');
              }
            }}>
              Use Anyway
            </Button>
          </div>
        </div>
      )}
      
      {!isLoading && !error && extractedText && (
        <div className="space-y-2">
          <Label htmlFor="extractedText">Extracted Text</Label>
          <Textarea
            id="extractedText"
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            className="h-60"
            placeholder="Extracted text will appear here..."
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onTextExtracted(extractedText)}>
              Use This Text
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
