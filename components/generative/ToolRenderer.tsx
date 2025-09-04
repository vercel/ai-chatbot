'use client';

import React from 'react';
import { WeatherCard } from './WeatherCard';
import { StockCard } from './StockCard';
import { CalculationCard } from './CalculationCard';
import { CodeCard } from './CodeCard';
import { SearchCard } from './SearchCard';
import { Loader2 } from 'lucide-react';

interface ToolRendererProps {
  type: string;
  data: any;
  loading?: boolean;
}

export function ToolRenderer({ type, data, loading }: ToolRendererProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Executando ferramenta...</span>
      </div>
    );
  }

  switch (type) {
    case 'weather':
      return <WeatherCard data={data} />;
    
    case 'stock':
      return <StockCard data={data} />;
    
    case 'calculation':
      return <CalculationCard data={data} />;
    
    case 'code':
      return <CodeCard data={data} />;
    
    case 'search':
      return <SearchCard data={data} />;
    
    default:
      return (
        <div className="text-sm text-muted-foreground p-4 border rounded">
          Tipo de ferramenta não reconhecido: {type}
        </div>
      );
  }
}