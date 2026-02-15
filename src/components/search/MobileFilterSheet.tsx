'use client';

import { useState, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface MobileFilterSheetProps {
  categories: FilterOption[];
  benefitTags: FilterOption[];
  currentCategory: string;
  currentBenefitTag: string;
  currentChannel: string;
  activeFilterCount: number;
}

export function MobileFilterSheet({
  categories,
  benefitTags,
  currentCategory,
  currentBenefitTag,
  currentChannel,
  activeFilterCount,
}: MobileFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 임시 선택 상태 (적용 전)
  const [tempCategory, setTempCategory] = useState(currentCategory);
  const [tempBenefitTag, setTempBenefitTag] = useState(currentBenefitTag);
  const [tempChannel, setTempChannel] = useState(currentChannel);

  // 시트 열 때 현재 값 동기화
  useEffect(() => {
    if (isOpen) {
      setTempCategory(currentCategory);
      setTempBenefitTag(currentBenefitTag);
      setTempChannel(currentChannel);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, currentCategory, currentBenefitTag, currentChannel]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());

    // 필터 업데이트
    if (tempCategory) params.set('category', tempCategory);
    else params.delete('category');

    if (tempBenefitTag) params.set('benefit_tag', tempBenefitTag);
    else params.delete('benefit_tag');

    if (tempChannel) params.set('channel', tempChannel);
    else params.delete('channel');

    // 페이지 리셋
    params.delete('page');

    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempCategory('');
    setTempBenefitTag('');
    setTempChannel('');
  };

  const tempActiveCount = [tempCategory, tempBenefitTag, tempChannel].filter(Boolean).length;

  const channels = [
    { value: 'online', label: '온라인' },
    { value: 'offline', label: '오프라인' },
    { value: 'hybrid', label: '온+오프' },
  ];

  return (
    <>
      {/* 필터 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-surface-200 bg-white active:bg-surface-50 transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4 text-surface-500" />
        <span className="text-surface-700">필터</span>
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* 바텀시트 오버레이 */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* 배경 */}
          <div
            className="absolute inset-0 bg-black/40 animate-overlay-in"
            onClick={() => setIsOpen(false)}
          />

          {/* 시트 */}
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl animate-bottom-sheet-up max-h-[85vh] flex flex-col">
            {/* 스와이프 핸들 */}
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-surface-300" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-100">
              <h3 className="text-lg font-bold text-surface-900">필터</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 rounded-full active:bg-surface-100"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-surface-400" />
              </button>
            </div>

            {/* 필터 본문 — 스크롤 */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-6">
              {/* 카테고리 */}
              <div>
                <p className="text-sm font-semibold text-surface-700 mb-2.5">카테고리</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setTempCategory(tempCategory === cat.value ? '' : cat.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        tempCategory === cat.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-100 text-surface-600 active:bg-surface-200'
                      }`}
                    >
                      {cat.label}
                      {cat.count ? (
                        <span className={`ml-1 text-xs ${tempCategory === cat.value ? 'text-white/70' : 'text-surface-400'}`}>
                          {cat.count}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              {/* 혜택 유형 */}
              <div>
                <p className="text-sm font-semibold text-surface-700 mb-2.5">혜택 유형</p>
                <div className="flex flex-wrap gap-2">
                  {benefitTags.map((tag) => (
                    <button
                      key={tag.value}
                      onClick={() => setTempBenefitTag(tempBenefitTag === tag.value ? '' : tag.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        tempBenefitTag === tag.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-100 text-surface-600 active:bg-surface-200'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 채널 */}
              <div>
                <p className="text-sm font-semibold text-surface-700 mb-2.5">채널</p>
                <div className="flex flex-wrap gap-2">
                  {channels.map((ch) => (
                    <button
                      key={ch.value}
                      onClick={() => setTempChannel(tempChannel === ch.value ? '' : ch.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        tempChannel === ch.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-100 text-surface-600 active:bg-surface-200'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 하단 액션 */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-surface-100 pb-safe">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-sm font-medium text-surface-500 active:text-surface-700 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl active:bg-primary-600 transition-colors"
              >
                {tempActiveCount > 0 ? `${tempActiveCount}개 필터 적용` : '결과 보기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
