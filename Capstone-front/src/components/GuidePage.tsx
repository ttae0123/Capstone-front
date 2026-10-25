import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Cpu, Layout, HardDrive, Zap, Speaker, Monitor, Box, HelpCircle, CheckCircle2 } from 'lucide-react';

const guides = [
  {
    title: "CPU",
    subtitle: "컴퓨터의 '두뇌'",
    desc: "모든 연산을 담당하는 핵심 부품입니다. 성능이 좋을수록 복잡한 작업을 훨씬 빠르게 처리합니다.",
    checkPoint: "메인보드와의 소켓 규격(예: LGA1700, AM5)이 일치해야 조립이 가능합니다!",
    icon: <Cpu className="w-10 h-10" />,
    color: "bg-blue-500",
    shadow: "shadow-blue-100"
  },
  {
    title: "메인보드",
    subtitle: "컴퓨터의 '신체'",
    desc: "모든 부품이 장착되는 판입니다. 부품 간의 연결과 안정성을 책임지는 신경계 역할을 합니다.",
    checkPoint: "CPU 소켓 종류와 메모리 세대(DDR4/DDR5) 지원 여부를 반드시 체크하세요.",
    icon: <Layout className="w-10 h-10" />,
    color: "bg-slate-700",
    shadow: "shadow-slate-200"
  },
  {
    title: "GPU",
    subtitle: "컴퓨터의 '눈'",
    desc: "화면을 그려내는 화가입니다. 고사양 게임이나 영상 편집 시 가장 중요한 역할을 수행합니다.",
    checkPoint: "그래픽카드 길이(mm)가 케이스 장착 제한 길이에 들어가는지 확인해야 합니다.",
    icon: <Monitor className="w-10 h-10" />,
    color: "bg-indigo-500",
    shadow: "shadow-indigo-100"
  },
  {
    title: "RAM",
    subtitle: "컴퓨터의 '책상'",
    desc: "임시 작업 공간입니다. 용량이 클수록 여러 프로그램을 동시에 띄워도 버벅임이 없습니다.",
    checkPoint: "요즘 게이밍/작업 PC는 16GB x 2개(총 32GB) 구성을 권장합니다.",
    icon: <Speaker className="w-10 h-10" />,
    color: "bg-purple-500",
    shadow: "shadow-purple-100"
  },
  {
    title: "SSD/HDD",
    subtitle: "컴퓨터의 '창고'",
    desc: "데이터를 영구 저장합니다. SSD는 속도가 매우 빨라 부팅과 게임 로딩 시간을 줄여줍니다.",
    checkPoint: "최신 M.2 NVMe SSD를 선택하시면 속도 체감이 가장 큽니다.",
    icon: <HardDrive className="w-10 h-10" />,
    color: "bg-rose-500",
    shadow: "shadow-rose-100"
  },
  {
    title: "파워",
    subtitle: "컴퓨터의 '심장'",
    desc: "부품들에 전기를 공급합니다. 안정적인 전력 공급은 컴퓨터 전체의 수명을 결정합니다.",
    checkPoint: "그래픽카드 권장 파워 용량(예: 750W 이상)보다 높은 정격을 선택하세요.",
    icon: <Zap className="w-10 h-10" />,
    color: "bg-amber-500",
    shadow: "shadow-amber-100"
  },
  {
    title: "케이스",
    subtitle: "컴퓨터의 '집'",
    desc: "부품을 보호하고 열기를 배출합니다. 디자인과 쿨링 성능을 결정하는 껍데기 역할을 합니다.",
    checkPoint: "쿨러 높이와 그래픽카드 길이가 맞는지 확인해야 뚜껑이 닫힙니다.",
    icon: <Box className="w-10 h-10" />,
    color: "bg-zinc-500",
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
      <div className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="p-2.5 hover:bg-slate-100 rounded-full transition-all active:scale-95"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">부품 기초 가이드</h1>
              <p className="text-sm text-slate-600 font-medium">카드를 터치/클릭해서 구매 핵심 체크포인트를 확인해보세요!</p>
            </div>
          </div>

          <span className="hidden sm:flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3.5 py-2 rounded-full font-extrabold border border-blue-100">
            <HelpCircle size={16} /> 3D 뒤집기 카드
          </span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-6xl mx-auto px-6 py-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide, idx) => {
            const isFlipped = !!flippedCards[idx];

            return (
              <div
                key={idx}
                className="h-[350px] w-full [perspective:1000px] cursor-pointer"
                onClick={() => toggleFlip(idx)}
              >
                <motion.div
                  className="relative w-full h-full rounded-[2rem] transition-all duration-500 [transform-style:preserve-3d]"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  {/* 카드 앞면 */}
                  <div className={`absolute inset-0 w-full h-full bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl ${guide.shadow} flex flex-col items-center text-center justify-between [backface-visibility:hidden]`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-18 h-18 rounded-2xl ${guide.color} flex items-center justify-center text-white mb-5 shadow-lg shadow-current/20`}>
                        {guide.icon}
                      </div>
                      <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full mb-3 inline-block">
                        {guide.subtitle}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mb-3">{guide.title}</h2>
                      <p className="text-slate-600 text-base leading-relaxed break-keep font-medium">
                        {guide.desc}
                      </p>
                    </div>

                    <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-100">
                      💡 터치하여 핵심 조립 팁 보기 ↺
                    </span>
                  </div>

                  {/* 카드 뒷면 */}
                  <div className="absolute inset-0 w-full h-full bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <div className="flex flex-col items-center w-full">
                      <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
                        <CheckCircle2 size={28} />
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-100 mb-3">{guide.title} 핵심 체크포인트</h3>
                      <p className="text-slate-200 text-base leading-relaxed break-keep bg-slate-800/90 p-5 rounded-2xl border border-slate-700 mt-1 font-medium">
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