export type Intent = 'greeting' | 'budget' | 'status' | 'human' | 'unknown';

/**
 * Basic regex policies to detect intent from user text.
 */
export function detect_intent(text: string): Intent {
  const t = text.toLowerCase();
  if (/(oi|olá|ola|bom dia|boa tarde|boa noite|hey)/.test(t)) return 'greeting';
  if (/(orçamento|orcamento|preço|preco|cotação|cotacao|quanto custa|budget)/.test(t)) return 'budget';
  if (/(status|andamento|progresso|acompanhamento|acompanho|como está|como esta)/.test(t)) return 'status';
  if (/(humano|atendente|pessoa real|falar com (humano|atendente))/.test(t)) return 'human';
  return 'unknown';
}
