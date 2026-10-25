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

// 부품 카테고리별 차트 컬러 (밝은 배경에 잘 어울리는 비비드/파스텔 톤)
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

export const EstimateChart: React.FC<EstimateChartProps> = ({ parts, totalPrice, referenceParts = [] }) => {
  // 1. 도넛 차트용 예산 비중 데이터 가공
  const budgetData = parts.map((part) => ({
    name: part.category,
    value: part.price,
    percentage: ((part.price / (totalPrice || 1)) * 100).toFixed(1),
  }));

  // Only real benchmark scores returned by the backend are used. Each category
  // is normalised against the highest available score among the 1-3 recommendations.
  // Different category benchmarks are NOT interchangeable absolute performance scores.
  const categories = ['CPU', 'GPU', 'RAM', 'SSD'];
  const candidates = referenceParts.length ? referenceParts : [parts];
  const radarData = categories.map(subject => {
    const part = parts.find(p => p.category?.toUpperCase() === subject);
    const actualScore = part ? benchScore(part) : null;
    const maxScore = Math.max(...candidates.flatMap(rec => rec.filter(p => p.category?.toUpperCase() === subject).map(p => benchScore(p) ?? 0)), 0);
    return {
      subject, score: actualScore && maxScore > 0 ? Math.round(actualScore / maxScore * 100) : 0,
      actualScore, available: Boolean(actualScore && maxScore),
    };
  });
  const hasBenchmarks = radarData.some(item => item.available);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
      {/* 1. 예산 분배 도넛 차트 */}
      <div className="flex flex-col items-center justify-center p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          부품별 예산 지출 비중
        </h3>
        <p className="text-xs text-slate-500 mb-4">어떤 부품에 예산이 집중되었는지 확인해보세요.</p>
        <div className="w-full h-[260px]">
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
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. 성능 밸런스 레이더 차트 */}
      <div className="flex flex-col items-center justify-center p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          벤치마크 상대 지수
        </h3>
        <p className="text-xs text-slate-500 mb-4">동일 부품군의 추천 후보 중 최고 점수 대비 비율(%)입니다. 실측 FPS는 아닙니다.</p>
        <div className="w-full h-[260px]">
          {hasBenchmarks ? <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#CBD5E1" />
              <PolarAngleAxis dataKey="subject" stroke="#475569" tick={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" tick={false} />
              <Radar
                name="성능 스코어"
                dataKey="score"
                stroke="#059669"
                fill="#10B981"
                fillOpacity={0.35}
              />
              <Tooltip
                formatter={(value: number, _name: string, entry: any) => [entry?.payload?.actualScore ? `${entry.payload.actualScore.toLocaleString()}점 (상대지수 ${value}%)` : '점수 없음', '벤치마크']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  color: '#1E293B',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              />
            </RadarChart>
          </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-slate-500 font-semibold text-sm">벤치마크 데이터가 제공되지 않았습니다.</div>}
        </div>
      </div>
    </div>
  );
};

export default EstimateChart;