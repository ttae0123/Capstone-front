import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  ArrowUpDown,
  CheckCircle2, 
  ChevronRight, 
  Cpu, 
  ExternalLink, 
  Loader2, 
  RotateCcw, 
  Search, 
  ShieldCheck, 
  Trash2, 
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  Check
} from 'lucide-react';
import { fetchManualParts } from '../utils/api';
import { 
  CATEGORY_LABEL, 
  MANUAL_CATEGORIES, 
  SELECTION_KEY, 
  benchScore, 
  danawaLink, 
  emptySelection, 
  specsText 
} from '../utils/hardware';
import type { ManualBuildSelection, ManualCategory, ManualPart, OwnedBuildSeed, Recommendation } from '../types/pc';

interface Props { 
  onBack: () => void; 
  onComplete: () => void; 
}

type SelectedDetails = Partial<Record<ManualCategory, ManualPart>>;
type SortOption = 'BENCH_DESC' | 'BENCH_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC';

function readOwnedSeed(): OwnedBuildSeed | null {
  try {
    const raw = sessionStorage.getItem('ownedBuildSeed');
    if (!raw) return null;
    const seed = JSON.parse(raw) as OwnedBuildSeed;
    if (!MANUAL_CATEGORIES.includes(seed.category) || !Number.isSafeInteger(seed.part?.id) || seed.part.id <= 0) return null;
    if (!Number.isFinite(seed.extraBudget) || seed.extraBudget <= 0) return null;
    return seed;
  } catch { 
    return null; 
  }
}

