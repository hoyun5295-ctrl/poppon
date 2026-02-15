import Link from 'next/link';
import { MAIN_CATEGORIES } from '@/lib/constants';

export function CategoryGrid() {
  return (
    <section className="py-8">
      <h2 className="text-lg font-bold text-surface-900 mb-4">카테고리</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3">
        {MAIN_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/c/${cat.slug}`}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl 
                       hover:bg-surface-50 transition-colors group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">
              {cat.icon}
            </span>
            <span className="text-xs font-medium text-surface-600 group-hover:text-surface-900 text-center whitespace-nowrap">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
