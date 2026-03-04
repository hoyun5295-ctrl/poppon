'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Eye, EyeOff, Check, AlertTriangle, ArrowLeft } from 'lucide-react';

/**
 * /auth/reset-password?token_hash=XXX&type=recovery
 * 
 * 비로그인 상태 비밀번호 재설정 페이지
 * 
 * 핵심: /auth/callback 경유 안 함 → recovery 세션 생성 안 함 → 기존 세션 영향 0
 * 
 * 플로우:
 * 1. 이메일 링크 클릭 → 이 페이지 도착 (token_hash, type 파라미터)
 * 2. 새 비밀번호 입력
 * 3. PATCH /api/auth/reset-password → 서버에서 verifyOtp + updateUserById
 * 4. 성공 → 로그인 안내
 */
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 토큰이 없으면 잘못된 접근
  if (!tokenHash || !type) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-surface-900">유효하지 않은 링크</h1>
        <p className="text-sm text-surface-500 mt-2 leading-relaxed">
          비밀번호 재설정 링크가 올바르지 않거나 만료되었습니다.<br />
          다시 요청해 주세요.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
        >
          로그인 페이지로
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError('');

    if (!password || !passwordConfirm) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_hash: tokenHash, type, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
    setLoading(false);
  };

  // ── 성공 화면 ──
  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-surface-900">비밀번호 변경 완료</h1>
        <p className="text-sm text-surface-500 mt-2 leading-relaxed">
          새 비밀번호로 로그인해 주세요.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  // ── 비밀번호 입력 폼 ──
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Link
        href="/auth"
        className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        로그인으로
      </Link>

      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-primary-500" />
          </div>
          <h1 className="text-xl font-bold text-surface-900">새 비밀번호 설정</h1>
          <p className="text-sm text-surface-500 mt-1.5">
            새로운 비밀번호를 입력해주세요.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">새 비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력해주세요"
                className="w-full px-4 h-12 rounded-xl border border-surface-200 text-sm pr-12
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">비밀번호 확인</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && password && passwordConfirm) handleSubmit(); }}
              placeholder="비밀번호를 다시 입력해주세요"
              className="w-full px-4 h-12 rounded-xl border border-surface-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            {passwordConfirm && password !== passwordConfirm && (
              <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !password || !passwordConfirm}
          className="w-full mt-6 h-12 rounded-xl bg-primary-500 text-white font-semibold
                     hover:bg-primary-600 disabled:bg-surface-200 disabled:text-surface-400 transition-colors"
        >
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </div>
    </div>
  );
}

// Next.js 15 필수: useSearchParams + Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
