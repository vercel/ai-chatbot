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
  Mic, 
  FileText, 
  StickyNote,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Define type for offline file
interface OfflineFile {
  id: string;
  name: string;
  path: string;
  type: 'recording' | 'text' | 'note';
  timestamp: string;
  processed: boolean;
  error: string | null;
  processingTimestamp: string | null;
}

interface CountsData {
  recordings: number;
  texts: number;
  notes: number;
  total: number;
}

export function OfflineFilesPanel() {
  const [offlineFiles, setOfflineFiles] = useState<OfflineFile[]>([]);
  const [counts, setCounts] = useState<CountsData>({ recordings: 0, texts: 0, notes: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch offline files on load
  useEffect(() => {
    fetchOfflineFiles();
    
    // Set up interval to check for new files
    const interval = setInterval(fetchOfflineFiles, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to fetch offline files
  const fetchOfflineFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch from API
      const response = await fetch('/api/extension/offline-files');
      const data = await response.json();
      
      if (data.success) {
        setOfflineFiles(data.files || []);
        setCounts(data.counts || { recordings: 0, texts: 0, notes: 0, total: 0 });
      } else {
        // Use mock data if API fails
        console.warn('Using mock data - API error:', data.error);
        setOfflineFiles([]);
        setCounts({ recordings: 0, texts: 0, notes: 0, total: 0 });
      }
    } catch (err) {
      // Use mock data if API connection fails
      console.warn('Using mock data - connection error:', err);
      
      // Try to get mock data from localStorage
      try {
        const mockData = localStorage.getItem('debug_offlineFiles');
        if (mockData) {
          const parsedData = JSON.parse(mockData);
          console.log('Using mock data from localStorage:', parsedData);
          setOfflineFiles(parsedData);
          
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
      setOfflineFiles([]);
      setCounts({ recordings: 0, texts: 0, notes: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to process all offline files
  const processAllOfflineFiles = async () => {
    if (counts.total === 0) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/extension/process-offline', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Show success toast
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${data.processed} files${data.failed > 0 ? `, ${data.failed} failed` : ''}`,
          variant: "default",
        });
        
        // Refresh the list
        fetchOfflineFiles();
      } else {
        // Show error toast
        toast({
          title: "Processing Issues",
          description: data.message || 'Some files could not be processed',
          variant: "destructive",
        });
        
        setError(data.error || 'Failed to process some files');
        // Still refresh to see what was processed
        fetchOfflineFiles();
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error processing offline files:', err);
      
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
  
  // Function to get status badge
  const getStatusBadge = (file: OfflineFile) => {
    if (file.error) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Error
        </Badge>
      );
    }
    
    if (file.processed) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3" /> Processed
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Offline Temp Files</CardTitle>
          <CardDescription>
            Files saved when offline or waiting for processing
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchOfflineFiles}
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
                onClick={processAllOfflineFiles}
                disabled={processing}
              >
                {processing ? 'Processing...' : `Process All Offline Files (${counts.total})`}
                {processing ? <RefreshCw className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            
            <div className="space-y-2">
              {offlineFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center p-2 border rounded-md"
                >
                  <div className="mr-3 text-primary">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{file.name}</p>
                      {getStatusBadge(file)}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" /> 
                      {new Date(file.timestamp).toLocaleString()}
                    </div>
                    {file.error && (
                      <div className="flex items-center text-xs text-red-500 mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" /> 
                        {file.error}
                      </div>
                    )}
                  </div>
                  <Badge variant={file.type === 'recording' ? 'destructive' : file.type === 'text' ? 'default' : 'secondary'} className="ml-2">
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
              {loading ? 'Checking for files...' : 'No offline files found'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}