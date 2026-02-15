'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Merchant {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  parent_id: string | null;
  depth: number;
}

interface DealFormData {
  title: string;
  description: string;
  deal_type: string;
  status: string;
  channel: string;
  merchant_id: string;
  category_id: string;
  subcategory_id: string;
  benefit_tags: string[];
  benefit_summary: string;
  coupon_code: string;
  discount_value: string;
  discount_type: string;
  price: string;
  original_price: string;
  landing_url: string;
  source_url: string;
  source_type: string;
  thumbnail_url: string;
  how_to_use: string;
  starts_at: string;
  ends_at: string;
  is_evergreen: boolean;
  quality_score: string;
}

const EMPTY_FORM: DealFormData = {
  title: '',
  description: '',
  deal_type: 'A1',
  status: 'active',
  channel: 'online',
  merchant_id: '',
  category_id: '',
  subcategory_id: '',
  benefit_tags: [],
  benefit_summary: '',
  coupon_code: '',
  discount_value: '',
  discount_type: 'percent',
  price: '',
  original_price: '',
  landing_url: '',
  source_url: '',
  source_type: 'admin',
  thumbnail_url: '',
  how_to_use: '',
  starts_at: '',
  ends_at: '',
  is_evergreen: false,
  quality_score: '50',
};

const BENEFIT_TAGS = [
  { value: 'percent_off', label: '% 할인' },
  { value: 'amount_off', label: '원 할인' },
  { value: 'bogo', label: '1+1' },
  { value: 'free_shipping', label: '무료배송' },
  { value: 'gift_with_purchase', label: '사은품' },
  { value: 'bundle_deal', label: '세트할인' },
  { value: 'clearance', label: '클리어런스' },
  { value: 'member_only', label: '회원전용' },
  { value: 'new_user', label: '신규가입' },
  { value: 'app_only', label: '앱전용' },
  { value: 'limited_time', label: '한정시간' },
];

interface DealFormProps {
  initialData?: Partial<DealFormData>;
  dealId?: string;
  mode: 'create' | 'edit';
}

