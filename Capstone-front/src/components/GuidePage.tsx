import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Cpu, 
  Layout, 
  HardDrive, 
  Zap, 
  Speaker, 
  Monitor, 
  Box, 
  HelpCircle, 
  CheckCircle2, 
  Fan, 
  Sparkles 
} from 'lucide-react';

// 부품 기초 도감 데이터 (쿨러 포함 총 8개 부품)
const guides = [
  {
    title: "CPU",
    subtitle: "컴퓨터의 '두뇌'",
    desc: "모든 연산을 담당하는 핵심 부품입니다. 성능이 좋을수록 복잡한 작업과 고사양 게임을 훨씬 빠르게 처리합니다.",
    checkPoint: "메인보드와의 소켓 규격(예: 인텔 LGA1700, AMD AM5)이 완벽히 일치해야 조립할 수 있습니다!",
    icon: <Cpu className="w-10 h-10" />,
    color: "bg-blue-500",
    shadow: "shadow-blue-100"
  },
  {
    title: "쿨러",
    subtitle: "컴퓨터의 '선풍기 / 에어컨'",
    desc: "CPU의 높은 발열을 낮춰 성능 저하(쓰로틀링)와 PC 다운을 막아줍니다. 공랭과 수랭 방식으로 나뉩니다.",
    checkPoint: "기본 번들 쿨러 제공 여부를 확인하고, 공랭 쿨러 높이(mm)나 수랭 라디에이터 규격이 케이스와 호환되는지 체크하세요.",
    icon: <Fan className="w-10 h-10" />,
    color: "bg-cyan-500",
    shadow: "shadow-cyan-100"
  },
  {
    title: "메인보드",
    subtitle: "컴퓨터의 '신체'",
    desc: "모든 부품이 장착되는 기판입니다. 부품 간의 연결과 안정적인 전력 분배를 책임지는 신경계 역할을 합니다.",
    checkPoint: "장착할 CPU의 소켓 종류와 메모리 규격(DDR4 / DDR5) 지원 여부를 반드시 함께 확인해야 합니다.",
    icon: <Layout className="w-10 h-10" />,
    color: "bg-slate-700",
    shadow: "shadow-slate-200"
  },
  {
    title: "RAM",
    subtitle: "컴퓨터의 '책상'",
    desc: "임시 작업 공간입니다. 용량이 넉넉할수록 여러 게임이나 창을 동시에 띄워도 버벅이지 않습니다.",
    checkPoint: "최신 게이밍/작업 PC 기준 16GB 2개를 장착하는 듀얼 채널(총 32GB) 구성을 적극 권장합니다.",
    icon: <Speaker className="w-10 h-10" />,
    color: "bg-purple-500",
    shadow: "shadow-purple-100"
  },
  {
    title: "GPU",
    subtitle: "컴퓨터의 '눈'",
    desc: "모니터 화면을 그려내는 그래픽카드입니다. 3D 게임, 영상 편집, 3D 렌더링 시 성능을 좌우하는 1순위 부품입니다.",
    checkPoint: "그래픽카드 가로 길이(mm)가 케이스의 최대 장착 허용 길이보다 작은지 꼭 확인해야 합니다.",
    icon: <Monitor className="w-10 h-10" />,
    color: "bg-indigo-500",
    shadow: "shadow-indigo-100"
  },
  {
    title: "SSD / HDD",
    subtitle: "컴퓨터의 '창고'",
    desc: "운영체제와 데이터를 영구 저장합니다. 초고속 NVMe SSD는 부팅과 게임 로딩 속도를 획기적으로 줄여줍니다.",
    checkPoint: "메인보드에 바로 꽂는 메인 드라이브는 읽기/쓰기 속도가 빠른 M.2 NVMe SSD를 선택하세요.",
    icon: <HardDrive className="w-10 h-10" />,
    color: "bg-rose-500",
    shadow: "shadow-rose-100"
  },
  {
    title: "파워",
    subtitle: "컴퓨터의 '심장'",
    desc: "가정용 전기를 PC 부품들이 안전하게 사용할 수 있는 직류 전기로 변환해 공급하며, 컴퓨터의 수명을 결정합니다.",
    checkPoint: "그래픽카드의 권장 파워 용량(예: RTX 4070은 정격 750W 이상)과 80 PLUS 정격 인증을 확인하세요.",
    icon: <Zap className="w-10 h-10" />,
    color: "bg-amber-500",
    shadow: "shadow-amber-100"
  },
  {
    title: "케이스",
    subtitle: "컴퓨터의 '집'",
    desc: "부품을 먼지와 충격으로부터 보호하고, 팬을 통해 내부 공기를 순환시켜 쿨링 효율과 감성을 완성합니다.",
    checkPoint: "메인보드 규격(ATX, M-ATX) 지원 여부와 CPU 쿨러 높이, 그래픽카드 길이가 맞는지 확인해야 합니다.",
    icon: <Box className="w-10 h-10" />,
    color: "bg-zinc-600",
    shadow: "shadow-zinc-200"
  }
];

