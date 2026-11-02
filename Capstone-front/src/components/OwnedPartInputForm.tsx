import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoadingScreen } from './LoadingScreen';
import { fetchManualParts, fetchOwnedRecommendations } from '../utils/api';
import { SELECTION_KEY } from '../utils/hardware';
import type { ManualCategory, ManualPart } from '../types/pc';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  HardDrive, 
  Layout, 
  Monitor, 
  ShieldCheck, 
  ChevronRight, 
  Database, 
  Search, 
  CheckCircle2, 
  RotateCcw,
  Plus
} from 'lucide-react';

const categories = [
  { id: 'CPU', label: 'CPU', icon: <Cpu size={22} /> },
  { id: 'GPU', label: '그래픽카드', icon: <Monitor size={22} /> },
  { id: 'MOTHERBOARD', label: '메인보드', icon: <Layout size={22} /> },
  { id: 'RAM', label: '메모리 (RAM)', icon: <HardDrive size={22} /> },
  { id: 'SSD', label: 'SSD', icon: <Database size={22} /> },
];

function formatKoreanBudget(value: number): string {
  if (value === 0) return '';
  const 억 = Math.floor(value / 100000000);
  const 만 = Math.floor((value % 100000000) / 10000);
  const 나머지 = value % 10000;

  const parts: string[] = [];
  if (억 > 0) parts.push(`${억}억`);
  if (만 > 0) parts.push(`${만}만`);
  if (나머지 > 0) parts.push(`${나머지}`);

  return parts.join(' ') + '원';
}

