'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [query, router]
  );

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="브랜드, 카테고리, 할인 검색..."
        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-surface-200 bg-surface-50 
                   text-sm text-surface-900 placeholder:text-surface-400
                   focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                   transition-all"
      />
    </form>
  );
}
