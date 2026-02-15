'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface MerchantFormData {
  name: string;
  description: string;
  official_url: string;
  logo_url: string;
  is_verified: boolean;
}

const EMPTY_FORM: MerchantFormData = {
  name: '',
  description: '',
  official_url: '',
  logo_url: '',
  is_verified: false,
};

interface MerchantFormProps {
  initialData?: Partial<MerchantFormData>;
  merchantId?: string;
  mode: 'create' | 'edit';
}

export default function MerchantForm({ initialData, merchantId, mode }: MerchantFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<MerchantFormData>({ ...EMPTY_FORM, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      setError('브랜드명은 필수입니다');
      return;
    }

    setSaving(true);
    setError('');

    const payload: Record<string, unknown> = {
      ...form,
      description: form.description || null,
      official_url: form.official_url || null,
      logo_url: form.logo_url || null,
    };

    try {
      const url =
        mode === 'edit'
          ? `/api/admin/merchants/${merchantId}`
          : '/api/admin/merchants';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '저장 실패');
        return;
      }

      router.push('/admin/merchants');
      router.refresh();
    } catch {
      setError('네트워크 오류');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">브랜드 정보</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            브랜드명 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="예: 올리브영"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            placeholder="브랜드 소개"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">공식 사이트 URL</label>
          <input
            name="official_url"
            value={form.official_url}
            onChange={handleChange}
            type="url"
            placeholder="https://www.oliveyoung.co.kr"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">로고 URL</label>
          <input
            name="logo_url"
            value={form.logo_url}
            onChange={handleChange}
            type="url"
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
          {form.logo_url && (
            <img
              src={form.logo_url}
              alt="logo preview"
              className="mt-2 w-16 h-16 object-cover rounded-lg border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_verified"
            checked={form.is_verified}
            onChange={handleChange}
            id="is_verified"
            className="rounded"
          />
          <label htmlFor="is_verified" className="text-sm text-gray-700">
            인증된 브랜드 (verified 배지 표시)
          </label>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? '저장 중...' : mode === 'edit' ? '수정 저장' : '브랜드 등록'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          취소
        </button>
      </div>
    </form>
  );
}
