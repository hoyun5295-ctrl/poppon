'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * 브랜드 구독/해제 버튼 (클라이언트 컴포넌트)
 * 서버 컴포넌트인 브랜드관 페이지에서 사용
 */
export function FollowButton({ merchantId, merchantName }: { merchantId: string; merchantName: string }) {
  const { isLoggedIn, openAuthSheet, showToast } = useAuth();
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 구독 상태 확인
  useEffect(() => {
    if (!isLoggedIn) { setChecking(false); return; }

    const checkFollow = async () => {
      try {
        const res = await fetch('/api/me/follows/merchants');
        if (res.ok) {
          const data = await res.json();
          const followed = (data.followedMerchants || []).some(
            (f: any) => f.merchants?.id === merchantId
          );
          setIsFollowed(followed);
        }
      } catch { /* ignore */ }
      setChecking(false);
    };
    checkFollow();
  }, [isLoggedIn, merchantId]);

  const handleClick = async () => {
    if (!isLoggedIn) {
      openAuthSheet();
      return;
    }

    setLoading(true);
    try {
      if (isFollowed) {
        // 구독 해제
        const res = await fetch(`/api/me/follows/merchants?merchant_id=${merchantId}`, { method: 'DELETE' });
        if (res.ok) {
          setIsFollowed(false);
          showToast(`${merchantName} 구독이 해제되었습니다`, 'success');
        }
      } else {
        // 구독
        const res = await fetch('/api/me/follows/merchants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant_id: merchantId }),
        });
        if (res.ok) {
          setIsFollowed(true);
          showToast(`${merchantName} 구독 완료! 새 딜 알림을 받습니다`, 'success');
        } else if (res.status === 409) {
          setIsFollowed(true); // 이미 구독 중
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (checking) {
    return (
      <button disabled className="px-5 py-2 bg-surface-100 text-surface-400 text-sm font-medium rounded-lg">
        ...
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-sm font-semibold transition-colors disabled:opacity-50 ${
        isFollowed
          ? 'px-5 py-2 bg-surface-100 text-surface-500 rounded-lg hover:bg-surface-200'
          : 'px-5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 active:bg-primary-700'
      }`}
    >
      {loading ? '...' : isFollowed ? '구독 중' : '구독하기'}
    </button>
  );
}

/**
 * 모바일용 구독 버튼 (풀 너비)
 */
export function FollowButtonMobile({ merchantId, merchantName }: { merchantId: string; merchantName: string }) {
  const { isLoggedIn, openAuthSheet, showToast } = useAuth();
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { setChecking(false); return; }

    const checkFollow = async () => {
      try {
        const res = await fetch('/api/me/follows/merchants');
        if (res.ok) {
          const data = await res.json();
          const followed = (data.followedMerchants || []).some(
            (f: any) => f.merchants?.id === merchantId
          );
          setIsFollowed(followed);
        }
      } catch { /* ignore */ }
      setChecking(false);
    };
    checkFollow();
  }, [isLoggedIn, merchantId]);

  const handleClick = async () => {
    if (!isLoggedIn) {
      openAuthSheet();
      return;
    }

    setLoading(true);
    try {
      if (isFollowed) {
        const res = await fetch(`/api/me/follows/merchants?merchant_id=${merchantId}`, { method: 'DELETE' });
        if (res.ok) {
          setIsFollowed(false);
          showToast(`${merchantName} 구독이 해제되었습니다`, 'success');
        }
      } else {
        const res = await fetch('/api/me/follows/merchants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant_id: merchantId }),
        });
        if (res.ok) {
          setIsFollowed(true);
          showToast(`${merchantName} 구독 완료! 새 딜 알림을 받습니다`, 'success');
        } else if (res.status === 409) {
          setIsFollowed(true);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (checking) {
    return (
      <button disabled className="w-full py-2.5 bg-surface-100 text-surface-400 text-sm font-semibold rounded-xl">
        ...
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
        isFollowed
          ? 'bg-surface-100 text-surface-500 active:bg-surface-200'
          : 'bg-primary-500 text-white active:bg-primary-600'
      }`}
    >
      {loading ? '...' : isFollowed ? '구독 중 ✓' : '구독하기'}
    </button>
  );
}
