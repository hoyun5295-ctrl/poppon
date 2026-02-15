'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useRef, useState } from 'react';
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

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleClose]);

  // 모바일 스와이프 다운 to close
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // 스와이프 핸들 영역에서만 드래그 시작
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
    // 100px 이상 드래그하면 닫기
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-overlay-in"
        onClick={handleClose}
      />

      {/* ===== 데스크탑: 센터 모달 ===== */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center px-4">
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-surface-100 hover:bg-surface-200 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4 text-surface-500" />
          </button>
          <div className="p-5">
            {children}
          </div>
        </div>
      </div>

      {/* ===== 모바일: 바텀시트 ===== */}
      <div
        className="md:hidden absolute inset-x-0 bottom-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="bg-white rounded-t-2xl shadow-2xl w-full animate-bottom-sheet-up"
          style={{
            maxHeight: '92vh',
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 스와이프 핸들 */}
          <div
            data-drag-handle
            className="flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
          >
            <div className="w-10 h-1 rounded-full bg-surface-300" />
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-surface-100 active:bg-surface-200 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4 text-surface-500" />
          </button>

          {/* 내용 — 스크롤 가능 */}
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
