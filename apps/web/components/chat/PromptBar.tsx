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
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recognizer, setRecognizer] = useState<SpeechRecognition | null>(null);
  const [realData, setRealData] = useState(false);
  const [fallback, setFallback] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  }, [handleInputChange]);

  const startVoice = () => {
    recognizer?.start();
  };

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, { data: { realData, fallback, files } });
    setFiles([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []));
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
        <Button type="submit" aria-label="enviar">Enviar</Button>
      </div>
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
