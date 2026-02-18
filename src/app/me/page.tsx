'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, Bell, Store, Tag, Settings, LogOut, ChevronRight,
  Bookmark, Shield, Smartphone, ExternalLink, AlertTriangle, KeyRound,
  Check, Shirt, Sparkles, UtensilsCrossed, Home, Plane, LayoutGrid, Plus,
  User, Camera, Clock
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { setPendingToast } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { formatTimeRemaining } from '@/lib/utils/format';

type Tab = 'saved' | 'follows' | 'settings';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fashion: <Shirt className="w-4 h-4" />,
  beauty: <Sparkles className="w-4 h-4" />,
  food: <UtensilsCrossed className="w-4 h-4" />,
  living: <Home className="w-4 h-4" />,
  travel: <Plane className="w-4 h-4" />,
  culture: <LayoutGrid className="w-4 h-4" />,
};

export default function MyPage() {
  const { isLoggedIn, isLoading, user, profile, openAuthSheet, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'saved';
  const [tab, setTab] = useState<Tab>(initialTab);

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
          onClick={() => openAuthSheet()}
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
  const avatarUrl = user?.user_metadata?.avatar_url || profile?.avatar_url;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* 프로필 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="프로필"
              className="w-12 h-12 rounded-full object-cover border border-surface-200"
            />
          ) : (
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {profile?.nickname?.charAt(0) || profile?.name?.charAt(0) || 'P'}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-base font-bold text-surface-900">
              {profile?.nickname || profile?.name || user?.email?.split('@')[0] || '사용자'}
              <span className="font-medium text-surface-600">님, 환영합니다!</span>
            </h1>
            <p className="text-sm text-surface-400">
              {user?.email || ''}
            </p>
          </div>
        </div>
        {/* ✅ 핵심 수정: <a> 태그 — JS 상태와 무관하게 무조건 작동 */}
        <a
          href="/api/auth/signout"
          onClick={() => setPendingToast('로그아웃되었습니다', 'success')}
          className="flex items-center gap-1 text-sm text-surface-400 hover:text-surface-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </a>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-surface-200 mb-5">
        <TabButton icon={<Heart className="w-4 h-4" />} label="저장 딜" active={tab === 'saved'} onClick={() => setTab('saved')} />
        <TabButton icon={<Store className="w-4 h-4" />} label="구독" active={tab === 'follows'} onClick={() => setTab('follows')} />
        <TabButton icon={<Settings className="w-4 h-4" />} label="설정" active={tab === 'settings'} onClick={() => setTab('settings')} />
      </div>

      {tab === 'saved' && <SavedDealsTab />}
      {tab === 'follows' && <FollowsTab />}
      {tab === 'settings' && <SettingsTab profile={profile} user={user} onRefresh={refreshProfile} />}
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
      if (!res.ok) throw new Error();
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
      if (!res.ok) throw new Error();
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
      <div className="space-y-6">
        <div className="text-center py-8">
          <Store className="w-10 h-10 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500 font-medium">구독한 브랜드가 없습니다</p>
          <p className="text-sm text-surface-400 mt-1">아래에서 관심 브랜드를 구독해보세요</p>
        </div>
        <FollowsRecommendSection
          excludeIds={[]}
          onFollow={() => fetchFollows()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 내 구독 브랜드 */}
      <div>
        <h3 className="text-sm font-semibold text-surface-500 mb-3 flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" />
          내 구독 브랜드 ({follows.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {follows.map((item) => {
            const merchant = item.merchants;
            if (!merchant) return null;
            return (
              <div key={item.id} className="flex items-center gap-2.5 p-2.5 bg-white border border-surface-100 rounded-xl hover:border-surface-200 transition-colors">
                {merchant.logo_url ? (
                  <img src={merchant.logo_url} alt={merchant.name} className="w-9 h-9 rounded-lg object-contain border border-surface-100 p-0.5 bg-white shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center text-sm font-bold text-surface-400 shrink-0">
                    {merchant.name?.charAt(0)}
                  </div>
                )}
                <Link href={`/m/${merchant.slug}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">{merchant.name}</p>
                  <p className="text-xs text-surface-400">활성 딜 {merchant.active_deal_count || 0}개</p>
                </Link>
                <button
                  onClick={() => handleUnfollow(merchant.id)}
                  className="shrink-0 px-2.5 py-1.5 text-xs text-surface-500 border border-surface-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                  해제
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 추천 브랜드 */}
      <FollowsRecommendSection
        excludeIds={follows.map((f: any) => f.merchants?.id).filter(Boolean)}
        onFollow={() => fetchFollows()}
      />
    </div>
  );
}

// --- 구독 탭 내 추천 브랜드 (구독 시 자동 리프레시) ---
function FollowsRecommendSection({ excludeIds, onFollow }: { excludeIds: string[]; onFollow: () => void }) {
  const { showToast } = useAuth();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(excludeIds));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFollowedIds(new Set(excludeIds));
  }, [excludeIds]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/merchants?active_deal_count=gt.0&order=active_deal_count.desc&limit=12&select=id,name,slug,logo_url,active_deal_count,brand_color`,
          { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' } }
        );
        const data = await res.json();
        if (Array.isArray(data)) setMerchants(data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleFollow = async (merchantId: string, merchantName: string) => {
    try {
      if (followedIds.has(merchantId)) {
        await fetch(`/api/me/follows/merchants?merchant_id=${merchantId}`, { method: 'DELETE' });
        setFollowedIds(prev => { const n = new Set(prev); n.delete(merchantId); return n; });
        showToast(`${merchantName} 구독 해제`, 'info');
      } else {
        const res = await fetch('/api/me/follows/merchants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant_id: merchantId }),
        });
        if (res.ok || res.status === 409) {
          setFollowedIds(prev => new Set([...prev, merchantId]));
          showToast(`${merchantName} 구독 완료!`, 'success');
        }
      }
      onFollow(); // 상위 구독 목록 리프레시
    } catch { /* ignore */ }
  };

  // 이미 구독한 브랜드 필터링
  const filtered = merchants.filter(m => !followedIds.has(m.id));

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <div className="h-5 w-32 bg-surface-100 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-surface-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) return null;

  return (
    <div className="bg-surface-50 rounded-xl border border-surface-100 p-4">
      <h3 className="text-sm font-semibold text-surface-600 mb-1 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        이런 브랜드는 어때요?
      </h3>
      <p className="text-xs text-surface-400 mb-3">
        인기 브랜드를 구독하고 새 딜 알림을 받아보세요
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.slice(0, 8).map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-surface-100 hover:border-surface-200 transition-colors">
            {m.logo_url ? (
              <img src={m.logo_url} alt={m.name} className="w-9 h-9 rounded-lg object-contain border border-surface-100 p-0.5 bg-white shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: m.brand_color || '#94a3b8' }}>
                {m.name?.charAt(0)}
              </div>
            )}
            <Link href={`/m/${m.slug}`} className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">{m.name}</p>
              <p className="text-[11px] text-surface-400">딜 {m.active_deal_count}개</p>
            </Link>
            <button
              onClick={() => handleFollow(m.id, m.name)}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-primary-50 text-primary-500 hover:bg-primary-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <Link
        href="/search"
        className="flex items-center justify-center gap-1 mt-3 py-2 text-xs text-surface-400 hover:text-surface-600 transition-colors"
      >
        더 많은 브랜드 보기 <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// --- 설정 탭 ---
function SettingsTab({ profile, user, onRefresh }: {
  profile: any; user: any; onRefresh: () => Promise<void>;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // ✅ 전체 프로필 조회 (AuthProvider가 제공하지 않는 필드 포함)
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!user?.id) { setProfileLoading(false); return; }
      try {
        // ✅ 서버사이드 API로 조회 (createClient() auth lock 우회)
        const res = await fetch('/api/me/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) setFullProfile(data.profile);
        }
      } catch { /* ignore */ }
      setProfileLoading(false);
    };
    fetchFullProfile();
  }, [user?.id]);

  const supabase = createClient();

  // 비밀번호 재설정 이메일 발송
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setPasswordResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/me`,
      });
      if (!error) {
        setPasswordResetSent(true);
      }
    } catch { /* ignore */ }
    finally { setPasswordResetLoading(false); }
  };

  // 계정 탈퇴
  const [withdrawReason, setWithdrawReason] = useState('');
  // ✅ 탈퇴 요청 완료 상태 (API 성공 후 즉시 UI 반영)
  const [withdrawRequested, setWithdrawRequested] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/me/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: withdrawReason }),
      });
      if (res.ok) {
        // ✅ 페이지 이동 대신 상태만 변경 (세션 유지)
        setWithdrawRequested(true);
        setShowDeleteConfirm(false);
      } else {
        const data = await res.json();
        alert(data.error || '탈퇴 요청 중 오류가 발생했습니다.');
      }
    } catch {
      alert('탈퇴 요청 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // SNS 연동 여부 판별
  const linkedProviders: string[] = fullProfile?.linked_providers || [];
  const currentProvider = fullProfile?.provider || '';
  const isLinked = (provider: string) =>
    linkedProviders.includes(provider) || currentProvider === provider;

  // ✅ 탈퇴 대기 상태 판별 (DB에서 가져온 값 또는 방금 요청한 값)
  const isPendingWithdrawal = fullProfile?.status === 'pending_withdrawal' || withdrawRequested;

  return (
    <div className="space-y-5">
      {/* ✅ 탈퇴 심사 중 안내 배너 */}
      {isPendingWithdrawal && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700">
                탈퇴 요청이 접수되었습니다
              </p>
              <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                관리자 승인 후 탈퇴가 완료됩니다. 승인 전까지 서비스를 정상적으로 이용하실 수 있으며,
                탈퇴를 취소하시려면 고객센터로 문의해주세요.
              </p>
              {fullProfile?.withdrawn_at && (
                <p className="text-[11px] text-amber-500 mt-2">
                  요청일: {new Date(fullProfile.withdrawn_at).toLocaleDateString('ko-KR')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ 내 정보 섹션 */}
      <ProfileInfoSection
        fullProfile={fullProfile}
        user={user}
        loading={profileLoading}
      />

      {/* 관심 카테고리 */}
      <InterestCategoriesSection profile={profile} onRefresh={onRefresh} userId={user?.id} />

      {/* 추천 브랜드 구독 */}
      <RecommendedBrandsSection userId={user?.id} />

      {/* 비밀번호 변경 — 이메일 가입자만 표시 */}
      {(!currentProvider || currentProvider === 'email') && (
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            비밀번호 변경
          </h3>
          {passwordResetSent ? (
            <p className="text-sm text-green-600">
              비밀번호 재설정 이메일을 발송했습니다. 메일함을 확인해주세요.
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-700">{user?.email}</p>
                <p className="text-xs text-surface-400">이메일로 재설정 링크를 보내드립니다</p>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={passwordResetLoading}
                className="px-3 py-1.5 text-xs text-primary-500 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
              >
                {passwordResetLoading ? '발송 중...' : '변경하기'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ✅ SNS 연동 — 실제 연동 상태 반영 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          소셜 계정 연동
        </h3>
        <div className="space-y-3">
          <SNSLinkItem name="카카오" color="#FEE500" textColor="#191919" linked={isLinked('kakao')} />
          <SNSLinkItem name="네이버" color="#03C75A" textColor="#fff" linked={isLinked('naver')} />
          <SNSLinkItem name="Apple" color="#000" textColor="#fff" linked={isLinked('apple')} />
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

      {/* 마케팅 동의 — ✅ 실제 DB 저장 */}
      <MarketingConsentSection
        defaultOn={fullProfile?.marketing_agreed ?? profile?.marketing_agreed ?? false}
        userId={user?.id}
      />

      {/* 계정 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4">계정</h3>

        {/* ✅ 이미 탈퇴 대기 중이면 재요청 차단 */}
        {isPendingWithdrawal ? (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <Clock className="w-4 h-4" />
            탈퇴 심사 중입니다
          </div>
        ) : !showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-500 hover:text-red-600 font-medium"
          >
            회원 탈퇴
          </button>
        ) : (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">
                  정말 탈퇴하시겠습니까?
                </p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">
                  탈퇴 요청은 관리자 승인 후 처리됩니다.
                  승인 전까지 서비스를 정상적으로 이용하실 수 있습니다.
                </p>

                <select
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full mt-3 px-3 py-2 text-xs border border-red-200 rounded-lg bg-white text-surface-700 focus:outline-none"
                >
                  <option value="">탈퇴 사유를 선택해주세요 (선택)</option>
                  <option value="no_use">더 이상 사용하지 않아서</option>
                  <option value="no_deals">원하는 딜이 없어서</option>
                  <option value="too_many_notifications">알림이 너무 많아서</option>
                  <option value="privacy">개인정보 우려</option>
                  <option value="other">기타</option>
                </select>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {deleteLoading ? '처리 중...' : '탈퇴 요청'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-xs font-medium text-surface-600 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- ✅ 내 정보 섹션 (네이버 검수용 + 실제 프로필 표시) ---
function ProfileInfoSection({ fullProfile, user, loading }: {
  fullProfile: any; user: any; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <div className="h-5 w-24 bg-surface-100 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-5 bg-surface-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const avatarUrl = user?.user_metadata?.avatar_url || fullProfile?.avatar_url;
  const providerLabel = getProviderLabel(fullProfile?.provider);

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-5">
      <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
        <User className="w-4 h-4" />
        내 정보
      </h3>

      {/* 프로필 사진 */}
      <div className="flex justify-center mb-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="프로필 사진"
            className="w-20 h-20 rounded-full object-cover border-2 border-surface-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center">
            <Camera className="w-8 h-8 text-surface-300" />
          </div>
        )}
      </div>

      {/* 정보 행 */}
      <div className="space-y-0 divide-y divide-surface-100">
        <ProfileInfoRow label="이름" value={fullProfile?.name} />
        <ProfileInfoRow label="닉네임" value={fullProfile?.nickname} />
        <ProfileInfoRow label="이메일" value={user?.email} />
        <ProfileInfoRow label="성별" value={fullProfile?.gender} />
        <ProfileInfoRow label="생년월일" value={fullProfile?.birth_date} />
        <ProfileInfoRow label="연락처" value={fullProfile?.phone} />
        {providerLabel && (
          <ProfileInfoRow label="로그인 방법" value={providerLabel} />
        )}
      </div>

      <p className="text-[11px] text-surface-400 mt-4 leading-relaxed">
        SNS 로그인 시 동의한 정보가 표시됩니다. 정보 수정은 해당 SNS 계정에서 변경 후 재로그인하면 반영됩니다.
      </p>
    </div>
  );
}

function ProfileInfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-surface-500">{label}</span>
      <span className={`text-sm font-medium ${value ? 'text-surface-800' : 'text-surface-300'}`}>
        {value || '미설정'}
      </span>
    </div>
  );
}

function getProviderLabel(provider?: string): string {
  switch (provider) {
    case 'kakao': return '카카오';
    case 'naver': return '네이버';
    case 'apple': return 'Apple';
    case 'email': return '이메일';
    default: return '';
  }
}

// --- 관심 카테고리 편집 ---
function InterestCategoriesSection({ profile, onRefresh, userId }: { profile: any; onRefresh: () => Promise<void>; userId?: string }) {
  const { showToast } = useAuth();
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selected, setSelected] = useState<string[]>(profile?.interest_categories || []);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/categories?depth=eq.0&is_active=eq.true&order=sort_order&select=id,name,slug`, {
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const original = profile?.interest_categories || [];
    const changed = selected.length !== original.length || selected.some((id: string) => !original.includes(id));
    setHasChanges(changed);
  }, [selected, profile?.interest_categories]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').update({ interest_categories: selected }).eq('id', session.user.id);
        await onRefresh();
        showToast('관심 카테고리가 저장되었습니다', 'success');
        setHasChanges(false);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-5">
      <h3 className="font-semibold text-surface-900 mb-1 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        관심 카테고리
      </h3>
      <p className="text-xs text-surface-400 mb-4">
        선택한 카테고리의 새로운 딜 알림을 받을 수 있어요
      </p>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isSelected = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              className={`
                inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'bg-surface-50 text-surface-500 border border-surface-200 hover:border-surface-300'
                }
              `}
            >
              <span className={isSelected ? 'text-primary-500' : 'text-surface-400'}>
                {CATEGORY_ICONS[cat.slug] || <LayoutGrid className="w-4 h-4" />}
              </span>
              {cat.name}
              {isSelected && <Check className="w-3.5 h-3.5 text-primary-500" />}
            </button>
          );
        })}
      </div>

      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '변경사항 저장'}
        </button>
      )}
    </div>
  );
}

