'use client';

import { useEffect, useState, useRef } from 'react';
import { DealDetail } from './DealDetail';

var SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
var SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
var SELECT = '*,merchants(name,slug,logo_url,brand_color),categories!deals_category_id_fkey(name,slug)';
var dealCache = new Map();

export function DealDetailClient({ slug, isModal = false }: { slug: string; isModal?: boolean }) {
  var decodedSlug = decodeURIComponent(slug);
  var cached = dealCache.get(decodedSlug);
  var [deal, setDeal] = useState(cached || null);
  var [loading, setLoading] = useState(!cached);
  var [error, setError] = useState(false);
  var fetchedRef = useRef(false);

  useEffect(function() {
    if (cached) { setDeal(cached); setLoading(false); return; }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    var mounted = true;
    var params = new URLSearchParams({ select: SELECT, slug: 'eq.' + decodedSlug, status: 'in.("active","expired")' });
    fetch(SUPABASE_URL + '/rest/v1/deals?' + params, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Accept: 'application/json' }
    })
      .then(function(r) { return r.json(); })
      .then(function(rows) {
        if (!mounted) return;
        if (!rows || !rows.length) { setError('no data'); return; }
        dealCache.set(decodedSlug, rows[0]);
        setDeal(rows[0]);
      })
      .catch(function(e) { if (mounted) setError(e.message); })
      .finally(function() { if (mounted) setLoading(false); });
    return function() { mounted = false; };
  }, [decodedSlug, cached]);

  if (loading) return <DealDetailSkeleton />;
  if (error || !deal) return <div className="py-12 text-center"><p className="text-red-500 text-xs">{String(error)}</p><p className="text-surface-400 text-sm mt-2">딜을 찾을 수 없습니다</p></div>;
  return <DealDetail deal={deal} isModal={isModal} />;
}

function DealDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-4"><div className="w-11 h-11 rounded-xl bg-surface-100" /><div className="space-y-1.5"><div className="h-3.5 w-24 bg-surface-100 rounded" /><div className="h-3 w-16 bg-surface-100 rounded" /></div></div>
      <div className="h-5 w-full bg-surface-100 rounded mb-1.5" />
      <div className="h-5 w-3/4 bg-surface-100 rounded mb-3" />
      <div className="h-5 w-40 bg-surface-100 rounded mb-3" />
      <div className="h-4 w-48 bg-surface-100 rounded mb-4" />
      <div className="h-12 w-full bg-surface-50 border-2 border-dashed border-surface-200 rounded-lg mb-3" />
      <div className="h-12 w-full bg-surface-100 rounded-xl" />
    </div>
  );
}