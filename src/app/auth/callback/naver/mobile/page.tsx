// src/app/auth/callback/naver/mobile/page.tsx
// 네이버 OAuth 앱용 중간 페이지
// 흐름: 네이버 로그인 → 여기로 리다이렉트(?code=xxx) → 서버 API로 토큰 교환 → 앱으로 딥링크

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function NaverMobileCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <p style={{ fontSize: 16, color: '#999' }}>로딩 중...</p>
      </div>
    }>
      <NaverMobileCallbackContent />
    </Suspense>
  );
}

function NaverMobileCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [deepLink, setDeepLink] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg('네이버 로그인이 취소되었습니다.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('인증 코드가 없습니다.');
      return;
    }

    // 서버 API로 code → Supabase 세션 토큰 교환
    (async () => {
      try {
        const redirectUri = 'https://poppon.vercel.app/auth/callback/naver/mobile';

        const response = await fetch('/api/auth/naver/mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: redirectUri }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `서버 오류: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.access_token && data.refresh_token) {
          // 앱 딥링크 생성 (카카오 중간 페이지와 동일한 패턴)
          const fragment = `access_token=${data.access_token}&refresh_token=${data.refresh_token}&provider=naver`;

          // Expo Go 개발용 + 프로덕션 빌드용 딥링크
          const expoLink = `exp://192.168.219.116:8081/--/auth/callback#${fragment}`;
          const prodLink = `poppon://auth/callback#${fragment}`;

          setDeepLink(prodLink);
          setStatus('success');

          // 자동 리다이렉트 시도 (프로덕션에서는 poppon:// 자동 열림)
          window.location.href = prodLink;

          // 1초 후 Expo Go 링크도 시도
          setTimeout(() => {
            window.location.href = expoLink;
          }, 1000);
        } else {
          throw new Error('세션 토큰을 받지 못했습니다.');
        }
      } catch (err: any) {
        console.error('[NaverMobileCallback] Error:', err);
        setStatus('error');
        setErrorMsg(err.message || '로그인 처리 중 오류가 발생했습니다.');
      }
    })();
  }, [searchParams]);

  // Expo Go 딥링크 (개발 환경)
  const expoDeepLink = deepLink.replace('poppon://', 'exp://192.168.219.116:8081/--/');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '24px',
      backgroundColor: '#f9fafb',
    }}>
      {status === 'loading' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid #e5e7eb',
            borderTopColor: '#03C75A', borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
            네이버 로그인 처리 중...
          </p>
          <p style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
            잠시만 기다려주세요
          </p>
        </div>
      )}

      {status === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: '#03C75A', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 32, color: '#fff',
          }}>
            ✓
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 8 }}>
            로그인 성공!
          </p>
          <p style={{ fontSize: 14, color: '#999', marginBottom: 32 }}>
            앱으로 자동 이동합니다. 이동하지 않으면 아래 버튼을 눌러주세요.
          </p>

          {/* 프로덕션 딥링크 */}
          <a
            href={deepLink}
            style={{
              display: 'block', backgroundColor: '#03C75A', color: '#fff',
              padding: '16px 32px', borderRadius: 12, fontSize: 16,
              fontWeight: 700, textDecoration: 'none', marginBottom: 12,
            }}
          >
            팝폰 앱으로 돌아가기
          </a>

          {/* Expo Go 개발용 */}
          <a
            href={expoDeepLink}
            style={{
              display: 'block', backgroundColor: '#666', color: '#fff',
              padding: '12px 24px', borderRadius: 8, fontSize: 14,
              fontWeight: 600, textDecoration: 'none',
            }}
          >
            Expo Go로 돌아가기 (개발용)
          </a>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: '#fee2e2', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 32, color: '#ef4444',
          }}>
            ✕
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 8 }}>
            로그인 실패
          </p>
          <p style={{ fontSize: 14, color: '#ef4444', marginBottom: 24 }}>
            {errorMsg}
          </p>
          <button
            onClick={() => window.close()}
            style={{
              backgroundColor: '#f3f4f6', color: '#333',
              padding: '12px 24px', borderRadius: 8, fontSize: 14,
              fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            창 닫기
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
