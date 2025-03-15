'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadIcon, XIcon, PlayIcon, PauseIcon } from 'lucide-react';

interface AudioUploadProps {
  onFileSelected: (file: File) => void;
  onCancel: () => void;
  acceptedFormats?: string;
  maxSizeMB?: number;
}

export function AudioUpload({
  onFileSelected,
  onCancel,
  acceptedFormats = 'audio/*', // Accept all audio formats by default
  maxSizeMB = 25 // 25MB default max size
}: AudioUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Calculate max file size in bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const validateFile = (file: File): boolean => {
    // Check if file is an audio file
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file');
      return false;
    }
    
    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB`);
      return false;
    }
    
    return true;
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };
  
  const handleFile = (file: File) => {
    // Reset error state
    setError(null);
    
    // Validate file
    if (validateFile(file)) {
      setSelectedFile(file);
      
      // Create audio element for preview
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      audioRef.current = new Audio(URL.createObjectURL(file));
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }
  };
  
  const handleButtonClick = () => {
    inputRef.current?.click();
  };
  
  const clearSelection = () => {
    setSelectedFile(null);
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const submitFile = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };
  
  // Format bytes to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 w-full max-w-md text-center ${
            dragActive 
              ? 'border-hunter_green-500 bg-hunter_green-50 dark:border-cornsilk-500 dark:bg-hunter_green-700/20' 
              : 'border-hunter_green-300 dark:border-cornsilk-700'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedFormats}
            onChange={handleChange}
            className="hidden"
          />
          
          <UploadIcon className="h-10 w-10 mx-auto mb-4 text-hunter_green-400 dark:text-cornsilk-400" />
          
          <p className="mb-2 font-semibold text-hunter_green-600 dark:text-cornsilk-400">Drag and drop an audio file</p>
          <p className="text-sm text-hunter_green-500 dark:text-cornsilk-500 mb-4">
            or click to browse (max {maxSizeMB}MB)
          </p>
          
          <Button 
            onClick={handleButtonClick} 
            variant="outline" 
            className="mt-2 border-hunter_green-300 hover:bg-hunter_green-100 dark:border-cornsilk-700 dark:hover:bg-hunter_green-700"
          >
            Select Audio File
          </Button>
          
          {error && (
            <p className="mt-2 text-sm text-tigers_eye-500">{error}</p>
          )}
        </div>
      ) : (
        <div className="border border-hunter_green-200 dark:border-cornsilk-800 rounded-lg p-6 w-full max-w-md bg-cornsilk-600 dark:bg-hunter_green-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg text-hunter_green-600 dark:text-cornsilk-400">Selected Audio</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSelection}
              className="h-8 w-8 hover:bg-hunter_green-100 dark:hover:bg-hunter_green-500"
            >
              <XIcon className="h-4 w-4 text-hunter_green-500 dark:text-cornsilk-500" />
            </Button>
          </div>
          
          <div className="border border-hunter_green-200 dark:border-hunter_green-600 rounded p-4 mb-4 bg-cornsilk-500 dark:bg-hunter_green-500">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 mr-3 rounded-full hover:bg-earth_yellow-200 dark:hover:bg-earth_yellow-700"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6 text-hunter_green-500 dark:text-cornsilk-500" />
                ) : (
                  <PlayIcon className="h-6 w-6 text-hunter_green-500 dark:text-cornsilk-500" />
                )}
              </Button>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-hunter_green-600 dark:text-cornsilk-400">{selectedFile.name}</p>
                <p className="text-sm text-hunter_green-500 dark:text-cornsilk-500">
                  {selectedFile.type.split('/')[1].toUpperCase()} • {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={clearSelection}
              className="border-hunter_green-300 hover:bg-hunter_green-100 dark:border-cornsilk-700 dark:hover:bg-hunter_green-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitFile}
              className="bg-hunter_green-500 hover:bg-hunter_green-600 dark:bg-asparagus-500 dark:hover:bg-asparagus-400"
            >
              Use Audio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}