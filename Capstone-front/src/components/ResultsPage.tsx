import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import API_BASE, { fetchRecommendations } from '../utils/api';
import { benchScore, danawaLink } from '../utils/hardware';
import type { PartDetail, Recommendation } from '../types/pc';
import EstimateChart from '../components/EstimateChart';
import {
  Check,
  Printer,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Award,
  ShieldCheck,
  Flame,
  Cpu,
  HardDrive,
  Layers,
  Gamepad2,
  Tv,
  TrendingUp,
  MonitorCheck
} from 'lucide-react';

type Part = PartDetail;

interface AiAnalysis {
  pros: string[];
  cons: string[];
}

interface ResultsPageProps {
  onRestart: () => void;
}

const getTabBadgeInfo = (index: number, _serverRankName?: string) => ({
  title: `추천 조합 ${index + 1}`,

});

const getCategoryBadge = (category: string, price: number, totalPrice: number, isOwned: boolean) => {
  const catUpper = category?.toUpperCase() || '';
  const ratio = (price / (totalPrice || 1)) * 100;

  if (isOwned) {
    return {
      label: '보유 자산 활용',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: <ShieldCheck size={14} />
    };
  }

  if (catUpper.includes('GPU') && ratio > 30) {
    return {
      label: '게이밍 핵심 성능',
      color: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: <Flame size={14} />
    };
  }
  if (catUpper.includes('CPU') && ratio > 20) {
    return {
      label: '연산 프로세서 중심',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: <Cpu size={14} />
    };
  }
  if (catUpper.includes('SSD') || catUpper.includes('RAM')) {
    return {
      label: '고속 메모리/저장장치',
      color: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: <HardDrive size={14} />
    };
  }
  if (catUpper.includes('POWER') || catUpper.includes('MAINBOARD') || catUpper.includes('MOTHERBOARD')) {
    return {
      label: '시스템 전원/안정성',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      icon: <Zap size={14} />
    };
  }
  return {
    label: '추천 가성비 구성',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: <Award size={14} />
  };
};