// --- 추천 브랜드 구독 ---
function RecommendedBrandsSection({ userId }: { userId?: string }) {
  const { showToast } = useAuth();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/merchants?active_deal_count=gt.0&order=active_deal_count.desc&limit=12&select=id,name,slug,logo_url,active_deal_count,brand_color`, {
          headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }
        });
        const merchantData = await res.json();
        if (Array.isArray(merchantData)) setMerchants(merchantData);
      } catch { /* ignore */ }

      try {
        // 구독 목록
        const res = await fetch('/api/me/follows/merchants');
        if (res.ok) {
          const data = await res.json();
          const ids = new Set<string>(
            (data.followedMerchants || [])
              .map((f: any) => f.merchants?.id)
              .filter(Boolean)
          );
          setFollowedIds(ids);
        }
      } catch { /* ignore */ }

      setLoading(false);
    };
    load();
  }, []);

  const toggleFollow = async (merchantId: string, merchantName: string) => {
    try {
      if (followedIds.has(merchantId)) {
        await fetch(`/api/me/follows/merchants?merchant_id=${merchantId}`, { method: 'DELETE' });
        setFollowedIds(prev => { const n = new Set(prev); n.delete(merchantId); return n; });
      } else {
        await fetch('/api/me/follows/merchants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant_id: merchantId }),
        });
        setFollowedIds(prev => new Set([...prev, merchantId]));
        showToast(`${merchantName} 구독 완료`, 'success');
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <div className="h-5 w-32 bg-surface-100 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-surface-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-5">
      <h3 className="font-semibold text-surface-900 mb-1 flex items-center gap-2">
        <Store className="w-4 h-4" />
        인기 브랜드 구독
      </h3>
      <p className="text-xs text-surface-400 mb-4">
        브랜드를 구독하면 새로운 할인이 올라올 때 알려드려요
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {merchants.map((m) => {
          const isFollowed = followedIds.has(m.id);
          return (
            <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-surface-100 hover:border-surface-200 transition-colors">
              {m.logo_url ? (
                <img
                  src={m.logo_url}
                  alt={m.name}
                  className="w-9 h-9 rounded-lg object-contain border border-surface-100 p-0.5 bg-white flex-shrink-0"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: m.brand_color || '#94a3b8' }}
                >
                  {m.name?.charAt(0)}
                </div>
              )}
              <Link href={`/m/${m.slug}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{m.name}</p>
                <p className="text-[11px] text-surface-400">딜 {m.active_deal_count}개</p>
              </Link>
              <button
                onClick={() => toggleFollow(m.id, m.name)}
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isFollowed
                    ? 'bg-primary-50 text-primary-500'
                    : 'bg-surface-50 text-surface-400 hover:bg-surface-100'
                }`}
              >
                {isFollowed ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>

      <Link
        href="/search"
        className="flex items-center justify-center gap-1 mt-3 py-2 text-xs text-surface-400 hover:text-surface-600 transition-colors"
      >
        더 많은 브랜드 보기 <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// --- ✅ 마케팅 동의 (실제 DB 저장) ---
function MarketingConsentSection({ defaultOn, userId }: { defaultOn: boolean; userId?: string }) {
  const { showToast } = useAuth();
  const [on, setOn] = useState(defaultOn);
  const [saving, setSaving] = useState(false);

  // fullProfile 로딩 후 값이 바뀌면 동기화
  useEffect(() => { setOn(defaultOn); }, [defaultOn]);

  const handleToggle = async () => {
    if (!userId) return;
    const newValue = !on;
    setOn(newValue); // 즉시 UI 반영
    setSaving(true);

    try {
      const supabase = createClient();
      const updateData: any = {
        marketing_agreed: newValue,
      };
      // 동의 시 동의 시각 기록, 철회 시 null
      if (newValue) {
        updateData.marketing_agreed_at = new Date().toISOString();
      } else {
        updateData.marketing_agreed_at = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        setOn(!newValue); // 실패 시 롤백
        showToast('저장 실패', 'error');
      } else {
        showToast(newValue ? '마케팅 수신에 동의했습니다' : '마케팅 수신을 철회했습니다', 'success');
      }
    } catch {
      setOn(!newValue); // 실패 시 롤백
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-5">
      <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4" />
        마케팅 동의
      </h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-surface-700">마케팅 정보 수신 동의</p>
          <p className="text-xs text-surface-400">할인/프로모션 관련 마케팅 정보를 받습니다</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`w-10 h-6 rounded-full transition-colors relative ${on ? 'bg-primary-500' : 'bg-surface-200'} ${saving ? 'opacity-50' : ''}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'left-5' : 'left-1'}`} />
        </button>
      </div>
      <p className="text-xs text-surface-400 mt-3">
        동의를 철회하면 마케팅 관련 알림이 즉시 중단됩니다.
      </p>
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
        <span className="text-xs text-surface-400 font-medium">
          준비 중
        </span>
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