export function GuidePage({ onBack }: { onBack: () => void }) {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleFlip = (idx: number) => {
    setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="p-2.5 hover:bg-slate-100 rounded-full transition-all active:scale-95"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                초보자 PC 부품 가이드
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h1>
              <p className="text-sm text-slate-600 font-medium mt-0.5">
                컴퓨터를 이루는 8대 핵심 부품의 역할과 구매 체크포인트를 카드로 확인해보세요.
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full font-bold border border-blue-100">
            <HelpCircle size={15} /> 3D 뒤집기 카드
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">컴퓨터를 이루는 8대 핵심 부품</h2>
          <p className="text-sm text-slate-500">카드를 터치하면 뒷면에서 필수 구매 체크포인트를 확인할 수 있습니다.</p>
        </div>

        {/* 3D Flip Card Grid (8개 부품) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guides.map((guide, idx) => {
            const isFlipped = !!flippedCards[idx];

            return (
              <div
                key={idx}
                className="h-[370px] w-full [perspective:1000px] cursor-pointer"
                onClick={() => toggleFlip(idx)}
              >
                <motion.div
                  className="relative w-full h-full rounded-[2rem] transition-all duration-500 [transform-style:preserve-3d]"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {/* 카드 앞면 */}
                  <div className={`absolute inset-0 w-full h-full bg-white p-7 rounded-[2rem] border border-slate-100 shadow-lg ${guide.shadow} flex flex-col items-center text-center justify-between [backface-visibility:hidden]`}>
                    <div className="flex flex-col items-center w-full">
                      <div className={`w-16 h-16 rounded-2xl ${guide.color} flex items-center justify-center text-white mb-4 shadow-md shadow-current/25`}>
                        {guide.icon}
                      </div>
                      <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-2 inline-block">
                        {guide.subtitle}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mb-2">{guide.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed break-keep font-medium">
                        {guide.desc}
                      </p>
                    </div>

                    <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-100 hover:bg-slate-100 transition-colors">
                      💡 터치하여 조립 팁 보기 ↺
                    </span>
                  </div>

                  {/* 카드 뒷면 */}
                  <div className="absolute inset-0 w-full h-full bg-slate-900 text-white p-7 rounded-[2rem] shadow-xl flex flex-col items-center text-center justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <div className="flex flex-col items-center w-full">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                        <CheckCircle2 size={26} />
                      </div>
                      <h4 className="text-lg font-black text-slate-100 mb-2">
                        {guide.title} 구매 체크포인트
                      </h4>
                      <p className="text-slate-200 text-sm leading-relaxed break-keep bg-slate-800/90 p-4 rounded-2xl border border-slate-700 mt-1 font-medium text-left">
                        {guide.checkPoint}
                      </p>
                    </div>

                    <span className="text-xs text-slate-400 font-bold bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-700">
                      ↺ 앞면으로 돌아가기
                    </span>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}