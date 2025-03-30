'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MicIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AudioUploadProps {
  onFileSelected: (file: File, metadata: AudioMetadata) => void;
  onFileRejected?: (error: string) => void;
}

export interface AudioMetadata {
  duration: number; // in seconds
  bitrate: number; // in bits per second
  format: string;
  language: string; // language code for Speechmatics
}

export function AudioUpload({ onFileSelected, onFileRejected }: AudioUploadProps) {
  const [validationError, setValidationError] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Function to analyze audio file metadata
  const analyzeAudioFile = async (file: File, language: string) => {
    setValidationError('');
    
    // Check file format
    const validFormats = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aac', 'audio/ogg', 'audio/amr', 'audio/m4a', 'audio/mp4', 'audio/flac'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['wav', 'mp3', 'aac', 'ogg', 'mpeg', 'amr', 'm4a', 'mp4', 'flac'];
    
    if (!validFormats.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
      const error = `File format not supported by Speechmatics. Supported formats: ${validExtensions.join(', ')}`;
      setValidationError(error);
      if (onFileRejected) onFileRejected(error);
      return false;
    }

    // Check file size (1GB limit for Speechmatics)
    if (file.size > 1024 * 1024 * 1024) {
      const error = 'File size must be less than 1GB for direct processing';
      setValidationError(error);
      if (onFileRejected) onFileRejected(error);
      return false;
    }

    // Create an audio element to get duration
    try {
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio();

      const durationPromise = new Promise<number>((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => {
          // Get duration in seconds
          resolve(audio.duration);
        });

        audio.addEventListener('error', () => {
          reject(new Error('Failed to load audio metadata'));
        });
      });

      audio.src = audioUrl;
      const duration = await durationPromise;

      // Check duration (5 minutes max as specified in requirements)
      if (duration > 300) { // 5 minutes = 300 seconds
        const error = 'Audio length must be 5 minutes or less';
        setValidationError(error);
        if (onFileRejected) onFileRejected(error);
        URL.revokeObjectURL(audioUrl);
        return false;
      }

      // Approximate bitrate calculation
      const bitrate = Math.round((file.size * 8) / duration); // bits per second
      
      URL.revokeObjectURL(audioUrl);
      
      // Call the onFileSelected callback with the file and metadata
      onFileSelected(file, {
        duration,
        bitrate,
        format: file.type || 'unknown',
        language
      });
      
      return true;
    } catch (error) {
      console.error('Error analyzing audio:', error);
      const errorMsg = 'Failed to analyze audio file';
      setValidationError(errorMsg);
      if (onFileRejected) onFileRejected(errorMsg);
      return false;
    }
  };

  return (
    <div className="p-4 border rounded-md bg-muted/30 dark:bg-hunter_green-600/50">
      <div className="mb-4 text-center">
        <MicIcon className="mx-auto size-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">Audio File</h3>
        <p className="text-sm text-muted-foreground">
          Upload an audio file to transcribe and add to your knowledge base
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supported formats: wav, mp3, aac, ogg, mpeg, amr, m4a, mp4, flac
        </p>
      </div>
      
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-xs">
          <label className="block text-sm font-medium mb-1">Select Language</label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="af">Afrikaans</SelectItem>
              <SelectItem value="ar">Arabic</SelectItem>
              <SelectItem value="az">Azerbaijani</SelectItem>
              <SelectItem value="bg">Bulgarian</SelectItem>
              <SelectItem value="ca">Catalan</SelectItem>
              <SelectItem value="cs">Czech</SelectItem>
              <SelectItem value="da">Danish</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="el">Greek</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="et">Estonian</SelectItem>
              <SelectItem value="fa">Persian</SelectItem>
              <SelectItem value="fi">Finnish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="he">Hebrew</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="hr">Croatian</SelectItem>
              <SelectItem value="hu">Hungarian</SelectItem>
              <SelectItem value="id">Indonesian</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="ko">Korean</SelectItem>
              <SelectItem value="lt">Lithuanian</SelectItem>
              <SelectItem value="lv">Latvian</SelectItem>
              <SelectItem value="ms">Malay</SelectItem>
              <SelectItem value="nl">Dutch</SelectItem>
              <SelectItem value="no">Norwegian</SelectItem>
              <SelectItem value="pl">Polish</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
              <SelectItem value="ro">Romanian</SelectItem>
              <SelectItem value="ru">Russian</SelectItem>
              <SelectItem value="sk">Slovak</SelectItem>
              <SelectItem value="sl">Slovenian</SelectItem>
              <SelectItem value="sv">Swedish</SelectItem>
              <SelectItem value="th">Thai</SelectItem>
              <SelectItem value="tr">Turkish</SelectItem>
              <SelectItem value="uk">Ukrainian</SelectItem>
              <SelectItem value="vi">Vietnamese</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Input
          type="file"
          accept="audio/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              analyzeAudioFile(e.target.files[0], selectedLanguage);
            }
          }}
          className="cursor-pointer dark:bg-hunter_green-500"
        />
        
        {validationError && (
          <div className="mt-2 text-sm text-red-500">
            {validationError}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for displaying audio summary
export interface AudioSummaryProps {
  file: File;
  metadata: AudioMetadata;
  onChangeFile: () => void;
}

export function AudioSummary({ file, metadata, onChangeFile }: AudioSummaryProps) {
  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format bitrate to human-readable
  const formatBitrate = (bps: number) => {
    if (bps > 1000000) {
      return `${(bps / 1000000).toFixed(2)} Mbps`;
    } else if (bps > 1000) {
      return `${(bps / 1000).toFixed(1)} kbps`;
    }
    return `${bps} bps`;
  };

  // Get language name from code
  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      'af': 'Afrikaans',
      'ar': 'Arabic',
      'az': 'Azerbaijani',
      'bg': 'Bulgarian',
      'ca': 'Catalan',
      'cs': 'Czech',
      'da': 'Danish',
      'de': 'German',
      'el': 'Greek',
      'en': 'English',
      'es': 'Spanish',
      'et': 'Estonian',
      'fa': 'Persian',
      'fi': 'Finnish',
      'fr': 'French',
      'he': 'Hebrew',
      'hi': 'Hindi',
      'hr': 'Croatian',
      'hu': 'Hungarian',
      'id': 'Indonesian',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'lt': 'Lithuanian',
      'lv': 'Latvian',
      'ms': 'Malay',
      'nl': 'Dutch',
      'no': 'Norwegian',
      'pl': 'Polish',
      'pt': 'Portuguese',
      'ro': 'Romanian',
      'ru': 'Russian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'sv': 'Swedish',
      'th': 'Thai',
      'tr': 'Turkish',
      'uk': 'Ukrainian',
      'vi': 'Vietnamese',
      'zh': 'Chinese'
    };
    
    return languages[code] || code;
  };

  return (
    <div className="p-4 border rounded-md bg-muted/30 dark:bg-hunter_green-600/50">
      <h3 className="text-lg font-medium mb-4">Audio File Summary</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="font-medium">File name:</span>
          <span>{file.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">File size:</span>
          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Format:</span>
          <span>{metadata.format}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Duration:</span>
          <span>{formatDuration(metadata.duration)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Bitrate:</span>
          <span>{formatBitrate(metadata.bitrate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Language:</span>
          <span>{getLanguageName(metadata.language)}</span>
        </div>
      </div>
      
      <div className="mt-4 flex flex-col gap-2">
        <h4 className="font-medium">Speechmatics Compatibility Check:</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li className={metadata.duration <= 300 ? 'text-green-500' : 'text-red-500'}>
            {metadata.duration <= 300 ? '✓' : '✗'} Duration: {formatDuration(metadata.duration)} {metadata.duration <= 300 ? '(OK)' : '(Too long - must be under 5 minutes)'}
          </li>
          <li className={file.size <= 1024 * 1024 * 1024 ? 'text-green-500' : 'text-red-500'}>
            {file.size <= 1024 * 1024 * 1024 ? '✓' : '✗'} File size: {(file.size / 1024 / 1024).toFixed(2)} MB {file.size <= 1024 * 1024 * 1024 ? '(OK)' : '(Too large - must be under 1GB)'}
          </li>
          <li className="text-green-500">
            ✓ Format: {metadata.format} (OK)
          </li>
        </ul>
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={onChangeFile}
          className="dark:bg-hunter_green-600 dark:text-white dark:border-hunter_green-500 dark:hover:bg-hunter_green-500"
        >
          Change File
        </Button>
      </div>
    </div>
  );
}
