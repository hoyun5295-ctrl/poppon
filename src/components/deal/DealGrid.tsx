'use client';

import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { DealCard } from './DealCard';
import type { DealCard as DealCardType } from '@/types';

interface DealGridProps {
  deals: DealCardType[];
  /** 기본 레이아웃 (grid | list) */
  defaultLayout?: 'grid' | 'list';
  /** 레이아웃 토글 표시 여부 */
  showLayoutToggle?: boolean;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  emptySubMessage?: string;
}

export function DealGrid({
  deals,
  defaultLayout = 'grid',
  showLayoutToggle = true,
  emptyMessage = '딜이 없습니다',
  emptySubMessage,
}: DealGridProps) {
  const [layout, setLayout] = useState<'grid' | 'list'>(defaultLayout);

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-surface-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl">🔍</span>
        </div>
        <p className="text-surface-600 font-medium text-sm sm:text-base">{emptyMessage}</p>
        {emptySubMessage && (
          <p className="text-xs sm:text-sm text-surface-400 mt-1">{emptySubMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* 상단: 결과 수 + 레이아웃 토글 */}
      {showLayoutToggle && (
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm text-surface-500">
            총 <span className="font-semibold text-surface-700">{deals.length}</span>개
          </p>
          <div className="flex items-center gap-0.5 bg-surface-100 rounded-lg p-0.5">
            <button
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-md transition-colors ${
                layout === 'grid'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-400 hover:text-surface-600'
              }`}
              aria-label="그리드 보기"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-2 rounded-md transition-colors ${
                layout === 'list'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-400 hover:text-surface-600'
              }`}
              aria-label="리스트 보기"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 딜 목록 */}
      {layout === 'grid' ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} layout="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} layout="list" />
          ))}
        </div>
      )}
    </div>
  );
}
