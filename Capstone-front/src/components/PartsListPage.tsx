import React, { useEffect, useMemo, useState } from 'react';
import { 
  Search, 
  BarChart3, 
  ExternalLink, 
  Cpu, 
  HardDrive, 
  Layout, 
  Monitor, 
  Zap, 
  Box, 
  Swords, 
  RotateCcw, 
  Fan, 
  RefreshCw, 
  AlertCircle, 
  ArrowUpDown,
  Tag,
  CheckCircle2,
  TrendingUp,
  Scale
} from 'lucide-react';
import { fetchManualParts } from '../utils/api';
import { benchScore, danawaLink, MANUAL_CATEGORIES, specsText } from '../utils/hardware';
import type { ManualCategory, ManualPart } from '../types/pc';

interface PartItem {
  id: number;
  category: string;
  name: string;
  brand: string;
  price: number;
  benchmarkScore: number;
  specSummary: string;
  productUrl: string | null;
}

type SortOption = 'BENCH_DESC' | 'BENCH_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC';

const categories = [
  { id: 'ALL', label: '전체 보기', icon: <Box size={18}/> },
  { id: 'CPU', label: 'CPU (프로세서)', icon: <Cpu size={18}/> },
  { id: 'GPU', label: '그래픽카드', icon: <Monitor size={18}/> },
  { id: 'MAINBOARD', label: '메인보드', icon: <Layout size={18}/> },
  { id: 'RAM', label: '메모리 (RAM)', icon: <Zap size={18}/> },
  { id: 'SSD', label: '스토리지 (SSD)', icon: <HardDrive size={18}/> },
  { id: 'POWER', label: '파워', icon: <Zap size={18}/> },
  { id: 'CASE', label: '케이스', icon: <Box size={18}/> },
  { id: 'COOLER', label: '쿨러', icon: <Fan size={18}/> },
];

function displayPart(p: ManualPart, c: ManualCategory): PartItem {
  return {
    id: p.id,
    category: c.toUpperCase(),
    name: p.name,
    brand: p.brand || p.chipsetBrand || '미표기',
    price: p.price ?? 0,
    benchmarkScore: benchScore(p) ?? 0,
    specSummary: specsText(p),
    productUrl: p.productUrl ?? null,
  };
}

