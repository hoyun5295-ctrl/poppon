'use client';

import { useState } from 'react';

export default function AuthPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Supabase Auth phone OTP 요청
    setStep('verify');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Supabase Auth phone OTP 검증
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-primary-500">POPPON</h1>
          <p className="mt-2 text-sm text-surface-500">
            로그인하고 딜을 저장/구독하세요
          </p>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          {step === 'phone' ? (
            <form onSubmit={handleRequestCode}>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                휴대폰 번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-4 py-3 rounded-lg border border-surface-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-lg bg-primary-500 text-white font-semibold
                           hover:bg-primary-600 transition-colors"
              >
                인증번호 받기
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <p className="text-sm text-surface-600 mb-4">
                <span className="font-medium">{phone}</span>으로 인증번호를 발송했습니다
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="인증번호 6자리"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg border border-surface-200 text-center text-lg tracking-widest
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-lg bg-primary-500 text-white font-semibold
                           hover:bg-primary-600 transition-colors"
              >
                확인
              </button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full mt-2 py-2 text-sm text-surface-500 hover:text-surface-700"
              >
                번호 변경
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-xs text-surface-400 text-center">
          로그인 시 <a href="/legal/terms" className="underline">이용약관</a> 및{' '}
          <a href="/legal/privacy" className="underline">개인정보처리방침</a>에 동의합니다.
        </p>
      </div>
    </div>
  );
}
