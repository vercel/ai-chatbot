import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`
}

export function formatTokens(input?: number, output?: number): string {
  if (!input && !output) return ""
  return `${input || 0}↑ ${output || 0}↓`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

export function generateUUID(): string {
  // Implementação simples de UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getCurrentClaudeSessionId(): string | null {
  // Busca ID real da sessão atual no ~/.claude/projects/
  // Formato: 70fcbdbd-4e34-4770-be69-d85c76ba7c8b
  
  // Para ambiente web, podemos tentar extrair do localStorage
  // ou fazer requisição para backend que lê os arquivos .jsonl
  if (typeof window !== 'undefined') {
    const storedSessionId = localStorage.getItem('claude_session_id')
    return storedSessionId
  }
  
  return null
}

// Funções adicionais necessárias para o build
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export const fetchWithErrorHandlers = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const getTextFromMessage = (message: any): string => {
  if (typeof message === 'string') return message;
  if (message?.content) return message.content;
  if (message?.text) return message.text;
  return '';
};

export const sanitizeText = (text: string): string => {
  return text.replace(/<[^>]*>/g, '').trim();
};

export const getDocumentTimestampByIndex = (docs: any[], index: number): string => {
  if (!docs || !docs[index]) return '';
  return docs[index].timestamp || new Date().toISOString();
};

export const convertToUIMessages = (messages: any[]): any[] => {
  return messages.map(msg => ({
    id: msg.id || generateUUID(),
    role: msg.role || 'user',
    content: msg.content || '',
    timestamp: msg.timestamp || new Date().toISOString()
  }));
};