const PerformanceSimulator = ({ parts }: { parts: Part[] }) => {
  const cpu = parts.find(p => p.category?.toUpperCase() === 'CPU');
  const gpu = parts.find(p => p.category?.toUpperCase() === 'GPU');
  const cpuScore = cpu ? benchScore(cpu) : null;
  const gpuScore = gpu ? benchScore(gpu) : null;
  // FPS, 4K rendering time and AI inference cannot be predicted from the product name alone.
  const games = [
    { title: '배틀그라운드 (FHD 국민옵션)', fps: gpuScore ? `GPU 벤치 ${gpuScore.toLocaleString()}점 · FPS 실측 정보 없음` : 'FPS 실측 정보 없음', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    { title: '로스트아크 / 발로란트 / 롤', fps: cpuScore ? `CPU 벤치 ${cpuScore.toLocaleString()}점 · FPS 실측 정보 없음` : 'FPS 실측 정보 없음', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
    { title: '4K 프리미어 프로 영상편집', fps: '실제 편집·렌더링 벤치마크 없음', badge: 'bg-purple-100 text-purple-900 border-purple-300' },
    { title: '3D 그래픽 & 로컬 AI 추론', fps: 'VRAM·모델별 성능 검증 필요', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
  ];

  return (
    <div className="bg-white rounded-3xl p-7 shadow-xs border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Gamepad2 className="text-blue-600" size={22} /> 이 컴퓨터로 무엇을 할 수 있나요? (체감 성능)
        </h3>
        <span className="text-sm font-semibold text-slate-500">벤치마크 참고 · 실제 FPS 아님</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {games.map((g, i) => (
          <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <span className="text-sm font-bold text-slate-600 mb-2">{g.title}</span>
            <span className={`text-base font-extrabold px-3.5 py-2 rounded-xl border w-fit ${g.badge}`}>
              {g.fps}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AssemblyGuide = ({ parts }: { parts: Part[] }) => {
  const hasGpu = parts.some((p) => p.category?.toUpperCase().includes('GPU') && p.price > 0);

  return (
    <div className="bg-white rounded-3xl p-7 shadow-xs border border-amber-200 bg-amber-50/40 mb-8">
      <div className="flex items-center gap-2 mb-4 text-amber-950">
        <Tv className="text-amber-600" size={22} />
        <h3 className="text-xl font-bold">초보자를 위한 설치 & 모니터 포트 연결 가이드</h3>
      </div>

      <div className="space-y-4">
        {hasGpu && (
          <div className="bg-amber-100/80 border border-amber-300 p-5 rounded-2xl flex items-start gap-3.5">
            <AlertCircle className="text-amber-700 shrink-0 mt-0.5" size={20} />
            <div className="text-base text-amber-950 leading-relaxed">
              <strong className="font-extrabold text-lg">⚠️ 가장 많이 하는 실수 주의!</strong>
              <p className="mt-1">
                외장 그래픽카드(GPU)가 포함된 견적입니다. 모니터 케이블(HDMI/DP)을 메인보드 상단 포트가 아닌 <span className="underline font-black text-amber-950">아래쪽 외장 그래픽카드 단자</span>에 꽂으셔야 화면이 정상 출력됩니다!
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
            <MonitorCheck className="text-blue-600 shrink-0" size={20} />
            <span className="text-sm text-slate-800 font-semibold">권장 모니터 케이블: <strong className="text-blue-700">DP 1.4 또는 HDMI 2.1</strong></span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Zap className="text-indigo-600 shrink-0" size={20} />
            <span className="text-sm text-slate-800 font-semibold">권장 멀티탭: <strong className="text-indigo-700">과전류 차단 접지 멀티탭 사용 추천</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

const UpgradabilityIndex = ({ parts }: { parts: Part[] }) => {
  const power = parts.find((p) => p.category?.toUpperCase().includes('POWER'));
  const ram = parts.find((p) => p.category?.toUpperCase().includes('RAM'));

  const wattage = power?.specSummary?.match(/(\d{3,4})\s*W/i)?.[1] || power?.name.match(/(\d{3,4})\s*W/i)?.[1];

  return (
    <div className="bg-white rounded-3xl p-7 shadow-xs border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-emerald-600" size={22} />
          <h3 className="text-xl font-bold text-slate-900">미래 부품 업그레이드 확장성 지수</h3>
        </div>
        <span className="text-sm font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-4 py-1.5 rounded-full">
          확장성 점수 미산정
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-bold mb-1">그래픽카드 교체 여유</p>
          <p className="text-base font-extrabold text-slate-900">
            {wattage ? `파워 ${wattage}W · GPU 변경 시 권장 출력 재확인` : '파워 정격 및 GPU 권장 출력 확인 필요'}
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-bold mb-1">RAM 슬롯 여유</p>
          <p className="text-base font-extrabold text-slate-900">
            {ram?.name ? '메인보드의 총 슬롯 수와 현재 사용 슬롯 확인 필요' : 'RAM 선택 정보 없음'}
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-bold mb-1">SSD 저장공간 확장</p>
          <p className="text-base font-extrabold text-slate-900">
            메인보드의 여유 M.2 슬롯 확인 필요
          </p>
        </div>
      </div>
    </div>
  );
};

export function ResultsPage({ onRestart }: ResultsPageProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiRequestSeq = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState(0);
  const [isUpgradeMode, setIsUpgradeMode] = useState(false);
  const [isManualBuildMode, setIsManualBuildMode] = useState(false);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // 1. 자연어 견적 세션 확인
    const naturalResult = sessionStorage.getItem('recommendationResult');
    const naturalBudget = sessionStorage.getItem('extractedBudget');
    // 보유 부품 자동 견적 또한 사전 계산된 추천 결과를 사용합니다.
    // 일반 견적과 구분하여 기존 보라색 결과 UI 및 추가 예산 문구를 유지합니다.
    try {
      const savedBuildData = sessionStorage.getItem('pcBuildData');
      const parsedBuildData = savedBuildData ? JSON.parse(savedBuildData) : null;
      setIsUpgradeMode(Boolean(parsedBuildData?.isOwnedMode));
      setIsManualBuildMode(Boolean(parsedBuildData?.isManualBuildMode));
    } catch { setIsUpgradeMode(false); setIsManualBuildMode(false); }

    if (naturalResult) {
      try {
        const fetchedData = JSON.parse(naturalResult);
        setRecommendations(fetchedData);
        setBudget(naturalBudget ? parseInt(naturalBudget) : 0);
        setLoading(false);

        if (fetchedData && fetchedData.length > 0) {
          fetchAiAnalysis(fetchedData[0]);
        }
        return;
      } catch (err) {
        console.error("자연어 추천 결과 파싱 오류:", err);
      }
    }

    // 2. 일반 및 보유 부품 견적 세션 확인
    const data = sessionStorage.getItem('pcBuildData');
    if (!data) {
      onRestart();
      return;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(data);
    } catch (err) {
      setError("요청 데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    const { budget: storedBudget, purpose, brands } = parsedData;
    const parsedBudget = parseInt(storedBudget || '0');
    setBudget(parsedBudget);

    // /api/estimates/recommend does not accept fixed owned parts. Owned parts now
    // use ManualBuildPage and /api/manual-build/parts with exact DB IDs.
    fetchRecommendations({ budget: String(parsedBudget), purpose, brands: Array.isArray(brands) ? brands : [] })
      .then((data) => {
        if (!data.recommendations.length) {
          setError('설정하신 예산과 조건에 맞는 추천 조합이 없습니다.');
          setLoading(false);
          return;
        }
        setRecommendations(data.recommendations);
        setLoading(false);
        fetchAiAnalysis(data.recommendations[0]);
      })
      .catch((err) => {
        console.error('자동 견적 API 실패:', err);
        setError(err instanceof Error ? err.message : '추천 API 연결 실패');
        setLoading(false);
      });
  }, [onRestart]);

  const fetchAiAnalysis = async (selectedRec: Recommendation) => {
    const seq = ++aiRequestSeq.current;
    setAiLoading(true);
    setAiAnalysis(null);
    setAiError(null);

    try {
      const res = await axios.post(`${API_BASE}/api/estimates/analyze`, {
        parts: selectedRec.parts.map(part => ({ category: part.category, name: part.name }))
      });

      if (res.data && Array.isArray(res.data.pros) && Array.isArray(res.data.cons)) {
        if (seq === aiRequestSeq.current) setAiAnalysis(res.data);
      } else {
        throw new Error("Invalid AI Analysis Data");
      }
    } catch (err) {
      if (seq === aiRequestSeq.current) setAiError('Gemini AI 분석을 불러오지 못했습니다. 호환성 검증 성공을 의미하지 않습니다.');
    } finally {
      if (seq === aiRequestSeq.current) setAiLoading(false);
    }
  };

  const printOfficialEstimate = () => {
    const selected = recommendations[selectedIndex];
    if (!selected) return;

    const tabInfo = getTabBadgeInfo(selectedIndex, selected.rankName);
    const printWindow = window.open('', 'PrintEstimate', 'width=800,height=900,scrollbars=yes');
    if (!printWindow) return;

    const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PickPC 공식 추천 견적서</title>
        <style>
          body { font-family: 'Pretendard', sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 24px; font-weight: bold; color: #1e293b; }
          .info { background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 13px; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .total { text-align: right; font-size: 18px; font-weight: bold; color: #2563eb; margin-top: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">PickPC AI 공식 견적서</div>
          <div style="font-size:13px; color:#64748b;">발행일: ${new Date().toLocaleDateString()}</div>
        </div>
        <div class="info">
          <strong>추천 구성:</strong> ${escapeHtml(tabInfo.title)}<br>
          <strong>설정 예산:</strong> ${budget.toLocaleString()}원
        </div>
        <table>
          <thead>
            <tr>
              <th>카테고리</th>
              <th>부품명</th>
              <th>가격</th>
            </tr>
          </thead>
          <tbody>
            ${selected.parts.map(p => `
              <tr>
                <td>${escapeHtml(p.category)}</td>
                <td>${escapeHtml(p.name)}</td>
                <td>${p.price === 0 ? '0원' : p.price.toLocaleString() + '원'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          총 금액: ${selected.parts.reduce((sum, p) => sum + p.price, 0).toLocaleString()}원
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="font-bold text-slate-800 text-xl">
            백엔드 서버에서 최적의 PC 조합을 연산 중입니다...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-lg text-center border border-red-100 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-slate-900">견적 생성 실패</h2>
          <p className="text-slate-600 mb-6 text-base">{error}</p>
          <button
            onClick={onRestart}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-colors text-base"
          >
            다시 요청하기
          </button>
        </div>
      </div>
    );
  }

  const selected = recommendations[selectedIndex];
  if (!selected || !selected.parts) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-lg text-center border border-gray-100 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-slate-900">추천 결과가 없습니다</h2>
          <p className="text-slate-600 mb-6 text-base">
            설정하신 조건에 맞는 부품 조합을 찾지 못했습니다.
          </p>
          <button
            onClick={onRestart}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-colors text-base"
          >
            조건 재설정하기
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = selected.parts.reduce((sum, part) => sum + (part.price || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto pt-10 px-4">
        
        {/* 상단 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 text-white shadow-xl mb-8 transition-colors duration-500 ${
            isUpgradeMode ? "bg-purple-600 shadow-purple-100" : "bg-blue-600 shadow-blue-100"
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-3xl md:text-4xl font-extrabold">
              {isUpgradeMode ? "보유 부품 연동 맞춤 견적 결과" : "추천 PC 조합"}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm">
              <p className={isUpgradeMode ? "text-purple-100 text-base font-semibold" : "text-blue-100 text-base font-semibold"}>
                {isUpgradeMode ? "설정한 추가 예산" : isManualBuildMode ? "선택 부품 합계" : "설정 예산"}
              </p>
              <p className="text-3xl font-extrabold mt-1">
                {budget.toLocaleString()}원
              </p>
            </div>

            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm">
              <p className={isUpgradeMode ? "text-purple-100 text-base font-semibold" : "text-blue-100 text-base font-semibold"}>
                {isUpgradeMode ? "신규 부품 구매 총액" : "견적 총액"}
              </p>
              <p className="text-3xl font-extrabold mt-1">
                {totalPrice.toLocaleString()}원
              </p>
            </div>
          </div>
        </motion.div>

        {/* 3개 추천 조합 선택 탭 */}
        {recommendations.length > 1 && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {recommendations.map((rec, index) => {
              const tabInfo = getTabBadgeInfo(index, rec.rankName);
              const isSelected = selectedIndex === index;

              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedIndex(index);
                    fetchAiAnalysis(rec);
                  }}
                  className={`px-6 py-3.5 rounded-2xl font-extrabold text-base whitespace-nowrap transition-all flex flex-col items-start gap-0.5 border ${
                    isSelected
                      ? isUpgradeMode 
                        ? "bg-purple-600 text-white shadow-md border-purple-600 ring-2 ring-purple-300" 
                        : "bg-blue-600 text-white shadow-md border-blue-600 ring-2 ring-blue-300"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers size={16} />
                    {tabInfo.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 시각화 차트 */}
        <motion.div
          key={`chart-${selectedIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <EstimateChart
            parts={selected.parts}
            totalPrice={totalPrice}
            referenceParts={recommendations.map(rec => rec.parts)}
          />
        </motion.div>

        {/* 체감 성능 시뮬레이터 */}
        <motion.div
          key={`simulator-${selectedIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PerformanceSimulator parts={selected.parts} />
        </motion.div>

        {/* 미래 확장성 지수 */}
        <motion.div
          key={`upgrade-${selectedIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <UpgradabilityIndex parts={selected.parts} />
        </motion.div>

        {/* AI 분석 리포트 */}
        <motion.div
          key={`ai-${selectedIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`bg-white rounded-3xl p-8 shadow-sm mb-8 border ${
            isUpgradeMode ? "border-purple-100" : "border-blue-100"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-7 h-7 ${isUpgradeMode ? "text-purple-600" : "text-blue-600"}`} />
              <h2 className="text-2xl font-bold text-slate-900">
                {isUpgradeMode ? "AI 하드웨어 호환성 리포트" : "AI 전문가 분석 리포트"}
              </h2>
            </div>

            <span className="text-xs bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1">
              <Zap size={14} className="text-amber-500" /> Gemini AI 분석
            </span>
          </div>

          {aiLoading ? (
            <div className="flex flex-col items-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`w-8 h-8 border-4 border-t-transparent rounded-full mb-4 ${
                  isUpgradeMode ? "border-purple-600" : "border-blue-600"
                }`}
              />
              <p className="text-slate-500 text-base italic font-medium">
                선택하신 조합의 구성을 AI가 재분석하고 있습니다...
              </p>
            </div>
          ) : aiError ? (
            <p role="alert" className="p-5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 font-semibold">{aiError}</p>
          ) : aiAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/70 border border-emerald-100 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-emerald-800 font-extrabold text-lg">
                    <ThumbsUp size={20} /> 이런 점이 좋아요
                  </h3>
                  <span className="text-xs bg-emerald-200/80 text-emerald-900 font-bold px-2.5 py-1 rounded-md">
                    장점 포인트
                  </span>
                </div>
                <ul className="space-y-3">
                  {aiAnalysis?.pros?.map((p, i) => (
                    <li key={i} className="text-slate-900 text-base leading-relaxed flex items-start gap-2.5 bg-white/90 p-4 rounded-2xl border border-emerald-100/50 shadow-2xs font-medium">
                      <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-amber-800 font-extrabold text-lg">
                    <ThumbsDown size={20} /> 이런 점은 고려하세요
                  </h3>
                  <span className="text-xs bg-amber-200/80 text-amber-900 font-bold px-2.5 py-1 rounded-md">
                    체크 포인트
                  </span>
                </div>
                <ul className="space-y-3">
                  {aiAnalysis?.cons?.map((c, i) => (
                    <li key={i} className="text-slate-900 text-base leading-relaxed flex items-start gap-2.5 bg-white/90 p-4 rounded-2xl border border-amber-100/50 shadow-2xs font-medium">
                      <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : <p className="text-slate-500">분석 정보가 없습니다.</p>}
        </motion.div>

        {/* 조립 가이드 */}
        <motion.div
          key={`assembly-${selectedIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AssemblyGuide parts={selected.parts} />
        </motion.div>

        {/* 부품 상세 목록 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 mb-1">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-slate-600" /> 상세 세부 부품 명세
            </h3>
            <span className="text-sm font-semibold text-slate-500">총 {selected.parts.length}개 부품 구성</span>
          </div>

          {selected.parts.map((part, idx) => {
            const isOwned = part.isOwned === true; // 새 보유 부품 API가 명시한 소유 여부 사용
            const badge = getCategoryBadge(part.category, part.price, totalPrice, isOwned);
            const link = danawaLink(part);

            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl shadow-xs border border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:border-slate-200 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${badge.color}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                      {part.category}
                    </span>
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
                    {part.name}
                  </h3>

                  {part.specSummary && (
                    <p className="text-sm text-slate-600 font-medium">
                      {part.specSummary}
                    </p>
                  )}
                  {benchScore(part) && <p className="text-xs text-blue-700 font-semibold">벤치마크 {benchScore(part)?.toLocaleString()}점</p>}
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                  <p className="text-xl md:text-2xl font-black text-gray-900">
                    {`${part.price.toLocaleString()}원`}
                  </p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-sm font-extrabold hover:underline flex items-center gap-1 mt-1.5 ${
                      isUpgradeMode ? "text-purple-600" : "text-blue-600"
                    }`}
                  >
                    {link.isDirect ? '상품 상세 페이지' : '다나와 검색'} <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 제어 버튼 */}
        <div className="grid grid-cols-2 gap-4 mt-10">
          <button
            onClick={() => {
              sessionStorage.removeItem('pcBuildData');
              sessionStorage.removeItem('recommendationResult');
              sessionStorage.removeItem('extractedBudget');
              onRestart();
            }}
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 p-4 rounded-2xl font-extrabold text-gray-800 text-base hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <RotateCcw size={20} /> 메인 화면으로 가기
          </button>

          <button
            onClick={printOfficialEstimate}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-2xl font-extrabold text-base hover:bg-slate-800 transition-colors shadow-md"
          >
            <Printer size={20} /> 견적서 인쇄 / PDF 저장
          </button>
        </div>
      </div>
    </div>
  );
}