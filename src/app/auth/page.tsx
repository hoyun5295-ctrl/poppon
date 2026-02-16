'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Mail } from 'lucide-react';

function AuthContent() {
  const { isLoggedIn, isLoading, openAuthSheet, isAuthSheetOpen } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (!isLoading && isLoggedIn && !isAuthSheetOpen) {
      router.replace(redirect);
    }
  }, [isLoading, isLoggedIn, isAuthSheetOpen, redirect, router]);

  // 비로그인 시 자동으로 AuthSheet 열기
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      openAuthSheet();
    }
  }, [isLoading, isLoggedIn, openAuthSheet]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Mail className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-extrabold text-red-500">POPPON</h1>
        <p className="mt-2 text-sm text-gray-500">
          로그인하고 딜 저장, 브랜드 구독, 알림을 이용하세요
        </p>

        <button
          onClick={openAuthSheet}
          className="mt-6 w-full h-12 rounded-xl bg-red-500 text-white font-semibold
                     hover:bg-red-600 transition-colors"
        >
          로그인 / 회원가입
        </button>

        <p className="mt-4 text-xs text-gray-400">
          로그인 시{' '}
          <a href="/legal/terms" className="underline">이용약관</a> 및{' '}
          <a href="/legal/privacy" className="underline">개인정보처리방침</a>에 동의합니다.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
