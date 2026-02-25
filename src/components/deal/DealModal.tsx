'use client';

import { useRouter } from 'next/navigation';
import { useLayoutEffect, useEffect, useCallback, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface DealModalProps {
  children: React.ReactNode;
}

export function DealModal({ children }: DealModalProps) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const scrollYRef = useRef(0);

  // 열림 애니메이션 상태
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  // ✅ body 스타일 복원 헬퍼 (중복 호출 안전)
  const restoreBodyScroll = useCallback(() => {
    const savedY = scrollYRef.current;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    document.body.style.width = '';
    window.scrollTo(0, savedY);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      // ✅ router.back() 전에 body 먼저 복원 (Next.js 스크롤 복원과 경합 방지)
      restoreBodyScroll();
      router.back();
    }, 200);
  }, [router, restoreBodyScroll]);

  // ✅ useLayoutEffect: paint 전에 즉시 body 고정 (스크롤 점프 방지)
  useLayoutEffect(() => {
    scrollYRef.current = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';

    return () => {
      // 안전망: handleClose에서 이미 복원했으면 no-op
      if (document.body.style.position === 'fixed') {
        restoreBodyScroll();
      }
    };
  }, [restoreBodyScroll]);

  // ESC 키 핸들러 (별도 useEffect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // 모바일 스와이프 다운 to close
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]')) {
      startYRef.current = e.touches[0].clientY;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* 오버레이 */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* 데스크탑: 센터 모달 */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center px-4">
        <div
          className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto transition-all duration-200 ease-out ${
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* X 버튼 별도 행 */}
          <div className="flex justify-end px-3 pt-3">
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-surface-100 hover:bg-surface-200 transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-surface-500" />
            </button>
          </div>
          <div className="px-5 pb-5">
            {children}
          </div>
        </div>
      </div>

      {/* 모바일: 바텀시트 */}
      <div
        className="md:hidden absolute inset-x-0 bottom-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="bg-white rounded-t-2xl shadow-2xl w-full"
          style={{
            maxHeight: '92vh',
            transform: dragY > 0
              ? `translateY(${dragY}px)`
              : isVisible
                ? 'translateY(0)'
                : 'translateY(100%)',
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 드래그 핸들 + X 버튼 같은 행 */}
          <div
            data-drag-handle
            className="flex items-center justify-between px-3 pt-3 pb-1 cursor-grab active:cursor-grabbing"
          >
            <div className="flex-1" />
            <div className="w-10 h-1 rounded-full bg-surface-300" />
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-surface-100 active:bg-surface-200 transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4 text-surface-500" />
              </button>
            </div>
          </div>

          <div
            className="overflow-y-auto overscroll-contain px-4 pb-6 pb-safe"
            style={{ maxHeight: 'calc(92vh - 2.5rem)' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
