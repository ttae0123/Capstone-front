import React, { useEffect, useMemo, useState } from 'react';
import { Search, BarChart3, ExternalLink, Cpu, HardDrive, Layout, Monitor, Zap, Box, Swords, RotateCcw, Fan, RefreshCw, AlertCircle } from 'lucide-react';
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
    id: p.id, category: c.toUpperCase(), name: p.name, brand: p.brand || p.chipsetBrand || '미표기',
    price: p.price ?? 0, benchmarkScore: benchScore(p) ?? 0,
    specSummary: specsText(p), productUrl: p.productUrl ?? null,
  };
}
export function PartsListPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [compareList, setCompareList] = useState<PartItem[]>([]);
  const [partsByCategory, setPartsByCategory] = useState<Partial<Record<ManualCategory, PartItem[]>>>({});
  const [counts, setCounts] = useState<Partial<Record<ManualCategory, number>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    // Individual failures should not hide successfully loaded categories.
    Promise.allSettled(MANUAL_CATEGORIES.map(async c => ({category: c, data: await fetchManualParts(c, {})}))).then(results => {
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
      setPartsByCategory(loaded); setCounts(nums);
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
      if (!part.benchmarkScore) { alert('벤치마크 점수가 있는 부품만 비교할 수 있습니다.'); return; }
      if (compareList.length > 0 && compareList[0].category !== part.category) { alert('같은 카테고리 제품만 비교할 수 있습니다.'); return; }
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

  const filteredParts = hardwareParts.filter(part => {
    const matchesCategory = selectedCategory === 'ALL' || part.category === selectedCategory;
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          part.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          part.specSummary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full">
      
      {/* 1:1 성능 비교 대결 VS 모드 위젯 */}
      <div className="bg-white rounded-3xl p-7 shadow-xs border border-slate-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="text-purple-600" size={24} />
            <h3 className="font-extrabold text-slate-900 text-xl">하드웨어 1:1 성능 대결 모드</h3>
          </div>
          {compareList.length > 0 && (
            <button
              onClick={() => setCompareList([])}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-3.5 py-1.5 rounded-full"
            >
              <RotateCcw size={14} /> 초기화
            </button>
          )}
        </div>

        {compareList.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm font-semibold text-slate-500">
            아래 부품 목록에서 비교할 부품 2개를 선택해 1:1 성능 우위를 비교해보세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {compareList.map((item, idx) => {
              const other = compareList[1 - idx];
              let percentDiff = 0;
              if (other && other.benchmarkScore > 0) {
                percentDiff = Math.round(((item.benchmarkScore - other.benchmarkScore) / other.benchmarkScore) * 100);
              }

              return (
                <div key={item.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md">
                      슬롯 {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-2">{item.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">점수: <strong className="text-slate-900 font-extrabold">{item.benchmarkScore.toLocaleString()}점</strong></p>
                  </div>

                  {other && (
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">상대 대비 성능:</span>
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-lg ${
                        percentDiff >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {percentDiff >= 0 ? `+${percentDiff}% 우세` : `${percentDiff}% 열세`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 서브 대시보드 요약 정보 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-100">
          <p className="text-xs text-blue-700 font-extrabold uppercase tracking-wider mb-1">총 하드웨어 자산</p>
          <p className="text-3xl font-black text-slate-900">{totalAssetCount.toLocaleString()}<span className="text-base font-bold text-slate-600 ml-1.5">개 모델</span></p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 rounded-2xl border border-indigo-100">
          <p className="text-xs text-indigo-700 font-extrabold uppercase tracking-wider mb-1">표준 카테고리 풀</p>
          <p className="text-3xl font-black text-slate-900">8<span className="text-base font-bold text-slate-600 ml-1.5">개 대역</span></p>
        </div>
        <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/50 p-6 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-600 font-extrabold uppercase tracking-wider mb-1">데이터 동기화 규격</p>
          <p className="text-base font-bold text-slate-900 flex items-center gap-2 mt-2">
            <span className={`w-3 h-3 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500'}`} /> {loading ? 'MariaDB 조회 중' : error ? '일부 데이터 로드 실패' : '백엔드 DB 조회 완료'}
          </p>
        </div>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 select-none no-scrollbar max-w-full md:max-w-[70%]">
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

        <div className="relative flex-1 md:max-w-[300px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="부품명, 제조사, 상세 스펙 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-xs font-medium"
          />
        </div>
      </div>

      {error && <div role="alert" className="mb-5 p-4 border border-rose-200 rounded-xl bg-rose-50 text-rose-700 text-sm flex items-center gap-2"><AlertCircle size={17}/> {error} <button className="ml-auto font-bold underline" onClick={() => setRefreshTick(v => v + 1)}>재시도</button></div>}
      {loading && <div className="mb-5 text-blue-600 text-sm font-semibold flex items-center gap-2"><RefreshCw size={17} className="animate-spin"/> DB에 저장된 하드웨어 목록을 불러오는 중입니다...</div>}
      {/* 부품 마스터 리스트 */}
      {filteredParts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-500 font-bold shadow-xs text-base">
          {loading ? 'DB 하드웨어를 불러오는 중입니다...' : '검색 조건 및 카테고리에 부합하는 하드웨어 데이터가 존재하지 않습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredParts.map((part) => {
              const barPercentage = ((part.benchmarkScore / currentMaxScore) * 100).toFixed(0);
              const link = danawaLink(part);
              const isComparing = compareList.some(p => p.id === part.id && p.category === part.category);

              return (
                <div key={part.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-slate-50/50 transition-colors">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-extrabold uppercase tracking-wide border border-blue-100">
                        {part.category}
                      </span>
                      <span className="text-xs text-slate-500 font-black tracking-tight uppercase">{part.brand}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight">{part.name}</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
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
                        className={`text-xs px-3 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1 ${
                          isComparing 
                            ? "bg-purple-600 text-white" 
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
                        {link.isDirect ? '다나와 상품 상세' : '다나와 검색'} <ExternalLink size={12} />
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