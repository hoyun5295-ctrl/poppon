'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { setTrackingUserId } from '@/lib/tracking';
import type { Profile } from '@/types';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  openAuthSheet: () => void;
  closeAuthSheet: () => void;
  isAuthSheetOpen: boolean;
  requireAuth: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

  // ✅ 핵심 수정: supabase 클라이언트를 ref로 한 번만 생성
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // ✅ signOut 중복 방지 플래그
  const isSigningOutRef = useRef(false);

  // 프로필 조회 — supabase를 의존성에서 제거 (ref이므로 불변)
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data?.status === 'withdrawn' || data?.status === 'banned') {
        isSigningOutRef.current = true;
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        isSigningOutRef.current = false;
        return;
      }

      setProfile(data);
    } catch {
      // 프로필 조회 실패 시 무시 (신규 가입 직후 등)
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // 초기 세션 확인 + 리스너
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setTrackingUserId(currentSession?.user?.id ?? null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        }
      } catch {
        // 세션 조회 실패 시 비로그인 처리
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        // ✅ signOut 진행 중이면 무시 (무한루프 방지)
        if (isSigningOutRef.current) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setTrackingUserId(newSession?.user?.id ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    isSigningOutRef.current = true;
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      setTrackingUserId(null);
    } finally {
      isSigningOutRef.current = false;
    }
  }, [supabase]);

  const openAuthSheet = useCallback(() => setIsAuthSheetOpen(true), []);
  const closeAuthSheet = useCallback(() => setIsAuthSheetOpen(false), []);

  const requireAuth = useCallback((callback: () => void) => {
    if (user) {
      callback();
    } else {
      openAuthSheet();
    }
  }, [user, openAuthSheet]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
