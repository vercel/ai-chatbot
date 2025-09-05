'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { StarIcon } from 'lucide-react';

type SpecItem = {
  sku: string;
  brand: string;
  category: 'module' | 'inverter' | 'rail';
  catalogUrl: string;
};

const ITEMS: SpecItem[] = [
  {
    sku: 'MOD-001',
    brand: 'SunPower',
    category: 'module',
    catalogUrl: '#',
  },
  {
    sku: 'INV-001',
    brand: 'Enphase',
    category: 'inverter',
    catalogUrl: '#',
  },
  {
    sku: 'RAIL-001',
    brand: 'Unirac',
    category: 'rail',
    catalogUrl: '#',
  },
];

export function SpecLibrary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | SpecItem['category']>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SpecItem[]>([]);

  const filtered = useMemo(() => {
    return ITEMS.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const q = query.toLowerCase();
      const matchesQuery =
        item.sku.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const toggleFavorite = (sku: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const selectItem = (item: SpecItem) => {
    setSelected((prev) => [...prev, item]);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SKU ou marca"
          className="border p-1 rounded flex-1"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className="border p-1 rounded"
        >
          <option value="all">Todos</option>
          <option value="module">Módulos</option>
          <option value="inverter">Inversores</option>
          <option value="rail">Rails</option>
        </select>
      </div>
      <ul className="space-y-2">
        {filtered.map((item) => (
          <li
            key={item.sku}
            className="flex items-center justify-between border rounded p-2"
          >
            <div>
              <div className="font-medium">{item.brand}</div>
              <div className="text-xs text-muted-foreground">{item.sku}</div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={item.catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                Catálogo
              </a>
              <button
                type="button"
                onClick={() => toggleFavorite(item.sku)}
                aria-label="favoritar"
                className={clsx(
                  'p-1',
                  favorites.has(item.sku)
                    ? 'text-yellow-500'
                    : 'text-muted-foreground',
                )}
              >
                <StarIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => selectItem(item)}
                className="border px-2 py-1 rounded text-sm"
              >
                Selecionar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted-foreground">
        System Size: {selected.length} itens — BOM:{' '}
        {selected.map((s) => s.sku).join(', ')}
      </div>
    </div>
  );
}

