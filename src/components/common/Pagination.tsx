'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
}

export function Pagination({ currentPage, totalPages, totalCount }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  }

  // 페이지 번호 범위 계산 (최대 5개 표시)
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      {/* 이전 */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="이전 페이지"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* 페이지 번호 */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => goToPage(1)}
            className="w-9 h-9 rounded-lg text-sm text-surface-600 hover:bg-surface-100 transition-colors"
          >
            1
          </button>
          {startPage > 2 && (
            <span className="text-surface-300 text-sm px-1">…</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
            page === currentPage
              ? 'bg-primary-500 text-white'
              : 'text-surface-600 hover:bg-surface-100'
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="text-surface-300 text-sm px-1">…</span>
          )}
          <button
            onClick={() => goToPage(totalPages)}
            className="w-9 h-9 rounded-lg text-sm text-surface-600 hover:bg-surface-100 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* 다음 */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="다음 페이지"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
