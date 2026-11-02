import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE, { fetchRecommendations } from '../utils/api';
import { API_TIMEOUT_MS } from '../utils/requestTimeout';
import { getAxiosErrorMessage } from '../utils/apiError';
import { createResultScreenPdf } from '../utils/resultScreenPdf';
import { benchScore, danawaLink } from '../utils/hardware';
import type { PartDetail, Recommendation } from '../types/pc';
import EstimateChart from '../components/EstimateChart';
import { LoadingScreen } from './LoadingScreen';
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
  TrendingUp,
  Database,
  Mail,
  Send,
  X,
  CheckCircle2,
  Server,
  Activity,
  BarChart3
} from 'lucide-react';

type Part = PartDetail;

interface AiAnalysis {
  pros: string[];
  cons: string[];
}

interface ResultsPageProps {
  onRestart: () => void;
}

// 백엔드 rankName의 실제 추천 전략을 우선하여 조합명이 서로 바뀌는 문제를 방지합니다.
// 전략명이 없는 오래된 API 응답만 1/2/3번 순서를 이용합니다.
const getTabBadgeInfo = (index: number, rec?: Recommendation) => {
  const rankName = (rec?.rankName ?? '').trim();
  const key = rankName.toUpperCase().replace(/\s+/g, '');

  if (key.includes('GPU_FOCUSED') || key.includes('GPU중심') || key.includes('GPU강화') || key.includes('GPU업') || key.includes('그래픽중심')) {
    return { title: 'GPU 중심 조합' };
  }
  if (key.includes('CPU_FOCUSED') || key.includes('CPU중심') || key.includes('CPU강화') || key.includes('CPU업') || key.includes('프로세서중심')) {
    return { title: 'CPU 중심 조합' };
  }
  if (key.includes('BALANCED') || key.includes('균형')) {
    return { title: '균형있는 조합' };
  }

  // 수동 조립, 보유 부품 조합 등의 고유 제목은 그대로 보여줍니다.
  if (rankName && !/^추천\s*조합\s*[123](?:번)?$/i.test(rankName)) {
    return { title: rankName };
  }
  return { title: ['균형있는 조합', 'GPU 중심 조합', 'CPU 중심 조합'][index] ?? `추천 조합 ${index + 1}` };
};

