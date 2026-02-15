import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { DealCard } from './DealCard';
import type { DealCard as DealCardType } from '@/types';

interface DealShelfProps {
  title: string;
  subtitle?: string;
  deals: DealCardType[];
  viewAllHref?: string;
  emptyMessage?: string;
  /** PC에서 표시할 열 수 (기본 4) */
  columns?: 3 | 4;
}

export function DealShelf({
  title,
  subtitle,
  deals,
  viewAllHref,
  emptyMessage = '딜이 없습니다',
  columns = 4,
}: DealShelfProps) {
  if (deals.length === 0) {
    return (
      <section className="py-6">
        <h2 className="text-lg font-bold text-surface-900">{title}</h2>
        <p className="mt-4 text-sm text-surface-400 text-center py-8">{emptyMessage}</p>
      </section>
    );
  }

  // PC에서 보여줄 딜 수 제한
  const visibleDeals = deals.slice(0, columns === 3 ? 6 : 8);

  const gridCols =
    columns === 3
      ? 'md:grid-cols-3'
      : 'md:grid-cols-4';

  return (
    <section className="py-5 sm:py-6">
      {/* 헤더 */}
      <div className="flex items-end justify-between mb-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-surface-900 truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-surface-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-0.5 text-xs sm:text-sm text-surface-500 hover:text-primary-500 active:text-primary-600 transition-colors shrink-0 ml-2 py-1"
          >
            전체보기 <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        )}
      </div>

      {/* 모바일 (md 미만): 가로 스크롤 — 화면 너비 비율 기반 */}
      <div className="md:hidden -mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide scroll-smooth-touch">
          {deals.map((deal, i) => (
            <div
              key={deal.id}
              className="w-[68vw] min-w-[200px] max-w-[280px] shrink-0 snap-start"
              style={i === deals.length - 1 ? { marginRight: '16px' } : undefined}
            >
              <DealCard deal={deal} />
            </div>
          ))}
        </div>
      </div>

      {/* PC (md 이상): 그리드 */}
      <div className={`hidden md:grid ${gridCols} gap-4`}>
        {visibleDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </section>
  );
}
