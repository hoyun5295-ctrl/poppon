'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Home,
  Smartphone,
  Plane,
  Film,
  BookOpen,
  HeartPulse,
  PawPrint,
  Car,
  CreditCard,
  Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MAIN_CATEGORIES } from '@/lib/constants';

const ICON_MAP: Record<string, LucideIcon> = {
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Home,
  Smartphone,
  Plane,
  Film,
  BookOpen,
  HeartPulse,
  PawPrint,
  Car,
  CreditCard,
};

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
      className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
    >
      {MAIN_CATEGORIES.map((cat) => {
        const isActive = cat.slug === currentSlug;
        const IconComp = ICON_MAP[cat.lucideIcon] || Tag;

        return (
          <Link
            key={cat.slug}
            href={`/c/${cat.slug}`}
            data-active={isActive}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: isActive ? `${cat.color}12` : 'transparent',
              color: isActive ? cat.color : '#6B7280',
              border: isActive ? `1.5px solid ${cat.color}30` : '1.5px solid transparent',
            }}
          >
            <IconComp
              size={15}
              strokeWidth={isActive ? 2.2 : 1.8}
              className="shrink-0"
              style={{ color: isActive ? cat.color : '#9CA3AF' }}
            />
            <span className="text-xs sm:text-sm whitespace-nowrap">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
