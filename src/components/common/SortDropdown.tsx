'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';

export const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'new', label: '최신순' },
  { value: 'ending', label: '마감임박순' },
  { value: 'discount', label: '할인율순' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

interface SortDropdownProps {
  currentSort: string;
}

export function SortDropdown({ currentSort }: SortDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'popular') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    params.delete('page'); // 정렬 변경 시 첫 페이지로
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <ArrowUpDown className="w-3.5 h-3.5 text-surface-400" />
      <select
        value={currentSort || 'popular'}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-transparent text-sm font-medium text-surface-700 cursor-pointer pr-5 focus:outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="w-3 h-3 text-surface-400 pointer-events-none -ml-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
