import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export interface Pokemon {
  id: string;
  name: string;
  url: string;
  artwork?: string;
}

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick?: (id: string) => void;
}

export function PokemonCard({ pokemon, onClick }: PokemonCardProps) {
  const { id, name, url, artwork } = pokemon;

  return (
    <Card
      className="overflow-hidden cursor-pointer opacity-60 hover:opacity-100 h-[320px] w-[220px] flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      onClick={() => onClick?.(id)}
    >
      <CardContent className="p-3 grow flex items-center justify-center bg-white">
        <div className="relative w-full h-[200px] flex items-center justify-center">
          <Image
            src={artwork || '/placeholder.svg'}
            alt={name}
            fill
            className="object-contain p-2"
          />
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-slate-100 border-t flex items-center justify-center">
        <h3 className="font-medium text-center capitalize">
          <a href={url}>{name}</a>
        </h3>
      </CardFooter>
    </Card>
  );
}
