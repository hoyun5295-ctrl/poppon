'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DealForm from '@/components/admin/DealForm';

export default function EditDealPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/deals/${dealId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          // datetime-local 형식으로 변환
          const deal = data.deal;
          if (deal.starts_at) {
            deal.starts_at = deal.starts_at.slice(0, 16);
          }
          if (deal.ends_at) {
            deal.ends_at = deal.ends_at.slice(0, 16);
          }
          // null → 빈 문자열 변환
          Object.keys(deal).forEach((key) => {
            if (deal[key] === null) deal[key] = '';
          });
          setInitialData(deal);
        }
      })
      .catch(() => setError('데이터를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [dealId]);

  if (loading) {
    return <div className="text-gray-400 p-12 text-center">불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-12 text-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">딜 수정</h1>
      {initialData && <DealForm mode="edit" dealId={dealId} initialData={initialData} />}
    </div>
  );
}