export default function DealForm({ initialData, dealId, mode }: DealFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DealFormData>({ ...EMPTY_FORM, ...initialData });
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 드롭다운 데이터 로드
  useEffect(() => {
    fetch('/api/admin/merchants?limit=500')
      .then((r) => r.json())
      .then((d) => setMerchants(d.merchants || []))
      .catch(() => {});
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const parentCategories = categories.filter((c) => c.depth === 0);
  const subCategories = categories.filter(
    (c) => c.depth === 1 && c.parent_id === form.category_id
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

  const toggleBenefitTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      benefit_tags: prev.benefit_tags.includes(tag)
        ? prev.benefit_tags.filter((t) => t !== tag)
        : [...prev.benefit_tags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.merchant_id || !form.category_id || !form.landing_url) {
      setError('필수 항목을 모두 입력해주세요 (제목, 브랜드, 카테고리, 랜딩URL)');
      return;
    }

    setSaving(true);
    setError('');

    // DB 형식에 맞게 변환
    const payload: Record<string, unknown> = {
      ...form,
      discount_value: form.discount_value ? parseFloat(form.discount_value) : null,
      price: form.price ? parseFloat(form.price) : null,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      quality_score: parseInt(form.quality_score) || 50,
      subcategory_id: form.subcategory_id || null,
      coupon_code: form.coupon_code || null,
      source_url: form.source_url || null,
      thumbnail_url: form.thumbnail_url || null,
      how_to_use: form.how_to_use || null,
      description: form.description || null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };

    // 가격딜(A2) → 할인율 자동 계산
    if (payload.price && payload.original_price) {
      payload.discount_rate = Math.round(
        ((Number(payload.original_price) - Number(payload.price)) / Number(payload.original_price)) * 100
      );
    }

    try {
      const url =
        mode === 'edit'
          ? `/api/admin/deals/${dealId}`
          : '/api/admin/deals';
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

      router.push('/admin/deals');
      router.refresh();
    } catch {
      setError('네트워크 오류');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* ===== 기본 정보 ===== */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">기본 정보</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            딜 제목 <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="예: 올리브영 전 상품 15% 할인 쿠폰"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="딜에 대한 상세 설명"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">딜 타입</label>
            <select
              name="deal_type"
              value={form.deal_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="A1">A1 — 쿠폰/프로모</option>
              <option value="A2">A2 — 가격딜</option>
              <option value="B">B — 앱쿠폰/링크</option>
              <option value="C">C — 오프라인</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="active">active (노출중)</option>
              <option value="pending">pending (검수중)</option>
              <option value="hidden">hidden (숨김)</option>
              <option value="expired">expired (만료)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">채널</label>
            <select
              name="channel"
              value={form.channel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="online">온라인</option>
              <option value="offline">오프라인</option>
              <option value="hybrid">온+오프</option>
            </select>
          </div>
        </div>
      </section>

      {/* ===== 브랜드 & 카테고리 ===== */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">브랜드 & 카테고리</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              브랜드 <span className="text-red-500">*</span>
            </label>
            <select
              name="merchant_id"
              value={form.merchant_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">선택하세요</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {merchants.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">
                브랜드가 없습니다.{' '}
                <a href="/admin/merchants/new" className="underline">
                  먼저 등록하세요
                </a>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              출처 타입
            </label>
            <select
              name="source_type"
              value={form.source_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="admin">어드민 직접등록</option>
              <option value="crawl">크롤링</option>
              <option value="brand">브랜드 제출</option>
              <option value="user_submit">사용자 제보</option>
              <option value="affiliate">제휴 네트워크</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={(e) => {
                handleChange(e);
                setForm((prev) => ({ ...prev, subcategory_id: '' }));
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">선택하세요</option>
              {parentCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              중카테고리
            </label>
            <select
              name="subcategory_id"
              value={form.subcategory_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              disabled={!form.category_id}
            >
              <option value="">선택하세요</option>
              {subCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ===== 혜택 정보 ===== */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">혜택 정보</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">혜택 요약</label>
          <input
            name="benefit_summary"
            value={form.benefit_summary}
            onChange={handleChange}
            placeholder="예: 최대 50% 할인 + 무료배송"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">혜택 태그</label>
          <div className="flex flex-wrap gap-2">
            {BENEFIT_TAGS.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleBenefitTag(tag.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  form.benefit_tags.includes(tag.value)
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">쿠폰 코드</label>
            <input
              name="coupon_code"
              value={form.coupon_code}
              onChange={handleChange}
              placeholder="SAVE50"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">할인 값</label>
            <input
              name="discount_value"
              value={form.discount_value}
              onChange={handleChange}
              type="number"
              placeholder="50"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">할인 타입</label>
            <select
              name="discount_type"
              value={form.discount_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="percent">% 할인</option>
              <option value="amount">원 할인</option>
            </select>
          </div>
        </div>

        {/* 가격딜(A2) 전용 */}
        {form.deal_type === 'A2' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">특가 (원)</label>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                type="number"
                placeholder="29900"
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                정가 (원)
              </label>
              <input
                name="original_price"
                value={form.original_price}
                onChange={handleChange}
                type="number"
                placeholder="59800"
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        )}
      </section>

      {/* ===== 링크 & 이미지 ===== */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">링크 & 이미지</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            랜딩 URL <span className="text-red-500">*</span>
          </label>
          <input
            name="landing_url"
            value={form.landing_url}
            onChange={handleChange}
            type="url"
            placeholder="https://www.oliveyoung.co.kr/..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">출처 URL</label>
          <input
            name="source_url"
            value={form.source_url}
            onChange={handleChange}
            type="url"
            placeholder="원본 이벤트 페이지 URL"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">썸네일 URL</label>
          <input
            name="thumbnail_url"
            value={form.thumbnail_url}
            onChange={handleChange}
            type="url"
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
          {form.thumbnail_url && (
            <img
              src={form.thumbnail_url}
              alt="preview"
              className="mt-2 w-24 h-24 object-cover rounded-lg border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이용 방법</label>
          <textarea
            name="how_to_use"
            value={form.how_to_use}
            onChange={handleChange}
            rows={2}
            placeholder="쿠폰 코드를 결제 시 입력하세요"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
      </section>

      {/* ===== 기간 & 점수 ===== */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">기간 & 점수</h2>

        <div className="flex items-center gap-3 mb-2">
          <input
            type="checkbox"
            name="is_evergreen"
            checked={form.is_evergreen}
            onChange={handleChange}
            id="is_evergreen"
            className="rounded"
          />
          <label htmlFor="is_evergreen" className="text-sm text-gray-700">
            상시 딜 (종료일 없음)
          </label>
        </div>

        {!form.is_evergreen && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작일시</label>
              <input
                name="starts_at"
                value={form.starts_at}
                onChange={handleChange}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료일시</label>
              <input
                name="ends_at"
                value={form.ends_at}
                onChange={handleChange}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            품질 점수 (0-100): {form.quality_score}
          </label>
          <input
            name="quality_score"
            value={form.quality_score}
            onChange={handleChange}
            type="range"
            min="0"
            max="100"
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>낮음</span>
            <span>보통</span>
            <span>높음</span>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? '저장 중...' : mode === 'edit' ? '수정 저장' : '딜 등록'}
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
