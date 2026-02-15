'use client';

import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useState, useRef } from 'react';

interface SearchInputProps {
  defaultValue?: string;
  placeholder?: string;
  /** true면 /search 페이지로 이동, false면 현재 경로에 ?q= 추가 */
  navigateToSearch?: boolean;
}

export function SearchInput({
  defaultValue = '',
  placeholder = '브랜드, 카테고리, 할인 검색...',
  navigateToSearch = true,
}: SearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (navigateToSearch) {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    } else {
      const url = new URL(window.location.href);
      if (q) {
        url.searchParams.set('q', q);
      } else {
        url.searchParams.delete('q');
      }
      url.searchParams.delete('page');
      router.push(url.pathname + url.search);
    }
  }

  function handleClear() {
    setValue('');
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-20 py-3.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
      >
        검색
      </button>
    </form>
  );
}
