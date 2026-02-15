'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

interface Deal {
  id: string;
  title: string;
  deal_type: string;
  status: string;
  benefit_summary: string;
  coupon_code: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  source_type: string;
  quality_score: number;
  merchants: { name: string; logo_url: string | null } | null;
  categories: { name: string; icon: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  hidden: 'bg-gray-100 text-gray-500',
  expired: 'bg-red-100 text-red-700',
};

const DEAL_TYPE_LABELS: Record<string, string> = {
  A1: '쿠폰/프로모',
  A2: '가격딜',
  B: '앱쿠폰/링크',
  C: '오프라인',
};

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('q', search);

    try {
      const res = await fetch(`/api/admin/deals?${params}`);
      const data = await res.json();
      setDeals(data.deals || []);
      setTotal(data.total || 0);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchDeals();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 딜을 삭제하시겠습니까?`)) return;
    await fetch(`/api/admin/deals/${id}`, { method: 'DELETE' });
    fetchDeals();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">딜 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}개</p>
        </div>
        <Link
          href="/admin/deals/new"
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
        >
          ➕ 새 딜 등록
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
          className="flex-1"
        >
          <input
            type="text"
            placeholder="딜 제목으로 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">전체 상태</option>
          <option value="active">active</option>
          <option value="pending">pending</option>
          <option value="hidden">hidden</option>
          <option value="expired">expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">불러오는 중...</div>
        ) : deals.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-3">등록된 딜이 없습니다</p>
            <Link href="/admin/deals/new" className="text-red-500 text-sm underline">
              첫 딜 등록하기 →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">딜 정보</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">
                  브랜드
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">타입</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">상태</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                  점수
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="max-w-md">
                      <p className="font-medium text-gray-900 truncate">{deal.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {deal.benefit_summary}
                        {deal.coupon_code && (
                          <span className="ml-2 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            {deal.coupon_code}
                          </span>
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-gray-600">
                      {deal.categories?.icon} {deal.merchants?.name || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {DEAL_TYPE_LABELS[deal.deal_type] || deal.deal_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={deal.status}
                      onChange={(e) => handleStatusChange(deal.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${
                        STATUS_COLORS[deal.status] || 'bg-gray-100'
                      }`}
                    >
                      <option value="pending">pending</option>
                      <option value="active">active</option>
                      <option value="hidden">hidden</option>
                      <option value="expired">expired</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-xs text-gray-500">{deal.quality_score}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/admin/deals/${deal.id}/edit`}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(deal.id, deal.title)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              ← 이전
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              다음 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
