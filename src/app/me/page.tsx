'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart, Bell, Store, Tag, Settings, LogOut, ChevronRight,
  Bookmark, Shield, Smartphone, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { formatTimeRemaining } from '@/lib/utils/format';

type Tab = 'saved' | 'follows' | 'settings';

export default function MyPage() {
  const { isLoggedIn, isLoading, profile, signOut, openAuthSheet } = useAuth();
  const [tab, setTab] = useState<Tab>('saved');

  // 비로그인 상태
  if (!isLoading && !isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Smartphone className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-surface-900">마이페이지</h1>
        <p className="mt-2 text-surface-500 text-sm">
          로그인하면 딜 저장, 브랜드 구독, 알림 설정을 이용할 수 있어요
        </p>
        <button
          onClick={openAuthSheet}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
        >
          <Smartphone className="w-4 h-4" />
          시작하기
        </button>

        {/* 미리보기 */}
        <div className="mt-12 text-left">
          <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">
            로그인 후 이용 가능
          </h2>
          <div className="bg-white rounded-xl border border-surface-200 divide-y divide-surface-100">
            <MenuPreview icon={<Bookmark className="w-5 h-5" />} label="저장한 딜" desc="관심 딜을 저장하고 관리하세요" />
            <MenuPreview icon={<Store className="w-5 h-5" />} label="구독 브랜드" desc="좋아하는 브랜드의 새 딜 알림 받기" />
            <MenuPreview icon={<Tag className="w-5 h-5" />} label="관심 카테고리" desc="맞춤 카테고리 기반 추천" />
            <MenuPreview icon={<Bell className="w-5 h-5" />} label="알림 설정" desc="카카오/SMS/이메일 알림 설정" />
            <MenuPreview icon={<Shield className="w-5 h-5" />} label="마케팅 동의" desc="마케팅 수신 동의 관리" />
          </div>
        </div>
      </div>
    );
  }

  // 로딩
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // === 로그인 상태 ===
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* 프로필 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {profile?.nickname?.charAt(0) || profile?.name?.charAt(0) || 'P'}
            </span>
          </div>
          <div>
            <h1 className="text-base font-bold text-surface-900">
              {profile?.nickname || profile?.name || '사용자'}
            </h1>
            <p className="text-sm text-surface-400">
              {profile?.phone?.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3') || ''}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1 text-sm text-surface-400 hover:text-surface-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-surface-200 mb-5">
        <TabButton icon={<Heart className="w-4 h-4" />} label="저장 딜" active={tab === 'saved'} onClick={() => setTab('saved')} />
        <TabButton icon={<Store className="w-4 h-4" />} label="구독" active={tab === 'follows'} onClick={() => setTab('follows')} />
        <TabButton icon={<Settings className="w-4 h-4" />} label="설정" active={tab === 'settings'} onClick={() => setTab('settings')} />
      </div>

      {tab === 'saved' && <SavedDealsTab />}
      {tab === 'follows' && <FollowsTab />}
      {tab === 'settings' && <SettingsTab profile={profile} />}
    </div>
  );
}

