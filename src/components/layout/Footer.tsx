import Link from 'next/link';
import { MAIN_CATEGORIES } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="bg-surface-900 text-surface-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* 브랜드 */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-extrabold text-white tracking-tight">POPPON</span>
            <p className="mt-2 text-sm text-surface-400">
              한국의 모든 할인/쿠폰/프로모션을 한 곳에서
            </p>
          </div>

          {/* 카테고리 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">카테고리</h3>
            <ul className="space-y-2">
              {MAIN_CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/c/${cat.slug}`} className="text-sm text-surface-400 hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">카테고리</h3>
            <ul className="space-y-2">
              {MAIN_CATEGORIES.slice(6).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/c/${cat.slug}`} className="text-sm text-surface-400 hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 안내 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">안내</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/submit" className="text-sm text-surface-400 hover:text-white transition-colors">
                  딜 제보하기
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-sm text-surface-400 hover:text-white transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-sm text-surface-400 hover:text-white transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/legal/marketing" className="text-sm text-surface-400 hover:text-white transition-colors">
                  마케팅수신 동의
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 */}
        <div className="mt-10 pt-6 border-t border-surface-700">
          <p className="text-xs text-surface-500">
            © {new Date().getFullYear()} POPPON by INVITO. All rights reserved.
          </p>
          <p className="text-xs text-surface-500 mt-1">
            팝폰은 딜/쿠폰 정보를 모아서 제공하는 플랫폼이며, 개별 딜의 유효성과 조건은 해당 브랜드의 정책에 따릅니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
