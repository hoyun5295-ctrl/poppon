'use client';

import { useState, useEffect } from 'react';
import { Heart, Store, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';

interface DealActionBarProps {
  dealId: string;
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  isModal?: boolean;
}

/**
 * 딜 상세 액션 바: 저장(찜) / 브랜드관 / 구독
 * DealDetail 브랜드 영역 우측에 배치
 */
export function DealActionBar({
  dealId,
  merchantId,
  merchantName,
  merchantSlug,
  isModal = false,
}: DealActionBarProps) {
  const { isLoggedIn, openAuthSheet, showToast } = useAuth();

  // 저장 상태
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // 구독 상태
  const [isFollowed, setIsFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // 초기 상태 로드
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    const checkStatus = async () => {
      try {
        const [savedRes, followRes] = await Promise.all([
          fetch('/api/me/saved-deals'),
          fetch('/api/me/follows/merchants'),
        ]);

        if (cancelled) return;

        if (savedRes.ok) {
          const savedData = await savedRes.json();
          const saved = (savedData.savedDeals || []).some(
            (s: any) => s.deals?.id === dealId
          );
          setIsSaved(saved);
        }

        if (followRes.ok) {
          const followData = await followRes.json();
          const followed = (followData.followedMerchants || []).some(
            (f: any) => f.merchants?.id === merchantId
          );
          setIsFollowed(followed);
        }
      } catch {
        // ignore
      }
      if (!cancelled) setChecking(false);
    };

    checkStatus();
    return () => { cancelled = true; };
  }, [isLoggedIn, dealId, merchantId]);

  // ── 저장 토글 ──
  const handleSave = async () => {
    if (!isLoggedIn) { openAuthSheet(); return; }
    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/me/saved-deals?deal_id=${dealId}`, { method: 'DELETE' });
        if (res.ok) {
          setIsSaved(false);
          showToast('저장이 해제되었습니다', 'info');
        }
      } else {
        const res = await fetch('/api/me/saved-deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deal_id: dealId }),
        });
        if (res.ok) {
          setIsSaved(true);
          showToast('딜이 저장되었습니다 ❤️', 'success');
        } else if (res.status === 409) {
          setIsSaved(true);
        }
      }
    } catch { /* ignore */ }
    setSaveLoading(false);
  };

  // ── 구독 토글 ──
  const handleFollow = async () => {
    if (!isLoggedIn) { openAuthSheet(); return; }
    setFollowLoading(true);
    try {
      if (isFollowed) {
        const res = await fetch(`/api/me/follows/merchants?merchant_id=${merchantId}`, { method: 'DELETE' });
        if (res.ok) {
          setIsFollowed(false);
          showToast(`${merchantName} 구독 해제`, 'info');
        }
      } else {
        const res = await fetch('/api/me/follows/merchants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant_id: merchantId }),
        });
        if (res.ok) {
          setIsFollowed(true);
          showToast(`${merchantName} 구독 완료!`, 'success');
        } else if (res.status === 409) {
          setIsFollowed(true);
        }
      }
    } catch { /* ignore */ }
    setFollowLoading(false);
  };

  const merchantHref = `/m/${merchantSlug}`;

  if (checking) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-8 h-8 rounded-lg bg-surface-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* 저장(찜) */}
      <button
        onClick={handleSave}
        disabled={saveLoading}
        title={isSaved ? '저장됨' : '저장'}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
          isSaved
            ? 'bg-red-50 text-red-500'
            : 'bg-surface-50 text-surface-400 hover:bg-surface-100 hover:text-surface-600'
        }`}
      >
        <Heart
          className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500' : ''}`}
        />
        <span className="hidden sm:inline">{isSaved ? '저장됨' : '저장'}</span>
      </button>

      {/* 브랜드관 */}
      {isModal ? (
        <a
          href={merchantHref}
          title={`${merchantName} 브랜드관`}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-surface-50 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-all"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">브랜드관</span>
        </a>
      ) : (
        <a
          href={merchantHref}
          title={`${merchantName} 브랜드관`}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-surface-50 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-all"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">브랜드관</span>
        </a>
      )}

      {/* 구독 */}
      <button
        onClick={handleFollow}
        disabled={followLoading}
        title={isFollowed ? '구독 중' : '구독하기'}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
          isFollowed
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-surface-50 text-surface-400 hover:bg-surface-100 hover:text-surface-600'
        }`}
      >
        {isFollowed ? (
          <BellOff className="w-3.5 h-3.5" />
        ) : (
          <Bell className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{isFollowed ? '구독중' : '구독'}</span>
      </button>
    </div>
  );
}
