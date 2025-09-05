'use client';
import { useState, useRef, useEffect } from 'react';
import { useChatContext } from '@/apps/web/lib/chat/context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function PromptBar() {
  const { input, handleInputChange, handleSubmit } = useChatContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recognizer, setRecognizer] = useState<SpeechRecognition | null>(null);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [realData, setRealData] = useState(false);
  const [fallback, setFallback] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec: SpeechRecognition = new SpeechRecognition();
      rec.lang = 'pt-BR';
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        handleInputChange({ target: { value: text } } as any);
      };
      setRecognizer(rec);
      setVoiceSupported(true);
    }
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
    }
  }, [handleInputChange]);

  const startVoice = () => {
    recognizer?.start();
  };

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, { data: { realData, fallback, files } });
    setFiles([]);
    setUploadProgress({});
    if (fileRef.current) fileRef.current.value = '';
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const sanitized: File[] = [];
    selected.forEach((f) => {
      if (f.size > MAX_SIZE) return;
      const name = f.name.replace(/[^\w.\-]/g, '_');
      const safeFile = new File([f], name, { type: f.type });
      sanitized.push(safeFile);
      const reader = new FileReader();
      reader.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setUploadProgress((p) => ({
            ...p,
            [name]: Math.round((ev.loaded / ev.total) * 100),
          }));
        }
      };
      reader.onloadend = () => {
        setUploadProgress((p) => ({ ...p, [name]: 100 }));
        progressRef.current?.focus();
      };
      reader.readAsArrayBuffer(f);
    });
    setFiles(sanitized);
  };

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        onSubmit(new Event('submit') as any);
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 p-4 border-t">
      <Textarea
        ref={inputRef}
        value={input}
        onChange={handleInputChange}
        aria-label="Digite sua mensagem"
        className="resize-none"
      />
      <div className="flex items-center gap-2">
        <Button type="button" onClick={() => fileRef.current?.click()} aria-label="enviar arquivo">
          📎
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.csv,image/*"
          multiple
          onChange={onFileChange}
        />
        {voiceSupported && (
          <Button type="button" onClick={startVoice} aria-label="voz">
            🎙️
          </Button>
        )}
        {ttsSupported && (
          <Button
            type="button"
            onClick={() =>
              window.speechSynthesis.speak(new SpeechSynthesisUtterance(input))
            }
            aria-label="texto para voz"
          >
            🔈
          </Button>
        )}
        <Button type="submit" aria-label="enviar">Enviar</Button>
      </div>
      {files.length > 0 && (
        <div ref={progressRef} tabIndex={-1} aria-live="polite" className="flex flex-col gap-1">
          {files.map((f) => (
            <div key={f.name} className="text-xs">
              <span>{f.name}</span>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-blue-500 h-2 rounded"
                  style={{ width: `${uploadProgress[f.name] || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Switch id="real-data" checked={realData} onCheckedChange={setRealData} />
          <Label htmlFor="real-data">usar dados reais</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="fallback" checked={fallback} onCheckedChange={setFallback} />
          <Label htmlFor="fallback">fallback API</Label>
        </div>
      </div>
    </form>
  );
}
