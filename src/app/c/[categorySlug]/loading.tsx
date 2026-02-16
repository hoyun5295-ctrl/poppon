export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 animate-pulse">
      {/* 카테고리 탭바 */}
      <div className="flex gap-6 border-b border-surface-200 py-3 mb-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-surface-100" />
            <div className="h-3 w-10 bg-surface-100 rounded" />
          </div>
        ))}
      </div>

      {/* 헤더 */}
      <div className="mb-5">
        <div className="h-7 w-24 bg-surface-100 rounded mb-2" />
        <div className="h-4 w-48 bg-surface-100 rounded" />
      </div>

      {/* 서브카테고리 칩 */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-8 w-16 bg-surface-100 rounded-full" />
        ))}
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
