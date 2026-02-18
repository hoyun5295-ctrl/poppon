// ===========================================
// POPPON 행동 추적 유틸
// 비로그인: session_id (쿠키 30일)
// 로그인: session_id + user_id
// ===========================================
// ✅ v2: auth readiness 큐 시스템
//    - AuthProvider 초기화 전 trackAction 호출 시 큐에 대기
//    - setTrackingUserId() 호출 시점에 큐 flush (user_id 포함)
//    - 3초 안전장치 타임아웃 (auth 실패해도 null로 전송)
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

// --- Auth Readiness 큐 시스템 ---

let _userId: string | null = null;
let _authReady = false;

interface QueuedAction {
  type: 'action';
  payload: { dealId: string; actionType: DealActionType; metadata?: Record<string, unknown> };
}

interface QueuedSearch {
  type: 'search';
  payload: { query: string; categorySlug?: string; resultCount?: number };
}

type QueuedItem = QueuedAction | QueuedSearch;

const _queue: QueuedItem[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

// 안전장치: 3초 후 auth 미완료면 null로라도 전송
const AUTH_TIMEOUT_MS = 3000;

function startFlushTimer(): void {
  if (_flushTimer) return;
  _flushTimer = setTimeout(() => {
    if (!_authReady) {
      _authReady = true;
      flushQueue();
    }
  }, AUTH_TIMEOUT_MS);
}

function flushQueue(): void {
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }

  while (_queue.length > 0) {
    const item = _queue.shift()!;
    if (item.type === 'action') {
      sendAction(item.payload);
    } else {
      sendSearch(item.payload);
    }
  }
}

/**
 * AuthProvider에서 로그인/로그아웃 시 호출
 * → 큐에 대기 중이던 액션들을 user_id 포함하여 flush
 */
export function setTrackingUserId(userId: string | null): void {
  _userId = userId;
  _authReady = true;
  flushQueue();
}

export function getTrackingUserId(): string | null {
  return _userId;
}

// --- 실제 전송 함수 ---

function sendAction({ dealId, actionType, metadata }: {
  dealId: string;
  actionType: DealActionType;
  metadata?: Record<string, unknown>;
}): void {
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
  }).catch(() => {});
}

function sendSearch({ query, categorySlug, resultCount }: {
  query: string;
  categorySlug?: string;
  resultCount?: number;
}): void {
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

// --- 행동 추적 API 호출 ---

interface TrackActionParams {
  dealId: string;
  actionType: DealActionType;
  metadata?: Record<string, unknown>;
}

/**
 * 딜 액션을 서버에 기록 (fire-and-forget)
 * UI를 절대 블로킹하지 않음
 * ✅ auth 미초기화 시 큐에 대기 → setTrackingUserId 호출 시 flush
 */
export function trackAction({ dealId, actionType, metadata }: TrackActionParams): void {
  if (_authReady) {
    sendAction({ dealId, actionType, metadata });
  } else {
    _queue.push({ type: 'action', payload: { dealId, actionType, metadata } });
    startFlushTimer();
  }
}

// --- 검색 추적 ---

/**
 * 검색 로그 기록 (fire-and-forget)
 * ✅ auth 미초기화 시 큐에 대기
 */
export function trackSearch(query: string, categorySlug?: string, resultCount?: number): void {
  if (_authReady) {
    sendSearch({ query, categorySlug, resultCount });
  } else {
    _queue.push({ type: 'search', payload: { query, categorySlug, resultCount } });
    startFlushTimer();
  }
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
