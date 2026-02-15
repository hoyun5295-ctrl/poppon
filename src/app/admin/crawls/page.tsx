'use client';

import { useEffect, useState, useCallback } from 'react';

interface AICrawlStats {
  totalConnectors: number;
  totalCrawledDeals: number;
  pendingDeals: number;
}

interface Connector {
  id: string;
  name: string;
  merchant_id: string;
  source_url: string;
  status: string;
  last_run_at: string | null;
  fail_count: number;
  config: Record<string, unknown> | null;
}

interface CrawlRun {
  id: string;
  status: string;
  new_count: number;
  updated_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  tokens_used: number | null;
  crawl_connectors: { name: string } | null;
}

interface CrawlResultItem {
  connector: string;
  crawl: { dealCount: number; tokensUsed?: number; status: string; errorMessage?: string };
  save: { newCount: number; updatedCount: number; skippedCount: number } | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  disabled: 'bg-gray-100 text-gray-500',
  running: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

type BatchTarget = '1차' | '2차' | '전체';

export default function AdminCrawlsPage() {
  const [stats, setStats] = useState<AICrawlStats | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [runs, setRuns] = useState<CrawlRun[]>([]);
  const [loading, setLoading] = useState(true);

  // 크롤 실행 상태
  const [crawling, setCrawling] = useState(false);
  const [crawlingTarget, setCrawlingTarget] = useState<string>('');
  const [crawlingId, setCrawlingId] = useState<string>('');
  const [progress, setProgress] = useState<string>('');
  const [lastResult, setLastResult] = useState<string>('');

  // 필터
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-crawl');
      const data = await res.json();
      setStats(data.stats || null);
      setConnectors(data.connectors || []);
      setRuns(data.recentRuns || []);
    } catch {
      console.error('데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 배치 크롤 실행 ---
  const handleBatchCrawl = async (target: BatchTarget, autoApprove: boolean) => {
    if (crawling) return;
    if (!confirm(`${target} AI 크롤을 실행하시겠습니까?${autoApprove ? ' (자동 승인)' : ' (pending 상태)'}`)) return;

    setCrawling(true);
    setCrawlingTarget(target);
    setProgress('커넥터 목록 준비 중...');
    setLastResult('');

    try {
      // 대상 커넥터 ID 결정
      let targetIds: string[] = [];
      if (target === '전체') {
        targetIds = connectors.map(c => c.id);
      } else {
        // 1차: 처음 90개, 2차: 나머지
        const sorted = [...connectors].sort((a, b) => a.name.localeCompare(b.name));
        if (target === '1차') {
          targetIds = sorted.slice(0, 90).map(c => c.id);
        } else {
          targetIds = sorted.slice(90).map(c => c.id);
        }
      }

      setProgress(`${target} ${targetIds.length}개 커넥터 크롤 시작...`);

      const res = await fetch('/api/admin/ai-crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectorIds: targetIds,
          autoApprove,
          expireOldDeals: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLastResult(`❌ 에러: ${data.error || '알 수 없는 에러'}`);
        return;
      }

      setLastResult(
        `✅ ${target} 완료! ` +
        `${data.successCount}/${data.totalConnectors} 성공 | ` +
        `신규 ${data.totalNewDeals} | 업데이트 ${data.totalUpdatedDeals} | ` +
        `비용 ${data.estimatedCost}`
      );

      fetchData();
    } catch (err) {
      setLastResult(`❌ 실행 실패: ${(err as Error).message}`);
    } finally {
      setCrawling(false);
      setCrawlingTarget('');
      setProgress('');
    }
  };

  // --- 단일 크롤 실행 ---
  const handleSingleCrawl = async (connector: Connector) => {
    if (crawlingId) return;
    setCrawlingId(connector.id);
    setLastResult('');

    try {
      const res = await fetch(`/api/admin/ai-crawl/${connector.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoApprove: true }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        setLastResult(
          `✅ ${data.connector}: 추출 ${data.crawl?.dealsExtracted}개 → ` +
          `신규 ${data.save?.new} / 업데이트 ${data.save?.updated} / 스킵 ${data.save?.skipped} ` +
          `(${data.crawl?.estimatedCost})`
        );
      } else {
        setLastResult(`❌ ${data.connector}: ${data.error || '실패'}`);
      }

      fetchData();
    } catch {
      setLastResult('❌ 단일 크롤 실패');
    } finally {
      setCrawlingId('');
    }
  };

  // --- 필터링 ---
  const filteredConnectors = connectors.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="p-12 text-center text-gray-400">불러오는 중...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🕷️ AI 크롤 관리</h1>

      {/* === 통계 카드 === */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="활성 커넥터" value={stats.totalConnectors} color="text-green-600" />
          <StatCard label="크롤 딜 (전체)" value={stats.totalCrawledDeals} color="text-blue-600" />
          <StatCard label="승인 대기" value={stats.pendingDeals} color="text-amber-600" />
        </div>
      )}

      {/* === 배치 실행 패널 === */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">배치 크롤 실행</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <BatchButton
            label="1차 90개 (뷰티/패션/식품/이커머스)"
            onClick={() => handleBatchCrawl('1차', true)}
            disabled={crawling}
            color="bg-primary-500 hover:bg-primary-600"
          />
          <BatchButton
            label="2차 나머지 (생활/금융/문화 등)"
            onClick={() => handleBatchCrawl('2차', true)}
            disabled={crawling}
            color="bg-orange-500 hover:bg-orange-600"
          />
          <BatchButton
            label="⚡ 전체 실행"
            onClick={() => handleBatchCrawl('전체', true)}
            disabled={crawling}
            color="bg-gray-800 hover:bg-gray-900"
          />
        </div>

        {/* 진행 상태 */}
        {crawling && (
          <div className="flex items-center gap-2 py-2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">{progress || `${crawlingTarget} 실행 중...`}</span>
          </div>
        )}

        {/* 결과 메시지 */}
        {lastResult && (
          <div className={`mt-2 px-4 py-2.5 rounded-lg text-sm ${
            lastResult.startsWith('✅')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {lastResult}
          </div>
        )}
      </div>

      {/* === 커넥터 목록 === */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-gray-900">
            커넥터 ({filteredConnectors.length}/{connectors.length})
          </h2>
          <div className="flex items-center gap-2">
            {/* 검색 */}
            <input
              type="text"
              placeholder="브랜드 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-40 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="error">에러</option>
              <option value="disabled">비활성</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">브랜드</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">URL</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500">상태</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500">실패</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500">최근 실행</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredConnectors.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-900 text-xs">{c.name}</p>
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline truncate block max-w-[200px]"
                    >
                      {c.source_url.replace(/^https?:\/\//, '').substring(0, 40)}...
                    </a>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {c.fail_count > 0 ? (
                      <span className="text-xs text-red-500 font-medium">{c.fail_count}</span>
                    ) : (
                      <span className="text-xs text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-gray-400">
                    {c.last_run_at
                      ? new Date(c.last_run_at).toLocaleString('ko-KR', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : '미실행'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleSingleCrawl(c)}
                      disabled={!!crawlingId || crawling}
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium disabled:opacity-30"
                    >
                      {crawlingId === c.id ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          실행중
                        </span>
                      ) : '▶ 실행'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* === 최근 크롤 로그 === */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">최근 크롤 로그 ({runs.length})</h2>
        </div>
        {runs.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">아직 크롤 실행 기록이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">커넥터</th>
                  <th className="text-center px-4 py-2 font-medium text-gray-500">상태</th>
                  <th className="text-center px-4 py-2 font-medium text-gray-500">신규</th>
                  <th className="text-center px-4 py-2 font-medium text-gray-500">업데이트</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">에러</th>
                  <th className="text-center px-4 py-2 font-medium text-gray-500">시간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-900">
                      {run.crawl_connectors?.name || '-'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[run.status] || 'bg-gray-100'}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center text-xs">
                      {run.new_count > 0 ? (
                        <span className="text-green-600 font-medium">+{run.new_count}</span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-gray-500">
                      {run.updated_count || 0}
                    </td>
                    <td className="px-4 py-2 text-xs text-red-500 max-w-xs truncate">
                      {run.error_message || '-'}
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-gray-400">
                      {new Date(run.started_at).toLocaleString('ko-KR', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// 통계 카드
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

// 배치 실행 버튼
function BatchButton({
  label, onClick, disabled, color,
}: {
  label: string; onClick: () => void; disabled: boolean; color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${color}`}
    >
      {label}
    </button>
  );
}
