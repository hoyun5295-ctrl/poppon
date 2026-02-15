import { formatDistanceToNow, differenceInHours, differenceInDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 금액 포맷팅: 1000 → "1,000원"
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 할인율 포맷팅: 50 → "50%"
 */
export function formatDiscount(value: number, type: 'percent' | 'amount'): string {
  if (type === 'percent') return `${value}%`;
  return formatPrice(value);
}

/**
 * 마감 임박 텍스트
 * - 종료됨 → "종료됨"
 * - 1시간 이내 → "1시간 이내 마감"
 * - 24시간 이내 → "N시간 남음"
 * - 7일 이내 → "N일 남음"
 * - 30일 이내 → "M월 d일 마감"
 * - 1년 이내 → "yyyy.M.d 마감" (연도 포함)
 * - 1년+ → null (비정상 데이터로 간주, 표시 안 함)
 */
export function formatTimeRemaining(endsAt: string | null): string | null {
  if (!endsAt) return null;

  const end = new Date(endsAt);
  const now = new Date();

  // 유효하지 않은 날짜
  if (isNaN(end.getTime())) return null;

  if (end <= now) return '종료됨';

  const hoursLeft = differenceInHours(end, now);
  const daysLeft = differenceInDays(end, now);

  // 1년 이상 남은 건 비정상 데이터 — 표시 안 함
  if (daysLeft > 365) return null;

  if (hoursLeft < 1) return '1시간 이내 마감';
  if (hoursLeft < 24) return `${hoursLeft}시간 남음`;
  if (daysLeft < 7) return `${daysLeft}일 남음`;
  if (daysLeft < 30) return format(end, 'M월 d일 마감');

  // 30일~1년: 연도 포함
  return format(end, 'yyyy.M.d 마감');
}

/**
 * 상대 시간: "3시간 전", "2일 전"
 */
export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ko });
}

/**
 * 날짜 포맷: "2026.02.14"
 */
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'yyyy.MM.dd');
}

/**
 * 기간 포맷: "2/14 ~ 2/28"
 */
export function formatDateRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return '상시 진행';
  if (!startsAt && endsAt) return `~ ${format(new Date(endsAt), 'M/d')}`;
  if (startsAt && !endsAt) return `${format(new Date(startsAt), 'M/d')} ~`;
  return `${format(new Date(startsAt!), 'M/d')} ~ ${format(new Date(endsAt!), 'M/d')}`;
}

/**
 * 숫자 축약: 1200 → "1.2K", 15000 → "1.5만"
 */
export function formatCount(count: number): string {
  if (count < 1000) return String(count);
  if (count < 10000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 10000).toFixed(1)}만`;
}

/**
 * 슬러그 생성: "올리브영 50% 할인" → "올리브영-50-할인"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
