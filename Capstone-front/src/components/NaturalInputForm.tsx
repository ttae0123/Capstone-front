import React, { useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { LoadingScreen } from './LoadingScreen';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import API_BASE from '../utils/api';
import { API_TIMEOUT_MS } from '../utils/requestTimeout';
import { getAxiosErrorMessage } from '../utils/apiError';
import type { Recommendation } from '../types/pc';

interface NaturalInputFormProps {
  onComplete: () => void;
}

type ConflictOption = {
  id: string;
  label: string;
  description: string;
  usage: 'OFFICE' | 'GAMING' | 'HIGH_END';
  budget: number;
};

type NaturalResponse = {
  status: 'READY' | 'CONFIRMATION_REQUIRED';
  recommendations?: Recommendation[];
  userBudget?: number;
  usage?: string;
  warnings?: string[];
  message?: string;
  options?: ConflictOption[];
};

const quickChips = [
  { label: '배틀그라운드가 돌아가는 200만원짜리 컴퓨터 견적 맞춰줘', text: '배틀그라운드가 돌아가는 200만원짜리 컴퓨터 견적 맞춰줘' },
  { label: '여유 예산 150만원으로 컴퓨터 맞추고 싶어', text: '여유 예산 150만원으로 컴퓨터 맞추고 싶어' },
  { label: '사무용 컴퓨터 추천해줘', text: '사무용 컴퓨터 추천해줘' },
];

export function NaturalInputForm({ onComplete }: NaturalInputFormProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflict, setConflict] = useState<{ message: string; options: ConflictOption[] } | null>(null);

  const finish = (data: NaturalResponse) => {
    if (!Array.isArray(data.recommendations) || data.recommendations.length === 0) {
      throw new Error('조건에 맞는 추천 조합을 생성하지 못했습니다.');
    }
    sessionStorage.setItem('recommendationResult', JSON.stringify(data.recommendations));
    sessionStorage.setItem('extractedBudget', String(data.userBudget ?? 0));
    sessionStorage.setItem('naturalQuoteWarnings', JSON.stringify(data.warnings || []));
    sessionStorage.setItem('naturalQuoteUsage', data.usage || '');
    setConflict(null);
    onComplete();
  };

  const handleSearch = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setConflict(null);
    try {
      const res = await axios.post<NaturalResponse>(`${API_BASE}/api/estimates/natural-language`,
        { userInput: input }, { timeout: API_TIMEOUT_MS.naturalRecommend });
      if (res.data.status === 'CONFIRMATION_REQUIRED') {
        if (!res.data.options?.length) throw new Error('선택할 예산 조건이 없습니다.');
        setConflict({ message: res.data.message || '견적 조건을 선택해 주세요.', options: res.data.options });
        return;
      }
      sessionStorage.removeItem('pcBuildData');
      finish(res.data);
    } catch (err) {
      console.error('AI 자연어 견적 요청 실패:', err);
      alert(getAxiosErrorMessage(err, '자연어 견적 생성'));
    } finally {
      setLoading(false);
    }
  };

  const applyChoice = async (option: ConflictOption) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post<NaturalResponse>(`${API_BASE}/api/estimates/natural-language/confirm`,
        { usage: option.usage, budget: option.budget }, { timeout: API_TIMEOUT_MS.recommend });
      sessionStorage.removeItem('pcBuildData');
      finish({ ...res.data, warnings: [option.description] });
    } catch (err) {
      console.error('선택한 견적 조건 요청 실패:', err);
      alert(getAxiosErrorMessage(err, '선택한 조건으로 견적 생성'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && createPortal(<LoadingScreen />, document.body)}
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-3xl shadow-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2.5 mb-5">
          <Sparkles className="text-blue-600 w-7 h-7" />
          <h3 className="font-extrabold text-2xl text-slate-900">AI 전문가에게 자연어로 견적 요청</h3>
        </div>
        <div className="relative">
          <textarea
            value={input}
            maxLength={1500}
            onChange={e => { setInput(e.target.value); setConflict(null); }}
            placeholder="배틀그라운드가 돌아가는 200만원짜리 컴퓨터 견적 맞춰줘"
            className="w-full p-6 pr-20 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl outline-none transition-all min-h-[160px] resize-none text-slate-900 text-lg md:text-xl font-semibold leading-relaxed"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !input.trim()}
            className="absolute right-5 bottom-5 bg-blue-600 p-4 rounded-2xl text-white hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-lg active:scale-95"
            title="견적 분석 요청"
          >
            {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={24} />}
          </button>
        </div>
        <div className="mt-6">
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {quickChips.map((chip, idx) => (
              <button key={idx} onClick={() => { setInput(chip.text); setConflict(null); }}
                className="text-sm bg-slate-100 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-full whitespace-nowrap hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all font-bold shadow-2xs">
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {conflict && (
          <div className="mt-7 p-5 rounded-2xl bg-amber-50 border border-amber-200" role="region" aria-label="견적 조건 확인">
            <h4 className="flex items-center gap-2 text-amber-900 font-extrabold text-lg">
              <AlertCircle size={19} /> 견적 조건 확인
            </h4>
            <p className="text-sm text-amber-900 mt-2 leading-relaxed">{conflict.message}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {conflict.options.map(option => (
                <button key={option.id} onClick={() => applyChoice(option)} disabled={loading}
                  className="text-left rounded-xl p-4 bg-white border border-amber-200 hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all">
                  <span className="font-bold text-blue-700 block">{option.label}</span>
                  <span className="text-sm text-slate-600 block mt-2 leading-relaxed">{option.description}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setConflict(null)} className="mt-3 text-sm text-amber-900 underline hover:text-blue-700">
              문장을 다시 수정할게요
            </button>
          </div>
        )}
      </div>
    </>
  );
}
