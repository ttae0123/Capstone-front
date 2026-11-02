import React from 'react';
import { benchScore } from '../utils/hardware';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface PartDetail {
  category: string;
  name: string;
  price: number;
  brand?: string;
  specSummary?: string;
  benchScore?: number;
}

interface EstimateChartProps {
  parts: PartDetail[];
  totalPrice: number;
  referenceParts?: PartDetail[][];
}

const COLORS: { [key: string]: string } = {
  CPU: '#2563EB',        // Blue
  GPU: '#059669',        // Emerald
  RAM: '#D97706',        // Amber
  SSD: '#7C3AED',        // Purple
  Mainboard: '#DB2777',  // Pink
  Power: '#4F46E5',      // Indigo
  Case: '#475569',       // Slate
  Cooler: '#0891B2',     // Cyan
};

function calculateTierScore(category: string, score: number): { score: number; tier: string; color: string } {
  if (!score || score <= 0) {
    return { score: 20, tier: '기본 보급형', color: 'text-slate-500 bg-slate-100' };
  }

  const cat = category.toUpperCase();
  if (cat === 'CPU') {
    if (score >= 45000) return { score: 95, tier: '최상급 플래그십', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (score >= 32000) return { score: 78, tier: '고성능 게이밍/작업', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    if (score >= 20000) return { score: 55, tier: '표준 밸런스형', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    return { score: 32, tier: '엔트리 사무/캐주얼', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }

  if (cat === 'GPU') {
    if (score >= 30000) return { score: 96, tier: '4K 초고화질 게이밍', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (score >= 22000) return { score: 75, tier: 'QHD 144Hz 쾌적', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    if (score >= 14000) return { score: 48, tier: 'FHD 국민옵션 원활', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    return { score: 25, tier: '사무 / 가벼운 게임', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }

  if (cat === 'RAM') {
    if (score >= 23) return { score: 90, tier: '초고클럭 DDR5 튜닝', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    if (score >= 20) return { score: 65, tier: '고속 표준 DDR5', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    return { score: 40, tier: '일반 표준 DDR4', color: 'text-slate-700 bg-slate-100 border-slate-200' };
  }

  if (cat === 'SSD') {
    if (score >= 55000) return { score: 95, tier: '초고속 PCIe 4.0/5.0', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (score >= 28000) return { score: 70, tier: '고성능 NVMe SSD', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    return { score: 42, tier: '표준 가성비 SSD', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  }

  return { score: 50, tier: '표준 사양', color: 'text-slate-600 bg-slate-50' };
}

export const EstimateChart: React.FC<EstimateChartProps> = ({ parts, totalPrice }) => {
  const budgetData = parts.map((part) => ({
    name: part.category,
    value: part.price,
    percentage: ((part.price / (totalPrice || 1)) * 100).toFixed(1),
  }));

  const categories = ['CPU', 'GPU', 'RAM', 'SSD'];
  const radarData = categories.map((subject) => {
    const part = parts.find((p) => p.category?.toUpperCase() === subject);
    const actual = part ? benchScore(part) : 0;
    const { score, tier, color } = calculateTierScore(subject, actual);

    return {
      subject,
      score,
      actualScore: actual,
      tier,
      tierColor: color,
      name: part?.name || '부품 정보 없음',
    };
  });

  const hasBenchmarks = radarData.some((item) => item.actualScore > 0);

  const gpuScore = radarData.find((d) => d.subject === 'GPU')?.score || 0;
  const cpuScore = radarData.find((d) => d.subject === 'CPU')?.score || 0;
  let specialization = '⚖️ 밸런스 균형형 구성';
  if (gpuScore - cpuScore >= 18) {
    specialization = '🎮 GPU 게이밍 집중형 구성';
  } else if (cpuScore - gpuScore >= 15) {
    specialization = '💻 CPU 연산·작업 특화형 구성';
  }

  return (
      <div className="w-full mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-7 bg-white rounded-3xl shadow-xs border border-slate-200">

          {/* 1. 예산 지출 비중 도넛 차트 */}
          <div className="flex flex-col items-center justify-between p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
            <div className="w-full text-left">
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                부품별 예산 지출 비중
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">총 지출 금액 대비 부품별 배분 비율입니다.</p>
            </div>

            <div className="w-full h-[250px] my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                      data={budgetData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                  >
                    {budgetData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.name] || '#94A3B8'}
                            stroke="#FFFFFF"
                            strokeWidth={2}
                        />
                    ))}
                  </Pie>
                  <Tooltip
                      formatter={(value: number, name: string, entry: any) => [
                        `${value.toLocaleString()}원 (${entry.payload.percentage}%)`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        color: '#1E293B',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                  />
                  <Legend
                      verticalAlign="bottom"
                      height={32}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. 성능 밸런스 레이더 차트 */}
          <div className="flex flex-col items-center justify-between p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
            <div className="w-full flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  PassMark 성능 체급 인덱스
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">부품별 하드웨어 등급 분포를 나타냅니다.</p>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
              {specialization}
            </span>
            </div>

            <div className="w-full h-[250px] my-1">
              {hasBenchmarks ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                      <PolarGrid stroke="#CBD5E1" strokeDasharray="3 3" />
                      <PolarAngleAxis
                          dataKey="subject"
                          stroke="#475569"
                          tick={{ fill: '#334155', fontSize: 12, fontWeight: '800' }}
                      />
                      <PolarRadiusAxis
                          angle={45}
                          domain={[0, 100]}
                          stroke="#94A3B8"
                          tick={{ fill: '#94A3B8', fontSize: 9 }}
                          tickCount={5}
                      />
                      <Radar
                          name="체급 인덱스"
                          dataKey="score"
                          stroke="#059669"
                          strokeWidth={2.5}
                          fill="#10B981"
                          fillOpacity={0.45}
                      />
                      <Tooltip
                          formatter={(value: number, _name: string, entry: any) => [
                            `${entry?.payload?.actualScore ? entry.payload.actualScore.toLocaleString() + '점' : '점수 미표기'} (${entry?.payload?.tier})`,
                            `${entry?.payload?.subject} 실측 점수`
                          ]}
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E2E8F0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            color: '#1E293B',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                    벤치마크 데이터를 불러올 수 없습니다.
                  </div>
              )}
            </div>
          </div>

        </div>
      </div>
  );
};

export default EstimateChart;