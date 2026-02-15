'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { Clock, Flame } from 'lucide-react';
import type { DealCard as DealCardType } from '@/types';
import { formatTimeRemaining, formatDiscount, formatPrice } from '@/lib/utils/format';
import { DEAL_TYPE_LABELS } from '@/lib/constants';

// ──────────────────────────────────────────
// brand_color 없을 때 fallback
// ──────────────────────────────────────────
const DEFAULT_BADGE_COLOR = '#374151';

// ──────────────────────────────────────────
// 밝기 판단 → 배지 텍스트 흰/검 자동 결정
// ──────────────────────────────────────────
function getBadgeTextColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#FFFFFF';
}

// ──────────────────────────────────────────
// 로고 비율 판단 → 동적 사이즈
// ──────────────────────────────────────────
type LogoShape = 'wide' | 'normal' | 'tall';

function getLogoShape(w: number, h: number): LogoShape {
  if (w === 0 || h === 0) return 'normal';
  const ratio = w / h;
  if (ratio > 2) return 'wide';
  if (ratio < 0.8) return 'tall';
  return 'normal';
}

// 그리드용 사이즈
const GRID_LOGO_CLASSES: Record<LogoShape, string> = {
  wide:   'max-w-[180px] max-h-[56px]',
  normal: 'max-w-[100px] max-h-[100px]',
  tall:   'max-w-[72px] max-h-[100px]',
};

// 리스트용 사이즈
const LIST_LOGO_CLASSES: Record<LogoShape, string> = {
  wide:   'max-w-[96px] max-h-[36px]',
  normal: 'max-w-[56px] max-h-[56px]',
  tall:   'max-w-[44px] max-h-[56px]',
};