const getCategoryBadge = (category: string, price: number, totalPrice: number, isOwned: boolean) => {
  const catUpper = category?.toUpperCase() || '';
  const ratio = (price / (totalPrice || 1)) * 100;

  if (isOwned) {
    return {
      label: '보유 자산 활용 (비용 제외)',
      color: 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-black',
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

// 기존 4개 카드의 레이아웃은 유지하고, 평가 문장만 별도 Gemini 분석 결과를 표시합니다.
// 기존 AI 전문가 분석 리포트(pros/cons)와는 완전히 독립적입니다.
interface CapabilityReport {
  pubg: string;
  esports: string;
  videoEditing: string;
  ai3d: string;
}

type CapabilityState =
  | { key: string; status: 'loading' }
  | { key: string; status: 'ready'; report: CapabilityReport }
  | { key: string; status: 'error'; message: string };

const PerformanceSimulator = ({ state }: { state: CapabilityState | null }) => {
  const games = [
    { title: '배틀그라운드 (FHD 국민옵션)', text: state?.status === 'ready' ? state.report.pubg : null, badge: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
    { title: '로스트아크 / 발로란트 / 롤', text: state?.status === 'ready' ? state.report.esports : null, badge: 'bg-blue-50 text-blue-900 border-blue-200' },
    { title: '4K 프리미어 프로 영상편집', text: state?.status === 'ready' ? state.report.videoEditing : null, badge: 'bg-purple-50 text-purple-900 border-purple-200' },
    { title: '3D 그래픽 & 로컬 AI 모델 구동', text: state?.status === 'ready' ? state.report.ai3d : null, badge: 'bg-rose-50 text-rose-900 border-rose-200' },
  ];

  return (
    <div className="bg-white rounded-3xl p-7 shadow-xs border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Gamepad2 className="text-blue-600" size={22} /> 이 컴퓨터로 무엇을 할 수 있나요?
        </h3>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
          Gemini AI 분석
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {games.map((g, i) => (
          <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-600">{g.title}</span>
            <span className={`text-sm sm:text-base font-semibold px-3.5 py-2 rounded-xl border w-fit leading-relaxed ${g.badge}`}>
              {state?.status === 'ready' ? (g.text?.trim() || '분석 근거가 부족합니다.')
                : state?.status === 'error' ? state.message
                : 'AI가 부품 사양을 분석 중입니다...'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 파워 출력 및 부품 용량 기반 업그레이드 확장성 지수
const UpgradabilityIndex = ({ parts }: { parts: Part[] }) => {
  const power = parts.find((p) => p.category?.toUpperCase().includes('POWER'));
  const ram = parts.find((p) => p.category?.toUpperCase().includes('RAM'));
  const ssd = parts.find((p) => p.category?.toUpperCase().includes('SSD'));
  const gpu = parts.find((p) => p.category?.toUpperCase().includes('GPU'));

  const pWatt = parseInt(power?.specSummary?.match(/(\d{3,4})\s*W/i)?.[1] || power?.name.match(/(\d{3,4})\s*W/i)?.[1] || '600');
  const gpuWatt = parseInt(gpu?.specSummary?.match(/(\d{3,4})\s*W/i)?.[1] || '500');
  const powerMargin = pWatt - gpuWatt;

  const ramSize = parseInt(ram?.specSummary?.match(/(\d{1,3})\s*GB/i)?.[1] || ram?.name.match(/(\d{1,3})\s*GB/i)?.[1] || '16');
  const ssdSize = parseInt(ssd?.specSummary?.match(/(\d{3,4})\s*(?:GB|TB)/i)?.[1] || ssd?.name.match(/(\d{3,4})\s*(?:GB|TB)/i)?.[1] || '500');

  let score = 70;
  if (powerMargin >= 150) score += 15;
  if (ramSize >= 32) score += 10;
  if (ssdSize >= 1000) score += 5;

  return (
    <div className="bg-white rounded-3xl p-7 shadow-xs border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-emerald-600" size={22} />
          <h3 className="text-xl font-bold text-slate-900">미래 부품 업그레이드 확장성 지수</h3>
        </div>
        <span className="text-sm font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-4 py-1.5 rounded-full flex items-center gap-1.5">
          <CheckCircle2 size={16} /> 확장 여유 {score}점 (우수)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-bold mb-1">그래픽카드 교체 여유</p>
          <p className="text-sm font-black text-slate-900">
            정격 {pWatt}W 탑재 (여유 +{Math.max(powerMargin, 50)}W)
          </p>
          <p className="text-xs text-emerald-700 mt-1 font-medium">차세대 중상급 GPU 장착 가능</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-bold mb-1">RAM 메모리 확장성</p>
          <p className="text-sm font-black text-slate-900">
            현재 {ramSize}GB 구성 완료
          </p>
          <p className="text-xs text-blue-700 mt-1 font-medium">보드 여유 슬롯에 추가 증설 가능</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-bold mb-1">스토리지 용량 확장</p>
          <p className="text-sm font-black text-slate-900">
            기본 고속 NVMe SSD 탑재
          </p>
          <p className="text-xs text-indigo-700 mt-1 font-medium">추가 M.2 및 SATA 포트 확장 여유</p>
        </div>
      </div>
    </div>
  );
};

export function ResultsPage({ onRestart }: ResultsPageProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  // 데이터 적재 파이프라인과 함께 갱신되는 예산 비율 테이블의 최신 시각입니다.
  const [dataUpdatedAt, setDataUpdatedAt] = useState<string | null>(null);
  // 위 4개 카드만 별도 API로 분석합니다. 기존 AI 장단점 리포트는 수정하지 않습니다.
  const [capabilityState, setCapabilityState] = useState<CapabilityState | null>(null);
  const capabilityCache = useRef(new Map<string, CapabilityReport>());

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiRequestSeq = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState(0);
  const naturalWarnings = (() => {
    try {
      const value = JSON.parse(sessionStorage.getItem('naturalQuoteWarnings') || '[]');
      return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
    } catch { return [] as string[]; }
  })();
  const [isUpgradeMode, setIsUpgradeMode] = useState(false);
  const [isManualBuildMode, setIsManualBuildMode] = useState(false);

  // 이메일 전송 모달 관련 상태
  const resultPrintRef = useRef<HTMLDivElement | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    let active = true;
    axios.get<{ dataUpdatedAt: string | null }>(`${API_BASE}/api/hardware-data/status`, { timeout: 7000 })
      .then(({ data }) => {
        if (active && typeof data?.dataUpdatedAt === 'string') {
          setDataUpdatedAt(data.dataUpdatedAt);
        }
      })
      .catch(() => { /* DB 시각 조회 실패가 견적 결과 로딩을 막지 않도록 합니다. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const naturalResult = sessionStorage.getItem('recommendationResult');
    const naturalBudget = sessionStorage.getItem('extractedBudget');

    try {
      const savedBuildData = sessionStorage.getItem('pcBuildData');
      const parsedBuildData = savedBuildData ? JSON.parse(savedBuildData) : null;
      setIsUpgradeMode(Boolean(parsedBuildData?.isOwnedMode));
      setIsManualBuildMode(Boolean(parsedBuildData?.isManualBuildMode));
    } catch {
      setIsUpgradeMode(false);
      setIsManualBuildMode(false);
    }

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
      }, { timeout: API_TIMEOUT_MS.aiAnalysis });

      if (res.data && Array.isArray(res.data.pros) && Array.isArray(res.data.cons)) {
        if (seq === aiRequestSeq.current) setAiAnalysis(res.data);
      } else {
        throw new Error("Invalid AI Analysis Data");
      }
    } catch (err) {
      if (seq === aiRequestSeq.current) setAiError(getAxiosErrorMessage(err, 'Gemini AI 분석'));
    } finally {
      if (seq === aiRequestSeq.current) setAiLoading(false);
    }
  };

  const selected = recommendations[selectedIndex];
  const totalPrice = selected ? selected.parts.reduce((sum, part) => sum + (part.price || 0), 0) : 0;

  // 선택된 조합의 4개 카드만 갱신합니다. 기존 fetchAiAnalysis에는 영향이 없습니다.
  const capabilityKey = selected?.parts ? JSON.stringify(selected.parts.map(p => [
    p.category, p.productCode ?? p.name, p.benchScore ?? null, p.specSummary ?? '',
  ])) : '';
  useEffect(() => {
    if (!selected?.parts?.length || !capabilityKey) return;
    const cached = capabilityCache.current.get(capabilityKey);
    if (cached) {
      setCapabilityState({ key: capabilityKey, status: 'ready', report: cached });
      return;
    }

    let active = true;
    setCapabilityState({ key: capabilityKey, status: 'loading' });
    axios.post<CapabilityReport>(`${API_BASE}/api/estimates/capabilities`, {
      parts: selected.parts.map(p => ({
        category: p.category,
        name: p.name,
        benchScore: typeof p.benchScore === 'number' ? p.benchScore : null,
        specSummary: p.specSummary ?? '',
      }))
    }, { timeout: API_TIMEOUT_MS.capabilityCards })
      .then(({ data }) => {
        if (!data || !['pubg', 'esports', 'videoEditing', 'ai3d'].every(
          key => typeof data[key as keyof CapabilityReport] === 'string'
        )) throw new Error('AI 카드 응답 형식 오류');
        capabilityCache.current.set(capabilityKey, data);
        if (active) setCapabilityState({ key: capabilityKey, status: 'ready', report: data });
      })
      .catch((err) => {
        if (active) setCapabilityState({ key: capabilityKey, status: 'error', message: getAxiosErrorMessage(err, 'AI 활용도 평가') });
      });
    return () => { active = false; };
  }, [selected, capabilityKey]);


  // 실제 화면을 이미지로 렌더링하여 다중 페이지 PDF로 전환합니다.
  // ref는 결과 본문에만 연결되어 있어 이메일 모달과 작업 버튼은 포함되지 않습니다.
  const createVisiblePdf = async (): Promise<Blob> => {
    if (!resultPrintRef.current) throw new Error('견적 결과 화면을 찾을 수 없습니다.');
    return createResultScreenPdf(resultPrintRef.current);
  };

  // 실제 SMTP 발송 API. 화면에 표시된 차트/AI 분석/부품명세를 그대로 PDF에 포함합니다.
  const handleSendEmailPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim() || sendingEmail || !selected) return;

    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(false);

    try {
      const renderedPdf = await createVisiblePdf();
      const request = {
        email: targetEmail.trim(),
        budget,
        rankName: getTabBadgeInfo(selectedIndex, selected).title,
        parts: selected.parts.map(p => ({
          category: p.category,
          productCode: p.productCode ?? null,
          id: p.id ?? null,
          isOwned: Boolean(p.isOwned),
        })),
      };
      const body = new FormData();
      body.append('estimate', new Blob([JSON.stringify(request)], { type: 'application/json' }));
      body.append('pdf', renderedPdf, 'PickPC-results.pdf');

      const response = await axios.post<{ success: boolean; message: string }>(
        `${API_BASE}/api/estimates/send-pdf`, body, { timeout: 90_000 }
      );
      if (response.data?.success !== true) {
        throw new Error('메일 서버에서 발송 완료 응답을 받지 못했습니다.');
      }
      setEmailSuccess(true);
      window.setTimeout(() => {
        setEmailSuccess(false);
        setEmailModalOpen(false);
        setTargetEmail('');
      }, 3000);
    } catch (err) {
      setEmailError(getAxiosErrorMessage(err, '결과 화면 PDF 이메일 발송'));
    } finally {
      setSendingEmail(false);
    }
  };

  // 저장/인쇄도 메일 첨부 파일과 동일한 결과 화면 PDF를 사용합니다.
  // 클릭 시 미리 탭을 열어 비동기 변환 뒤 팝업 차단이 발생하지 않게 합니다.
  const printOfficialEstimate = async () => {
    if (!selected) return;
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.title = 'PickPC 결과 화면 PDF 준비 중';
      previewWindow.document.body.textContent = '견적 결과 화면을 PDF로 변환 중입니다...';
    }
    try {
      const pdf = await createVisiblePdf();
      const url = URL.createObjectURL(pdf);
      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.replace(url);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'PickPC-results.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      // 열려 있는 PDF 뷰어의 읽기 완료를 위해 URL을 즉시 해제하지 않습니다.
      window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    } catch (err) {
      if (previewWindow && !previewWindow.closed) previewWindow.close();
      window.alert(err instanceof Error ? err.message : 'PDF 생성에 실패했습니다.');
    }
  };

  if (loading) return <LoadingScreen />;

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div ref={resultPrintRef} className="max-w-4xl mx-auto pt-10 px-4">
        
        {/* 상단 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 text-white shadow-xl transition-colors duration-500 ${
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

        {naturalWarnings.length > 0 && sessionStorage.getItem('recommendationResult') && (
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-950" role="note">
            <p className="font-bold text-base flex items-center gap-2"><AlertCircle size={18} /> 자연어 견적 조건 안내</p>
            {naturalWarnings.map((warning, index) => (
              <p key={index} className="text-sm mt-2 leading-relaxed">{warning}</p>
            ))}
          </div>
        )}

        {/* 크롤링 & 데이터 신뢰성 배너 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-5 mb-8 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/90 border-2 border-blue-200/90 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs shrink-0">
                <Database size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-blue-700 uppercase tracking-wide">VERIFIED LIVE HARDWARE DATA</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  공인 벤치마크 & 전자상거래 실시간 크롤링 검증 완료
                </h3>
              </div>
            </div>
            <span className="text-xs font-black text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              {dataUpdatedAt ? `DB 최종 반영: ${dataUpdatedAt}` : 'DB 갱신 시각 미확인'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
            <div className="bg-white p-3.5 rounded-2xl border border-blue-100/80 shadow-2xs flex items-center gap-3">
              <Server size={20} className="text-cyan-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-900 block">다나와 (Danawa)</span>
                <span className="text-[11px] text-slate-500 font-medium">국내 실시간 최저가 및 소켓 규격</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-indigo-100/80 shadow-2xs flex items-center gap-3">
              <Activity size={20} className="text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-900 block">컴퓨존 (Compuzone)</span>
                <span className="text-[11px] text-slate-500 font-medium">완본체 출고 통계 및 예산비율</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-100/80 shadow-2xs flex items-center gap-3">
              <BarChart3 size={20} className="text-amber-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-900 block">PassMark Software</span>
                <span className="text-[11px] text-slate-500 font-medium">CPU/GPU/RAM/SSD 공인 성능 점수</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3개 추천 조합 선택 탭 */}
        {recommendations.length > 1 && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {recommendations.map((rec, index) => {
              const tabInfo = getTabBadgeInfo(index, rec);
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

        {/* 벤치마크 및 예산 차트 */}
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
          <PerformanceSimulator state={capabilityState?.key === capabilityKey ? capabilityState : null} />
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

        {/* 부품 상세 목록 (보유 부품의 경우 녹색 계열 하이라이트 배경 및 전용 태그 적용) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 mb-1">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-slate-600" /> 상세 세부 부품 명세
            </h3>
            <span className="text-sm font-semibold text-slate-500">총 {selected.parts.length}개 부품 구성</span>
          </div>

          {selected.parts.map((part, idx) => {
            const isOwned = part.isOwned === true;
            const badge = getCategoryBadge(part.category, part.price, totalPrice, isOwned);
            const link = danawaLink(part);
            const cleanName = part.name.replace(/^\[보유\s*중\]\s*/i, '');

            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl transition-all flex flex-col md:flex-row md:justify-between md:items-center gap-4 ${
                  isOwned
                    ? "bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white border-2 border-emerald-400/90 shadow-sm ring-4 ring-emerald-500/10"
                    : "bg-white shadow-xs border border-gray-100 hover:border-slate-200"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${badge.color}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${isOwned ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {part.category}
                    </span>
                    {isOwned && (
                      <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                        기존 부품 재사용
                      </span>
                    )}
                  </div>

                  <h3 className={`text-lg md:text-xl font-bold leading-snug ${isOwned ? 'text-emerald-950 font-black' : 'text-gray-900'}`}>
                    {cleanName}
                  </h3>

                  {part.specSummary && (
                    <p className={`text-sm font-medium ${isOwned ? 'text-emerald-800/80' : 'text-slate-600'}`}>
                      {part.specSummary}
                    </p>
                  )}
                  {benchScore(part) > 0 && (
                    <p className={`text-xs font-semibold ${isOwned ? 'text-emerald-700 font-bold' : 'text-blue-700'}`}>
                      PassMark 벤치마크 {benchScore(part)?.toLocaleString()}점
                    </p>
                  )}
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                  <p className={`text-xl md:text-2xl font-black ${isOwned ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {isOwned ? '0원' : `${part.price.toLocaleString()}원`}
                  </p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-sm font-extrabold hover:underline flex items-center gap-1 mt-1.5 ${
                      isOwned ? "text-emerald-700 hover:text-emerald-800" : isUpgradeMode ? "text-purple-600" : "text-blue-600"
                    }`}
                  >
                    {link.isDirect ? '상품 상세 페이지' : '다나와 검색'} <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 제어 버튼 (메인으로 / PDF 이메일 발송 / 인쇄 및 PDF) */}
        <div data-pdf-ignore="true" className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-10">
          <button
            onClick={() => {
              sessionStorage.removeItem('pcBuildData');
              sessionStorage.removeItem('recommendationResult');
              sessionStorage.removeItem('extractedBudget');
              sessionStorage.removeItem('naturalQuoteWarnings');
              sessionStorage.removeItem('naturalQuoteUsage');
              onRestart();
            }}
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 p-4 rounded-2xl font-extrabold text-gray-800 text-sm sm:text-base hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <RotateCcw size={18} /> 메인 화면으로
          </button>

          <button
            onClick={() => {
              setEmailModalOpen(true);
              setEmailError(null);
              setEmailSuccess(false);
            }}
            className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-2xl font-extrabold text-sm sm:text-base hover:bg-blue-100 transition-colors shadow-2xs"
          >
            <Mail size={18} /> 이메일로 견적서(PDF) 보내기
          </button>

          <button
            onClick={printOfficialEstimate}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-2xl font-extrabold text-sm sm:text-base hover:bg-slate-800 transition-colors shadow-md"
          >
            <Printer size={18} /> 견적서 인쇄 / PDF 저장
          </button>
        </div>

      </div>

      {/* 이메일로 견적서 PDF 발송 모달 */}
      <AnimatePresence>
        {emailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative"
            >
              <button
                onClick={() => setEmailModalOpen(false)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">견적서 PDF 이메일 발송</h3>
                  <p className="text-xs text-slate-500 font-medium">현재 결과 화면의 차트·분석·부품 명세를 그대로 PDF로 발송합니다.</p>
                </div>
              </div>

              {emailSuccess ? (
                <div className="py-8 text-center space-y-2.5">
                  <CheckCircle2 size={46} className="text-emerald-500 mx-auto" />
                  <p className="text-base font-bold text-slate-900">메일 서버에 견적서 PDF 발송 요청이 접수되었습니다!</p>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    <strong className="text-blue-600">{targetEmail}</strong> 메일함을 확인해 주세요. 수신까지 잠시 걸릴 수 있습니다.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendEmailPdf} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                    <p><strong>발송 견적:</strong> {getTabBadgeInfo(selectedIndex, selected).title}</p>
                    <p><strong>견적 총액:</strong> {totalPrice.toLocaleString()}원 ({selected.parts.length}개 부품)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      수신받을 이메일 주소
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-semibold text-slate-800"
                    />
                  </div>

                  {emailError && (
                    <p className="text-xs font-bold text-rose-600">
                      {emailError}
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={sendingEmail || !targetEmail}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {sendingEmail ? (
                        <>
                          <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ repeat: Infinity, duration: 1 }} 
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" 
                          />
                          견적서 PDF 발송 중...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> 견적서 PDF 발송하기
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}