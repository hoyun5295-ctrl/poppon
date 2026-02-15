import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { DealCard as DealCardType, UrgencyTag } from '@/types';

const DEAL_DETAIL_SELECT = `
  *,
  merchants (name, slug, logo_url, brand_color),
  categories!deals_category_id_fkey (name, slug)
`;

const DEAL_CARD_SELECT = `
  id, title, benefit_summary, deal_type, status,
  coupon_code, discount_value, discount_type,
  price, original_price,
  thumbnail_url, og_image_url,
  ends_at, is_evergreen, benefit_tags,
  quality_score, trending_score,
  affiliate_disclosure, slug, created_at,
  merchants (name, logo_url, brand_color),
  categories!deals_category_id_fkey (name)
`;

// DealCard 변환 헬퍼
function toDealCard(row: any): DealCardType {
  const now = new Date();
  const endsAt = row.ends_at ? new Date(row.ends_at) : null;
  const createdAt = new Date(row.created_at);
  const urgencyTags: UrgencyTag[] = [];

  if (endsAt && !row.is_evergreen) {
    const hoursLeft = (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft > 0 && hoursLeft <= 24) urgencyTags.push('ending_soon_24h');
    else if (hoursLeft > 0 && hoursLeft <= 72) urgencyTags.push('ending_soon_3d');
  }
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (createdAt >= todayStart) urgencyTags.push('new_today');

  return {
    id: row.id,
    title: row.title,
    benefit_summary: row.benefit_summary || '',
    deal_type: row.deal_type,
    merchant_name: row.merchants?.name || '브랜드',
    merchant_logo_url: row.merchants?.logo_url || null,
    merchant_brand_color: row.merchants?.brand_color || null,
    category_name: row.categories?.name || '',
    thumbnail_url: row.thumbnail_url || row.og_image_url || null,
    coupon_code: row.coupon_code || null,
    discount_value: row.discount_value ? Number(row.discount_value) : null,
    discount_type: row.discount_type || null,
    price: row.price ? Number(row.price) : null,
    original_price: row.original_price ? Number(row.original_price) : null,
    ends_at: row.ends_at,
    is_evergreen: row.is_evergreen || false,
    benefit_tags: row.benefit_tags || [],
    urgency_tags: urgencyTags,
    quality_score: row.quality_score || 0,
    is_sponsored: false,
    affiliate_disclosure: row.affiliate_disclosure || false,
    slug: row.slug,
  };
}

/**
 * 활성 딜 필터 — 만료 안 된 active 딜만 조회
 * status='active' AND (ends_at IS NULL OR ends_at > now)
 *
 * 사용법:
 *   const query = supabase.from('deals').select(DEAL_CARD_SELECT);
 *   filterActiveDeals(query, now);
 */
function filterActiveDeals(query: any, now: string) {
  return query
    .eq('status', 'active')
    .or(`ends_at.is.null,ends_at.gt.${now}`);
}

export async function getDealBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();

  // 한글 slug URL 디코딩
  const decodedSlug = decodeURIComponent(slug);

  const { data: deal, error } = await supabase
    .from('deals')
    .select(DEAL_DETAIL_SELECT)
    .eq('slug', decodedSlug)
    .in('status', ['active', 'expired'])
    .single();

  if (error || !deal) return null;

  return { deal };
}

export { toDealCard, DEAL_CARD_SELECT, filterActiveDeals };
