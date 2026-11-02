import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Target, ChevronRight, Check, HelpCircle, Plus, RotateCcw } from 'lucide-react';

const usageOptions = [
  { value: 'GAMING', label: '게이밍', emoji: '🎮', desc: '고사양 게임 플레이' },
  { value: 'OFFICE', label: '사무용', emoji: '💼', desc: '문서 작업 중심' },
  { value: 'HIGH_END', label: '하이엔드', emoji: '🚀', desc: '최상위 성능 중심 PC' },
];

// 게이밍 예산별 그래픽 옵션 가이드 (FHD, 레이트레이싱 제외 기준).
// 표시용 추정 기준이며, 실제 옵션/FPS는 자동 견적의 CPU·GPU 조합에 따라 달라진다.
// 기존 상위 옵션 가이드(배그 140만, 사이버펑크 230만, 붉은사막 300만)는 '상옵' 구간에 유지한다.
const gameOptions = [
  { value: 'LOL_VALORANT', label: '롤, 발로란트', medium: 1_000_000, high: 1_000_000, ultra: 1_000_000 },
  { value: 'PUBG_LOSTARK', label: '배틀그라운드, 로스트아크', medium: 1_200_000, high: 1_400_000, ultra: 2_100_000 },
  { value: 'CYBERPUNK', label: '사이버펑크', medium: 1_800_000, high: 2_300_000, ultra: 3_200_000 },
  { value: 'CRIMSON_DESERT', label: '붉은사막', medium: 2_400_000, high: 3_000_000, ultra: 4_000_000 },
] as const;

type GameGuide = (typeof gameOptions)[number];
type GraphicTier = '중옵' | '상옵' | '풀옵';

function getGraphicTier(game: GameGuide, budget: number): GraphicTier | null {
  if (budget >= game.ultra) return '풀옵';
  if (budget >= game.high) return '상옵';
  if (budget >= game.medium) return '중옵';
  return null;
}

// 게이밍 예산이 높아질수록 파랑 → 초록 → 노랑 → 주황 → 빨강 순서로 표시한다.
// 그래픽 옵션이 새 게임의 '중옵'으로 바뀌어도 예산 색상 단계가 역행하지 않도록
// 선택된 게임의 옵션 대신 입력한 총예산을 기준으로 색상을 결정한다.
function getGameBadgeColor(budget: number): string {
  if (budget >= 4_000_000) return 'bg-red-100 border-red-300 text-red-800';
  if (budget >= 3_000_000) return 'bg-orange-100 border-orange-300 text-orange-800';
  if (budget >= 2_300_000) return 'bg-amber-100 border-amber-300 text-amber-800';
  if (budget >= 1_800_000) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
  if (budget >= 1_400_000) return 'bg-emerald-100 border-emerald-300 text-emerald-800';
  return 'bg-blue-100 border-blue-300 text-blue-800';
}

const usageMinimums: Record<string, number> = {
  OFFICE: 500_000,
  GAMING: 1_000_000,
  HIGH_END: 4_500_000,
};

const usageMaximums: Record<string, number | undefined> = {
  OFFICE: 900_000,
  GAMING: 4_400_000,
  HIGH_END: undefined,
};

