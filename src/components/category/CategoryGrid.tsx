import Link from 'next/link';
import { MAIN_CATEGORIES } from '@/lib/constants';
import { CategoryIcon } from '@/components/category/CategoryIcon';

export function CategoryGrid() {
  return (
    <section className="py-2 sm:py-4">
      {/* 모바일: 가로 스크롤 1줄 / PC: 12열 그리드 */}
      <div className="flex sm:grid sm:grid-cols-6 md:grid-cols-12 gap-1 sm:gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {MAIN_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/c/${cat.slug}`}
            className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl 
                       hover:bg-surface-50 active:bg-surface-100 transition-colors group shrink-0
                       min-w-[60px] sm:min-w-0"
          >
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
              style={{ backgroundColor: `${cat.color}15` }}
            >
              <CategoryIcon slug={cat.slug} size={20} color={cat.color} />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-surface-600 group-hover:text-surface-900 text-center whitespace-nowrap">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
