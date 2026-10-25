import React, { useEffect, useRef, useState } from 'react';
import { fetchManualParts, fetchOwnedRecommendations } from '../utils/api';
import { SELECTION_KEY } from '../utils/hardware';
import type { ManualCategory, ManualPart } from '../types/pc';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Layout, Monitor, ShieldCheck, ChevronRight, Gauge } from 'lucide-react';

const categories = [
  { id: 'CPU', label: 'CPU (프로세서)', icon: <Cpu size={22} /> },
  { id: 'GPU', label: '그래픽카드', icon: <Monitor size={22} /> },
  { id: 'MOTHERBOARD', label: '메인보드', icon: <Layout size={22} /> },
  { id: 'RAM', label: '메모리 (RAM)', icon: <HardDrive size={22} /> },
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

function getBudgetTier(value: number) {
  if (value < 600000) {
    return { label: '🟢 사무 / 인강 / 웹서핑 최적', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  } else if (value < 1200000) {
    return { label: '🔵 롤 / 오버워치 / FHD 일반 게이밍', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  } else if (value < 1900000) {
    return { label: '🟣 배틀그라운드 144Hz / 4K 영상편집', color: 'bg-purple-100 text-purple-800 border-purple-200' };
  } else {
    return { label: '🔴 하이엔드 4K 게이밍 / AI 딥러닝', color: 'bg-rose-100 text-rose-800 border-rose-200' };
  }
}

/**
 * Capstone-front(3)의 보라색 입력 UI는 유지합니다.
 * 모델명 DB 확인 후 신규 전용 API에 고정 제품 ID + 추가 예산을 전달합니다.
 * 남은 부품 조합 생성/예산 계산/호환성 검증은 전부 백엔드가 수행합니다.
 */
export function OwnedPartInputForm({ onComplete }: { onComplete: () => void }) {
  // 원본(3)의 카테고리·기본값·카드 UI를 유지합니다.
  const [selectedCategory, setSelectedCategory] = useState('GPU');
  const [partName, setPartName] = useState('RTX 3060');
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

  const choosePart = async (part: ManualPart) => {
    const budget = Number(extraBudget);
    if (!Number.isSafeInteger(part.id) || part.id <= 0 || !Number.isSafeInteger(budget) || budget <= 0) {
      setLookupError('부품 정보 또는 추가 예산이 올바르지 않습니다.');
      return;
    }
    // DB에서 확정한 보유 부품 ID를 새 서버 엔드포인트에 전달합니다.
    // 서버가 고정 ID를 기준으로 호환성·예산을 검증하여 자동 조합을 생성합니다.
    setIsSearching(false);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    setIsGenerating(true);
    setLookupError(null);
    setCandidateOptions([]);
    try {
      const response = await fetchOwnedRecommendations({
        budget,
        ownedParts: { [SELECTION_KEY[category]]: part.id },
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
        ownedPartName: part.name,
        ownedPartId: part.id,
      }));
      sessionStorage.setItem('recommendationResult', JSON.stringify(response.recommendations));
      sessionStorage.setItem('extractedBudget', String(budget));
      onComplete();
    } catch (error) {
      if (!controller.signal.aborted) {
        setLookupError(error instanceof Error ? error.message : '보유 부품 자동 견적 생성에 실패했습니다.');
      }
    } finally {
      window.clearTimeout(timeout);
      if (abortRef.current === controller) {
        if (controller.signal.aborted) setLookupError('견적 생성이 30초를 초과했거나 취소되었습니다. 다시 시도해 주세요.');
        setIsGenerating(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching || isGenerating) return;
    const query = partName.trim();
    const budget = Number(extraBudget);
    if (!query) { setLookupError('보유 중인 부품의 모델명을 입력해 주세요.'); return; }
    if (!Number.isSafeInteger(budget) || budget <= 0) {
      setLookupError('추가 예산은 0원보다 큰 정수로 입력해 주세요.');
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
        void choosePart(candidates[0]);
      } else if (candidates.length > 1) {
        setCandidateOptions(candidates.slice(0, 50));
        setLookupError(`검색 결과가 ${candidates.length}개입니다. 아래에서 실제 보유 중인 제품을 선택해 주세요.`);
      } else {
        setLookupError('조회된 DB 부품 목록에서 입력한 모델명을 찾지 못했습니다. 더 구체적인 상품명을 입력해 주세요. API가 일부 후보만 반환하는 경우에도 찾지 못할 수 있습니다.');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setLookupError(error instanceof Error ? error.message : 'DB 조회에 실패했습니다. 서버 연결을 확인해 주세요.');
      }
    } finally {
      if (abortRef.current === controller) setIsSearching(false);
    }
  };

  const numericBudget = parseInt(extraBudget || '0');
  const budgetTier = getBudgetTier(numericBudget);

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-purple-100">
      <div className="flex items-center gap-3 mb-8 text-purple-900">
        <ShieldCheck className="text-purple-600 shrink-0" size={28} />
        <div>
          <h2 className="text-2xl font-bold">보유 중인 부품 연동 업그레이드</h2>
          <p className="text-sm text-slate-600 mt-1 font-medium">가지고 계신 부품과 호환되는 신규 부품을 추가 예산 안에서 자동 추천해드립니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <label className="block text-base font-bold text-slate-800 mb-3">보유 부품 카테고리</label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { resetSearch(); setSelectedCategory(cat.id); }}
                className={`p-4 rounded-2xl border flex items-center gap-2.5 font-bold text-sm md:text-base transition-all ${
                  selectedCategory === cat.id
                    ? "bg-purple-600 text-white border-purple-600 shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-base font-bold text-slate-800 mb-2">보유 중인 부품명 (모델명)</label>
          <input
            type="text"
            value={partName}
            onChange={(e) => { resetSearch(); setPartName(e.target.value); }}
            placeholder="예) RTX 3060, i5-12400F, B660M"
            required
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-purple-500 text-base font-semibold text-slate-900"
          />
          {lookupError && <p role="alert" className="mt-2 text-sm font-semibold text-rose-600">{lookupError}</p>}
          {candidateOptions.length > 0 && (
            <div className="mt-3 max-h-52 overflow-y-auto border border-purple-100 rounded-2xl bg-white shadow-sm">
              {candidateOptions.map(part => (
                <button
                  type="button"
                  key={part.id}
                  onClick={() => { void choosePart(part); }}
                  className="flex w-full items-center justify-between gap-3 border-b border-slate-100 p-3 text-left text-sm hover:bg-purple-50"
                >
                  <span className="font-bold text-slate-800">{part.name}</span>
                  <span className="shrink-0 text-slate-500">{Number(part.price ?? 0).toLocaleString()}원</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-base font-bold text-slate-800 mb-2">신규 구매를 위한 추가 예산</label>
          <div className="relative mb-2">
            <input
              type="number"
              value={extraBudget}
              onChange={(e) => { resetSearch(); setExtraBudget(e.target.value); }}
              placeholder="1500000"
              required
              className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-purple-500 text-base font-bold text-slate-900"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base text-slate-600 font-extrabold">원</span>
          </div>

          {numericBudget > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="text-sm text-slate-700 font-medium">
                약 <span className="text-purple-700 font-extrabold text-base">{formatKoreanBudget(numericBudget)}</span> 추가 예산 수준
              </div>
              <div className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 w-fit ${budgetTier.color}`}>
                <Gauge size={14} />
                {budgetTier.label}
              </div>
            </motion.div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSearching || isGenerating}
            className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            {isGenerating ? '보유 부품 호환 자동 견적 생성 중...' : isSearching ? '보유 제품 DB 확인 중...' : '보유 부품 연동 견적 찾기'}
            <ChevronRight size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}