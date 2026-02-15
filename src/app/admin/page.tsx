'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats {
  totalDeals: number;
  activeDeals: number;
  pendingDeals: number;
  totalMerchants: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalDeals: 0,
    activeDeals: 0,
    pendingDeals: 0,
    totalMerchants: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [dealsRes, merchantsRes] = await Promise.all([
          fetch('/api/admin/deals?limit=1'),
          fetch('/api/admin/merchants?limit=1'),
        ]);
        const dealsData = await dealsRes.json();
        const merchantsData = await merchantsRes.json();
        setStats({
          totalDeals: dealsData.total || 0,
          activeDeals: 0,
          pendingDeals: 0,
          totalMerchants: merchantsData.total || 0,
        });
      } catch {
        // 에러 무시
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    {
      href: '/admin/deals',
      title: '딜 관리',
      desc: '검수, 승인, 숨김, 병합',
      stat: loading ? '...' : `${stats.totalDeals}개`,
      color: 'bg-red-50 text-red-700',
    },
    {
      href: '/admin/merchants',
      title: '브랜드 관리',
      desc: '브랜드 등록/수정',
      stat: loading ? '...' : `${stats.totalMerchants}개`,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      href: '/admin/deals/new',
      title: '➕ 새 딜 등록',
      desc: '수동으로 딜 추가',
      stat: '',
      color: 'bg-green-50 text-green-700',
    },
    {
      href: '/admin/merchants/new',
      title: '➕ 새 브랜드 등록',
      desc: '브랜드 정보 추가',
      stat: '',
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">어드민 대시보드</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900">{card.title}</h2>
              {card.stat && (
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${card.color}`}>
                  {card.stat}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-3">빠른 시작 가이드</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          <li>1. <Link href="/admin/merchants/new" className="text-red-500 underline">브랜드 등록</Link> — 먼저 딜을 올릴 브랜드를 추가하세요</li>
          <li>2. <Link href="/admin/deals/new" className="text-red-500 underline">딜 등록</Link> — 브랜드를 선택하고 딜 정보를 입력하세요</li>
          <li>3. 상태를 &quot;active&quot;로 변경하면 홈 화면에 바로 노출됩니다</li>
        </ol>
      </div>
    </div>
  );
}
