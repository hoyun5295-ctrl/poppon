'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { setTrackingUserId } from '@/lib/tracking';
import type { Profile } from '@/types';
import type { User, Session } from '@supabase/supabase-js';

// ── Toast ──
interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** 가입/로그인 필요 시 바텀시트 열기 */
  openAuthSheet: () => void;
  closeAuthSheet: () => void;
  isAuthSheetOpen: boolean;
  /** 인증이 필요한 액션 래퍼 - 비로그인 시 바텀시트 */
  requireAuth: (callback: () => void) => void;
  /** 토스트 */
  toast: ToastState;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOAST_STORAGE_KEY = 'poppon_pending_toast';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });

  const supabase = createClient();

  // ✅ 핵심: 프로필을 이미 로드한 userId를 추적 — 중복 호출 방지
  const profileLoadedForRef = useRef<string | null>(null);

  // ── Toast 함수 ──
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // 페이지 리로드 후 sessionStorage 토스트 복원 (로그아웃 등)
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(TOAST_STORAGE_KEY);
      if (pending) {
        sessionStorage.removeItem(TOAST_STORAGE_KEY);
        const { message, type } = JSON.parse(pending);
        setTimeout(() => showToast(message, type), 300);
      }
    } catch { /* ignore */ }
  }, [showToast]);

  // 프로필 조회
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 탈퇴한 계정이면 강제 로그아웃
      if (data?.status === 'withdrawn' || data?.status === 'banned') {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        profileLoadedForRef.current = null;
        return;
      }

      setProfile(data);
      profileLoadedForRef.current = userId;
    } catch {
      // 프로필 조회 실패 시 무시
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      profileLoadedForRef.current = null; // 강제 리프레시 허용
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // 초기 세션 확인 + 리스너
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setTrackingUserId(currentSession?.user?.id ?? null);
        setIsLoading(false);

        if (currentSession?.user) {
          fetchProfile(currentSession.user.id);
        }
      } catch {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // ✅ 핵심 수정: TOKEN_REFRESHED는 세션 갱신만, 프로필 재조회 안 함
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setTrackingUserId(newSession?.user?.id ?? null);

        if (newSession?.user) {
          // SIGNED_IN 또는 INITIAL_SESSION일 때만, 그리고 아직 이 유저 프로필을 안 불렀을 때만
          if (event !== 'TOKEN_REFRESHED' && profileLoadedForRef.current !== newSession.user.id) {
            await fetchProfile(newSession.user.id);
          }
        } else {
          setProfile(null);
          profileLoadedForRef.current = null;
        }

        // ※ SIGNED_IN 시 자동으로 AuthSheet을 닫지 않음
        // → 회원가입 온보딩 플로우를 AuthSheet 내부에서 제어하기 위함
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    setUser(null);
    setProfile(null);
    setSession(null);
    setTrackingUserId(null);
    profileLoadedForRef.current = null;
  };

  const openAuthSheet = () => setIsAuthSheetOpen(true);
  const closeAuthSheet = () => setIsAuthSheetOpen(false);

  const requireAuth = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      openAuthSheet();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isLoggedIn: !!user,
        signOut,
        refreshProfile,
        openAuthSheet,
        closeAuthSheet,
        isAuthSheetOpen,
        requireAuth,
        toast,
        showToast,
        hideToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** sessionStorage에 토스트 저장 (페이지 리로드 후 표시용) */
export function setPendingToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  try {
    sessionStorage.setItem(TOAST_STORAGE_KEY, JSON.stringify({ message, type }));
  } catch { /* ignore */ }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
