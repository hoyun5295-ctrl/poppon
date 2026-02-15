'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  deal_count: number;
}

interface SubCategoryChipsProps {
  subcategories: SubCategory[];
  currentSub: string;
}

export function SubCategoryChips({ subcategories, currentSub }: SubCategoryChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (subcategories.length === 0) return null;

  function selectSub(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('sub', slug);
    } else {
      params.delete('sub');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      <button
        onClick={() => selectSub('')}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          !currentSub
            ? 'bg-surface-900 text-white'
            : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
        }`}
      >
        전체
      </button>
      {subcategories.map((sub) => (
        <button
          key={sub.id}
          onClick={() => selectSub(sub.slug)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            currentSub === sub.slug
              ? 'bg-surface-900 text-white'
              : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
          }`}
        >
          {sub.name}
          {sub.deal_count > 0 && (
            <span className={`ml-1 ${
              currentSub === sub.slug ? 'text-surface-400' : 'text-surface-400'
            }`}>
              {sub.deal_count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
