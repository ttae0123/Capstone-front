import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Target, ChevronRight, Check, Gauge, HelpCircle } from 'lucide-react';

const usageOptions = [
  { value: 'GAMING', label: '게이밍', emoji: '🎮', desc: '고사양 게임 플레이' },
  { value: 'OFFICE', label: '사무용', emoji: '💼', desc: '문서 작업 중심' },
  { value: 'VIDEO_EDITING', label: '전문가용', emoji: '🎬', desc: '영상 편집 및 전문 작업' },
];

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

export function InputForm({ onComplete }: { onComplete: () => void }) {
  const [budget, setBudget] = useState('1500000');
  const [purpose, setPurpose] = useState('GAMING');
  const [brands, setBrands] = useState<Record<string, boolean>>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 기존 자연어 견적 세션 캐시 제거 후 일반 견적 파라미터 세션 저장
    sessionStorage.removeItem('recommendationResult');
    sessionStorage.removeItem('extractedBudget');

    if (!['GAMING', 'OFFICE', 'VIDEO_EDITING'].includes(purpose)) {
      alert('현재 백엔드는 게이밍·사무용·영상 편집 견적만 지원합니다.');
      return;
    }
    if (Number(budget) <= 0) { alert('올바른 예산을 입력해 주세요.'); return; }

    sessionStorage.setItem('pcBuildData', JSON.stringify({
      budget,
      purpose,
      brands: Object.keys(brands).filter(key => brands[key]),
      isOwnedMode: false
    }));

    onComplete();
  };

  const toggleBrand = (brandId: string) => {
    // 기존 EstimateRequest.preference 필드는 문자열 1개만 지원한다.
    setBrands(prev => prev[brandId] ? {} : { [brandId]: true });
  };

  const numericBudget = parseInt(budget || '0');
  const budgetTier = getBudgetTier(numericBudget);

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
        className="space-y-8"
      >
        {/* Budget Section */}
        <div className="bg-white rounded-3xl shadow-xs border border-gray-200 p-6 md:p-8">
          <label className="block">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">예산</h3>
                <p className="text-base text-gray-500">총 예산을 입력해주세요</p>
              </div>
            </div>

            <div className="relative mb-3">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1500000"
                required
                className="w-full px-6 py-5 pr-14 border-2 border-gray-200 bg-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xl transition-all font-bold text-slate-900"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 font-extrabold text-lg">원</span>
            </div>

            {numericBudget > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="text-base text-gray-700 font-medium">
                  약 <span className="text-blue-600 font-extrabold text-lg">{formatKoreanBudget(numericBudget)}</span> 예산 수준
                </div>
                <div className={`px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 w-fit ${budgetTier.color}`}>
                  <Gauge size={16} />
                  {budgetTier.label}
                </div>
              </motion.div>
            )}
          </label>
        </div>

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
                  if (['GAMING', 'OFFICE', 'VIDEO_EDITING'].includes(option.value)) setPurpose(option.value);
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
            disabled={!budget || !purpose}
            whileHover={{ scale: !budget || !purpose ? 1 : 1.01 }}
            whileTap={{ scale: !budget || !purpose ? 1 : 0.99 }}
            className={`w-full py-5 rounded-2xl text-xl font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 ${
              budget && purpose
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