'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: '📊' },
  { href: '/admin/deals', label: '딜 관리', icon: '🏷️' },
  { href: '/admin/merchants', label: '브랜드 관리', icon: '🏪' },
  { href: '/admin/crawls', label: '수급 모니터링', icon: '🔄' },
  { href: '/admin/ads', label: '광고 관리', icon: '📢' },
  { href: '/admin/policies', label: '운영 정책', icon: '⚙️' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-lg font-bold text-red-500">
            POPPON Admin
          </Link>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
            Phase 0
          </span>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← 사이트 보기
        </Link>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-53px)] p-4 hidden md:block">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-red-50 text-red-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
