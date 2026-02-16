export default function MerchantLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-pulse">
      {/* 브랜드 헤더 */}
      <div className="py-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-100" />
        <div className="flex-1">
          <div className="h-6 w-32 bg-surface-100 rounded mb-2" />
          <div className="h-4 w-48 bg-surface-100 rounded" />
        </div>
        <div className="h-9 w-20 bg-surface-100 rounded-lg" />
      </div>

      {/* 탭 */}
      <div className="flex gap-4 border-b border-surface-200 mb-5">
        <div className="h-10 w-24 bg-surface-100 rounded" />
        <div className="h-10 w-24 bg-surface-100 rounded" />
      </div>

      {/* 딜 리스트 */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map(card => (
          <div key={card} className="bg-white rounded-xl border border-surface-100 p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-surface-100" />
              <div className="h-3 w-16 bg-surface-100 rounded" />
            </div>
            <div className="h-4 w-full bg-surface-100 rounded mb-1.5" />
            <div className="h-4 w-3/4 bg-surface-100 rounded mb-3" />
            <div className="h-3 w-20 bg-surface-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
