'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Calendar, Info } from 'lucide-react';
import type { Deal, Merchant, Category } from '@/types';
import { formatTimeRemaining, formatDateRange } from '@/lib/utils/format';
import { CopyCodeButton } from './CopyCodeButton';
import { DealActionBar } from './DealActionBar';
import { trackDealView } from '@/lib/tracking';

// 카테고리별 액센트 색상
const CATEGORY_ACCENT: Record<string, string> = {
  '패션': 'bg-violet-500', '뷰티': 'bg-rose-500', '식품/배달': 'bg-amber-500',
  '생활/리빙': 'bg-emerald-500', '디지털/가전': 'bg-blue-500', '여행/레저': 'bg-sky-500',
  '문화/콘텐츠': 'bg-purple-500', '키즈/교육': 'bg-pink-500', '건강/헬스': 'bg-green-500',
  '반려동물': 'bg-orange-500', '자동차/주유': 'bg-slate-500', '금융/통신': 'bg-indigo-500',
};

interface DealDetailProps {
  deal: Deal & {
    merchants: Pick<Merchant, 'id' | 'name' | 'slug' | 'logo_url'>;
    categories: Pick<Category, 'name' | 'slug'>;
  };
  isModal?: boolean;
}

export function DealDetail({ deal, isModal = false }: DealDetailProps) {
  const timeRemaining = formatTimeRemaining(deal.ends_at);
  const isExpired = deal.ends_at && new Date(deal.ends_at) <= new Date();
  const accentColor = CATEGORY_ACCENT[deal.categories?.name] || 'bg-gray-500';

  const outboundUrl = `/out/${deal.id}`;
  const hasOutbound = !!(deal.affiliate_url || deal.landing_url || deal.source_url);
  const merchantHref = `/m/${deal.merchants?.slug}`;

  // ✅ 딜 조회 로깅
  useEffect(() => {
    trackDealView(deal.id);
  }, [deal.id]);

  return (
    <div>
      {/* ✅ 브랜드 + 액션 바 */}
      <div className="flex items-start justify-between gap-2 mb-4">
        {/* 왼쪽: 로고 + 브랜드명 */}
        <div className="flex items-center gap-3 min-w-0">
          {deal.merchants?.logo_url ? (
            <img
              src={deal.merchants.logo_url}
              alt={deal.merchants.name}
              className="w-11 h-11 rounded-xl bg-white border border-surface-100 object-contain p-1 shrink-0"
            />
          ) : (
            <div className={`w-11 h-11 rounded-xl ${accentColor} flex items-center justify-center shrink-0`}>
              <span className="text-base font-bold text-white">
                {deal.merchants?.name?.charAt(0) || '?'}
              </span>
            </div>
          )}
          <div className="min-w-0">
            {isModal ? (
              <a
                href={merchantHref}
                className="text-sm font-semibold text-surface-700 hover:text-primary-500 transition-colors"
              >
                {deal.merchants?.name}
              </a>
            ) : (
              <Link
                href={merchantHref}
                className="text-sm font-semibold text-surface-700 hover:text-primary-500 transition-colors"
              >
                {deal.merchants?.name}
              </Link>
            )}
            <p className="text-xs text-surface-400">{deal.categories?.name}</p>
          </div>
        </div>

        {/* 오른쪽: 액션 버튼 (저장/브랜드관/구독) */}
        <DealActionBar
          dealId={deal.id}
          merchantId={deal.merchants?.id || deal.merchant_id}
          merchantName={deal.merchants?.name || ''}
          merchantSlug={deal.merchants?.slug || ''}
          isModal={isModal}
        />
      </div>

      {/* 제목 */}
      <h1 className="text-lg font-bold text-surface-900 leading-snug mb-1.5">
        {deal.title}
      </h1>

      {/* 혜택 요약 */}
      <p className="text-base font-bold text-primary-500 mb-3">
        {deal.benefit_summary}
      </p>

      {/* 기간 */}
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
        <Calendar className="w-4 h-4 shrink-0" />
        <span>
          {deal.is_evergreen ? '상시 진행' : formatDateRange(deal.starts_at, deal.ends_at)}
        </span>
        {timeRemaining && !isExpired && (
          <span className="text-primary-500 font-medium">({timeRemaining})</span>
        )}
        {isExpired && (
          <span className="text-red-500 font-medium">(종료됨)</span>
        )}
      </div>

      {/* 조건 */}
      {deal.conditions && deal.conditions.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-surface-600 mb-4 bg-surface-50 rounded-lg px-3 py-2.5">
          <Info className="w-4 h-4 text-surface-400 mt-0.5 shrink-0" />
          <ul className="space-y-0.5">
            {deal.conditions.map((c: any, i: number) => (
              <li key={i}>{c.text}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 쿠폰코드 (A1 타입) */}
      {deal.coupon_code && (
        <div className="mb-3">
          <CopyCodeButton code={deal.coupon_code} dealId={deal.id} />
        </div>
      )}

      {/* CTA 버튼 */}
      {hasOutbound && !isExpired ? (
        <a
          href={outboundUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          공식 사이트로 이동
        </a>
      ) : isExpired ? (
        <div className="flex items-center justify-center w-full py-3 bg-surface-100 text-surface-400 font-semibold rounded-xl">
          종료된 딜입니다
        </div>
      ) : null}

      {/* 출처 */}
      {deal.source_url && (
        <div className="mt-3 text-center">
          <a
            href={deal.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-surface-400 hover:text-surface-500 transition-colors"
          >
            출처: {new URL(deal.source_url).hostname}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* 제휴 표시 */}
      {deal.affiliate_disclosure && (
        <p className="text-[10px] text-surface-300 mt-2 text-center">
          이 딜은 제휴 링크를 포함할 수 있습니다.
        </p>
      )}
    </div>
  );
}
