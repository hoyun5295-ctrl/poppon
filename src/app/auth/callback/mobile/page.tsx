// poppon 웹: src/app/auth/callback/mobile/page.tsx
// 모바일 앱 OAuth 콜백 중간 페이지
// Supabase가 여기로 리다이렉트 → 토큰 추출 → 앱 딥링크로 전달

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function MobileCallbackContent() {
  const searchParams = useSearchParams();
  const [appUrl, setAppUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [autoRedirected, setAutoRedirected] = useState(false);

  useEffect(() => {
    // URL에서 토큰 추출 (hash fragment 또는 query params)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash ? hash.substring(1) : window.location.search);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const code = params.get('code');
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam) {
      setError(errorDescription || errorParam);
      return;
    }

    // 앱 딥링크 URL 구성
    let deepLink = '';

    if (accessToken && refreshToken) {
      // implicit flow: 토큰 직접 전달
      deepLink = `poppon://auth/callback#access_token=${accessToken}&refresh_token=${refreshToken}`;
    } else if (code) {
      // PKCE flow: code 전달
      deepLink = `poppon://auth/callback?code=${code}`;
    }

    // Expo Go 개발용 URL도 시도
    // exp:// 스킴은 Expo Go에서 사용
    const expDeepLink = deepLink.replace('poppon://', 'exp://192.168.219.116:8081/--/');

    if (deepLink) {
      setAppUrl(deepLink);

      // 자동 리다이렉트 시도 (iOS에서 안 될 수 있음)
      if (!autoRedirected) {
        setAutoRedirected(true);
        // 먼저 poppon:// 시도, 안 되면 exp:// 시도
        window.location.href = deepLink;
        setTimeout(() => {
          window.location.href = expDeepLink;
        }, 500);
      }
    } else {
      setError('인증 정보를 찾을 수 없습니다.');
    }
  }, []);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '20px',
        fontFamily: 'Pretendard, sans-serif',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
          로그인 오류
        </h2>
        <p style={{ color: '#999', marginBottom: '24px' }}>{error}</p>
        <a href="/" style={{
          backgroundColor: '#FF6B35', color: '#fff', padding: '12px 32px',
          borderRadius: '8px', textDecoration: 'none', fontWeight: '600',
        }}>
          홈으로
        </a>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: 'Pretendard, sans-serif',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        backgroundColor: '#FF6B35', display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
      }}>
        <span style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>P</span>
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
        로그인 성공!
      </h2>
      <p style={{ color: '#999', marginBottom: '32px' }}>
        아래 버튼을 눌러 앱으로 돌아가세요
      </p>

      {/* 프로덕션: poppon:// */}
      <a
        href={appUrl}
        style={{
          backgroundColor: '#FF6B35', color: '#fff', padding: '16px 48px',
          borderRadius: '12px', textDecoration: 'none', fontWeight: '700',
          fontSize: '16px', display: 'block', textAlign: 'center',
          marginBottom: '12px', width: '100%', maxWidth: '300px',
        }}
      >
        앱으로 돌아가기
      </a>

      {/* Expo Go 개발용 */}
      <a
        href={appUrl.replace('poppon://', 'exp://192.168.219.116:8081/--/')}
        style={{
          backgroundColor: '#eee', color: '#666', padding: '12px 48px',
          borderRadius: '12px', textDecoration: 'none', fontWeight: '600',
          fontSize: '14px', display: 'block', textAlign: 'center',
          width: '100%', maxWidth: '300px',
        }}
      >
        Expo Go로 돌아가기 (개발용)
      </a>
    </div>
  );
}

export default function MobileCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p>로그인 처리 중...</p>
      </div>
    }>
      <MobileCallbackContent />
    </Suspense>
  );
}
