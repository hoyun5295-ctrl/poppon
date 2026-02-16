'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const prevPathRef = useRef(pathname + searchParams.toString());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgress = useCallback(() => {
    setIsNavigating(true);
    setProgress(30);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 90;
        }
        return prev + (90 - prev) * 0.1;
      });
    }, 200);
  }, []);

  const completeProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 300);
  }, []);

  // 내부 링크 클릭 감지 → 프로그레스 시작
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;
      // 외부 링크, 앵커, 새 탭 무시
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
      if (target.target === '_blank') return;
      // 현재 페이지와 같으면 무시
      if (href === pathname) return;

      startProgress();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, startProgress]);

  // pathname 변경 감지 → 프로그레스 완료
  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (prevPathRef.current !== currentPath) {
      prevPathRef.current = currentPath;
      if (isNavigating) {
        completeProgress();
      }
    }
  }, [pathname, searchParams, isNavigating, completeProgress]);

  // 언마운트 시 클린업
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none">
      <div
        className="h-full rounded-r-full"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)',
          transition: progress >= 100
            ? 'width 0.15s ease-out, opacity 0.3s ease-out 0.1s'
            : 'width 0.3s ease-out',
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
        }}
      />
    </div>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