export function PartsListPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('BENCH_DESC');
  const [compareList, setCompareList] = useState<PartItem[]>([]);
  const [partsByCategory, setPartsByCategory] = useState<Partial<Record<ManualCategory, PartItem[]>>>({});
  const [counts, setCounts] = useState<Partial<Record<ManualCategory, number>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.allSettled(MANUAL_CATEGORIES.map(async c => ({ category: c, data: await fetchManualParts(c, {}) }))).then(results => {
      if (!active) return;
      const loaded: Partial<Record<ManualCategory, PartItem[]>> = {};
      const nums: Partial<Record<ManualCategory, number>> = {};
      let failures = 0;
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          loaded[r.value.category] = r.value.data.parts.map(p => displayPart(p, r.value.category));
          nums[r.value.category] = r.value.data.totalCount;
        } else failures++;
      });
      setPartsByCategory(loaded);
      setCounts(nums);
      if (failures) setError(`${failures}개 부품 카테고리 조회에 실패했습니다. 서버 연결 및 API 설정을 확인해 주세요.`);
      setLoading(false);
    });
    return () => { active = false; };
  }, [refreshTick]);

  const hardwareParts = useMemo(() => MANUAL_CATEGORIES.flatMap(c => partsByCategory[c] ?? []), [partsByCategory]);
  const totalAssetCount = MANUAL_CATEGORIES.reduce((n, c) => n + (counts[c] ?? 0), 0);

  const toggleCompare = (part: PartItem) => {
    if (compareList.some(p => p.id === part.id && p.category === part.category)) {
      setCompareList(prev => prev.filter(p => p.id !== part.id || p.category !== part.category));
    } else {
      if (!part.benchmarkScore) {
        alert('벤치마크 점수가 등록된 부품만 비교할 수 있습니다.');
        return;
      }
      if (compareList.length > 0 && compareList[0].category !== part.category) {
        alert('동일한 카테고리의 제품끼리만 비교할 수 있습니다.');
        return;
      }
      if (compareList.length >= 2) {
        alert("성능 비교는 한 번에 2개 부품까지 가능합니다.");
        return;
      }
      setCompareList(prev => [...prev, part]);
    }
  };

  const getFilteredMaxScore = () => {
    const currentCategoryParts = hardwareParts.filter(p => selectedCategory === 'ALL' || p.category === selectedCategory);
    return Math.max(...currentCategoryParts.map(p => p.benchmarkScore), 1);
  };

  const currentMaxScore = getFilteredMaxScore();

  // 검색 및 정렬 복합 필터링
  const filteredAndSortedParts = useMemo(() => {
    const filtered = hardwareParts.filter(part => {
      const matchesCategory = selectedCategory === 'ALL' || part.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        part.name.toLowerCase().includes(q) || 
        part.brand.toLowerCase().includes(q) ||
        part.specSummary.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'BENCH_DESC':
          return b.benchmarkScore - a.benchmarkScore;
        case 'BENCH_ASC':
          return a.benchmarkScore - b.benchmarkScore;
        case 'PRICE_DESC':
          return b.price - a.price;
        case 'PRICE_ASC':
          return a.price - b.price;
        case 'NAME_ASC':
          return a.name.localeCompare(b.name, 'ko');
        default:
          return 0;
      }
    });
  }, [hardwareParts, selectedCategory, searchQuery, sortOption]);

  return (
    <div className="w-full">
      
      {/* 1:1 성능 및 스펙 대결 VS 모드 위젯 */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Swords size={22} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">하드웨어 1:1 상세 스펙 & 성능 대결 모드</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">두 제품의 성능 점수, 가격 격차, 세부 스펙을 정밀 비교합니다.</p>
            </div>
          </div>
          {compareList.length > 0 && (
            <button
              onClick={() => setCompareList([])}
              className="text-xs font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition-colors border border-slate-200/80"
            >
              <RotateCcw size={14} /> 비교 초기화
            </button>
          )}
        </div>

        {compareList.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-sm font-semibold text-slate-500">
            하단 목록에서 <span className="text-purple-600 font-bold">"VS 비교"</span> 버튼을 눌러 비교할 부품 2개를 선택해 보세요.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compareList.map((item, idx) => {
                const other = compareList[1 - idx];
                let percentDiff = 0;
                let priceDiff = 0;
                if (other) {
                  if (other.benchmarkScore > 0) {
                    percentDiff = Math.round(((item.benchmarkScore - other.benchmarkScore) / other.benchmarkScore) * 100);
                  }
                  priceDiff = item.price - other.price;
                }
                const link = danawaLink(item);

                return (
                  <div key={item.id} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg">
                          슬롯 {idx + 1} · {item.category}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase">{item.brand}</span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base mt-2.5 leading-snug">{item.name}</h4>
                      
                      {/* 점수 및 가격 요약 */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/80">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-[11px] font-bold text-slate-400 block">벤치마크 점수</span>
                          <span className="text-base font-black text-blue-600">
                            {item.benchmarkScore ? `${item.benchmarkScore.toLocaleString()}점` : '점수 없음'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-[11px] font-bold text-slate-400 block">DB 기준 가격</span>
                          <span className="text-base font-black text-slate-900">
                            {item.price ? `${item.price.toLocaleString()}원` : '가격 미정'}
                          </span>
                        </div>
                      </div>

                      {/* 상대 평가 뱃지 */}
                      {other && (
                        <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200/60 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-500">성능 우위:</span>
                            <span className={`px-2 py-0.5 rounded-md font-black text-xs ${
                              percentDiff > 0 
                                ? "bg-emerald-100 text-emerald-800" 
                                : percentDiff < 0 
                                ? "bg-rose-100 text-rose-800" 
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {percentDiff > 0 ? `+${percentDiff}% 우세` : percentDiff < 0 ? `${percentDiff}% 열세` : '동일 성능'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-500">가격 차이:</span>
                            <span className="font-bold text-slate-800">
                              {priceDiff > 0 
                                ? `+${priceDiff.toLocaleString()}원 (더 비쌈)` 
                                : priceDiff < 0 
                                ? `${Math.abs(priceDiff).toLocaleString()}원 (더 저렴)` 
                                : '동일 가격'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 세부 스펙 */}
                      <div className="mt-3">
                        <span className="text-xs font-bold text-slate-500 block mb-1">상세 스펙 요약</span>
                        <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed font-medium break-keep">
                          {item.specSummary || '상세 규격 정보가 없습니다.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 font-extrabold inline-flex items-center gap-1 hover:underline"
                      >
                        {link.isDirect ? '다나와 상품 정보' : '다나와 검색'} <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => toggleCompare(item)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline"
                      >
                        비교 제거
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2제품 비교 완료 시 종합 분석 요약 배너 */}
            {compareList.length === 2 && (
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <Scale className="text-purple-600 shrink-0" size={18} />
                  <span>
                    <strong>{compareList[0].name}</strong> vs <strong>{compareList[1].name}</strong> 비교 완료
                  </span>
                </div>
                <div className="text-slate-500 text-xs text-center sm:text-right">
                  점수 격차: <strong className="text-purple-700">{Math.abs(compareList[0].benchmarkScore - compareList[1].benchmarkScore).toLocaleString()}점</strong> · 
                  가격 격차: <strong className="text-blue-700">{Math.abs(compareList[0].price - compareList[1].price).toLocaleString()}원</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 대시보드 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-100">
          <p className="text-xs text-blue-700 font-extrabold uppercase tracking-wider mb-1">총 하드웨어 자산</p>
          <p className="text-3xl font-black text-slate-900">{totalAssetCount.toLocaleString()}<span className="text-base font-bold text-slate-600 ml-1.5">개 모델</span></p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 rounded-2xl border border-indigo-100">
          <p className="text-xs text-indigo-700 font-extrabold uppercase tracking-wider mb-1">표준 카테고리 풀</p>
          <p className="text-3xl font-black text-slate-900">8<span className="text-base font-bold text-slate-600 ml-1.5">개 규격</span></p>
        </div>
        <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/50 p-6 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-600 font-extrabold uppercase tracking-wider mb-1">데이터 동기화 규격</p>
          <p className="text-base font-bold text-slate-900 flex items-center gap-2 mt-2">
            <span className={`w-3 h-3 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500'}`} /> {loading ? 'MariaDB 조회 중' : error ? '일부 데이터 로드 실패' : '백엔드 DB 동기화 완료'}
          </p>
        </div>
      </div>

      {/* 카테고리 탭, 검색창 및 정렬 드롭다운 컨트롤 바 */}
      <div className="mb-6 space-y-4">
        {/* 카테고리 버튼 그룹 */}
        <div className="flex gap-2 overflow-x-auto pb-2 select-none no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setSelectedCategory(cat.id); setCompareList([]); }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 border ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* 검색창 및 정렬 셀렉터 */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="부품명, 제조사, 상세 스펙 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown size={16} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-600">정렬:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs cursor-pointer"
            >
              <option value="BENCH_DESC">성능 점수 높은순</option>
              <option value="BENCH_ASC">성능 점수 낮은순</option>
              <option value="PRICE_DESC">가격 높은순</option>
              <option value="PRICE_ASC">가격 낮은순</option>
              <option value="NAME_ASC">제품명 (가나다순)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 p-4 border border-rose-200 rounded-xl bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle size={17}/> {error} 
          <button className="ml-auto font-bold underline" onClick={() => setRefreshTick(v => v + 1)}>재시도</button>
        </div>
      )}
      
      {loading && (
        <div className="mb-5 text-blue-600 text-sm font-semibold flex items-center gap-2">
          <RefreshCw size={17} className="animate-spin"/> DB에 저장된 하드웨어 목록을 불러오는 중입니다...
        </div>
      )}

      {/* 부품 마스터 리스트 */}
      {filteredAndSortedParts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-500 font-bold shadow-xs text-base">
          {loading ? 'DB 하드웨어를 불러오는 중입니다...' : '검색 조건 및 카테고리에 부합하는 하드웨어 데이터가 존재하지 않습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredAndSortedParts.map((part) => {
              const barPercentage = ((part.benchmarkScore / currentMaxScore) * 100).toFixed(0);
              const link = danawaLink(part);
              const isComparing = compareList.some(p => p.id === part.id && p.category === part.category);

              return (
                <div key={`${part.category}-${part.id}`} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-slate-50/50 transition-colors">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-extrabold uppercase tracking-wide border border-blue-100">
                        {part.category}
                      </span>
                      <span className="text-xs text-slate-500 font-black tracking-tight uppercase">{part.brand}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">{part.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                      {part.specSummary}
                    </p>
                  </div>

                  <div className="w-full md:w-60 shrink-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1"><BarChart3 size={14} className="text-slate-400" /> 상대적 성능 인덱스</span>
                      <span className="text-blue-600 font-black text-sm">{part.benchmarkScore ? `${part.benchmarkScore.toLocaleString()} 점` : '정보 없음'}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${barPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-left md:text-right md:w-48 shrink-0 flex md:flex-col justify-between md:justify-center items-center md:items-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="md:text-right">
                      <p className="text-xs text-slate-500 font-medium">DB 수집 시점 가격</p>
                      <p className="text-xl font-black text-slate-900 tracking-tight">{part.price.toLocaleString()}<span className="text-sm font-bold text-slate-600 ml-1">원</span></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCompare(part)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
                          isComparing 
                            ? "bg-purple-600 text-white shadow-xs" 
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <Swords size={14} /> {isComparing ? "비교 해제" : "VS 비교"}
                      </button>

                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 font-extrabold inline-flex items-center gap-0.5 hover:underline"
                      >
                        {link.isDirect ? '다나와 정보' : '다나와 검색'} <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}