// ──────────────────────────────────────────
// 마감임박 판단 (7일 이내만)
// ──────────────────────────────────────────
function checkEndingSoon(deal: DealCardType): boolean {
  if (deal.is_evergreen || !deal.ends_at) return false;
  const endsAt = new Date(deal.ends_at);
  if (isNaN(endsAt.getTime())) return false;
  const daysLeft = (endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysLeft > 0 && daysLeft <= 7;
}

// ──────────────────────────────────────────
// 그리드 로고 (동적 사이즈)
// ──────────────────────────────────────────
function GridLogo({ deal }: { deal: DealCardType }) {
  const [imgError, setImgError] = useState(false);
  const [shape, setShape] = useState<LogoShape>('normal');

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setShape(getLogoShape(img.naturalWidth, img.naturalHeight));
  }, []);

  if (deal.merchant_logo_url && !imgError) {
    return (
      <div className="w-full h-[100px] flex items-center justify-center px-3">
        <img
          src={deal.merchant_logo_url}
          alt={deal.merchant_name}
          className={`object-contain ${GRID_LOGO_CLASSES[shape]}`}
          loading="lazy"
          onLoad={handleLoad}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  const brandColor = deal.merchant_brand_color || '#6B7280';
  return (
    <div
      className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
      style={{ backgroundColor: brandColor + '15' }}
    >
      <span className="text-3xl font-black" style={{ color: brandColor }}>
        {deal.merchant_name.charAt(0)}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────
// 리스트 로고 (동적 사이즈)
// ──────────────────────────────────────────
function ListLogo({ deal }: { deal: DealCardType }) {
  const [imgError, setImgError] = useState(false);
  const [shape, setShape] = useState<LogoShape>('normal');

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setShape(getLogoShape(img.naturalWidth, img.naturalHeight));
  }, []);

  if (deal.merchant_logo_url && !imgError) {
    return (
      <div className="w-full h-[56px] flex items-center justify-center px-1">
        <img
          src={deal.merchant_logo_url}
          alt={deal.merchant_name}
          className={`object-contain ${LIST_LOGO_CLASSES[shape]}`}
          loading="lazy"
          onLoad={handleLoad}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  const brandColor = deal.merchant_brand_color || '#6B7280';
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center"
      style={{ backgroundColor: brandColor + '15' }}
    >
      <span className="text-lg font-black" style={{ color: brandColor }}>
        {deal.merchant_name.charAt(0)}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────
// 할인 배지 (🔥 Flame 아이콘)
// ──────────────────────────────────────────
function DiscountBadge({
  deal,
  size = 'md',
}: {
  deal: DealCardType;
  size?: 'sm' | 'md';
}) {
  if (!deal.discount_value || !deal.discount_type) return null;

  const badgeColor = deal.merchant_brand_color || DEFAULT_BADGE_COLOR;
  const textColor = getBadgeTextColor(badgeColor);

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-bold rounded-full ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
      style={{ backgroundColor: badgeColor, color: textColor }}
    >
      <Flame className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {formatDiscount(deal.discount_value, deal.discount_type)}
    </span>
  );
}

// ══════════════════════════════════════════
// DealCard 엔트리포인트
// ══════════════════════════════════════════
interface DealCardProps {
  deal: DealCardType;
  layout?: 'grid' | 'list';
}

export function DealCard({ deal, layout = 'grid' }: DealCardProps) {
  const timeRemaining = formatTimeRemaining(deal.ends_at);
  const isEndingSoon = checkEndingSoon(deal);

  if (layout === 'list') {
    return <DealCardList deal={deal} timeRemaining={timeRemaining} isEndingSoon={isEndingSoon} />;
  }

  return <DealCardGrid deal={deal} timeRemaining={timeRemaining} isEndingSoon={isEndingSoon} />;
}

// ══════════════════════════════════════════
// 그리드 카드
// ══════════════════════════════════════════
function DealCardGrid({
  deal,
  timeRemaining,
  isEndingSoon,
}: {
  deal: DealCardType;
  timeRemaining: string | null;
  isEndingSoon: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const brandColor = deal.merchant_brand_color;
  const hoverBorder = hovered && brandColor ? brandColor : undefined;

  return (
    <Link
      href={`/d/${deal.slug}`}
      className="deal-card group block bg-white rounded-xl overflow-hidden transition-all duration-200"
      style={{
        border: `1.5px solid ${hoverBorder || '#E5E7EB'}`,
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ──── 상단: 흰 배경 + 배지 + 로고 ──── */}
      <div className="relative px-4 pt-4 pb-3 flex flex-col items-center">
        {/* 좌상단: 할인 배지 */}
        <div className="absolute top-3 left-3">
          <DiscountBadge deal={deal} />
        </div>

        {/* 우상단: 긴급/스폰서 배지 */}
        <div className="absolute top-3 right-3 flex gap-1">
          {deal.is_sponsored && (
            <span className="bg-surface-100 text-surface-500 text-[10px] font-semibold px-1.5 py-0.5 rounded">스폰서</span>
          )}
          {deal.urgency_tags?.includes('new_today') && (
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
          )}
          {isEndingSoon && (
            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">마감임박</span>
          )}
        </div>

        {/* 로고 (동적 사이즈) */}
        <div className="mt-5 mb-1 w-full">
          <GridLogo deal={deal} />
        </div>
      </div>

      {/* ──── 쿠폰 점선 구분 (POPPON 특색) ──── */}
      <div className="relative">
        <div className="border-t border-dashed border-surface-200" />
        <div
          className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white rounded-full"
          style={{ boxShadow: `inset -1px 1px 0 0 ${hoverBorder || '#E5E7EB'}` }}
        />
        <div
          className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white rounded-full"
          style={{ boxShadow: `inset 1px 1px 0 0 ${hoverBorder || '#E5E7EB'}` }}
        />
      </div>

      {/* ──── 하단: 브랜드명 + 혜택 + 코드/기간 ──── */}
      <div className="px-3.5 pt-3 pb-3.5">
        <p className="text-xs font-extrabold text-surface-900 tracking-wide uppercase truncate mb-1">
          {deal.merchant_name}
        </p>

        <h3 className="text-[13px] text-surface-600 leading-snug line-clamp-2 mb-3 min-h-[2.5rem]">
          {deal.title || deal.benefit_summary}
        </h3>

        {deal.price && (
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-base font-bold text-surface-900">{formatPrice(deal.price)}</span>
            {deal.original_price && (
              <span className="text-xs text-surface-400 line-through">{formatPrice(deal.original_price)}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {deal.coupon_code ? (
            <span className="inline-flex items-center text-[11px] font-semibold bg-surface-900 text-white px-3 py-1.5 rounded-full">
              Coupon code
            </span>
          ) : (
            <span className="text-[11px] text-surface-400">
              {DEAL_TYPE_LABELS[deal.deal_type]}
            </span>
          )}

          {timeRemaining && (
            <span className="flex items-center gap-1 text-[11px] text-surface-400">
              <Clock className="w-3 h-3" />
              {timeRemaining}
            </span>
          )}
        </div>

        {deal.affiliate_disclosure && (
          <span className="text-[10px] text-surface-300 mt-1.5 block">제휴링크</span>
        )}
      </div>
    </Link>
  );
}

// ══════════════════════════════════════════
// 리스트 카드
// ══════════════════════════════════════════
function DealCardList({
  deal,
  timeRemaining,
  isEndingSoon,
}: {
  deal: DealCardType;
  timeRemaining: string | null;
  isEndingSoon: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const brandColor = deal.merchant_brand_color;
  const hoverBorder = hovered && brandColor ? brandColor : undefined;

  return (
    <Link
      href={`/d/${deal.slug}`}
      className="deal-card group flex bg-white rounded-xl overflow-hidden transition-all duration-200"
      style={{
        border: `1.5px solid ${hoverBorder || '#E5E7EB'}`,
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-28 sm:w-32 shrink-0 flex flex-col items-center justify-center p-3 gap-2 border-r border-dashed border-surface-200">
        <DiscountBadge deal={deal} size="sm" />
        <ListLogo deal={deal} />
        <p className="text-[10px] font-extrabold text-surface-900 tracking-wide uppercase truncate max-w-full text-center">
          {deal.merchant_name}
        </p>
      </div>

      <div className="flex-1 min-w-0 p-3.5">
        <div className="flex items-center gap-1 mb-1">
          {deal.is_sponsored && (
            <span className="bg-surface-100 text-surface-500 text-[10px] font-semibold px-1.5 py-0.5 rounded">스폰서</span>
          )}
          {isEndingSoon && (
            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">마감임박</span>
          )}
          {deal.urgency_tags?.includes('new_today') && (
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-surface-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
          {deal.title || deal.benefit_summary}
        </h3>

        {/* benefit_summary가 title과 다를 때만 서브로 표시 */}
        {deal.benefit_summary && deal.title && deal.benefit_summary !== deal.title && (
          <p className="text-xs text-surface-500 line-clamp-1 mb-2">
            {deal.benefit_summary}
          </p>
        )}
        {(!deal.benefit_summary || !deal.title || deal.benefit_summary === deal.title) && (
          <div className="mb-2" />
        )}

        <div className="flex items-center gap-3">
          {deal.coupon_code ? (
            <span className="inline-flex items-center text-[11px] font-semibold bg-surface-900 text-white px-2.5 py-1 rounded-full">
              Coupon code
            </span>
          ) : (
            <span className="text-[11px] text-surface-400">
              {DEAL_TYPE_LABELS[deal.deal_type]}
            </span>
          )}
          {timeRemaining && (
            <span className="flex items-center gap-1 text-[11px] text-surface-400">
              <Clock className="w-3 h-3" /> {timeRemaining}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
