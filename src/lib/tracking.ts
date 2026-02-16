// ===========================================
// POPPON 행동 추적 유틸
// 비로그인: session_id (쿠키 30일)
// 로그인: session_id + user_id
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

// --- User ID 관리 (AuthProvider에서 주입) ---

let _userId: string | null = null;

/**
 * AuthProvider에서 로그인/로그아웃 시 호출
 * → 이후 모든 trackAction에 user_id가 자동 포함됨
 */
export function setTrackingUserId(userId: string | null): void {
  _userId = userId;
}

export function getTrackingUserId(): string | null {
  return _userId;
}

// --- 행동 추적 API 호출 ---

interface TrackActionParams {
  dealId: string;
  actionType: DealActionType;
  metadata?: Record<string, unknown>;
}

/**
 * 딜 액션을 서버에 기록 (fire-and-forget)
 * UI를 절대 블로킹하지 않음
 * 로그인 상태면 user_id 자동 포함
 */
export function trackAction({ dealId, actionType, metadata }: TrackActionParams): void {
  const sessionId = getSessionId();

  const payload = JSON.stringify({
    deal_id: dealId,
    action_type: actionType,
    session_id: sessionId,
    user_id: _userId,
    metadata,
  });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    const sent = navigator.sendBeacon('/api/actions', blob);
    if (sent) return;
  }

  fetch('/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // 실패해도 무시
  });
}

// --- 검색 추적 ---

/**
 * 검색 로그 기록 (fire-and-forget)
 */
export function trackSearch(query: string, categorySlug?: string, resultCount?: number): void {
  const sessionId = getSessionId();

  const payload = JSON.stringify({
    query,
    session_id: sessionId,
    user_id: _userId,
    category_slug: categorySlug,
    result_count: resultCount,
  });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    const sent = navigator.sendBeacon('/api/actions/search', blob);
    if (sent) return;
  }

  fetch('/api/actions/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

// --- 편의 함수 ---

export function trackDealView(dealId: string): void {
  trackAction({ dealId, actionType: 'view' });
}

export function trackCopyCode(dealId: string, code: string): void {
  trackAction({ dealId, actionType: 'copy_code', metadata: { code } });
}

export function trackClickOut(dealId: string): void {
  trackAction({ dealId, actionType: 'click_out' });
}

export function trackDealSave(dealId: string): void {
  trackAction({ dealId, actionType: 'save' });
}

export function trackDealShare(dealId: string): void {
  trackAction({ dealId, actionType: 'share' });
}
