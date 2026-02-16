'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, User, Heart, Bell, Send, ChevronRight, LogOut, Settings } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { useAuth, setPendingToast } from '@/lib/auth/AuthProvider';

const MOBILE_MENU_LINKS = [
  { href: '/me', icon: Heart, label: '저장한 딜', authRequired: true },
  { href: '/me', icon: Bell, label: '구독 관리', authRequired: true },
  { href: '/submit', icon: Send, label: '딜 제보하기', authRequired: false },
];

const QUICK_CATEGORIES = [
  { href: '/c/fashion', label: '패션', icon: '👗' },
  { href: '/c/beauty', label: '뷰티', icon: '💄' },
  { href: '/c/food', label: '식품/배달', icon: '🍔' },
  { href: '/c/living', label: '생활/리빙', icon: '🏠' },
  { href: '/c/travel', label: '여행/레저', icon: '✈️' },
  { href: '/c/culture', label: '문화/콘텐츠', icon: '🎬' },
];

export function TopNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isLoggedIn, profile, signOut, openAuthSheet } = useAuth();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // 로그아웃 — signOut await + 3초 타임아웃 보장
  const handleSignOut = async () => {
    setPendingToast('로그아웃되었습니다', 'success');
    await Promise.race([
      signOut(),
      new Promise(r => setTimeout(r, 3000)),
    ]);
    window.location.href = '/';
  };

  const handleAuthAction = () => {
    if (isLoggedIn) {
      window.location.href = '/me';
    } else {
      openAuthSheet();
    }
  };

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

          {/* 데스크톱 검색바 */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/me"
              className="p-2.5 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors"
              title="저장한 딜"
            >
              <Heart className="w-5 h-5" />
            </Link>
            <Link
              href="/me"
              className="p-2.5 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors"
              title="알림"
            >
              <Bell className="w-5 h-5" />
            </Link>

            {isLoggedIn ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-100 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {profile?.nickname?.charAt(0) || profile?.name?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-surface-700">
                    {profile?.nickname || profile?.name || '마이'}
                  </span>
                </button>

                {/* 데스크톱 프로필 드롭다운 — 투명 오버레이로 바깥 클릭 감지 */}
                {isProfileMenuOpen && (
                  <>
                    {/* 투명 오버레이: 바깥 클릭 시 닫기 */}
                    <div
                      className="fixed inset-0 z-[59]"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    {/* 드롭다운 메뉴 */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-surface-200 py-1 z-[60]">
                      <Link
                        href="/me"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <User className="w-4 h-4 text-surface-400" />
                        마이페이지
                      </Link>
                      <Link
                        href="/me"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-surface-400" />
                        설정
                      </Link>
                      <div className="h-px bg-surface-100 my-1" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthSheet}
                className="ml-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                로그인
              </button>
            )}
          </nav>

          {/* 모바일 버튼 */}
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
            <button
              onClick={handleAuthAction}
              className="flex items-center justify-center w-11 h-11 rounded-lg text-surface-500 active:bg-surface-100 transition-colors"
              aria-label={isLoggedIn ? '마이페이지' : '로그인'}
            >
              {isLoggedIn ? (
                <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">
                    {profile?.nickname?.charAt(0) || profile?.name?.charAt(0) || 'P'}
                  </span>
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
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

        {/* 모바일 검색바 */}
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
          <div
            className="absolute inset-0 bg-black/30 animate-overlay-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative bg-white border-t border-surface-200 animate-slide-up max-h-[calc(100vh-3.5rem)] overflow-y-auto pb-safe">
            <nav className="max-w-7xl mx-auto px-4 py-3">
              {/* 로그인 상태 헤더 */}
              {isLoggedIn && (
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-surface-50 rounded-xl">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {profile?.nickname?.charAt(0) || profile?.name?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-surface-900">
                      {profile?.nickname || profile?.name || '사용자'}
                    </p>
                    <p className="text-xs text-surface-400">{profile?.phone}</p>
                  </div>
                </div>
              )}

              {/* 메뉴 링크 */}
              <div className="space-y-0.5">
                {MOBILE_MENU_LINKS.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={label}
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

              {/* 로그인/로그아웃 CTA */}
              <div className="mt-4 pt-4 border-t border-surface-100">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm text-surface-500 hover:text-surface-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); openAuthSheet(); }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500 text-white text-sm font-semibold rounded-xl active:bg-primary-600 transition-colors"
                  >
                    로그인 / 회원가입
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
