import React, { useState } from 'react';
import axios from 'axios';
import { Send, Sparkles, MessageSquarePlus } from 'lucide-react';
import API_BASE from "../utils/api";

interface NaturalInputFormProps {
  onComplete: () => void;
}

const quickChips = [
  { label: "🎮 배그 144Hz 150만원", text: "배틀그라운드 국민옵션 144Hz 잘 돌아가는 150만원대 본체 견적 짜줘." },
  { label: "💻 대학생/사무용 60만원", text: "문서작업이랑 과제용으로 쓰기 좋은 60만원대 가성비 사무용 PC 추천해줘." },
  { label: "🎬 4K 튜브 영상편집 200만원", text: "프리미어 프로 4K 영상 편집 원활한 200만원 정도의 본체 견적 짜줘." },
  { label: "🤖 AI 딥러닝 250만원", text: "Stable Diffusion 이미지 생성 가능한 RTX 그래픽카드 탑재 250만원 견적 추천해줘." },
  { label: "🔥 롤/오버워치 90만원", text: "리그오브레전드랑 오버워치 쾌적하게 가능한 90만원대 본체 알려줘." }
];

export function NaturalInputForm({ onComplete }: NaturalInputFormProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true);

    try {
      sessionStorage.removeItem('pcBuildData');

      const res = await axios.post(`${API_BASE}/api/estimates/natural-language`, {
        userInput: input
      });

      const recommendations = res.data.recommendations || res.data;
      if (!recommendations || recommendations.length === 0) {
        alert("입력하신 문장에 적합한 부품 조합을 찾지 못했습니다. 다른 조건으로 입력해 보세요.");
        return;
      }

      sessionStorage.setItem('recommendationResult', JSON.stringify(recommendations));
      
      if (res.data.userBudget) {
        sessionStorage.setItem('extractedBudget', res.data.userBudget.toString());
      }
      
      onComplete();
    } catch (err) {
      console.error("AI 자연어 견적 요청 실패:", err);
      alert("백엔드 서버와 통신 중 오류가 발생했습니다. 백엔드 서버(EC2 또는 로컬) 실행 여부를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-3xl shadow-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2.5 mb-5">
        <Sparkles className="text-blue-600 w-7 h-7" />
        <h3 className="font-extrabold text-2xl text-slate-900">AI 전문가에게 자연어로 견적 요청</h3>
      </div>
      
      <div className="relative">
        <textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예) 배틀그라운드 원활하게 돌아가는 150만원 정도의 본체 견적 짜줘."
          className="w-full p-6 pr-20 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl outline-none transition-all min-h-[160px] resize-none text-slate-900 text-lg md:text-xl font-semibold leading-relaxed"
        />
        <button 
          onClick={handleSearch}
          disabled={loading || !input.trim()}
          className="absolute right-5 bottom-5 bg-blue-600 p-4 rounded-2xl text-white hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-lg active:scale-95"
          title="견적 분석 요청"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={24} />
          )}
        </button>
      </div>
      
      {/* 초보자용 원클릭 퀵 예시 프롬프트 칩 */}
      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
          <MessageSquarePlus size={18} className="text-blue-600" /> 추천 예시 문장 (클릭 시 입력창에 자동 입력):
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {quickChips.map((chip, idx) => (
            <button 
              key={idx}
              onClick={() => setInput(chip.text)}
              className="text-sm bg-slate-100 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-full whitespace-nowrap hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all font-bold shadow-2xs"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}