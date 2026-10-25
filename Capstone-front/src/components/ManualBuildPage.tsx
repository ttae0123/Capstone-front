import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, Cpu, ExternalLink, Loader2, RotateCcw, Search, ShieldCheck, Trash2, Wrench } from 'lucide-react';
import { fetchManualParts } from '../utils/api';
import { CATEGORY_LABEL, MANUAL_CATEGORIES, SELECTION_KEY, benchScore, danawaLink, emptySelection, specsText } from '../utils/hardware';
import type { ManualBuildSelection, ManualCategory, ManualPart, OwnedBuildSeed, Recommendation } from '../types/pc';

interface Props { onBack: () => void; onComplete: () => void; }
type SelectedDetails = Partial<Record<ManualCategory, ManualPart>>;

function readOwnedSeed(): OwnedBuildSeed | null {
  try {
    const raw = sessionStorage.getItem('ownedBuildSeed');
    if (!raw) return null;
    const seed = JSON.parse(raw) as OwnedBuildSeed;
    if (!MANUAL_CATEGORIES.includes(seed.category) || !Number.isSafeInteger(seed.part?.id) || seed.part.id <= 0) return null;
    if (!Number.isFinite(seed.extraBudget) || seed.extraBudget <= 0) return null;
    return seed;
  } catch { return null; }
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
      .finally(() => { if (requestId.current === currentId) setLoading(false); });
    return () => controller.abort();
  }, [active, selection]);

  const chosenCount = Object.keys(details).length;
  const purchasePrice = MANUAL_CATEGORIES.reduce((sum, category) =>
    sum + (category === seed?.category ? 0 : (details[category]?.price ?? 0)), 0);
  const allPrice = MANUAL_CATEGORIES.reduce((sum, category) => sum + (details[category]?.price ?? 0), 0);
  const overBudget = Boolean(seed && purchasePrice > seed.extraBudget);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? available.filter(p => `${p.name} ${p.brand ?? ''} ${specsText(p)}`.toLowerCase().includes(q)) : available;
  }, [available, search]);

  const reset = () => {
    const next = emptySelection();
    if (seed) next[SELECTION_KEY[seed.category]] = seed.part.id;
    setSelection(next);
    setDetails(seed ? { [seed.category]: seed.part } : {});
  };
  const pick = (part: ManualPart) => {
    if (!Number.isSafeInteger(part.id) || part.id <= 0) return;
    // On replacing a part, discard other selections; they may no longer be compatible.
    // A user-owned seed is never silently discarded.
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
    // Removing a dependency invalidates the compatibility assumptions of the remaining choices.
    reset();
    setActive(category);
  };

  const confirmBuild = () => {
    // Do not show a partial manual build as a completed PC estimate.
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
      rankName: '추천 조합 1',
      totalEstimatedPrice: purchasePrice,
      parts,
      message: '사용자가 직접 선택한 8종 부품 조합입니다. 서버에서 제공한 호환 후보로 구성했으며 누락된 규격은 별도 확인이 필요합니다.',
    };
    // ResultsPage reads precomputed recommendations before attempting the automatic API.
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
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => { sessionStorage.removeItem('ownedBuildSeed'); onBack(); }} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-all" aria-label="뒤로 가기"><ArrowLeft size={24}/></button>
          <div><h1 className="text-xl font-bold">수동 PC 조립</h1><p className="text-xs text-slate-500">실제 DB 부품 선택 · 선택된 부품 기반 호환성 필터</p></div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white flex flex-col sm:flex-row sm:justify-between gap-5">
          <div><div className="flex items-center gap-2 font-extrabold text-xl"><Wrench size={24}/> 나만의 PC 직접 구성</div><p className="text-sm mt-2 text-blue-100">부품을 선택할 때마다 서버가 기존 선택과 호환 가능한 후보를 조회합니다. DB에 없는 호환 규격은 별도 확인이 필요합니다.</p></div>
          <div className="sm:text-right shrink-0"><p className="text-blue-100 text-sm">새 부품 합계 / 선택 {chosenCount}종</p><p className="text-2xl font-black">{purchasePrice.toLocaleString()}원</p>{seed && <p className="text-xs text-blue-100">추가 예산 {seed.extraBudget.toLocaleString()}원 · 보유 부품 제외</p>}</div>
        </div>
        {seed && <div className="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 text-purple-800 flex items-start gap-2 text-sm"><ShieldCheck size={19} className="shrink-0"/>보유 부품: <strong>{seed.part.name}</strong> · DB에서 선택한 제품 ID {seed.part.id}를 기준으로 호환 제품을 조회합니다. 보유 부품의 가격은 구매 총액에서 제외됩니다.</div>}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5 gap-4"><h2 className="text-lg font-extrabold">조립 부품 8종</h2><button onClick={reset} className="text-sm font-bold text-slate-500 hover:text-red-600 flex gap-1 items-center"><RotateCcw size={16}/> 초기화</button></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MANUAL_CATEGORIES.map(c => (
              <button key={c} onClick={() => { setActive(c); setSearch(''); }} className={`rounded-2xl border-2 p-4 text-left transition-all ${active === c ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <span className="text-sm font-bold flex items-center gap-2">{details[c] ? <CheckCircle2 className="text-emerald-600" size={17}/> : <Cpu className="text-slate-400" size={17}/>} {CATEGORY_LABEL[c]}</span>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-8">{details[c]?.name ?? '선택 전'}</p>
                {details[c] && c !== seed?.category && <span onClick={(event) => { event.stopPropagation(); remove(c); }} className="inline-flex items-center text-xs font-bold text-rose-500 mt-2"><Trash2 size={13}/> 전체 재검증</span>}
                {seed?.category === c && <span className="text-purple-600 text-xs font-bold">보유 중 · 고정</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5"><div><h2 className="text-xl font-extrabold">{CATEGORY_LABEL[active]} 선택</h2><p className="text-sm text-slate-500 mt-1">조회된 후보 {totalCount.toLocaleString()}개 · 이전에 선택한 부품과의 호환성 조건 반영</p></div><div className="relative md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="부품명, 제조사, 상세 스펙 검색" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm"/></div></div>
          {loading && <div className="py-12 flex justify-center items-center gap-3 text-blue-600 font-semibold"><Loader2 className="animate-spin" size={20}/> DB 조회 중...</div>}
          {error && <div role="alert" className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-200">{error}</div>}
          {!loading && !error && filtered.length === 0 && <div className="py-12 text-center text-slate-500 font-semibold">표시할 호환 제품이 없습니다. 선택을 초기화하거나 다른 부품을 선택해 보세요.</div>}
          {!loading && !error && <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">{filtered.map(part => {
            const link = danawaLink(part);
            const isSelected = details[active]?.id === part.id;
            return <div key={part.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="min-w-0"><div className="font-bold text-slate-900">{part.name}</div><p className="text-xs text-slate-500 mt-1 leading-relaxed">{specsText(part)}</p><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-semibold mt-1 inline-flex items-center gap-1">{link.isDirect ? '상품 상세 페이지' : '다나와 검색'} <ExternalLink size={12}/></a></div><div className="flex items-center gap-3 shrink-0"><div className="font-black">{(part.price ?? 0).toLocaleString()}원</div><button disabled={seed?.category === active || isSelected} onClick={() => pick(part)} className="rounded-xl bg-blue-600 disabled:bg-slate-200 disabled:text-slate-500 text-white px-4 py-2.5 text-sm font-bold">{isSelected ? '선택됨' : '선택'} <ChevronRight size={14} className="inline"/></button></div></div>;
          })}</div>}
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-lg font-extrabold mb-4">현재 조립 견적</h2>
          <div className="space-y-2">{MANUAL_CATEGORIES.filter(c => details[c]).map(c => <div key={c} className="flex items-center justify-between gap-4 text-sm border-b border-slate-100 pb-2"><span><span className="font-bold text-slate-500 mr-2">{CATEGORY_LABEL[c]}</span>{details[c]?.name}{seed?.category === c && <span className="text-purple-600 ml-2">(보유)</span>}</span><strong className="shrink-0">{seed?.category === c ? '0원' : `${(details[c]?.price ?? 0).toLocaleString()}원`}</strong></div>)}</div>
          <div className="mt-5 font-black text-xl text-right">신규 구매 총액 {purchasePrice.toLocaleString()}원</div>
          {seed && <p className="text-sm text-slate-500 text-right mt-1">부품 원래 가격 합계 {allPrice.toLocaleString()}원 · 추가 예산 {seed.extraBudget.toLocaleString()}원</p>}
          {overBudget && <p role="alert" className="text-rose-600 font-bold text-right mt-2">추가 예산을 초과했습니다. 부품을 조정해 주세요.</p>}
          <p className="text-xs text-slate-500 text-right mt-3">표시 가격은 DB 수집 시점 가격입니다. 누락된 규격, 쿨링 성능, 전력 여유는 구매 전 별도로 확인하세요.</p>
          <button onClick={confirmBuild} disabled={chosenCount !== MANUAL_CATEGORIES.length || overBudget} className="mt-5 w-full bg-slate-900 text-white disabled:bg-slate-300 py-4 rounded-2xl font-extrabold">선택한 견적 확인</button>
        </div>
      </div>
    </div>
  );
}
