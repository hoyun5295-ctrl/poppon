// ===========================================
// POPPON 행동 추적 유틸 v3
// - user_id: 서버가 쿠키 세션에서 100% 추출 (클라이언트 전송 안 함)
// - 전송: fetch + keepalive (페이지 이탈에도 전송 보장)
// - sendBeacon: fetch 실패 시 fallback
// - fire-and-forget: UI 절대 블로킹 안 함
// ===========================================

import type { DealActionType } from '@/types';

// --- Session ID 관리 (쿠키 기반) ---

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

const SESSION_COOKIE = 'ppn_sid';
const SESSION_DAYS = 30;

export function getSessionId(): string {
  let sid = getCookie(SESSION_COOKIE);
  if (!sid) {
    sid = generateSessionId();
    setCookie(SESSION_COOKIE, sid, SESSION_DAYS);
  }
  return sid;
}

// --- setTrackingUserId (AuthProvider 호환 — 호출해도 무해) ---

// AuthProvider에서 여전히 호출하므로 인터페이스 유지 (실제 사용 안 함)
export function setTrackingUserId(_userId: string | null): void {
  // v3: user_id는 서버에서 쿠키 세션으로 추출하므로 클라이언트 저장 불필요
  // AuthProvider 호환성을 위해 함수만 유지
}

export function getTrackingUserId(): string | null {
  return null;
}

// --- 전송 함수 (fetch + keepalive → sendBeacon fallback) ---

function sendPayload(url: string, payload: string): void {
  // 1차: fetch + keepalive + credentials (쿠키 전달 보장)
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // 2차: fetch 실패 시 sendBeacon fallback (페이지 이탈 등)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    }
  });
}

// --- 행동 추적 API 호출 ---

interface TrackActionParams {
  dealId: string;
  actionType: DealActionType;
}

/**
 * 딜 액션을 서버에 기록 (fire-and-forget)
 * UI를 절대 블로킹하지 않음
 * user_id는 서버가 쿠키 세션에서 자동 추출
 */
export function trackAction({ dealId, actionType }: TrackActionParams): void {
  const sessionId = getSessionId();

  const payload = JSON.stringify({
    deal_id: dealId,
    action_type: actionType,
    session_id: sessionId,
  });

  sendPayload('/api/actions', payload);
}

// --- 검색 추적 ---

/**
 * 검색 로그 기록 (fire-and-forget)
 * user_id는 서버가 쿠키 세션에서 자동 추출
 */
export function trackSearch(query: string, categorySlug?: string, resultCount?: number): void {
  const sessionId = getSessionId();

  const payload = JSON.stringify({
    query,
    session_id: sessionId,
    category_slug: categorySlug,
    result_count: resultCount,
  });

  sendPayload('/api/actions/search', payload);
  hanjulTrack('search', { search_term: query });
}

// --- 한줄로 SDK 브리지 (window.hjl.track 위임 — 미로드/실패 시 무해, 호스트 동작 무방해) ---

/** 한줄로 SDK로 이벤트 전송. 표준명/custom_ 검증은 SDK가 담당. */
function hanjulTrack(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    (window as unknown as { hjl?: { track?: (e: string, p?: Record<string, unknown>) => void } }).hjl?.track?.(event, properties || {});
  } catch {
    /* 무해 */
  }
}

// --- 편의 함수 (팝폰 자체 추적 + 한줄로 SDK 병행) ---

export function trackDealView(dealId: string, meta?: { name?: string; category?: string }): void {
  trackAction({ dealId, actionType: 'view' });
  hanjulTrack('product_view', {
    product_id: dealId,
    ...(meta?.name ? { product_name: meta.name } : {}),
    ...(meta?.category ? { category: meta.category } : {}),
  });
}

export function trackCopyCode(dealId: string, code: string): void {
  trackAction({ dealId, actionType: 'copy_code' });
  hanjulTrack('custom_copy_code', { product_id: dealId });
}

export function trackClickOut(dealId: string): void {
  trackAction({ dealId, actionType: 'click_out' });
  hanjulTrack('custom_click_out', { product_id: dealId });
}

export function trackDealSave(dealId: string): void {
  trackAction({ dealId, actionType: 'save' });
  hanjulTrack('wishlist_add', { product_id: dealId });
}

export function trackDealShare(dealId: string): void {
  trackAction({ dealId, actionType: 'share' });
  hanjulTrack('custom_share', { product_id: dealId });
}

/** 찜 추가/해제 — DealActionBar(트래킹 함수 미경유)용 한줄로 SDK 직접 배선 */
export function trackWishlist(dealId: string, added: boolean): void {
  hanjulTrack(added ? 'wishlist_add' : 'wishlist_remove', { product_id: dealId });
}

/** 브랜드 구독/해제 — DealActionBar용 */
export function trackFollowMerchant(merchantId: string, followed: boolean): void {
  hanjulTrack('custom_follow_merchant', { merchant_id: merchantId, followed });
}
