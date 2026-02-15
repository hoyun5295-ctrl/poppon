'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MerchantForm from '@/components/admin/MerchantForm';

export default function EditMerchantPage() {
  const params = useParams();
  const merchantId = params.id as string;
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/merchants/${merchantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          const merchant = data.merchant;
          Object.keys(merchant).forEach((key) => {
            if (merchant[key] === null) merchant[key] = '';
          });
          setInitialData(merchant);
        }
      })
      .catch(() => setError('데이터를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [merchantId]);

  if (loading) {
    return <div className="text-gray-400 p-12 text-center">불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-12 text-center">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">브랜드 수정</h1>
      {initialData && (
        <MerchantForm mode="edit" merchantId={merchantId} initialData={initialData} />
      )}
    </div>
  );
}
