'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function PromptBar() {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic can be implemented later
    console.log('Submit:', input, files);
    setInput('');
    setFiles([]);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 p-4 border-t">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Digite sua mensagem"
        className="resize-none"
      />
      <div className="flex items-center gap-2">
        <Button type="button" onClick={() => fileRef.current?.click()}>
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
        <Button type="submit">Enviar</Button>
      </div>
      {files.length > 0 && (
        <div className="flex flex-col gap-1">
          {files.map((f) => (
            <div key={f.name} className="text-xs">
              {f.name}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
