'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Mail, ChevronRight, ChevronLeft, Eye, EyeOff,
  ShieldCheck, Check, Bell, MessageCircle, Sparkles,
  Shirt, UtensilsCrossed, Home, Plane, LayoutGrid
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';

type AuthStep = 'main' | 'signup' | 'login' | 'identity' | 'categories' | 'marketing';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: React.ReactNode;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fashion: <Shirt className="w-5 h-5" />,
  beauty: <Sparkles className="w-5 h-5" />,
  food: <UtensilsCrossed className="w-5 h-5" />,
  living: <Home className="w-5 h-5" />,
  travel: <Plane className="w-5 h-5" />,
  culture: <LayoutGrid className="w-5 h-5" />,
};

const REMEMBER_EMAIL_KEY = 'poppon_remember_email';

/**
 * AuthSheet — 가입/로그인 바텀시트
 *
 * 신규가입: main → signup → identity → categories → marketing → 완료
 * 로그인:   main → login → 완료
 */
export function AuthSheet() {
  const { isAuthSheetOpen, closeAuthSheet, refreshProfile, showToast } = useAuth();
  const [step, setStep] = useState<AuthStep>('main');

  // 회원가입 폼
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 아이디 저장
  const [rememberEmail, setRememberEmail] = useState(false);

  // 카테고리 선택
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 마케팅 동의
  const [marketingAll, setMarketingAll] = useState(false);
  const [marketingKakao, setMarketingKakao] = useState(false);
  const [marketingPush, setMarketingPush] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);

  // 공통
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  // 저장된 이메일 불러오기
  useEffect(() => {
    if (isAuthSheetOpen) {
      try {
        const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
        if (saved) {
          setEmail(saved);
          setRememberEmail(true);
        }
      } catch { /* ignore */ }
    }
  }, [isAuthSheetOpen]);

  // 카테고리 목록 로드
  useEffect(() => {
    if (step === 'categories' && categories.length === 0) {
      loadCategories();
    }
  }, [step]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('depth', 0)
      .eq('is_active', true)
      .order('sort_order');

    if (data) {
      setCategories(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: CATEGORY_ICONS[c.slug] || <LayoutGrid className="w-5 h-5" />,
        }))
      );
    }
  };

  // 마케팅 전체동의 토글
  useEffect(() => {
    if (marketingAll) {
      setMarketingKakao(true);
      setMarketingPush(true);
      setMarketingEmail(true);
    }
  }, [marketingAll]);

  useEffect(() => {
    if (marketingKakao && marketingPush && marketingEmail) {
      setMarketingAll(true);
    } else {
      setMarketingAll(false);
    }
  }, [marketingKakao, marketingPush, marketingEmail]);

  if (!isAuthSheetOpen) return null;

  // ── 이메일 회원가입 ──
  const handleSignup = async () => {
    if (!email || !password || !passwordConfirm) {
      setError('모든 항목을 입력해주세요');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('이미 가입된 이메일입니다. 로그인해주세요.');
        } else {
          setError(signUpError.message);
        }
      } else {
        // 가입 성공 → 본인인증 step으로
        setStep('identity');
      }
    } catch {
      setError('회원가입 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // ── 이메일 로그인 ──
  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        if (loginError.message.includes('Invalid login')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다');
        } else {
          setError(loginError.message);
        }
      } else {
        // 아이디 저장 처리
        try {
          if (rememberEmail) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, email);
          } else {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
          }
        } catch { /* ignore */ }

        showToast('로그인되었습니다', 'success');
        handleComplete();
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // ── SNS 로그인 (미래용) ──
  const handleSNSLogin = async (provider: 'kakao' | 'google') => {
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) setError(authError.message);
    } catch {
      setError('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // ── 관심 카테고리 저장 ──
  const handleSaveCategories = async () => {
    if (selectedCategories.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ interested_categories: selectedCategories })
          .eq('id', user.id);
      }
    }
    setStep('marketing');
  };

  // ── 마케팅 동의 저장 + 완료 ──
  const handleSaveMarketing = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const hasConsent = marketingKakao || marketingPush || marketingEmail;
        await supabase
          .from('profiles')
          .update({
            marketing_opt_in: hasConsent,
            marketing_opt_in_at: hasConsent ? new Date().toISOString() : null,
          })
          .eq('id', user.id);
      }
      await refreshProfile();
      showToast('회원가입이 완료되었습니다', 'success');
      handleComplete();
    } catch {
      showToast('회원가입이 완료되었습니다', 'success');
      handleComplete();
    } finally {
      setLoading(false);
    }
  };

  // ── 카테고리 토글 ──
  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // ── 완료 / 닫기 ──
  const handleComplete = () => {
    resetForm();
    closeAuthSheet();
  };

  const handleClose = () => {
    resetForm();
    closeAuthSheet();
  };

  const resetForm = () => {
    setStep('main');
    setPassword('');
    setPasswordConfirm('');
    setShowPassword(false);
    setError('');
    setSelectedCategories([]);
    setMarketingAll(false);
    setMarketingKakao(false);
    setMarketingPush(false);
    setMarketingEmail(false);
    // 저장된 이메일이 있으면 유지, 없으면 초기화
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (!saved) setEmail('');
    } catch {
      setEmail('');
    }
  };

  return createPortal(
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={handleClose}
      />

      {/* 바텀시트 (모바일) / 센터 모달 (데스크톱) */}
      <div className="fixed inset-0 z-[61] flex items-end sm:items-center sm:justify-center pb-safe">
        {/* 바깥 영역 클릭 시 닫기 */}
        <div className="absolute inset-0" onClick={handleClose} />

        <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
          {/* 핸들 + 닫기 */}
          <div className="sticky top-0 bg-white rounded-t-2xl sm:rounded-t-2xl z-10">
            <div className="flex items-center justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="hidden sm:block pt-3" />
            <button
              onClick={handleClose}
              className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="px-6 pb-8">
            {/* ═══════════════════════════════════════════
                STEP: main — 메인 (SNS + 이메일 선택)
               ═══════════════════════════════════════════ */}
            {step === 'main' && (
              <>
                <div className="text-center mb-6 pt-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    POPPON에 오신 것을 환영합니다
                  </h2>
                  <p className="text-sm text-gray-500 mt-1.5">
                    회원가입하고 맞춤 할인 알림을 받아보세요
                  </p>
                </div>

                {/* SNS 로그인 버튼 */}
                <div className="space-y-2.5">
                  {/* 카카오 */}
                  <button
                    onClick={() => setError('카카오 로그인은 준비 중입니다')}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 w-full h-12 rounded-xl font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#FEE500', color: '#191919' }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    카카오로 시작하기
                  </button>

                  {/* 네이버 */}
                  <button
                    onClick={() => setError('네이버 로그인은 준비 중입니다')}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 w-full h-12 rounded-xl font-semibold text-sm text-white transition-colors"
                    style={{ backgroundColor: '#03C75A' }}
                  >
                    <span className="text-lg font-bold">N</span>
                    네이버로 시작하기
                  </button>

                  {/* 애플 */}
                  <button
                    onClick={() => setError('Apple 로그인은 준비 중입니다')}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-black text-white font-semibold text-sm transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Apple로 시작하기
                  </button>
                </div>

                {/* 구분선 */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">또는</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* 이메일 가입 */}
                <button
                  onClick={() => { setStep('signup'); setError(''); }}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  이메일로 시작하기
                </button>

                {/* 기존 회원 로그인 */}
                <button
                  onClick={() => { setStep('login'); setError(''); }}
                  className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  이미 회원이신가요? <span className="font-semibold text-red-500">로그인</span>
                </button>

                {error && (
                  <p className="text-sm text-red-500 text-center mt-3">{error}</p>
                )}

                <p className="mt-4 text-[11px] text-gray-400 text-center leading-relaxed">
                  시작하면{' '}
                  <a href="/legal/terms" className="underline">이용약관</a> 및{' '}
                  <a href="/legal/privacy" className="underline">개인정보처리방침</a>에
                  동의합니다.
                </p>
              </>
            )}

            {/* ═══════════════════════════════════════════
                STEP: signup — 이메일 회원가입
               ═══════════════════════════════════════════ */}
            {step === 'signup' && (
              <>
                <div className="pt-2 mb-6">
                  <button
                    onClick={() => { setStep('main'); setError(''); }}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    뒤로
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">회원가입</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    이메일과 비밀번호를 입력해주세요
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full px-4 h-12 rounded-xl border border-gray-200 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="6자 이상"
                        className="w-full px-4 h-12 rounded-xl border border-gray-200 text-sm pr-12
                                   focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      비밀번호 확인
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && email && password && passwordConfirm) handleSignup(); }}
                      placeholder="비밀번호를 다시 입력해주세요"
                      className="w-full px-4 h-12 rounded-xl border border-gray-200 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                    {passwordConfirm && password !== passwordConfirm && (
                      <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
                    )}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 mt-3">{error}</p>
                )}

                <button
                  onClick={handleSignup}
                  disabled={loading || !email || !password || !passwordConfirm}
                  className="w-full mt-5 h-12 rounded-xl bg-red-500 text-white font-semibold
                             hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                >
                  {loading ? '가입 중...' : '다음'}
                </button>

                <button
                  onClick={() => { setStep('login'); setError(''); }}
                  className="w-full mt-2 py-2 text-sm text-gray-500"
                >
                  이미 회원이신가요? <span className="font-semibold text-red-500">로그인</span>
                </button>
              </>
            )}

            {/* ═══════════════════════════════════════════
                STEP: login — 이메일 로그인
               ═══════════════════════════════════════════ */}
            {step === 'login' && (
              <>
                <div className="pt-2 mb-6">
                  <button
                    onClick={() => { setStep('main'); setError(''); }}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    뒤로
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">로그인</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    가입한 이메일로 로그인하세요
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full px-4 h-12 rounded-xl border border-gray-200 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && email && password) handleLogin(); }}
                        placeholder="비밀번호"
                        className="w-full px-4 h-12 rounded-xl border border-gray-200 text-sm pr-12
                                   focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 아이디 저장 체크박스 */}
                <button
                  type="button"
                  onClick={() => setRememberEmail(!rememberEmail)}
                  className="flex items-center gap-2 mt-3 cursor-pointer select-none"
                >
                  <div
                    className={`rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      rememberEmail ? 'bg-red-500' : 'border border-gray-300'
                    }`}
                    style={{ width: 18, height: 18 }}
                  >
                    {rememberEmail && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-500">아이디 저장</span>
                </button>

                {error && (
                  <p className="text-sm text-red-500 mt-3">{error}</p>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading || !email || !password}
                  className="w-full mt-5 h-12 rounded-xl bg-red-500 text-white font-semibold
                             hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                >
                  {loading ? '로그인 중...' : '로그인'}
                </button>

                <button
                  onClick={() => { setStep('signup'); setError(''); }}
                  className="w-full mt-2 py-2 text-sm text-gray-500"
                >
                  아직 회원이 아니신가요? <span className="font-semibold text-red-500">회원가입</span>
                </button>
              </>
            )}

            {/* ═══════════════════════════════════════════
                STEP: identity — 본인인증 (KMC placeholder)
               ═══════════════════════════════════════════ */}
            {step === 'identity' && (
              <>
                <div className="pt-2 mb-6 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">본인인증</h2>
                  <p className="text-sm text-gray-500 mt-1.5">
                    안전한 서비스 이용을 위해 본인인증이 필요합니다
                  </p>
                </div>

                {/* KMC/PASS 본인인증 버튼 (추후 실제 연동) */}
                <button
                  disabled
                  className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-blue-500 text-white font-semibold text-sm opacity-50 cursor-not-allowed"
                >
                  <ShieldCheck className="w-5 h-5" />
                  휴대폰 본인인증 (준비 중)
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  통신사 본인인증(KMC)으로 실명 확인이 진행됩니다
                </p>

                {/* 임시 스킵 버튼 (개발용) */}
                <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
                  <p className="text-xs text-orange-500 text-center mb-2">
                    개발 모드: 본인인증 없이 진행
                  </p>
                  <button
                    onClick={() => setStep('categories')}
                    className="w-full h-10 rounded-xl border border-orange-300 text-orange-500 text-sm font-medium
                               hover:bg-orange-50 transition-colors"
                  >
                    건너뛰기 (테스트용)
                  </button>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════
                STEP: categories — 관심 카테고리 선택
               ═══════════════════════════════════════════ */}
            {step === 'categories' && (
              <>
                <div className="pt-2 mb-5 text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    관심 카테고리를 선택하세요
                  </h2>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                    선택한 카테고리의 <span className="font-semibold text-red-500">새로운 할인·쿠폰</span>이
                    <br />올라오면 <span className="font-semibold text-red-500">바로 알려드려요!</span>
                  </p>
                </div>

                {/* 카테고리 칩 그리드 */}
                <div className="grid grid-cols-2 gap-2.5">
                  {categories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`
                          flex items-center gap-3 px-4 h-14 rounded-xl border-2 text-left transition-all
                          ${isSelected
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-gray-150 bg-white text-gray-600 hover:border-gray-300'
                          }
                        `}
                      >
                        <span className={isSelected ? 'text-red-500' : 'text-gray-400'}>
                          {cat.icon}
                        </span>
                        <span className="text-sm font-medium">{cat.name}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-red-500 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedCategories.length > 0 && (
                  <p className="text-xs text-gray-400 text-center mt-3">
                    {selectedCategories.length}개 카테고리 선택됨
                  </p>
                )}

                <button
                  onClick={handleSaveCategories}
                  className={`w-full mt-5 h-12 rounded-xl font-semibold transition-colors ${
                    selectedCategories.length > 0
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {selectedCategories.length > 0 ? '알림 받기' : '다음'}
                </button>

                <button
                  onClick={() => { setSelectedCategories([]); setStep('marketing'); }}
                  className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  나중에 설정할게요
                </button>
              </>
            )}

            {/* ═══════════════════════════════════════════
                STEP: marketing — 마케팅 수신 동의
               ═══════════════════════════════════════════ */}
            {step === 'marketing' && (
              <>
                <div className="pt-2 mb-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900">알림 수신 설정</h2>
                  <p className="text-sm text-gray-500 mt-1.5">
                    맞춤 할인 정보를 어떻게 받아볼까요?
                  </p>
                </div>

                <div className="space-y-2">
                  {/* 전체 동의 */}
                  <label
                    className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 cursor-pointer"
                    onClick={(e) => { e.preventDefault(); setMarketingAll(!marketingAll); }}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                        marketingAll ? 'bg-red-500' : 'border-2 border-gray-300'
                      }`}
                    >
                      {marketingAll && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm font-bold text-gray-900">전체 동의</span>
                  </label>

                  <div className="h-px bg-gray-100 mx-2" />

                  {/* 카카오 알림톡 */}
                  <ConsentItem
                    checked={marketingKakao}
                    onChange={() => setMarketingKakao(!marketingKakao)}
                    label="카카오 알림톡"
                    description="새 딜·마감 임박 알림"
                  />

                  {/* 푸시 알림 */}
                  <ConsentItem
                    checked={marketingPush}
                    onChange={() => setMarketingPush(!marketingPush)}
                    label="푸시 알림"
                    description="앱/브라우저 알림"
                  />

                  {/* 이메일 */}
                  <ConsentItem
                    checked={marketingEmail}
                    onChange={() => setMarketingEmail(!marketingEmail)}
                    label="이메일"
                    description="주간 베스트 딜 요약"
                  />
                </div>

                <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                  마케팅 수신에 동의하시면 맞춤 할인 정보를 받아보실 수 있습니다.
                  동의는 마이페이지에서 언제든 철회 가능합니다.
                </p>

                <button
                  onClick={handleSaveMarketing}
                  disabled={loading}
                  className="w-full mt-5 h-12 rounded-xl bg-red-500 text-white font-semibold
                             hover:bg-red-600 disabled:bg-gray-200 transition-colors"
                >
                  {loading ? '완료 중...' : '가입 완료'}
                </button>

                <button
                  onClick={() => { showToast('회원가입이 완료되었습니다', 'success'); handleComplete(); }}
                  className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  건너뛰기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── 동의 항목 컴포넌트 ──
function ConsentItem({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <label
      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={(e) => { e.preventDefault(); onChange(); }}
    >
      <div
        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
          checked ? 'bg-red-500' : 'border-2 border-gray-300'
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400 ml-2">{description}</span>
      </div>
    </label>
  );
}
