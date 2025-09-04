'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockData {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  volume: number;
  marketCap: string;
}

interface StockCardProps {
  data: StockData;
}

export function StockCard({ data }: StockCardProps) {
  const isPositive = parseFloat(data.change) >= 0;

  return (
    <Card className="p-6 w-full max-w-md">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">{data.symbol}</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold">${data.price}</span>
            <div className={cn(
              "flex items-center gap-1 text-sm",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{isPositive ? '+' : ''}{data.change}</span>
              <span>({isPositive ? '+' : ''}{data.changePercent}%)</span>
            </div>
          </div>
        </div>
        <DollarSign className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Volume</p>
          <p className="text-sm font-semibold">
            {(data.volume / 1000000).toFixed(2)}M
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Market Cap</p>
          <p className="text-sm font-semibold">{data.marketCap}</p>
        </div>
      </div>
    </Card>
  );
}