'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

interface Merchant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  official_url: string | null;
  is_verified: boolean;
  active_deal_count: number;
  created_at: string;
}

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (search) params.set('q', search);

    try {
      const res = await fetch(`/api/admin/merchants?${params}`);
      const data = await res.json();
      setMerchants(data.merchants || []);
      setTotal(data.total || 0);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 브랜드를 삭제하시겠습니까? 연결된 딜도 함께 삭제됩니다.`)) return;
    await fetch(`/api/admin/merchants/${id}`, { method: 'DELETE' });
    fetchMerchants();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">브랜드 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}개</p>
        </div>
        <Link
          href="/admin/merchants/new"
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
        >
          ➕ 새 브랜드 등록
        </Link>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput);
        }}
        className="mb-4"
      >
        <input
          type="text"
          placeholder="브랜드명으로 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </form>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">불러오는 중...</div>
        ) : merchants.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-3">등록된 브랜드가 없습니다</p>
            <Link href="/admin/merchants/new" className="text-red-500 text-sm underline">
              첫 브랜드 등록하기 →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">브랜드</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                  도메인
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">인증</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">활성 딜</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {merchants.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.logo_url ? (
                        <img
                          src={m.logo_url}
                          alt={m.name}
                          className="w-8 h-8 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                          {m.name[0]}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {m.official_url ? (
                      <a
                        href={m.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-xs"
                      >
                        {new URL(m.official_url).hostname}
                      </a>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.is_verified ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {m.active_deal_count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/admin/merchants/${m.id}/edit`}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(m.id, m.name)}
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
      </div>
    </div>
  );
}
