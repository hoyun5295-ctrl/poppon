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
          fetch('/api/deals?limit=1'),
          fetch('/api/merchants?limit=1'),
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
      href: '/deals',
      title: '딜 관리',
      desc: '검수, 승인, 숨김, 병합',
      stat: loading ? '...' : `${stats.totalDeals}개`,
      color: 'bg-red-50 text-red-700',
    },
    {
      href: '/merchants',
      title: '브랜드 관리',
      desc: '브랜드 등록/수정',
      stat: loading ? '...' : `${stats.totalMerchants}개`,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      href: '/crawls',
      title: '수급 모니터링',
      desc: 'AI 크롤러 현황',
      stat: '',
      color: 'bg-green-50 text-green-700',
    },
    {
      href: '/users',
      title: '회원 관리',
      desc: '가입자 조회/관리',
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">빠른 시작</h2>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. <Link href="/merchants" className="text-red-500 underline">브랜드 관리</Link> — 브랜드 추가/수정</li>
            <li>2. <Link href="/deals" className="text-red-500 underline">딜 관리</Link> — 딜 상태 변경</li>
            <li>3. <Link href="/crawls" className="text-red-500 underline">수급 모니터링</Link> — 크롤러 확인</li>
          </ol>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">크롤 스케줄</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>매일 06:00 KST — 자동 크롤 + 만료 처리</p>
            <p className="text-xs text-gray-400">Vercel Cron으로 실행, 수동 실행은 수급 모니터링에서</p>
          </div>
        </div>
      </div>
    </div>
  );
}
