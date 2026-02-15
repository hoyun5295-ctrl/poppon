'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle, AlertCircle, Link2, MessageSquare, ArrowLeft } from 'lucide-react';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SubmitPage() {
  const [url, setUrl] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isValidUrl = (s: string) => {
    try {
      new URL(s);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setErrorMsg('URL을 입력해주세요');
      return;
    }

    if (!isValidUrl(url.trim())) {
      setErrorMsg('올바른 URL 형식이 아닙니다 (https://로 시작)');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '제보에 실패했습니다');
      }

      setStatus('success');
      setUrl('');
      setComment('');
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      {/* 뒤로가기 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        홈으로
      </Link>

      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Send className="w-7 h-7 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-surface-900">딜 제보하기</h1>
        <p className="mt-2 text-sm text-surface-500">
          발견한 할인/쿠폰/프로모션 링크를 제보해주세요.<br />
          검토 후 등록됩니다.
        </p>
      </div>

      {/* 성공 상태 */}
      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6 animate-fade-in">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-green-700">제보 완료!</h2>
          <p className="mt-1.5 text-sm text-green-600">
            검토 후 등록됩니다. 감사합니다.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-4 px-5 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
          >
            추가 제보하기
          </button>
        </div>
      )}

      {/* 폼 */}
      {status !== 'success' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* URL 입력 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-2">
              <Link2 className="w-4 h-4" />
              할인/쿠폰 URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrorMsg('');
              }}
              placeholder="https://brand.com/event/summer-sale"
              className="w-full px-4 py-3 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            />
            <p className="mt-1.5 text-xs text-surface-400">
              할인 이벤트, 쿠폰, 프로모션 페이지 링크를 붙여넣어주세요
            </p>
          </div>

          {/* 코멘트 (선택) */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-2">
              <MessageSquare className="w-4 h-4" />
              추가 설명 <span className="text-surface-400 font-normal">(선택)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="예: 올리브영 봄 세일, 최대 50% 할인, 3/15까지"
              rows={3}
              className="w-full px-4 py-3 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
            />
          </div>

          {/* 에러 메시지 */}
          {(errorMsg || status === 'error') && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{errorMsg || '제보에 실패했습니다. 다시 시도해주세요.'}</p>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={status === 'loading' || !url.trim()}
            className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                제출 중...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                제보하기
              </>
            )}
          </button>
        </form>
      )}

      {/* 안내 */}
      <div className="mt-8 bg-surface-50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-surface-700 mb-2">제보 안내</h3>
        <ul className="text-xs text-surface-500 space-y-1.5">
          <li>• 공식 브랜드 사이트의 할인/쿠폰/프로모션 링크를 제보해주세요</li>
          <li>• 제보된 링크는 자동 파싱 후 운영자 검토를 거쳐 등록됩니다</li>
          <li>• 이미 등록된 딜이나 개인정보가 포함된 링크는 반려될 수 있습니다</li>
          <li>• 제보 내역은 마이페이지에서 확인할 수 있습니다 (추후 지원)</li>
        </ul>
      </div>
    </div>
  );
}
