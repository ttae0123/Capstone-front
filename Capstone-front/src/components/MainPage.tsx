import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowRight,
  Zap, 
  Wrench, 
  SlidersHorizontal, 
  BarChart3, 
  BookOpen,
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2 
} from 'lucide-react';

interface MainPageProps {
  onStart: () => void;
  onAiStart?: () => void;
  onOwnedStart: () => void;
  onManualBuildStart: () => void;
  onDbStart: () => void;
  onGuide: () => void;
}

export function MainPage({ 
  onStart, 
  onAiStart, 
  onOwnedStart, 
  onDbStart, 
  onGuide, 
  onManualBuildStart 
}: MainPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 1. 배너 순환 3대 핵심 큐레이션 데이터
  const slides = [
    {
      no: "01",
      tag: "목적 & 예산",
      badge: "가장 많은 사용자가 이용 중",
      title: "예산과 목적에 맞춘 자동 견적",
      desc: "목적과 예산에 맞게 가장 균형 잡힌 최적 조합을 추천",
      action: onStart,
      accentBadge: "text-blue-300 border-blue-400/30 bg-blue-500/10",
      image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1800&auto=format&fit=crop"
    },
    {
      no: "02",
      tag: "자연어 입력",
      badge: "초보자 친화적 AI 추천",
      title: "자연어로 묻는 최적의 견적",
      desc: "AI에게 일상어로 편하게 원하는 견적을 요청해보세요",
      action: onAiStart || onStart,
      accentBadge: "text-purple-300 border-purple-400/30 bg-purple-500/10",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1800&auto=format&fit=crop"
    },
    {
      no: "03",
      tag: "하드웨어 지식",
      badge: "초보자를 위한 하드웨어 사전",
      title: "부품 가이드 & 모델명",
      desc: "초보자를 위한 부품 기초 가이드",
      action: onGuide,
      accentBadge: "text-indigo-300 border-indigo-400/30 bg-indigo-500/10",
      image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1800&auto=format&fit=crop"
    }
  ];

  // 2. 하단 5대 기능 카드 (각 페이지의 고유 테마 컬러 매핑)
  const serviceNav = [
    {
      no: "01",
      title: "새로운 PC 견적",
      sub: "Auto Estimation",
      desc: "예산 범위와 주 용도에 맞춘 최적 밸런스 조합 추천",
      action: onStart,
      icon: <Zap className="w-5 h-5" />,
      badge: "인기",
      badgeClass: "bg-blue-50 text-blue-600 border-blue-200",
      hoverCard: "hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10",
      hoverIcon: "group-hover:bg-blue-600 group-hover:text-white",
      hoverText: "group-hover:text-blue-600"
    },
    {
      no: "02",
      title: "보유 부품 활용",
      sub: "Component Upgrade",
      desc: "소지한 부품과의 호환성을 고려한 최적의 업그레이드 조합 추천",
      action: onOwnedStart,
      icon: <Wrench className="w-5 h-5" />,
      hoverCard: "hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10",
      hoverIcon: "group-hover:bg-purple-600 group-hover:text-white",
      hoverText: "group-hover:text-purple-600"
    },
    {
      no: "03",
      title: "수동 PC 조립",
      sub: "Manual Builder",
      desc: "부품을 직접 고르고 실시간 규격 호환성 검증",
      action: onManualBuildStart,
      icon: <SlidersHorizontal className="w-5 h-5" />,
      hoverCard: "hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10",
      hoverIcon: "group-hover:bg-cyan-600 group-hover:text-white",
      hoverText: "group-hover:text-cyan-600"
    },
    {
      no: "04",
      title: "벤치마크 마스터",
      sub: "Performance DB",
      desc: "부품별 실측 성능 점수 조회 및 1:1 성능 비교 그래프",
      action: onDbStart,
      icon: <BarChart3 className="w-5 h-5" />,
      hoverCard: "hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10",
      hoverIcon: "group-hover:bg-emerald-600 group-hover:text-white",
      hoverText: "group-hover:text-emerald-600"
    },
    {
      no: "05",
      title: "부품 기초 가이드",
      sub: "Hardware Knowledge",
      desc: "초보자를 위한 각 부품 역할을 간단하게 설명",
      action: onGuide,
      icon: <BookOpen className="w-5 h-5" />,
      hoverCard: "hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10",
      hoverIcon: "group-hover:bg-indigo-600 group-hover:text-white",
      hoverText: "group-hover:text-indigo-600"
    }
  ];

  // 6.5초 주기 자동 롤링
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      
      {/* 1. 최상단 마이크로 상태 바 */}
      <div className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-6 sm:px-12 py-3 flex justify-between items-center text-xs tracking-wider uppercase text-slate-500 z-20">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span className="font-semibold text-slate-700">최신 PC 하드웨어 최적화</span>
        </div>
      </div>

      {/* 2. [통합] 배너 크기 및 내부 높이 완전 고정 + 단독 PickPc 인터랙션 */}
      <section 
        onClick={() => slides[currentSlide].action()}
        className="w-full h-[620px] md:h-[680px] bg-slate-950 text-white relative overflow-hidden border-b border-slate-800 shadow-2xl cursor-pointer select-none"
      >
        {/* 슬라이드 배경 이미지 전환 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 0.35, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <img
              src={slides[currentSlide].image}
              alt="Curated Background"
              className="w-full h-full object-cover object-center filter grayscale contrast-125"
            />
            {/* 시네마틱 비네팅 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/70" />
          </motion.div>
        </AnimatePresence>

        {/* 앰비언트 블루 글로우 */}
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

        {/* 배너 내부 통합 컨텐츠 (고정 높이 flex 구조) */}
        <div className="max-w-[1440px] h-full mx-auto px-6 sm:px-12 pt-10 md:pt-14 pb-8 md:pb-10 relative z-10 flex flex-col justify-between">
          
          {/* (1) 상단: 브랜드 아이덴티티 & PickPc 타이포그래피 (아래 텍스트와의 간격 확대를 위해 pb 및 mb 확장) */}
          <div className="border-b border-white/10 pb-8 sm:pb-12 mb-4 md:mb-6 flex-none">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-blue-400 font-bold bg-blue-950/60 border border-blue-800/80 px-3 py-1 rounded-full backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>맞춤형 하드웨어 매칭 및 조립 PC 견적 플랫폼</span>
              </div>
            </div>

            {/* PickPc 타이포 (글자 자체에만 호버 인터랙션 적용) */}
            <h1 className="text-[15vw] sm:text-[14vw] md:text-[12vw] lg:text-[10vw] leading-[0.8] font-black tracking-tighter text-white uppercase flex items-baseline">
              <span 
                className="inline-block transition-colors duration-300 hover:text-blue-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onStart();
                }}
              >
                PickPc
              </span>
              <span className="text-blue-500 transition-transform duration-300 hover:scale-125 inline-block ml-1">.</span>
            </h1>
          </div>

          {/* (2) 중단: 실시간 슬라이드 콘텐츠 (상단 pt 추가로 여백 확보 & 고정 높이 슬롯으로 수직 흔들림 차단) */}
          <div className="flex-1 flex flex-col justify-center pt-4 md:pt-6">
            <div className="relative w-full max-w-3xl h-[210px] sm:h-[230px] md:h-[240px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`slide-${currentSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col justify-start space-y-3.5"
                >
                  {/* 뱃지 영역 고정 높이 */}
                  <div className="flex flex-wrap items-center gap-2.5 h-7">
                    <span className="font-mono text-xs uppercase tracking-widest text-slate-300 font-bold bg-white/10 border border-white/20 px-3 py-1 rounded-md backdrop-blur-md">
                      {slides[currentSlide].tag}
                    </span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-md border backdrop-blur-md flex items-center gap-1.5 ${slides[currentSlide].accentBadge}`}>
                      <CheckCircle2 size={13} />
                      {slides[currentSlide].badge}
                    </span>
                  </div>

                  {/* 제목 영역 고정 슬롯 (텍스트 길이에 관계없이 고정) */}
                  <div className="h-[72px] sm:h-[84px] md:h-[96px] flex items-center">
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                      {slides[currentSlide].title}
                    </h2>
                  </div>

                  {/* 설명문 영역 고정 슬롯 */}
                  <div className="h-[52px] sm:h-[58px] md:h-[64px] flex items-start">
                    <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl break-keep">
                      {slides[currentSlide].desc}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* (3) 하단: 심플 인디케이터 + 좌/우 화살표만 깔끔하게 배치 */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between flex-none">
            
            {/* 미니멀 라인 인디케이터 */}
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentSlide === idx 
                      ? "w-8 bg-blue-500" 
                      : "w-2 bg-white/20"
                  }`}
                />
              ))}
              <span className="ml-3 font-mono text-xs text-slate-400">
                0{currentSlide + 1} / 0{slides.length}
              </span>
            </div>

            {/* 좌우 화살표 버튼 (배너 클릭 이벤트 버블링 방지) */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
                aria-label="이전 슬라이드"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
                aria-label="다음 슬라이드"
              >
                <ChevronRight size={18} />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 3. 전체 서비스 기능 메뉴 (각 페이지 고유 컬러 호버) */}
      <section className="max-w-[1440px] w-full mx-auto px-6 sm:px-12 py-12 md:py-16">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            서비스 메뉴
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {serviceNav.map((menu) => (
            <button
              key={menu.no}
              onClick={menu.action}
              className={`group relative bg-white border border-slate-200 rounded-2xl p-6 text-left flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 h-full min-h-[240px] shadow-xs ${menu.hoverCard}`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className={`font-mono text-xs font-bold text-slate-400 transition-colors ${menu.hoverText}`}>
                    {menu.no}
                  </span>
                  <div className={`p-2.5 rounded-xl bg-slate-50 text-slate-600 transition-all shadow-xs ${menu.hoverIcon}`}>
                    {menu.icon}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {menu.sub}
                  </span>
                  {menu.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${menu.badgeClass}`}>
                      {menu.badge}
                    </span>
                  )}
                </div>

                <h4 className={`text-lg font-bold text-slate-900 tracking-tight transition-colors mb-2 ${menu.hoverText}`}>
                  {menu.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal break-keep">
                  {menu.desc}
                </p>
              </div>

              <div className={`pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 transition-colors ${menu.hoverText}`}>
                <span>바로가기</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}                   