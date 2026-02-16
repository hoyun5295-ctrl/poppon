'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
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
        // 약간의 딜레이로 페이지 렌더 후 표시
        setTimeout(() => showToast(message, type), 300);
      }
    } catch { /* ignore */ }
  }, [showToast]);

  // 프로필 조회
  const fetchProfile = useCallback(async (userId: string) => {
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
      return;
    }

    setProfile(data);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // 초기 세션 확인 + 리스너
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setTrackingUserId(currentSession?.user?.id ?? null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      }
      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setTrackingUserId(newSession?.user?.id ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }

        // ※ SIGNED_IN 시 자동으로 AuthSheet을 닫지 않음
        // → 회원가입 온보딩 플로우(본인인증 → 카테고리 → 마케팅)를
        //   AuthSheet 내부에서 제어하기 위함
        // → AuthSheet.handleLogin()에서 로그인 성공 시 직접 closeAuthSheet() 호출
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setTrackingUserId(null);
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
