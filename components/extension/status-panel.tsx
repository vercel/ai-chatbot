'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  RefreshCw, 
  Download, 
  Check, 
  Mic, 
  FileText, 
  StickyNote,
  Clock,
  CheckCircle2
} from 'lucide-react';

// Define type for unprocessed file
interface UnprocessedFile {
  name: string;
  path: string;
  type: 'recording' | 'text' | 'note';
  timestamp: string;
}

interface CountsData {
  recordings: number;
  texts: number;
  notes: number;
  total: number;
}

export function ExtensionStatusPanel() {
  const [unprocessedFiles, setUnprocessedFiles] = useState<UnprocessedFile[]>([]);
  const [counts, setCounts] = useState<CountsData>({ recordings: 0, texts: 0, notes: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch unprocessed files on load
  useEffect(() => {
    fetchUnprocessedFiles();
    
    // Set up interval to check for new files
    const interval = setInterval(fetchUnprocessedFiles, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to fetch unprocessed files
  const fetchUnprocessedFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch from API
      const response = await fetch('/api/extension/unprocessed');
      const data = await response.json();
      
      if (data.success) {
        setUnprocessedFiles(data.files || []);
        setCounts(data.counts || { recordings: 0, texts: 0, notes: 0, total: 0 });
      } else {
        // Use mock data if API fails
        console.warn('Using mock data - API error:', data.error);
        setUnprocessedFiles([]);
        setCounts({ recordings: 0, texts: 0, notes: 0, total: 0 });
      }
    } catch (err) {
      // Use mock data if API connection fails
      console.warn('Using mock data - connection error:', err);
      
      // Try to get mock data from localStorage
      try {
        const mockData = localStorage.getItem('debug_unprocessedFiles');
        if (mockData) {
          const parsedData = JSON.parse(mockData);
          console.log('Using mock data from localStorage:', parsedData);
          setUnprocessedFiles(parsedData);
          
          // Calculate counts
          const recordings = parsedData.filter(f => f.type === 'recording').length;
          const texts = parsedData.filter(f => f.type === 'text').length;
          const notes = parsedData.filter(f => f.type === 'note').length;
          setCounts({ 
            recordings, 
            texts, 
            notes, 
            total: recordings + texts + notes 
          });
          return;
        }
      } catch (e) {
        console.error('Error using mock data:', e);
      }
      
      // Fallback to empty data
      setUnprocessedFiles([]);
      setCounts({ recordings: 0, texts: 0, notes: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to process all unprocessed files
  const processAllFiles = async () => {
    if (counts.total === 0) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/extension/process-all', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Show success toast
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${data.processed} files`,
          variant: "default",
        });
        
        // Refresh the list
        fetchUnprocessedFiles();
      } else {
        // Show error toast
        toast({
          title: "Processing Issues",
          description: data.message || 'Some files could not be processed',
          variant: "destructive",
        });
        
        setError(data.error || 'Failed to process some files');
        // Still refresh to see what was processed
        fetchUnprocessedFiles();
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error processing files:', err);
      
      // Show error toast
      toast({
        title: "Connection Error",
        description: "Could not connect to the server",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Function to get icon based on file type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'recording':
        return <Mic className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Chrome Extension Files</CardTitle>
          <CardDescription>
            Unprocessed files from Chrome extension
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchUnprocessedFiles}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Mic className="h-3 w-3" /> {counts.recordings} Recordings
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" /> {counts.texts} Texts
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <StickyNote className="h-3 w-3" /> {counts.notes} Notes
          </Badge>
        </div>
        
        {counts.total > 0 ? (
          <>
            <div className="mb-4">
              <Button 
                className="w-full" 
                onClick={processAllFiles}
                disabled={processing}
              >
                {processing ? 'Processing...' : `Process All Files (${counts.total})`}
                {processing ? <RefreshCw className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            
            <div className="space-y-2">
              {unprocessedFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center p-2 border rounded-md"
                >
                  <div className="mr-3 text-primary">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" /> 
                      {new Date(file.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={file.type === 'recording' ? 'destructive' : file.type === 'text' ? 'default' : 'secondary'}>
                    {file.type}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {loading ? (
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            )}
            <p className="text-muted-foreground">
              {loading ? 'Checking for files...' : 'No unprocessed files found'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}