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

  // ✅ 싱글톤 클라이언트 (client.ts + ref 이중 보장)
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // signOut 중복 방지
  const isSigningOutRef = useRef(false);
  // 프로필 fetch 중복 방지
  const fetchingProfileRef = useRef<string | null>(null);

  // 프로필 조회 (중복 호출 방지)
  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchingProfileRef.current === userId) return;
    fetchingProfileRef.current = userId;

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
      // 프로필 조회 실패 무시
    } finally {
      fetchingProfileRef.current = null;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // ✅ 핵심 수정: onAuthStateChange 하나만 사용
  // 이전: getSession() + onAuthStateChange = 이중 초기화 → 전체 리렌더 2번 → 느림+깜빡임
  // 수정: onAuthStateChange의 INITIAL_SESSION이 초기 세션 자동 전달
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        if (isSigningOutRef.current) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setTrackingUserId(newSession?.user?.id ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
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
      // 상태 먼저 초기화 (UI 즉시 반영)
      setUser(null);
      setProfile(null);
      setSession(null);
      setTrackingUserId(null);
      await supabase.auth.signOut();
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