export function ManualBuildPage({ onBack, onComplete }: Props) {
  const [seed] = useState<OwnedBuildSeed | null>(readOwnedSeed);
  const [selection, setSelection] = useState<ManualBuildSelection>(() => {
    const initial = emptySelection();
    const s = readOwnedSeed();
    if (s) initial[SELECTION_KEY[s.category]] = s.part.id;
    return initial;
  });
  const [details, setDetails] = useState<SelectedDetails>(() => {
    const s = readOwnedSeed();
    return s ? { [s.category]: s.part } : {};
  });
  const [active, setActive] = useState<ManualCategory>('cpu');
  const [available, setAvailable] = useState<ManualPart[]>([]);
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('BENCH_DESC');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentId = ++requestId.current;
    setLoading(true);
    setError(null);
    setAvailable([]);
    setTotalCount(0);
    fetchManualParts(active, selection, controller.signal)
      .then((data) => {
        if (requestId.current !== currentId) return;
        setAvailable(data.parts);
        setTotalCount(data.totalCount);
      })
      .catch((e) => {
        if (controller.signal.aborted || requestId.current !== currentId) return;
        setError(e instanceof Error ? e.message : '부품 조회 실패');
      })
      .finally(() => { 
        if (requestId.current === currentId) setLoading(false); 
      });
    return () => controller.abort();
  }, [active, selection]);

  const chosenCount = Object.keys(details).length;
  const purchasePrice = MANUAL_CATEGORIES.reduce((sum, category) =>
    sum + (category === seed?.category ? 0 : (details[category]?.price ?? 0)), 0);
  const allPrice = MANUAL_CATEGORIES.reduce((sum, category) => sum + (details[category]?.price ?? 0), 0);
  const overBudget = Boolean(seed && purchasePrice > seed.extraBudget);
  
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matching = q
      ? available.filter(p => `${p.name} ${p.brand ?? ''} ${specsText(p)}`.toLowerCase().includes(q))
      : [...available];

    // 벤치마크 마스터와 동일한 5가지 정렬 방식
    return matching.sort((a, b) => {
      switch (sortOption) {
        case 'BENCH_DESC':
          return (benchScore(b) ?? 0) - (benchScore(a) ?? 0);
        case 'BENCH_ASC':
          return (benchScore(a) ?? 0) - (benchScore(b) ?? 0);
        case 'PRICE_DESC':
          return (b.price ?? 0) - (a.price ?? 0);
        case 'PRICE_ASC':
          return (a.price ?? 0) - (b.price ?? 0);
        case 'NAME_ASC':
          return a.name.localeCompare(b.name, 'ko');
        default:
          return 0;
      }
    });
  }, [available, search, sortOption]);

  const reset = () => {
    const next = emptySelection();
    if (seed) next[SELECTION_KEY[seed.category]] = seed.part.id;
    setSelection(next);
    setDetails(seed ? { [seed.category]: seed.part } : {});
  };

  const pick = (part: ManualPart) => {
    if (!Number.isSafeInteger(part.id) || part.id <= 0) return;
    const replaces = details[active]?.id !== undefined && details[active]?.id !== part.id;
    const next = replaces ? emptySelection() : { ...selection };
    const nextDetails: SelectedDetails = replaces ? {} : { ...details };
    if (seed) {
      next[SELECTION_KEY[seed.category]] = seed.part.id;
      nextDetails[seed.category] = seed.part;
    }
    next[SELECTION_KEY[active]] = part.id;
    nextDetails[active] = part;
    setSelection(next);
    setDetails(nextDetails);
    const nextCat = MANUAL_CATEGORIES.find(c => !nextDetails[c]);
    if (nextCat) setActive(nextCat);
  };

  const remove = (category: ManualCategory) => {
    if (category === seed?.category) return;
    reset();
    setActive(category);
  };

  const confirmBuild = () => {
    if (chosenCount !== MANUAL_CATEGORIES.length || overBudget) return;
    const selectedParts = MANUAL_CATEGORIES.map(category => details[category]);
    if (selectedParts.some(part => !part || !Number.isSafeInteger(part.id) || part.id <= 0 ||
      !Number.isSafeInteger(part.price) || part.price < 0)) {
      setError('선택된 부품의 ID 또는 가격 정보가 올바르지 않습니다.');
      return;
    }

    const parts = MANUAL_CATEGORIES.map(category => {
      const part = details[category]!;
      const owned = seed?.category === category;
      return {
        category: category.toUpperCase(),
        name: owned ? `[보유 중] ${part.name}` : part.name,
        price: owned ? 0 : part.price,
        brand: part.brand ?? null,
        chipsetBrand: part.chipsetBrand ?? null,
        specSummary: specsText(part),
        benchScore: benchScore(part),
        productCode: part.productCode ?? null,
        productUrl: part.productUrl ?? null,
      };
    });

    const recommendation: Recommendation = {
      rankName: '수동 조립 구성',
      totalEstimatedPrice: purchasePrice,
      parts,
      message: '사용자가 직접 선택한 8종 부품 조합입니다. 서버에서 제공한 호환성 검증 기준을 충족하는 조합입니다.',
    };

    sessionStorage.setItem('pcBuildData', JSON.stringify({
      budget: String(seed ? seed.extraBudget : purchasePrice),
      isManualBuildMode: true,
      isOwnedMode: Boolean(seed),
    }));
    sessionStorage.setItem('recommendationResult', JSON.stringify([recommendation]));
    sessionStorage.setItem('extractedBudget', String(seed ? seed.extraBudget : purchasePrice));
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      {/* 상단 네비게이션 헤더 */}
      <div className="bg-white/85 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { sessionStorage.removeItem('ownedBuildSeed'); onBack(); }} 
              className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-600 transition-all border border-slate-200/60" 
              aria-label="뒤로 가기"
            >
              <ArrowLeft size={20}/>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-200">
                  MANUAL BUILD
                </span>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">수동 PC 조립</h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">부품 직접 선택 및 실시간 호환성 교차 필터링</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400">선택 현황</span>
              <span className="text-sm font-black text-cyan-600">{chosenCount} / 8 완료</span>
            </div>
            <div className="w-16 sm:w-24 bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-teal-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(chosenCount / 8) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* 메인 히어로 배너 (Cyan & Teal Gradient) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-cyan-500/20">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-lg text-cyan-200 text-xs font-bold mb-3 border border-white/10">
                <SlidersHorizontal size={14} />
                CUSTOM COMPONENT PICKER
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                나만의 고성능 PC 부품 직접 맞추기
              </h2>
              <p className="text-sm text-cyan-100/90 mt-2 max-w-xl leading-relaxed break-keep font-medium">
                원하는 부품을 선택할 때마다 서버가 소켓 규격, 메모리 클럭, 파워 권장 용량을 검증하여 호환 가능한 제품만 자동으로 필터링합니다.
              </p>
            </div>

            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-5 border border-white/10 md:text-right shrink-0 min-w-[220px]">
              <span className="text-xs font-semibold text-cyan-200 uppercase tracking-wider block">선택 부품 신규 합계</span>
              <div className="text-3xl font-black text-white mt-1">
                {purchasePrice.toLocaleString()}<span className="text-lg font-bold text-cyan-200 ml-1">원</span>
              </div>
              {seed ? (
                <div className="mt-2 pt-2 border-t border-white/10 text-xs text-cyan-200/90 font-medium">
                  추가 가용 예산: {seed.extraBudget.toLocaleString()}원
                </div>
              ) : (
                <div className="mt-2 text-xs text-cyan-200/80 font-medium">
                  8개 부품 중 <strong className="text-white">{chosenCount}개</strong> 선택됨
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 보유 부품 연계 시 알림 카드 */}
        {seed && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/90 p-4 sm:p-5 text-purple-900 flex items-start gap-3.5 text-sm shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 text-purple-600 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-purple-950">기존 보유 부품 고정 모드</h4>
              <p className="text-xs sm:text-sm text-purple-800/90 mt-0.5 leading-relaxed">
                보유 중인 <strong>{seed.part.name}</strong>(ID: {seed.part.id})을 기준으로 다른 부품의 호환성을 검사합니다. 보유 부품은 결제 금액에서 자동으로 0원 처리됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 8종 부품 카테고리 셀렉터 그리드 */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">PC 조립 규격 (8종)</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">선택된 부품 순서에 따라 호환 부품이 갱신됩니다.</p>
            </div>
            <button 
              onClick={reset} 
              className="text-xs sm:text-sm font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors border border-slate-200/80 hover:border-rose-200"
            >
              <RotateCcw size={14}/> 전체 초기화
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {MANUAL_CATEGORIES.map((cat) => {
              const part = details[cat];
              const isSelected = Boolean(part);
              const isActive = active === cat;
              const isOwned = seed?.category === cat;

              return (
                <button
                  key={cat}
                  onClick={() => { setActive(cat); setSearch(''); }}
                  className={`relative rounded-2xl p-4 text-left transition-all flex flex-col justify-between min-h-[110px] group ${
                    isActive
                      ? 'border-2 border-cyan-500 bg-cyan-50/50 shadow-sm ring-4 ring-cyan-500/10'
                      : isSelected
                      ? 'border border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50/80 shadow-2xs'
                      : 'border border-dashed border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        isActive 
                          ? 'bg-cyan-600 text-white' 
                          : isSelected 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {CATEGORY_LABEL[cat]}
                      </span>
                      {isOwned ? (
                        <span className="text-[11px] font-black text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">보유</span>
                      ) : isSelected ? (
                        <CheckCircle2 size={16} className="text-teal-600" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>

                    <p className={`text-xs font-bold line-clamp-2 leading-snug ${
                      isSelected ? 'text-slate-900' : 'text-slate-400 font-medium'
                    }`}>
                      {part ? part.name : '부품을 선택하세요'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between w-full">
                    <span className="text-xs font-extrabold text-slate-700">
                      {isOwned ? '0원' : part?.price ? `${part.price.toLocaleString()}원` : '-'}
                    </span>
                    {isSelected && !isOwned && (
                      <span
                        onClick={(e) => { e.stopPropagation(); remove(cat); }}
                        className="text-[11px] font-bold text-slate-400 hover:text-rose-500 flex items-center gap-0.5 transition-colors"
                        title="부품 취소 및 재검증"
                      >
                        <Trash2 size={12} /> 재선택
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 현재 카테고리 후보 검색 및 목록 */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-500" />
                <h3 className="text-xl font-black text-slate-900">
                  {CATEGORY_LABEL[active]} 부품 탐색
                </h3>
                <span className="text-xs font-extrabold text-cyan-700 bg-cyan-50 border border-cyan-200/60 px-2.5 py-0.5 rounded-full">
                  후보 {totalCount.toLocaleString()}개
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                기존 선택된 규격과 완벽하게 호환되는 제품 목록만 표시됩니다.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative sm:w-64 lg:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17}/>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="모델명, 제조사, 상세 스펙 검색"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 text-sm font-medium transition-all"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ArrowUpDown size={16} className="text-slate-500" />
                <label htmlFor="manual-part-sort" className="text-xs font-bold text-slate-600">정렬:</label>
                <select
                  id="manual-part-sort"
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as SortOption)}
                  className="bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-xs cursor-pointer"
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

          {/* 로딩 / 에러 / 빈 상태 */}
          {loading && (
            <div className="py-20 flex flex-col justify-center items-center gap-3 text-cyan-600 font-bold">
              <Loader2 className="animate-spin text-cyan-600" size={28}/>
              <span className="text-sm text-slate-600">서버 호환성 엔진에서 후보를 조회하고 있습니다...</span>
            </div>
          )}

          {error && (
            <div role="alert" className="p-5 bg-rose-50 text-rose-800 rounded-2xl text-sm border border-rose-200 flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-20 text-center text-slate-400 font-medium space-y-2">
              <AlertCircle className="mx-auto text-slate-300" size={36}/>
              <p className="text-slate-600 font-bold">조건에 맞는 호환 제품이 없습니다.</p>
              <p className="text-xs text-slate-400">검색어를 지우거나, 다른 부품 조합을 변경하여 호환 후보를 넓혀보세요.</p>
            </div>
          )}

          {/* 부품 아이템 리스트 */}
          {!loading && !error && filtered.length > 0 && (
            <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto pr-1">
              {filtered.map(part => {
                const link = danawaLink(part);
                const isSelected = details[active]?.id === part.id;
                const score = benchScore(part);

                return (
                  <div 
                    key={part.id} 
                    className={`py-4 px-3 rounded-2xl my-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isSelected ? 'bg-cyan-50/70 border border-cyan-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {part.brand && (
                          <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {part.brand}
                          </span>
                        )}
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                          {part.name}
                        </h4>
                        {score > 0 && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                            성능 점수 {score.toLocaleString()}점
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                        {specsText(part)}
                      </p>

                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-cyan-700 hover:text-cyan-800 font-bold mt-2 inline-flex items-center gap-1 hover:underline"
                      >
                        {link.isDirect ? '다나와 상품 정보' : '다나와 가격비교'} 
                        <ExternalLink size={12}/>
                      </a>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-semibold">실시간 기준가</span>
                        <div className="font-black text-slate-900 text-base sm:text-lg">
                          {(part.price ?? 0).toLocaleString()}
                          <span className="text-xs font-bold text-slate-600 ml-0.5">원</span>
                        </div>
                      </div>

                      <button 
                        disabled={seed?.category === active || isSelected} 
                        onClick={() => pick(part)} 
                        className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20 shadow-md active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check size={14} /> 선택완료
                          </>
                        ) : (
                          <>
                            선택하기 <ChevronRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 현재 조립 견적 요약 및 완료 버튼 */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">최종 구성 견적서</h3>
              <p className="text-xs text-slate-500 font-medium">선택한 8개 부품의 세부 견적과 결제 예정 총액입니다.</p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-slate-100 rounded-full text-slate-700">
              {chosenCount} / 8 부품 선택됨
            </span>
          </div>

          <div className="space-y-2.5">
            {MANUAL_CATEGORIES.map(c => {
              const part = details[c];
              const isOwned = seed?.category === c;

              return (
                <div key={c} className="flex items-center justify-between gap-4 text-xs sm:text-sm py-1.5 px-2 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-16 font-extrabold text-slate-400 shrink-0">
                      {CATEGORY_LABEL[c]}
                    </span>
                    <span className={`truncate font-medium ${part ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                      {part ? part.name : '선택 대기 중'}
                      {isOwned && <span className="text-purple-600 font-bold ml-1.5">[보유 부품]</span>}
                    </span>
                  </div>
                  <strong className="shrink-0 font-extrabold text-slate-900">
                    {isOwned ? '0원' : part ? `${(part.price ?? 0).toLocaleString()}원` : '-'}
                  </strong>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-400">총 조립 예정 금액</div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-700">
                {purchasePrice.toLocaleString()}<span className="text-base text-slate-600 font-bold ml-1">원</span>
              </div>
            </div>

            {seed && (
              <div className="text-xs text-slate-500 font-medium sm:text-right">
                전체 부품 원래 가격: {allPrice.toLocaleString()}원<br/>
                추가 희망 예산: {seed.extraBudget.toLocaleString()}원
              </div>
            )}
          </div>

          {overBudget && (
            <div role="alert" className="mt-4 p-3.5 bg-rose-50 text-rose-700 text-xs sm:text-sm font-bold rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle size={16} /> 추가 예산을 초과했습니다. 부품을 더 경제적인 모델로 조정해 주세요.
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed font-medium">
            * 표시된 부품 가격은 DB 수집 시점 기준이며, 판매처 상황에 따라 변동될 수 있습니다. 8종 규격을 모두 채우면 상세 분석 결과 화면으로 이동합니다.
          </p>

          <button 
            onClick={confirmBuild} 
            disabled={chosenCount !== MANUAL_CATEGORIES.length || overBudget} 
            className="mt-5 w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 py-4 rounded-2xl font-black text-base shadow-md disabled:shadow-none transition-all active:scale-[0.99] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {chosenCount === MANUAL_CATEGORIES.length ? (
              <>
                <Sparkles size={18} /> 선택한 견적서 완성하기
              </>
            ) : (
              `8종 부품 중 ${8 - chosenCount}개 더 선택 필요`
            )}
          </button>
        </div>

      </div>
    </div>
  );
}