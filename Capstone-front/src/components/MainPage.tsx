import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BookOpen, Wrench, BarChart3, ChevronRight, Sparkles, ChevronLeft, Compass, Target, MessageSquareCode, ArrowRight } from 'lucide-react';

interface MainPageProps {
  onStart: () => void;
  onAiStart?: () => void;
  onOwnedStart: () => void;
  onManualBuildStart: () => void;
  onDbStart: () => void;
  onGuide: () => void;
}

export function MainPage({ onStart, onAiStart, onOwnedStart, onDbStart, onGuide, onManualBuildStart }: MainPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      step: "STEP 1",
      title: "🎯 예산과 용도만으로 맞춤 PC 견적",
      desc: "원하는 예산 범위와 사용 용도(게이밍, 영상편집, 사무용 등)를 선택하여 밸런스 균형 완본체를 추천받으세요.",
      badge: "가장 많은 사용자가 이용 중",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-400/30",
      btnText: "예산 맞춤 견적 시작하기",
      btnColor: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40",
      action: onStart,
      icon: <Target className="w-10 h-10 text-blue-400" />,
      bgImage: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop"
    },
    {
      step: "STEP 2",
      title: "🗣️ AI와 대화하듯 편하게 말해서 요청하기",
      desc: "'배그 국민옵션 150만원대'처럼 일상적인 문장으로 물어보면 Gemini AI가 최적의 견적을 자동으로 파싱합니다.",
      badge: "초보자 최적화 AI 추천",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-400/30",
      btnText: "AI 대화 견적 시작하기",
      btnColor: "bg-purple-600 hover:bg-purple-500 shadow-purple-900/40",
      action: onAiStart || onStart,
      icon: <MessageSquareCode className="w-10 h-10 text-purple-400" />,
      bgImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop"
    },
    {
      step: "STEP 3",
      title: "💡 부품 기초 개념과 3D 카드 가이드",
      desc: "CPU(두뇌), GPU(눈), RAM(책상) 등 컴퓨터 부품의 역할과 구매 시 꼭 확인해야 할 체크포인트를 쉽게 익히세요.",
      badge: "하드웨어 기초 입문",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
      btnText: "부품 가이드 보러가기",
      btnColor: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40",
      action: onGuide,
      icon: <BookOpen className="w-8 h-8 text-emerald-400" />,
      bgImage: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1200&auto=format&fit=crop"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 md:px-8 flex flex-col items-center">
      
      {/* 표준 너비 컨테이너 (max-w-6xl 정렬) */}
      <div className="max-w-6xl w-full flex flex-col items-center">
        
        {/* 최상단 타이틀 */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200/60 rounded-full text-blue-600 text-sm font-bold tracking-wide mb-5 shadow-2xs select-none">
            <Sparkles size={16} />
            GEMINI 1.5 PRO & COMPATIBILITY RULE ENGINE ACTIVE
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight leading-none text-slate-900 select-none">
            <motion.span 
              className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 cursor-pointer drop-shadow-xs"
              whileHover={{ 
                scale: 1.03,
                transition: { duration: 0.2 }
              }}
            >
              PickPC
            </motion.span>{' '}
          </h1>
          
          <p className="text-slate-700 text-base md:text-lg max-w-xl mx-auto font-semibold break-keep leading-relaxed">
            초보자도 쉽고 완벽하게! 나에게 알맞은 PC 조립 견적을 찾아보세요.
          </p>
        </motion.div>

        {/* 메인 히어로 슬라이더 */}
        <div className="w-full mb-12">
          <div className="relative bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden min-h-[340px] md:min-h-[360px] flex flex-col justify-between">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-0"
              >
                <img 
                  src={slides[currentSlide].bgImage} 
                  alt="Slide Background" 
                  className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/30" />
              </motion.div>
            </AnimatePresence>

            {/* 슬라이드 콘텐츠 */}
            <div className="relative z-10 p-8 md:p-12 flex-1 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${currentSlide}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-2xl space-y-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black bg-white/20 text-white backdrop-blur-md px-3 py-1 rounded-md">
                      {slides[currentSlide].step}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-md border backdrop-blur-md ${slides[currentSlide].badgeColor}`}>
                      {slides[currentSlide].badge}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow-xs">
                    {slides[currentSlide].title}
                  </h3>

                  <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-xl break-keep font-medium">
                    {slides[currentSlide].desc}
                  </p>

                  <div className="pt-3">
                    <button
                      onClick={slides[currentSlide].action}
                      className={`px-7 py-4 rounded-xl text-white font-bold text-sm md:text-base transition-all shadow-md flex items-center gap-2 ${slides[currentSlide].btnColor}`}
                    >
                      {slides[currentSlide].btnText}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* 하단 인디케이터 */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10">
                <div className="flex gap-2 items-center">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        currentSlide === idx ? "w-9 bg-blue-500" : "w-2.5 bg-white/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={prevSlide}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 4열 기능 메뉴 카드 */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-5 px-1">
            <Compass size={20} className="text-slate-600" />
            <h3 className="font-bold text-slate-800 text-base">전체 서비스 기능 메뉴</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <button
              onClick={onStart}
              className="bg-white border border-slate-200 p-7 rounded-3xl text-left flex flex-col justify-between group transition-all shadow-xs hover:border-blue-500 hover:shadow-md hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                  <Zap size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">새로운 PC 견적</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  예산과 주 용도에 맞춘 최적의 부품 조합 매칭
                </p>
              </div>
              <span className="text-sm text-blue-600 font-bold mt-8 flex items-center">
                바로가기 <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={onOwnedStart}
              className="bg-white border border-slate-200 p-7 rounded-3xl text-left flex flex-col justify-between group transition-all shadow-xs hover:border-purple-500 hover:shadow-md hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
                  <Wrench size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-purple-600 transition-colors">보유 부품 활용</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  기존 부품과의 호환성을 고려한 업그레이드
                </p>
              </div>
              <span className="text-sm text-purple-600 font-bold mt-8 flex items-center">
                바로가기 <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={onDbStart}
              className="bg-white border border-slate-200 p-7 rounded-3xl text-left flex flex-col justify-between group transition-all shadow-xs hover:border-emerald-500 hover:shadow-md hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-xs">
                  <BarChart3 size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-emerald-600 transition-colors">벤치마크 마스터</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  부품별 성능 점수 조회 및 1:1 대결 비교
                </p>
              </div>
              <span className="text-sm text-emerald-600 font-bold mt-8 flex items-center">
                바로가기 <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={onGuide}
              className="bg-white border border-slate-200 p-7 rounded-3xl text-left flex flex-col justify-between group transition-all shadow-xs hover:border-indigo-500 hover:shadow-md hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                  <BookOpen size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors">부품 기초 가이드</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  초보자를 위한 3D 카드 형태 부품 개념 정리
                </p>
              </div>
              <span className="text-sm text-indigo-600 font-bold mt-8 flex items-center">
                바로가기 <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
          {/* 수동 조립 진입점만 추가. 기존 4개 서비스 카드의 UI와 배치는 유지합니다. */}
          <button onClick={onManualBuildStart} className="mt-5 w-full bg-white border border-slate-200 p-5 rounded-3xl text-left flex items-center gap-4 group transition-all shadow-xs hover:border-indigo-500 hover:shadow-md">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white shrink-0"><Wrench size={22}/></div>
            <div className="flex-1"><h4 className="font-bold text-slate-900 text-lg">수동 PC 조립</h4><p className="text-sm text-slate-600 font-medium">실제 DB에서 8종 부품을 직접 선택하고 호환성 확인하기</p></div>
            <ChevronRight className="text-indigo-600" size={20}/>
          </button>
        </div>

      </div>
    </div>
  );
}