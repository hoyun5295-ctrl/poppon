'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface MerchantDealTabsProps {
  activeCount: number;
  expiredCount: number;
  currentTab: 'active' | 'expired';
}

export function MerchantDealTabs({ activeCount, expiredCount, currentTab }: MerchantDealTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'active') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex border-b border-surface-200">
      <button
        onClick={() => switchTab('active')}
        className={`relative px-5 py-3 text-sm font-medium transition-colors ${
          currentTab === 'active'
            ? 'text-primary-500'
            : 'text-surface-400 hover:text-surface-600'
        }`}
      >
        진행중
        <span className={`ml-1.5 text-xs ${
          currentTab === 'active' ? 'text-primary-400' : 'text-surface-300'
        }`}>
          {activeCount}
        </span>
        {currentTab === 'active' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
        )}
      </button>
      <button
        onClick={() => switchTab('expired')}
        className={`relative px-5 py-3 text-sm font-medium transition-colors ${
          currentTab === 'expired'
            ? 'text-primary-500'
            : 'text-surface-400 hover:text-surface-600'
        }`}
      >
        종료됨
        <span className={`ml-1.5 text-xs ${
          currentTab === 'expired' ? 'text-primary-400' : 'text-surface-300'
        }`}>
          {expiredCount}
        </span>
        {currentTab === 'expired' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
        )}
      </button>
    </div>
  );
}
