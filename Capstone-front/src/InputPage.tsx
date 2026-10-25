import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowLeft, Home } from 'lucide-react';
import { InputForm } from './components/InputForm';
import { NaturalInputForm } from './components/NaturalInputForm';

export function InputPage() {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/results');
  };

  // 공통 뒤로가기 핸들러
  const handleBack = () => {
    navigate(-1);
  };

  // 공통 메인 페이지(홈) 이동 핸들러
  const handleHome = () => {
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 공통 상위 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          
          {/* 왼쪽: 뒤로가기 및 로고 영역 */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack} 
              className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div 
              onClick={handleHome}
              className="flex items-center gap-3 cursor-pointer group select-none"
              title="메인 페이지로 이동"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">BuildMate</h1>
                <p className="text-xs text-gray-500">맞춤형 PC 조합 추천</p>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={handleHome}
              className="p-2.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-full transition-all active:scale-95 flex items-center gap-1"
              aria-label="메인 페이지로 이동"
              title="메인 페이지로 이동"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">나만의 맞춤 PC 견적</h2>
          <p className="text-slate-500">원하는 방식을 선택하여 견적을 시작해보세요.</p>
        </div>

        {/* 모드 전환 탭 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setMode('manual')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              mode === 'manual' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            직접 선택하기
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              mode === 'ai' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            AI에게 말하기
          </button>
        </div>

        {/* 선택된 모드에 따라 컴포넌트 렌더링 */}
        <div className="transition-all duration-500">
          {mode === 'manual' ? (
            <InputForm onComplete={handleComplete} />
          ) : (
            <NaturalInputForm onComplete={handleComplete} />
          )}
        </div>
      </div>
    </div>
  );
}