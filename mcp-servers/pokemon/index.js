import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { search } from 'fast-fuzzy';

const POKEMON_LIST_LIMIT = 1302;
const POKEMONS_MEM_CACHE = new Map();
const POKEMONS_FILE_CACHE = path.join(
  os.tmpdir(),
  'pokemon-cache',
  './pokemon-cache.json',
);

const server = new McpServer({
  name: 'Pokemon API',
  version: '1.0.0',
});

function makePokemonQueryResource(pokemon) {
  return {
    uri: pokemon.url,
    mimeType: 'application/json',
    name: pokemon.name,
    text: JSON.stringify(pokemon),
  };
}

function makePokemonProfileResource(pokemonData) {
  const data = extractFields(pokemonData, [
    'id',
    'abilities',
    'height',
    'weight',
    'name',
    'species',
  ]);

  return [
    {
      type: 'text',
      text: `Found ${data.name} Pokemon, 
        It has ${data.abilities.length} abilities,
        and is ${data.height}m
        tall and weighs ${data.weight}kg.
        It is a ${data.species.name} type Pokemon.
        The abilities are: ${data.abilities
          .map((ability) => ability.ability.name)
          .join(', ')}`,
    },
    {
      uri: pokemonData.url,
      mimeType: 'application/json',
      name: data.name,
      text: JSON.stringify(data, null, 2),
    },
  ];
}

function extractFields(data, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
  );
}

server.tool(
  'pokemons_query',
  'Search for Pokemons',
  { query: z.string() },
  async ({ query }) => {
    try {
      const names = Array.from(POKEMONS_MEM_CACHE.keys());
      const data = search(query, names, {
        keySelector: (pokemon) => pokemon,
        threshold: 0.3,
        ignoreCase: true,
      }).map((result) => ({
        name: result,
        ...POKEMONS_MEM_CACHE.get(result),
      }));

      console.error(
        `[info] Found ${data.length} Pokemon entries for "${query}"`,
      );

      data.length = Math.min(data.length, 10);

      // Fetch the details of the found Pokemons like artwork
      const pokemons = await Promise.all(
        data.map(async (pokemon) => {
          const res = await fetch(pokemon.url);
          const pokemonData = await res.json();
          const artwork =
            pokemonData.sprites?.other['official-artwork']?.front_default || '';

          return {
            name: pokemon.name,
            id: pokemon.url.split('/').at(-2),
            url: pokemon.url,
            artwork,
          };
        }),
      );

      return {
        content: [
          {
            type: 'text',
            text: `Found ${data.length} Pokemon, ${pokemons.map((p) => p.name).join(', ')}`,
          },
          ...pokemons.map(makePokemonQueryResource),
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in searching pokemon data: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  'pokemon_profile',
  'Query the pokemon detail information',
  { name: z.string() },
  async ({ name }) => {
    try {
      const pokemon = POKEMONS_MEM_CACHE.get(name);

      if (!pokemon) {
        throw new Error(`Pokemon "${name}" not found`);
      }

      console.error(`[info] Found Pokemon entry for "${name}"`);

      const data = await fetch(pokemon.url);
      const pokemonData = await data.json();

      return {
        content: [...makePokemonProfileResource(pokemonData)],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in searching pokemon data: ${error.message}`,
          },
        ],
      };
    }
  },
);

async function readPokemonsCache() {
  try {
    const cachedData = await fs.readFile(POKEMONS_FILE_CACHE, 'utf8');
    const parsedData = JSON.parse(cachedData);

    POKEMONS_MEM_CACHE.clear();

    for (const [key, value] of parsedData) {
      POKEMONS_MEM_CACHE.set(key, value);
    }

    console.error(
      `[info] Loaded ${POKEMONS_MEM_CACHE.size} Pokemon entries from ${POKEMONS_FILE_CACHE}`,
    );
    return true;
  } catch (error) {
    console.error('[error] No existing cache file found, using fresh data');
  }

  return false;
}

async function cachePokemons() {
  try {
    console.debug('[info] Caching Pokemon data...');
    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon?offset=0&limit=${POKEMON_LIST_LIMIT}`,
    );
    const data = await res.json();

    data.results.forEach((pokemon) => {
      POKEMONS_MEM_CACHE.set(pokemon.name, pokemon);
    });

    await fs.mkdir(path.dirname(POKEMONS_FILE_CACHE), { recursive: true });
    await fs.writeFile(
      POKEMONS_FILE_CACHE,
      JSON.stringify(Array.from(POKEMONS_MEM_CACHE.entries())),
      'utf8',
    );
    console.error(`[info] Cached Pokemon data to ${POKEMONS_FILE_CACHE}`);
  } catch (error) {
    console.error(`[error] Failed to cache Pokemon data: ${error.message}`);
  }
}

async function main() {
  if (!(await readPokemonsCache())) {
    await cachePokemons();
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
