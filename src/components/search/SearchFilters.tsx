'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SearchFiltersProps {
  categories: FilterOption[];
  benefitTags: FilterOption[];
  currentCategory: string;
  currentBenefitTag: string;
  currentChannel: string;
}

const CHANNEL_OPTIONS: FilterOption[] = [
  { value: '', label: '전체' },
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프' },
];

const BENEFIT_TAG_LABELS: Record<string, string> = {
  percent_off: '% 할인',
  amount_off: '원 할인',
  bogo: '1+1',
  free_shipping: '무료배송',
  gift_with_purchase: '사은품',
  bundle_deal: '묶음할인',
  clearance: '클리어런스',
  member_only: '회원전용',
  new_user: '신규회원',
  app_only: '앱전용',
  limited_time: '한정기간',
};

export function SearchFilters({
  categories,
  benefitTags,
  currentCategory,
  currentBenefitTag,
  currentChannel,
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters = !!(currentCategory || currentBenefitTag || currentChannel);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('benefit_tag');
    params.delete('channel');
    params.delete('page');
    const q = params.get('q');
    const sort = params.get('sort');
    const newParams = new URLSearchParams();
    if (q) newParams.set('q', q);
    if (sort) newParams.set('sort', sort);
    const qs = newParams.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  }

  const filterContent = (
    <div className="space-y-5">
      {/* 카테고리 필터 */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-2">카테고리</h3>
        <div className="flex flex-wrap gap-1.5">
          <ChipButton
            label="전체"
            active={!currentCategory}
            onClick={() => setFilter('category', '')}
          />
          {categories.map((cat) => (
            <ChipButton
              key={cat.value}
              label={cat.label}
              active={currentCategory === cat.value}
              onClick={() => setFilter('category', cat.value)}
              count={cat.count}
            />
          ))}
        </div>
      </div>

      {/* 혜택 타입 필터 */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-2">혜택 유형</h3>
        <div className="flex flex-wrap gap-1.5">
          <ChipButton
            label="전체"
            active={!currentBenefitTag}
            onClick={() => setFilter('benefit_tag', '')}
          />
          {benefitTags.map((tag) => (
            <ChipButton
              key={tag.value}
              label={BENEFIT_TAG_LABELS[tag.value] || tag.value}
              active={currentBenefitTag === tag.value}
              onClick={() => setFilter('benefit_tag', tag.value)}
            />
          ))}
        </div>
      </div>

      {/* 채널 필터 */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-2">채널</h3>
        <div className="flex flex-wrap gap-1.5">
          {CHANNEL_OPTIONS.map((ch) => (
            <ChipButton
              key={ch.value}
              label={ch.label}
              active={currentChannel === ch.value}
              onClick={() => setFilter('channel', ch.value)}
            />
          ))}
        </div>
      </div>

      {/* 필터 초기화 */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 text-sm text-surface-500 hover:text-primary-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          필터 초기화
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* 모바일: 필터 토글 버튼 */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
            hasActiveFilters
              ? 'border-primary-300 bg-primary-50 text-primary-600'
              : 'border-surface-200 text-surface-600 hover:bg-surface-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          필터
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
              {[currentCategory, currentBenefitTag, currentChannel].filter(Boolean).length}
            </span>
          )}
        </button>
        {showMobileFilters && (
          <div className="mt-3 p-4 bg-white border border-surface-200 rounded-xl animate-slide-up">
            {filterContent}
          </div>
        )}
      </div>

      {/* PC: 사이드바 필터 */}
      <div className="hidden lg:block">{filterContent}</div>
    </>
  );
}

// 칩 버튼 컴포넌트
function ChipButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
        active
          ? 'bg-primary-500 text-white font-medium'
          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1 text-xs ${active ? 'text-primary-200' : 'text-surface-400'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