const brandOptions = [
  { id: 'intel', name: 'Intel', tip: '높은 단일 코어 성능 및 안정적인 오피스/게임 밸런스' },
  { id: 'amd', name: 'AMD', tip: '3D V-Cache 기술 기반 게임 성능 및 다중 코어 가성비 우수' },
  { id: 'nvidia', name: 'NVIDIA', tip: '지포스 RTX 시리즈, 딥러닝 AI 및 독보적 게이밍 호환성' },
  { id: 'samsung', name: 'Samsung', tip: '글로벌 최고 수준의 반도체 SSD 및 메모리(RAM) 내구성' },
  { id: 'corsair', name: 'Corsair', tip: '프리미엄 튜닝 감성 및 고품질 파워서플라이 브랜드' },
  { id: 'asus', name: 'ASUS', tip: '세계 1위 메인보드 및 고성능 하드웨어 솔루션' },
  { id: 'msi', name: 'MSI', tip: '뛰어난 방열판 쿨링 기술 기반 게이밍 메인보드/GPU' },
  { id: 'gigabyte', name: 'Gigabyte', tip: '견고한 전원부 및 내구성 특화 어로스 게이밍 라인업' },
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

export function InputForm({ onComplete }: { onComplete: () => void }) {
  const [budget, setBudget] = useState('1500000');
  const [purpose, setPurpose] = useState('');
  const [brands, setBrands] = useState<Record<string, boolean>>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const minimumBudget = usageMinimums[purpose] ?? 0;
  const maximumBudget = usageMaximums[purpose];
  const numericBudget = budget.trim() === '' ? 0 : Number(budget);
  const isBudgetValid = Boolean(purpose) && budget.trim() !== ''
    && Number.isSafeInteger(numericBudget) && numericBudget >= minimumBudget
    && (maximumBudget === undefined || numericBudget <= maximumBudget);
  const isFormValid = isBudgetValid;
  // 각 게임에서 현재 예산으로 충족하는 최고 옵션을 계산한다.
  // 충족한 옵션 중 요구 예산이 가장 높은 하나만 표시해
  // 배틀그라운드(210만 원)와 사이버펑크(320만 원)의 풀옵 구간도 노출한다.
  const availableGames = purpose === 'GAMING' && Number.isSafeInteger(numericBudget)
    ? gameOptions.map(game => {
        const tier = getGraphicTier(game, numericBudget);
        const tierMinimum = tier === '풀옵' ? game.ultra : tier === '상옵' ? game.high : game.medium;
        return { ...game, tier, tierMinimum };
      }).filter((game): game is typeof game & { tier: GraphicTier } => game.tier !== null)
    : [];
  const topGame = availableGames.reduce<(typeof availableGames)[number] | undefined>(
    (current, game) => !current || game.tierMinimum > current.tierMinimum ? game : current,
    undefined
  );

  const clampBudget = (value: number, min: number, max?: number) => {
    // 이전 코드에서는 마지막 10만 원 단위로 잘라서 버튼 클릭 시 예산이 감소할 수 있었다.
    // 실제 최대 예산(900,000원 / 4,400,000원)까지만 제한해 역방향 변화를 방지한다.
    const upperBound = max ?? Number.MAX_SAFE_INTEGER;
    const safeValue = Number.isFinite(value) ? Math.trunc(value) : min;
    return Math.min(Math.max(safeValue, min), upperBound);
  };

  const handlePurposeChange = (nextPurpose: string) => {
    setPurpose(nextPurpose);
    // 용도를 선택하거나 변경할 때 항상 해당 용도의 최소 예산으로 시작한다.
    setBudget(String(usageMinimums[nextPurpose]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    sessionStorage.removeItem('recommendationResult');
    sessionStorage.removeItem('extractedBudget');

    if (!['GAMING', 'OFFICE', 'HIGH_END'].includes(purpose)) {
      alert('게이밍·사무용·하이엔드 중 사용 목적을 선택해 주세요.');
      return;
    }
    if (!isBudgetValid) {
      alert(`예산은 ${formatKoreanBudget(minimumBudget)} 이상${maximumBudget === undefined ? '' : `, ${formatKoreanBudget(maximumBudget)} 이하`}로 입력해 주세요.`);
      return;
    }

    sessionStorage.setItem('pcBuildData', JSON.stringify({
      budget,
      purpose,
      brands: Object.keys(brands).filter(key => brands[key]),
      isOwnedMode: false
    }));

    onComplete();
  };

  const toggleBrand = (brandId: string) => {
    setBrands(prev => prev[brandId] ? {} : { [brandId]: true });
  };

  const handleBudgetQuickAdd = (amount: number) => {
    const current = Number(budget) || minimumBudget;
    setBudget(String(clampBudget(current + amount, minimumBudget, maximumBudget)));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          어떤 PC를 찾고 계신가요?
        </h2>
        <p className="text-gray-600 text-lg md:text-xl font-medium">
          몇 가지 정보만 입력하시면 최적의 부품을 추천해드립니다
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        noValidate
        className="space-y-8"
      >
        {/* Purpose Section */}
        <div className="bg-white rounded-3xl shadow-xs border border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">사용 목적</h3>
              <p className="text-base text-gray-500">주요 사용 용도를 선택해주세요</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {usageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (['GAMING', 'OFFICE', 'HIGH_END'].includes(option.value)) handlePurposeChange(option.value);
                  else alert('해당 용도는 백엔드에서 아직 지원하지 않습니다.');
                }}
                className={`relative p-5 rounded-2xl border-2 transition-all text-left ${
                  purpose === option.value
                    ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span className="text-3xl">{option.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-extrabold text-lg mb-1 ${purpose === option.value ? 'text-blue-600' : 'text-slate-900'}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-gray-500 font-medium leading-snug">{option.desc}</p>
                  </div>
                </div>
                {purpose === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-xs"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Section */}
        {purpose && (
        <div className="bg-white rounded-3xl shadow-xs border border-gray-200 p-6 md:p-8">
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">예산</h3>
                  <p className="text-base text-gray-500">선택한 용도에 맞춰 총 예산을 입력해주세요</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                화살표 10만원 단위 변경
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-600 mb-3">
              허용 예산: <span className="text-blue-700">{formatKoreanBudget(minimumBudget)} ~ {maximumBudget === undefined ? '상한 없음' : formatKoreanBudget(maximumBudget)}</span>
            </p>
            <div className="relative mb-3">
              <input
                type="number"
                step="100000"
                min={minimumBudget}
                max={maximumBudget}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={String(minimumBudget)}
                required
                className="w-full px-6 py-5 pr-14 border-2 border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xl transition-all font-bold text-slate-900"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 font-extrabold text-lg">원</span>
            </div>

            {/* 퀵 예산 조절 버튼 */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleBudgetQuickAdd(50000)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1 border border-slate-200/80"
              >
                <Plus size={14} /> 5만원
              </button>
              <button
                type="button"
                onClick={() => handleBudgetQuickAdd(100000)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1 border border-slate-200/80"
              >
                <Plus size={14} /> 10만원
              </button>
              <button
                type="button"
                onClick={() => handleBudgetQuickAdd(500000)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1 border border-slate-200/80"
              >
                <Plus size={14} /> 50만원
              </button>
              <button
                type="button"
                onClick={() => setBudget(String(minimumBudget))}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-bold transition-colors ml-auto flex items-center gap-1 border border-slate-200/80"
              >
                <RotateCcw size={13} /> 기본값
              </button>
            </div>

            {Number.isFinite(numericBudget) && numericBudget > 0 && !isBudgetValid && (
              <p role="alert" className="text-sm text-red-600 font-bold mt-3">현재 예산이 허용 범위를 벗어났습니다.</p>
            )}

            {Number.isFinite(numericBudget) && numericBudget > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-base text-gray-700 font-medium shrink-0">
                  입력 예산 : <span className="text-blue-600 font-extrabold text-lg">{formatKoreanBudget(numericBudget)}</span>
                </div>
                {purpose === 'GAMING' && (
                  <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5">
                    {topGame ? (
                      <span
                        key={topGame.value}
                        title={`${topGame.label}: 중옵 ${formatKoreanBudget(topGame.medium)}, 상옵 ${formatKoreanBudget(topGame.high)}, 풀옵 ${formatKoreanBudget(topGame.ultra)}부터 (예산 기준 추정)`}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-lg border text-xs sm:text-sm font-bold whitespace-nowrap ${getGameBadgeColor(numericBudget)}`}
                      >
                        {topGame.label} {topGame.tier}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">게임별 가이드 예산 미충족</span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            {purpose === 'GAMING' && Number.isFinite(numericBudget) && numericBudget > 0 && (
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                중옵·상옵·풀옵은 FHD / 레이트레이싱 제외 예산 기준의 참고 등급입니다. 실제 플레이 옵션과 FPS는 추천된 CPU·GPU 구성에 따라 달라집니다.
              </p>
            )}
          </div>
        </div>
        )}

        {/* Brand Preferences Section */}
        <div className="bg-white rounded-3xl shadow-xs border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-1">선호 브랜드</h3>
            <p className="text-base text-gray-500">선호 브랜드 1개 선택 (선택사항 / 마우스 오버 시 설명)</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {brandOptions.map((brand) => (
              <div key={brand.id} className="relative group">
                <button
                  type="button"
                  onClick={() => toggleBrand(brand.id)}
                  onMouseEnter={() => setActiveTooltip(brand.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className={`px-5 py-3 rounded-2xl border-2 font-bold text-sm md:text-base transition-all flex items-center gap-2 ${
                    brands[brand.id]
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {brand.name}
                  <HelpCircle size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>

                {activeTooltip === brand.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-900 text-white text-xs rounded-2xl shadow-xl z-30 pointer-events-none text-center border border-slate-700 leading-relaxed font-medium">
                    {brand.tip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={!isFormValid}
            whileHover={{ scale: !isFormValid ? 1 : 1.01 }}
            whileTap={{ scale: !isFormValid ? 1 : 0.99 }}
            className={`w-full py-5 rounded-2xl text-xl font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 ${
              isFormValid
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            최적의 조합 찾기
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}