import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const POKEMON_LIST_LIMIT = 1302;

const server = new McpServer({
  name: 'Pokemon API',
  version: '1.0.0',
});

server.tool(
  'pokemons_list',
  'Search for Pokemons from the PokeAPI',
  { limit: z.string().default(POKEMON_LIST_LIMIT.toString()) },
  async ({ limit }) => {
    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon?offset=0&limit=${limit}`,
      );
      const data = await res.json();
      return {
        content: [
          { type: 'text', text: `Listing for Pokemon` },
          {
            type: 'text',
            text: data.results.map((pokemon) => pokemon.name).join(', '),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching Pokemon data: ${error.message}`,
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