// --- 저장 딜 탭 (실제 데이터) ---
function SavedDealsTab() {
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch('/api/me/saved-deals');
      const data = await res.json();
      setSavedDeals(data.savedDeals || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const handleRemove = async (dealId: string) => {
    await fetch(`/api/me/saved-deals?deal_id=${dealId}`, { method: 'DELETE' });
    setSavedDeals(prev => prev.filter(s => s.deals?.id !== dealId));
  };

  if (loading) return <LoadingSkeleton />;

  if (savedDeals.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-10 h-10 text-surface-300 mx-auto mb-3" />
        <p className="text-surface-500 font-medium">저장한 딜이 없습니다</p>
        <p className="text-sm text-surface-400 mt-1">딜 상세에서 하트를 눌러 저장하세요</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium">
          딜 둘러보기 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {savedDeals.map((item) => {
        const deal = item.deals;
        if (!deal) return null;
        return (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-surface-100 rounded-xl">
            <Link href={`/d/${encodeURIComponent(deal.slug)}`} className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate">{deal.title}</p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">{deal.benefit_summary}</p>
              <p className="text-xs text-surface-400 mt-0.5">
                {deal.merchants?.name} · {deal.is_evergreen ? '상시' : formatTimeRemaining(deal.ends_at) || '기간 미정'}
              </p>
            </Link>
            <button
              onClick={() => handleRemove(deal.id)}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
              title="저장 해제"
            >
              <Heart className="w-4 h-4 fill-current" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// --- 구독 탭 (실제 데이터) ---
function FollowsTab() {
  const [follows, setFollows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollows = useCallback(async () => {
    try {
      const res = await fetch('/api/me/follows/merchants');
      const data = await res.json();
      setFollows(data.followedMerchants || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFollows(); }, [fetchFollows]);

  const handleUnfollow = async (merchantId: string) => {
    await fetch(`/api/me/follows/merchants?merchant_id=${merchantId}`, { method: 'DELETE' });
    setFollows(prev => prev.filter(f => f.merchants?.id !== merchantId));
  };

  if (loading) return <LoadingSkeleton />;

  if (follows.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="w-10 h-10 text-surface-300 mx-auto mb-3" />
        <p className="text-surface-500 font-medium">구독한 브랜드가 없습니다</p>
        <p className="text-sm text-surface-400 mt-1">브랜드관에서 구독 버튼을 눌러보세요</p>
        <Link href="/search" className="mt-4 inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium">
          브랜드 둘러보기 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {follows.map((item) => {
        const merchant = item.merchants;
        if (!merchant) return null;
        return (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-surface-100 rounded-xl">
            {merchant.logo_url ? (
              <img src={merchant.logo_url} alt={merchant.name} className="w-10 h-10 rounded-lg object-contain border border-surface-100 p-0.5" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-sm font-bold text-surface-400">
                {merchant.name?.charAt(0)}
              </div>
            )}
            <Link href={`/m/${merchant.slug}`} className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900">{merchant.name}</p>
              <p className="text-xs text-surface-400">활성 딜 {merchant.active_deal_count}개</p>
            </Link>
            <button
              onClick={() => handleUnfollow(merchant.id)}
              className="shrink-0 px-3 py-1.5 text-xs text-surface-500 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
            >
              구독 해제
            </button>
          </div>
        );
      })}
    </div>
  );
}

// --- 설정 탭 ---
function SettingsTab({ profile }: { profile: any }) {
  return (
    <div className="space-y-5">
      {/* SNS 연동 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          소셜 계정 연동
        </h3>
        <div className="space-y-3">
          <SNSLinkItem
            name="카카오"
            color="#FEE500"
            textColor="#191919"
            linked={profile?.linked_providers?.includes('kakao')}
          />
          <SNSLinkItem
            name="네이버"
            color="#03C75A"
            textColor="#fff"
            linked={profile?.linked_providers?.includes('naver')}
          />
          <SNSLinkItem
            name="Apple"
            color="#000"
            textColor="#fff"
            linked={profile?.linked_providers?.includes('apple')}
          />
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          알림 설정
        </h3>
        <div className="space-y-4">
          <ToggleSetting label="카카오 알림톡" desc="새 딜/마감 임박 알림" />
          <ToggleSetting label="SMS 알림" desc="중요 딜 알림" />
          <ToggleSetting label="이메일 알림" desc="주간 다이제스트" />
          <ToggleSetting label="푸시 알림" desc="실시간 알림 (추후 지원)" disabled />
        </div>
      </div>

      {/* 마케팅 동의 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          마케팅 동의
        </h3>
        <ToggleSetting
          label="마케팅 정보 수신 동의"
          desc="할인/프로모션 관련 마케팅 정보를 받습니다"
          defaultOn={profile?.marketing_agreed || false}
        />
        <p className="text-xs text-surface-400 mt-3">
          동의를 철회하면 마케팅 관련 알림이 즉시 중단됩니다.
        </p>
      </div>

      {/* 계정 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4">계정</h3>
        <button className="text-sm text-red-500 hover:text-red-600 font-medium">
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}

// --- 공통 컴포넌트 ---
function TabButton({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
        active ? 'text-primary-500' : 'text-surface-400 hover:text-surface-600'
      }`}
    >
      {icon}{label}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />}
    </button>
  );
}

function MenuPreview({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 opacity-60">
      <div className="text-surface-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-700">{label}</p>
        <p className="text-xs text-surface-400">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-surface-300" />
    </div>
  );
}

function SNSLinkItem({ name, color, textColor, linked }: {
  name: string; color: string; textColor: string; linked: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: color, color: textColor }}>
          {name.charAt(0)}
        </div>
        <span className="text-sm text-surface-700">{name}</span>
      </div>
      {linked ? (
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">연동됨</span>
      ) : (
        <button className="text-xs text-primary-500 hover:text-primary-600 font-medium">
          연동하기
        </button>
      )}
    </div>
  );
}

function ToggleSetting({ label, desc, disabled = false, defaultOn = false }: {
  label: string; desc: string; disabled?: boolean; defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className={`flex items-center justify-between ${disabled ? 'opacity-40' : ''}`}>
      <div>
        <p className="text-sm font-medium text-surface-700">{label}</p>
        <p className="text-xs text-surface-400">{desc}</p>
      </div>
      <button
        onClick={() => !disabled && setOn(!on)}
        disabled={disabled}
        className={`w-10 h-6 rounded-full transition-colors relative ${on ? 'bg-primary-500' : 'bg-surface-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-surface-50 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
