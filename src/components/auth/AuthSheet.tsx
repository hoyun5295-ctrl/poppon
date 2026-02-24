'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Mail, ChevronLeft, Eye, EyeOff,
  Check, Bell, MessageCircle, Sparkles,
  Shirt, UtensilsCrossed, Home, Plane, LayoutGrid, User, PartyPopper
} from 'lucide-react';
import { useAuth, type AuthSheetStep } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';

type AuthStep = AuthSheetStep | 'complete' | 'email_sent';

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
 * 이메일 신규가입: main → signup → identity → categories → marketing → signUp + profile 저장 → complete
 * SNS 신규가입:   카카오/네이버 OAuth → callback → /?onboarding=sns → categories → marketing → 완료
 * 로그인:         main → login → 완료
 *
 * ✅ 핵심 수정: signUp은 마지막 스텝에서만 실행 (중간 이탈 시 반쪽 계정 방지)
 */
export function AuthSheet() {
  const {
    isAuthSheetOpen, closeAuthSheet, refreshProfile, showToast,
    authSheetInitialStep, user
  } = useAuth();
  const [step, setStep] = useState<AuthStep>('main');

  // 회원가입 폼 (state에만 저장, signUp은 마지막에)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 아이디 저장
  const [rememberEmail, setRememberEmail] = useState(false);

  // 프로필 정보 (이메일 가입 시)
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileBirthDate, setProfileBirthDate] = useState('');

  // 카테고리 선택
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 마케팅 동의
  const [marketingAll, setMarketingAll] = useState(false);
  const [marketingKakao, setMarketingKakao] = useState(false);
  const [marketingPush, setMarketingPush] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);

  // SNS 온보딩 모드 (뒤로가기 없이 categories→marketing만)
  const [isSNSOnboarding, setIsSNSOnboarding] = useState(false);

  // 이메일 인증 발송 완료
  const [sentEmail, setSentEmail] = useState('');

  // 공통
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  // ── AuthSheet가 열릴 때 초기 step 적용 ──
  useEffect(() => {
    if (isAuthSheetOpen) {
      setStep(authSheetInitialStep);
      if (authSheetInitialStep === 'categories' || authSheetInitialStep === 'marketing') {
        setIsSNSOnboarding(true);
      } else {
        setIsSNSOnboarding(false);
      }
    }
  }, [isAuthSheetOpen, authSheetInitialStep]);

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

  // ═══════════════════════════════════════════
  // ✅ 이메일 가입 Step 1: 이메일/비밀번호 검증만 (signUp 안 함!)
  // ═══════════════════════════════════════════
  const handleSignupNext = async () => {
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

    // 이메일 중복만 체크 (실제 가입은 안 함)
    setLoading(true);
    setError('');
    try {
      // signInWithPassword로 기존 계정 여부 확인
      // 실패 = 이메일 없거나 비번 틀림 → 신규 가능
      // 성공 = 이미 가입됨
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email, password: '__check_only_' + Date.now()
      });
      // "Invalid login credentials" = 계정이 없거나 비번 틀림 → OK
      // 그 외 에러도 OK (계속 진행)
      // 만약 로그인 성공하면? 그건 비번이 맞은 거라 이론적으로 불가능 (__check_only_ prefix)
      
      // 추가 체크: 실제 이메일 중복은 최종 signUp에서 잡힘
      // 여기서는 폼 검증만 하고 다음 스텝으로
      setStep('identity');
    } catch {
      setError('확인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════
  // ✅ 이메일 가입 Step 2: 프로필 정보 검증 (저장 안 함!)
  // ═══════════════════════════════════════════
  const handleProfileNext = () => {
    if (!profileName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }
    const rawPhone = profilePhone.replace(/[^0-9]/g, '');
    if (!rawPhone || !/^01[016789]\d{7,8}$/.test(rawPhone)) {
      setError('올바른 휴대전화번호를 입력해주세요');
      return;
    }
    if (!profileGender) {
      setError('성별을 선택해주세요');
      return;
    }
    if (!profileBirthDate) {
      setError('생년월일을 입력해주세요');
      return;
    }
    setError('');
    setStep('categories');
  };

  // ═══════════════════════════════════════════
  // 카테고리 저장 (SNS 온보딩은 이미 로그인 상태이므로 바로 저장)
  // ═══════════════════════════════════════════
  const handleSaveCategories = async () => {
    if (isSNSOnboarding && selectedCategories.length > 0) {
      const currentUser = user;
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ interest_categories: selectedCategories })
          .eq('id', currentUser.id);
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase
            .from('profiles')
            .update({ interest_categories: selectedCategories })
            .eq('id', authUser.id);
        }
      }
    }
    // 이메일 가입: state에만 저장, 최종 스텝에서 한꺼번에 저장
    setStep('marketing');
  };

  // ═══════════════════════════════════════════
  // ✅ 마지막 스텝: 실제 signUp + 모든 프로필 데이터 저장
  // ═══════════════════════════════════════════
  const handleFinalSignup = async () => {
    setLoading(true);
    setError('');
    try {
      if (isSNSOnboarding) {
        // SNS는 이미 로그인됨 → 마케팅만 저장
        const currentUser = user;
        const userId = currentUser?.id;
        if (userId) {
          await saveMarketingData(userId);
        } else {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) await saveMarketingData(authUser.id);
        }
        await refreshProfile();
        showToast('SNS 로그인이 완료되었습니다', 'success');
        handleComplete();
        return;
      }

      // ✅ 이메일 가입: 여기서 signUp 실행!
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('이미 가입된 이메일입니다. 로그인해주세요.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      const newUserId = signUpData?.user?.id;
      if (!newUserId) {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
        setLoading(false);
        return;
      }

      // ✅ 이메일 인증 필요 시 session이 null → 프로필 데이터를 임시 저장 후 인증 안내
      if (!signUpData.session) {
        console.log('[AuthSheet] signup success, email confirmation required');

        // RLS 때문에 세션 없이는 profiles 업데이트 불가 → localStorage에 임시 저장
        const hasConsent = marketingKakao || marketingPush || marketingEmail;
        const rawPhone = profilePhone.replace(/[^0-9]/g, '');
        const formattedPhone = rawPhone.length === 11
          ? `${rawPhone.slice(0, 3)}-${rawPhone.slice(3, 7)}-${rawPhone.slice(7)}`
          : rawPhone;

        try {
          localStorage.setItem('poppon_pending_profile', JSON.stringify({
            name: profileName.trim(),
            phone: formattedPhone || null,
            gender: profileGender || null,
            birth_date: profileBirthDate || null,
            provider: 'email',
            interest_categories: selectedCategories.length > 0 ? selectedCategories : [],
            marketing_agreed: hasConsent,
            marketing_agreed_at: hasConsent ? new Date().toISOString() : null,
            onboarding_completed: true,
          }));
          if (rememberEmail) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
          else localStorage.removeItem(REMEMBER_EMAIL_KEY);
        } catch { /* ignore */ }

        setSentEmail(email.trim().toLowerCase());
        setStep('email_sent');
        setLoading(false);
        return;
      }

      // 프로필 트리거가 profiles row를 만들 때까지 약간 대기
      await new Promise(r => setTimeout(r, 500));

      // ✅ 프로필 + 카테고리 + 마케팅 한꺼번에 저장
      const rawPhone = profilePhone.replace(/[^0-9]/g, '');
      const formattedPhone = rawPhone.length === 11
        ? `${rawPhone.slice(0, 3)}-${rawPhone.slice(3, 7)}-${rawPhone.slice(7)}`
        : rawPhone;

      const hasConsent = marketingKakao || marketingPush || marketingEmail;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: profileName.trim(),
          phone: formattedPhone,
          gender: profileGender,
          birth_date: profileBirthDate,
          provider: 'email',
          interest_categories: selectedCategories.length > 0 ? selectedCategories : [],
          marketing_agreed: hasConsent,
          marketing_agreed_at: hasConsent ? new Date().toISOString() : null,
        })
        .eq('id', newUserId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        // 가입은 됐으니 에러 무시하고 완료 처리
      }

      // 아이디 저장
      try {
        if (rememberEmail) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch { /* ignore */ }

      await refreshProfile();

      // ✅ 완료 화면으로
      setStep('complete');
    } catch {
      setError('회원가입 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const saveMarketingData = async (userId: string) => {
    const hasConsent = marketingKakao || marketingPush || marketingEmail;
    await supabase
      .from('profiles')
      .update({
        marketing_agreed: hasConsent,
        marketing_agreed_at: hasConsent ? new Date().toISOString() : null,
      })
      .eq('id', userId);
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
        if (loginError.message.includes('Email not confirmed')) {
          setSentEmail(email.trim().toLowerCase());
          setStep('email_sent');
        } else if (loginError.message.includes('Invalid login')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다');
        } else {
          setError(loginError.message);
        }
      } else {
        // ✅ 로그인 성공 → pending profile 데이터 적용
        try {
          const pendingRaw = localStorage.getItem('poppon_pending_profile');
          if (pendingRaw) {
            const pendingData = JSON.parse(pendingRaw);
            const { data: { user: loggedInUser } } = await supabase.auth.getUser();
            if (loggedInUser) {
              await supabase
                .from('profiles')
                .update(pendingData)
                .eq('id', loggedInUser.id);
              console.log('[AuthSheet] pending profile data applied');
            }
            localStorage.removeItem('poppon_pending_profile');
          }
        } catch (e) {
          console.error('[AuthSheet] pending profile apply error:', e);
        }

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

  // ── SNS 로그인 (카카오 등 Supabase 빌트인) ──
  const handleResendEmail = async () => {
    if (!sentEmail) return;
    setLoading(true);
    setError('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: sentEmail,
      });
      if (resendError) throw resendError;
      setError('');
      // 성공 시 간단 알림 (error state 재활용)
      setError('✅ 인증 메일을 다시 보냈습니다');
    } catch {
      setError('메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

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

  // ── 네이버 로그인 (수동 OAuth 플로우) ──
  const handleNaverLogin = () => {
    setLoading(true);
    window.location.href = '/api/auth/naver';
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
    // 완료 화면에서 닫기
    if (step === 'complete') {
      handleComplete();
      return;
    }
    resetForm();
    closeAuthSheet();
  };

  const resetForm = () => {
    setStep('main');
    setPassword('');
    setPasswordConfirm('');
    setShowPassword(false);
    setError('');
    setProfileName('');
    setProfilePhone('');
    setProfileGender('');
    setProfileBirthDate('');
    setSelectedCategories([]);
    setMarketingAll(false);
    setMarketingKakao(false);
    setMarketingPush(false);
    setMarketingEmail(false);
    setIsSNSOnboarding(false);
    setSentEmail('');
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (!saved) setEmail('');
    } catch {
      setEmail('');
    }
  };

  // ── 뒤로가기 핸들러 (이메일 가입 플로우) ──
  const handleBack = () => {
    setError('');
    if (step === 'signup') setStep('main');
    else if (step === 'identity') setStep('signup');
    else if (step === 'categories' && !isSNSOnboarding) setStep('identity');
    else if (step === 'marketing' && !isSNSOnboarding) setStep('categories');
  };

  // 뒤로가기 가능 여부
  const canGoBack = !isSNSOnboarding && ['signup', 'identity', 'categories', 'marketing'].includes(step);

  // 진행률 (이메일 가입용)
  const progressSteps = ['signup', 'identity', 'categories', 'marketing'];
  const currentProgress = progressSteps.indexOf(step);
  const showProgress = !isSNSOnboarding && currentProgress >= 0;

  return createPortal(
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={handleClose}
      />

      {/* 바텀시트 (모바일) / 센터 모달 (데스크톱) */}
      <div className="fixed inset-0 z-[61] flex items-end sm:items-center sm:justify-center pb-safe">
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

            {/* ✅ 진행률 표시 (이메일 가입 플로우) */}
            {showProgress && (
              <div className="flex gap-1.5 mb-4">
                {progressSteps.map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= currentProgress ? 'bg-red-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}

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
                  <button
                    onClick={() => handleSNSLogin('kakao')}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 w-full h-12 rounded-xl font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#FEE500', color: '#191919' }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    카카오로 시작하기
                  </button>

                  <button
                    onClick={handleNaverLogin}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 w-full h-12 rounded-xl font-semibold text-sm text-white transition-colors"
                    style={{ backgroundColor: '#03C75A' }}
                  >
                    <span className="text-lg font-bold">N</span>
                    네이버로 시작하기
                  </button>

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

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">또는</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button
                  onClick={() => { setStep('signup'); setError(''); }}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  이메일로 시작하기
                </button>

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
                STEP: signup — 이메일/비밀번호 입력 (signUp 안 함!)
               ═══════════════════════════════════════════ */}
            {step === 'signup' && (
              <>
                <div className="pt-2 mb-6">
                  <button
                    onClick={handleBack}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호 확인</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && email && password && passwordConfirm) handleSignupNext(); }}
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
                  onClick={handleSignupNext}
                  disabled={loading || !email || !password || !passwordConfirm}
                  className="w-full mt-5 h-12 rounded-xl bg-red-500 text-white font-semibold
                             hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                >
                  {loading ? '확인 중...' : '다음'}
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
                  <p className="text-sm text-gray-500 mt-1">가입한 이메일로 로그인하세요</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
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
                STEP: identity — 회원 정보 입력 (저장 안 함, state만)
               ═══════════════════════════════════════════ */}
            {step === 'identity' && (
              <>
                <div className="pt-2 mb-5">
                  {canGoBack && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      뒤로
                    </button>
                  )}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">회원 정보 입력</h2>
                    <p className="text-sm text-gray-500 mt-1.5">
                      맞춤 할인 정보를 위해 기본 정보를 입력해주세요
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="실명을 입력해주세요"
                      className="w-full px-4 h-12 rounded-xl border border-gray-200 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length <= 11) {
                          if (val.length <= 3) setProfilePhone(val);
                          else if (val.length <= 7) setProfilePhone(`${val.slice(0, 3)}-${val.slice(3)}`);
                          else setProfilePhone(`${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7)}`);
                        }
                      }}
                      placeholder="010-0000-0000"
                      className="w-full px-4 h-12 rounded-xl border border-gray-200 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      성별 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {[{ value: '남성', label: '남성' }, { value: '여성', label: '여성' }].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setProfileGender(option.value)}
                          className={`flex-1 h-12 rounded-xl border-2 text-sm font-medium transition-all ${
                            profileGender === option.value
                              ? 'border-red-500 bg-red-50 text-red-600'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      생년월일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={profileBirthDate}
                      onChange={(e) => setProfileBirthDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      min="1920-01-01"
                      className="w-full px-4 h-12 rounded-xl border border-gray-200 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center mt-3">{error}</p>
                )}

                <button
                  onClick={handleProfileNext}
                  className="w-full mt-5 h-12 rounded-xl bg-red-500 text-white font-semibold
                             hover:bg-red-600 transition-colors"
                >
                  다음
                </button>

                <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
                  입력된 정보는 맞춤형 할인 정보 제공 및 마케팅 활용에 사용됩니다.
                  <br />
                  자세한 내용은{' '}
                  <a href="/legal/privacy" className="underline">개인정보처리방침</a>을 확인해주세요.
                </p>
              </>
            )}

            {/* ═══════════════════════════════════════════
                STEP: categories — 관심 카테고리 선택
               ═══════════════════════════════════════════ */}
            {step === 'categories' && (
              <>
                <div className="pt-2 mb-5 text-center">
                  {canGoBack && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      뒤로
                    </button>
                  )}
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isSNSOnboarding ? '거의 다 됐어요!' : '관심 카테고리를 선택하세요'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                    {isSNSOnboarding ? (
                      <>
                        관심 카테고리를 선택하면<br />
                        <span className="font-semibold text-red-500">맞춤 할인 알림</span>을 받을 수 있어요
                      </>
                    ) : (
                      <>
                        선택한 카테고리의 <span className="font-semibold text-red-500">새로운 할인·쿠폰</span>이
                        <br />올라오면 <span className="font-semibold text-red-500">바로 알려드려요!</span>
                      </>
                    )}
                  </p>
                </div>

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
                  className="w-full mt-5 h-12 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
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
                STEP: marketing — 마케팅 수신 동의 + 최종 가입
               ═══════════════════════════════════════════ */}
            {step === 'marketing' && (
              <>
                <div className="pt-2 mb-6">
                  {canGoBack && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      뒤로
                    </button>
                  )}
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">알림 수신 설정</h2>
                    <p className="text-sm text-gray-500 mt-1.5">
                      맞춤 할인 정보를 어떻게 받아볼까요?
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
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

                  <ConsentItem checked={marketingKakao} onChange={() => setMarketingKakao(!marketingKakao)} label="카카오 알림톡" description="새 딜·마감 임박 알림" />
                  <ConsentItem checked={marketingPush} onChange={() => setMarketingPush(!marketingPush)} label="푸시 알림" description="앱/브라우저 알림" />
                  <ConsentItem checked={marketingEmail} onChange={() => setMarketingEmail(!marketingEmail)} label="이메일" description="주간 베스트 딜 요약" />
                </div>

                <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                  마케팅 수신에 동의하시면 맞춤 할인 정보를 받아보실 수 있습니다.
                  동의는 마이페이지에서 언제든 철회 가능합니다.
                </p>

                {error && (
                  <p className="text-sm text-red-500 text-center mt-3">{error}</p>
                )}

                <button
                  onClick={handleFinalSignup}
                  disabled={loading}
                  className="w-full mt-5 h-12 rounded-xl bg-red-500 text-white font-semibold
                             hover:bg-red-600 disabled:bg-gray-200 transition-colors"
                >
                  {loading ? '가입 처리 중...' : (isSNSOnboarding ? '시작하기' : '가입 완료')}
                </button>

                {isSNSOnboarding && (
                  <button
                    onClick={() => {
                      showToast('SNS 로그인이 완료되었습니다', 'success');
                      handleComplete();
                    }}
                    className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600"
                  >
                    건너뛰기
                  </button>
                )}
              </>
            )}

            {/* ═══════════════════════════════════════════
                STEP: email_sent — 인증 메일 발송 완료
               ═══════════════════════════════════════════ */}
            {step === 'email_sent' && (
              <>
                <div className="pt-8 pb-4 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Mail className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    인증 메일을 보냈습니다
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    <span className="font-semibold text-gray-700">{sentEmail}</span>
                    <br />메일함을 확인하고 인증 링크를 클릭해주세요.
                  </p>
                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                    메일이 보이지 않으면 스팸 폴더를 확인해주세요.
                  </p>
                </div>

                {error && (
                  <p className={`text-sm text-center mt-2 ${error.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
                    {error}
                  </p>
                )}

                <button
                  onClick={() => {
                    setStep('login');
                    setPassword('');
                    setError('');
                  }}
                  className="w-full mt-5 h-12 rounded-xl bg-red-500 text-white font-semibold
                             hover:bg-red-600 transition-colors"
                >
                  인증 완료 후 로그인하기
                </button>

                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="w-full mt-2 py-3 text-sm text-red-500 font-medium hover:text-red-600 transition-colors disabled:text-gray-400"
                >
                  {loading ? '발송 중...' : '인증 메일 다시 보내기'}
                </button>
              </>
            )}

            {/* ═══════════════════════════════════════════
                STEP: complete — 가입 완료! 🎉
               ═══════════════════════════════════════════ */}
            {step === 'complete' && (
              <>
                <div className="pt-8 pb-4 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <PartyPopper className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    회원가입 완료!
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    POPPON에 오신 것을 환영합니다 🎉<br />
                    이제 맞춤 할인 정보를 받아보실 수 있어요
                  </p>

                  <div className="mt-6 p-4 bg-red-50 rounded-xl">
                    <p className="text-sm font-medium text-red-600">
                      {selectedCategories.length > 0
                        ? `${selectedCategories.length}개 카테고리의 새 딜 알림이 설정되었습니다`
                        : '마이페이지에서 관심 카테고리를 설정해보세요'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      showToast('회원가입이 완료되었습니다', 'success');
                      handleComplete();
                    }}
                    className="w-full mt-6 h-12 rounded-xl bg-red-500 text-white font-semibold
                               hover:bg-red-600 transition-colors"
                  >
                    시작하기
                  </button>
                </div>
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
