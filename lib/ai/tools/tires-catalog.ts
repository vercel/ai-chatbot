import { tool } from 'ai';
import { z } from 'zod';

// Usando variáveis de ambiente
const MEILISEARCH_URL = process.env.MEILISEARCH_HOST;
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY;

export const tireSearch = tool({
  description:
    'Busca pneus no Meilisearch com base no tipo informado pelo usuário',
  inputSchema: z.object({
    tireType: z.string(), // Tipo de pneu fornecido pelo usuário
  }),
  execute: async ({ tireType }) => {
    if (!MEILISEARCH_URL || !MEILISEARCH_API_KEY) {
      throw new Error('Meilisearch não está configurado. Verifique seu .env');
    }

    const response = await fetch(`${MEILISEARCH_URL}/indexes/tires/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Meili-API-Key': MEILISEARCH_API_KEY,
      },
      body: JSON.stringify({
        q: tireType,
        limit: 10, // número máximo de resultados
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar pneus: ${response.statusText}`);
    }

    const tireData = await response.json();
    return tireData.hits; // retorna os resultados da pesquisa
  },
});