export function OwnedPartInputForm({ onComplete }: { onComplete: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState('GPU');
  const [partName, setPartName] = useState('RTX 3060');
  const [selectedPart, setSelectedPart] = useState<ManualPart | null>(null);
  const [extraBudget, setExtraBudget] = useState('1500000');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [candidateOptions, setCandidateOptions] = useState<ManualPart[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const category = (selectedCategory === 'MOTHERBOARD'
    ? 'mainboard' : selectedCategory.toLowerCase()) as ManualCategory;

  const resetSearch = () => {
    abortRef.current?.abort();
    setIsSearching(false);
    setIsGenerating(false);
    setLookupError(null);
    setCandidateOptions([]);
  };

  const searchPartInDb = async () => {
    const query = partName.trim();
    if (!query) {
      setLookupError('보유 중인 부품의 모델명을 입력해 주세요.');
      return;
    }

    resetSearch();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    try {
      const data = await fetchManualParts(category, {}, controller.signal);
      if (controller.signal.aborted) return;

      const normal = (value: string) => value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
      const normalized = normal(query);
      const exact = data.parts.filter(p => normal(p.name) === normalized);
      const partial = data.parts.filter(p => normal(p.name).includes(normalized));
      const candidates = exact.length > 0 ? exact : partial;

      if (candidates.length === 1) {
        setSelectedPart(candidates[0]);
        setPartName(candidates[0].name);
        setCandidateOptions([]);
        setLookupError(null);
      } else if (candidates.length > 1) {
        setCandidateOptions(candidates.slice(0, 50));
        setLookupError(`검색 결과가 ${candidates.length}개입니다. 아래 목록에서 실제 보유 모델을 선택해 주세요.`);
      } else {
        setLookupError('조회된 DB 목록에서 일치하는 모델을 찾지 못했습니다. 제조사나 세부 모델명을 더 구체적으로 입력해 주세요.');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setLookupError(error instanceof Error ? error.message : 'DB 조회에 실패했습니다. 서버 연결을 확인해 주세요.');
      }
    } finally {
      if (abortRef.current === controller) setIsSearching(false);
    }
  };

  const handleSelectCandidate = (part: ManualPart) => {
    setSelectedPart(part);
    setPartName(part.name);
    setCandidateOptions([]);
    setLookupError(null);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching || isGenerating) return;

    if (!selectedPart) {
      const query = partName.trim();
      if (!query) {
        setLookupError('보유 중인 부품명을 입력하고 먼저 DB에서 부품을 선택해 주세요.');
        return;
      }
      await searchPartInDb();
      return;
    }

    const budget = Number(extraBudget);
    if (!Number.isSafeInteger(budget) || budget <= 0) {
      setLookupError('추가 예산은 0원보다 큰 정수로 입력해 주세요.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setLookupError(null);

    try {
      const response = await fetchOwnedRecommendations({
        budget,
        ownedParts: { [SELECTION_KEY[category]]: selectedPart.id },
        usage: 'GAMING',
      }, controller.signal);

      if (controller.signal.aborted) return;

      sessionStorage.removeItem('recommendationResult');
      sessionStorage.removeItem('extractedBudget');
      sessionStorage.removeItem('ownedBuildSeed');
      sessionStorage.setItem('pcBuildData', JSON.stringify({
        budget: String(budget),
        isOwnedMode: true,
        ownedCategory: selectedCategory,
        ownedPartName: selectedPart.name,
        ownedPartId: selectedPart.id,
      }));
      sessionStorage.setItem('recommendationResult', JSON.stringify(response.recommendations));
      sessionStorage.setItem('extractedBudget', String(budget));
      onComplete();
    } catch (error) {
      if (!controller.signal.aborted) {
        setLookupError(error instanceof Error ? error.message : '보유 부품 자동 견적 생성에 실패했습니다.');
      }
    } finally {
      if (abortRef.current === controller) {
        // 서버 응답 지연은 fetchOwnedRecommendations가 45초 후 구분된 메시지로 처리합니다.
        setIsGenerating(false);
      }
    }
  };

  const handleBudgetQuickAdd = (amount: number) => {
    const current = Number(extraBudget) || 0;
    setExtraBudget(String(Math.max(0, current + amount)));
  };

  const numericBudget = parseInt(extraBudget || '0', 10);

  return (
    <>
      {isGenerating && createPortal(<LoadingScreen />, document.body)}
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-purple-100">
      <div className="flex items-center gap-3 mb-8 text-purple-900">
        <ShieldCheck className="text-purple-600 shrink-0" size={30} />
        <div>
          <h2 className="text-2xl font-bold">보유 중인 부품 연동 업그레이드</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            보유 부품을 DB에서 확정하고 추가 예산을 설정한 후 견적을 생성합니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-7">
        {/* 1. 카테고리 선택 */}
        <div>
          <label className="block text-base font-bold text-slate-800 mb-3">보유 부품 카테고리</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  resetSearch();
                  setSelectedPart(null);
                  setSelectedCategory(cat.id);
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all text-center min-h-[90px] ${
                  selectedCategory === cat.id
                    ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/30"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. 부품명 검색 및 선택 확정 영역 */}
        <div>
          <label className="block text-base font-bold text-slate-800 mb-2">보유 중인 부품 모델명</label>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={partName}
                onChange={(e) => {
                  setPartName(e.target.value);
                  setSelectedPart(null);
                  resetSearch();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchPartInDb();
                  }
                }}
                placeholder="예) RTX 3060, i5-12400F, B660M, 980 PRO"
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-purple-500 text-base font-semibold text-slate-900 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={searchPartInDb}
              disabled={isSearching}
              className="px-5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-extrabold rounded-2xl transition-colors shrink-0 flex items-center gap-1.5 text-sm"
            >
              <Search size={18} />
              {isSearching ? '검색 중...' : '부품 검색'}
            </button>
          </div>

          {/* 선택 완료된 부품 카드 */}
          <AnimatePresence>
            {selectedPart && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 size={20} className="text-purple-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wide block">선택 완료된 보유 부품</span>
                    <strong className="text-sm font-extrabold text-slate-900 truncate block">{selectedPart.name}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPart(null);
                    setCandidateOptions([]);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-purple-700 underline shrink-0 px-2 py-1"
                >
                  다시 선택
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {lookupError && (
            <p role="alert" className="mt-2.5 text-xs sm:text-sm font-semibold text-rose-600 break-keep">
              {lookupError}
            </p>
          )}

          {/* 검색 후보 목록 */}
          {candidateOptions.length > 0 && !selectedPart && (
            <div className="mt-3 max-h-56 overflow-y-auto border border-purple-200 rounded-2xl bg-white shadow-sm divide-y divide-slate-100">
              <div className="p-2.5 bg-purple-50/70 text-xs font-bold text-purple-800 sticky top-0 border-b border-purple-100">
                실제 보유 중인 부품을 아래에서 클릭하여 확정해 주세요:
              </div>
              {candidateOptions.map(part => (
                <button
                  type="button"
                  key={part.id}
                  onClick={() => handleSelectCandidate(part)}
                  className="flex w-full items-center justify-between gap-3 p-3.5 text-left text-sm hover:bg-purple-50 transition-colors group"
                >
                  <span className="font-bold text-slate-800 group-hover:text-purple-700">{part.name}</span>
                  <span className="shrink-0 text-xs font-extrabold text-purple-600 bg-purple-50 group-hover:bg-purple-100 px-2 py-1 rounded-lg">
                    선택
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. 추가 예산 입력 (10만 원 단위 스핀 및 퀵 증감 버튼) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-base font-bold text-slate-800">신규 구매를 위한 추가 예산</label>
            <span className="text-xs font-bold text-purple-600">화살표 10만원 단위 변경</span>
          </div>

          <div className="relative mb-2">
            <input
              type="number"
              step="100000"
              min="100000"
              value={extraBudget}
              onChange={(e) => setExtraBudget(e.target.value)}
              placeholder="1500000"
              required
              className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-purple-500 text-lg font-black text-slate-900 transition-colors"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base text-slate-600 font-extrabold">원</span>
          </div>

          {/* 퀵 예산 조절 버튼 */}
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleBudgetQuickAdd(50000)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Plus size={13} /> 5만원
            </button>
            <button
              type="button"
              onClick={() => handleBudgetQuickAdd(100000)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Plus size={13} /> 10만원
            </button>
            <button
              type="button"
              onClick={() => handleBudgetQuickAdd(500000)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Plus size={13} /> 50만원
            </button>
            <button
              type="button"
              onClick={() => setExtraBudget('1000000')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors ml-auto flex items-center gap-1"
            >
              <RotateCcw size={12} /> 기본값 100만원
            </button>
          </div>

          {numericBudget > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between"
            >
              <div className="text-sm text-slate-700 font-medium">
                추가 희망 예산 : <span className="text-purple-700 font-extrabold text-base">{formatKoreanBudget(numericBudget)}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* 4. 견적 생성 버튼 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSearching || isGenerating}
            className="w-full py-5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              '보유 부품 호환 자동 견적 생성 중...'
            ) : isSearching ? (
              '보유 제품 DB 확인 중...'
            ) : selectedPart ? (
              <>
                확정 부품으로 견적 찾기 ({selectedPart.name})
                <ChevronRight size={20} />
              </>
            ) : (
              <>
                보유 부품 확인 및 견적 찾기
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    </>
  );
}