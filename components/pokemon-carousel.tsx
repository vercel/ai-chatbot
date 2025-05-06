'use client';

import { type Pokemon, PokemonCard } from './pokemon-card';

function parsePokemonData(result: any) {
  if (!result || !result.content || !Array.isArray(result.content)) {
    console.error('Invalid result format:', result);
    return [];
  }
  if (result.content.length === 0) {
    console.error('No content found in result:', result);
    return [];
  }

  return JSON.parse(
    `[${result.content
      .filter((item: any) => item?.mimeType === 'application/json')
      .map((item: any) => item.text)
      .join(',')}]`,
  ) as Pokemon[];
}

interface PokemonCarouselProps {
  result: any;
  onClickPokemon?: (pokemon: Pokemon) => void;
}

export function PokemonCarousel({
  result,
  onClickPokemon,
}: PokemonCarouselProps) {
  const pokemonData: Pokemon[] = parsePokemonData(result);

  return (
    <div className="w-full">
      <div className="overflow-x-auto py-8 px-4 scrollbar-thin">
        <div className="flex space-x-4 min-w-max">
          {pokemonData.map((pokemon) => (
            <div key={pokemon.id}>
              <PokemonCard
                pokemon={pokemon}
                onClick={() => onClickPokemon?.(pokemon)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
