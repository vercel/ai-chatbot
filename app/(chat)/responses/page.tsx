'use client';

import React, { FormEvent, useState } from 'react';
import { useChat } from './hooks/useChat';
import '../../../styles/chat.css';

export default function ResponsesPage() {
  const threadId = 'default';
  const { messages, sendMessage, error } = useChat({ threadId });
  const [input, setInput] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map(m => (
          <div key={m.id} className={`chat-message chat-${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>
      {error && <div className="chat-error">{error}</div>}
      <form onSubmit={onSubmit} className="chat-composer">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className="chat-input"
          placeholder="Digite uma mensagem"
        />
        <button type="submit" className="chat-send">Enviar</button>
      </form>
    </div>
  );
}
