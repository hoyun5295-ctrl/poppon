// ===========================================
// POPPON 행동 추적 유틸
// 비로그인: session_id (쿠키 30일)
// 로그인: user_id (추후 연동)
// ===========================================

import type { DealActionType } from '@/types';

// --- Session ID 관리 (쿠키 기반) ---

function generateSessionId(): string {
  // 랜덤 UUID v4 생성
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback
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

// --- 행동 추적 API 호출 ---

interface TrackActionParams {
  dealId: string;
  actionType: DealActionType;
  metadata?: Record<string, unknown>;
}

/**
 * 딜 액션을 서버에 기록 (fire-and-forget)
 * UI를 절대 블로킹하지 않음
 */
export function trackAction({ dealId, actionType, metadata }: TrackActionParams): void {
  const sessionId = getSessionId();

  // navigator.sendBeacon 우선 사용 (페이지 이탈 시에도 전송 보장)
  const payload = JSON.stringify({
    deal_id: dealId,
    action_type: actionType,
    session_id: sessionId,
    metadata,
  });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    const sent = navigator.sendBeacon('/api/actions', blob);
    if (sent) return;
  }

  // fallback: fetch (fire-and-forget)
  fetch('/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // 실패해도 무시 — 사용자 경험에 영향 없음
  });
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
