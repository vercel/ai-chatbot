'use client';
import { useState } from 'react';

export function SidebarSearchInput({
  onSearch,
}: { onSearch: (value: string) => void }) {
  const [query, setQuery] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  }

  return (
    <div className="px-1">
      <input
        type="text"
        placeholder="Search Chats"
        value={query}
        onChange={handleChange}
        className="w-full px-2 py-1.5 text-sm rounded-md border bg-white text-gray-500"
      />
    </div>
  );
}
