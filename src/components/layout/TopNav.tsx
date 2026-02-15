'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, User, Heart, Bell, Send, ChevronRight } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';

const MOBILE_MENU_LINKS = [
  { href: '/me/saved', icon: Heart, label: '저장한 딜' },
  { href: '/me/follows', icon: Bell, label: '구독 관리' },
  { href: '/submit', icon: Send, label: '딜 제보하기' },
];

const QUICK_CATEGORIES = [
  { href: '/c/fashion', label: '패션', icon: '👗' },
  { href: '/c/beauty', label: '뷰티', icon: '💄' },
  { href: '/c/food', label: '식품/배달', icon: '🍔' },
  { href: '/c/living', label: '생활/리빙', icon: '🏠' },
  { href: '/c/digital', label: '디지털/가전', icon: '📱' },
  { href: '/c/travel', label: '여행/레저', icon: '✈️' },
];

export function TopNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // 모바일 메뉴 열릴 때 스크롤 방지
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-200 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 shrink-0 select-none-touch">
            <span className="text-2xl font-extrabold text-primary-500 tracking-tight">
              POPPON
            </span>
          </Link>

          {/* 데스크탑 검색바 */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/me/saved"
              className="p-2.5 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors"
              title="저장한 딜"
            >
              <Heart className="w-5 h-5" />
            </Link>
            <Link
              href="/me/settings"
              className="p-2.5 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors"
              title="알림"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <Link
              href="/auth"
              className="ml-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              로그인
            </Link>
          </nav>

          {/* 모바일 버튼들 — 최소 44px 터치 영역 */}
          <div className="flex md:hidden items-center gap-0.5">
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center w-11 h-11 rounded-lg text-surface-500 active:bg-surface-100 transition-colors"
              aria-label="검색"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/auth"
              className="flex items-center justify-center w-11 h-11 rounded-lg text-surface-500 active:bg-surface-100 transition-colors"
              aria-label="로그인"
            >
              <User className="w-5 h-5" />
            </Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
              }}
              className="flex items-center justify-center w-11 h-11 rounded-lg text-surface-500 active:bg-surface-100 transition-colors"
              aria-label="메뉴"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 모바일 검색바 — 부드러운 전환 */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-200 ease-out ${
            isSearchOpen ? 'max-h-16 pb-3 opacity-100' : 'max-h-0 pb-0 opacity-0'
          }`}
        >
          <SearchBar />
        </div>
      </div>

      {/* 모바일 메뉴 오버레이 */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/30 animate-overlay-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* 메뉴 패널 */}
          <div className="relative bg-white border-t border-surface-200 animate-slide-up max-h-[calc(100vh-3.5rem)] overflow-y-auto pb-safe">
            <nav className="max-w-7xl mx-auto px-4 py-3">
              {/* 메뉴 링크 */}
              <div className="space-y-0.5">
                {MOBILE_MENU_LINKS.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-surface-50 text-surface-700 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-surface-400" />
                    <span className="text-[15px] font-medium">{label}</span>
                  </Link>
                ))}
              </div>

              {/* 카테고리 바로가기 */}
              <div className="mt-4 pt-4 border-t border-surface-100">
                <p className="px-3 mb-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                  카테고리
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_CATEGORIES.map(({ href, label, icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-surface-50 active:bg-surface-100 transition-colors"
                    >
                      <span className="text-xl">{icon}</span>
                      <span className="text-xs text-surface-600 font-medium">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 로그인 CTA */}
              <div className="mt-4 pt-4 border-t border-surface-100">
                <Link
                  href="/auth"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500 text-white text-sm font-semibold rounded-xl active:bg-primary-600 transition-colors"
                >
                  로그인 / 회원가입
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
