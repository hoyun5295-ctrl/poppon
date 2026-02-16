export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 animate-pulse">
      {/* 검색 헤더 */}
      <div className="py-5">
        <div className="h-5 w-40 bg-surface-100 rounded mb-2" />
        <div className="h-4 w-24 bg-surface-100 rounded" />
      </div>

      {/* 필터/정렬 바 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-20 bg-surface-100 rounded-lg" />
          ))}
        </div>
        <div className="h-8 w-24 bg-surface-100 rounded-lg" />
      </div>

      {/* 딜 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(card => (
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
