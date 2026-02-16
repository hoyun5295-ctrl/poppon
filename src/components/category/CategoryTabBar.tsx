'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { MAIN_CATEGORIES } from '@/lib/constants';
import { CategoryIcon } from '@/components/category/CategoryIcon';

interface CategoryTabBarProps {
  currentSlug: string;
}

export function CategoryTabBar({ currentSlug }: CategoryTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 현재 활성 탭을 뷰포트 중앙으로 스크롤
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      const container = scrollRef.current;
      const scrollLeft = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [currentSlug]);

  return (
    <div
      ref={scrollRef}
      className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:justify-center border-b border-surface-100"
    >
      {MAIN_CATEGORIES.map((cat) => {
        const isActive = cat.slug === currentSlug;
        return (
          <Link
            key={cat.slug}
            href={`/c/${cat.slug}`}
            data-active={isActive}
            className="group relative flex flex-col items-center gap-2 px-8 sm:px-10 pt-3 pb-4 shrink-0 transition-colors"
          >
            <CategoryIcon
              slug={cat.slug}
              size={32}
              color={isActive ? cat.color : '#9ca3af'}
            />
            <span
              className={`text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? ''
                  : 'text-surface-500 group-hover:text-surface-800'
              }`}
              style={isActive ? { color: cat.color } : undefined}
            >
              {cat.name}
            </span>
            {/* 언더라인 */}
            <span
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-200
                         w-0 group-hover:w-3/5"
              style={{ backgroundColor: cat.color }}
            />
            {isActive && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-3/5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
