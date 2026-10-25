import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Sparkles } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center overflow-hidden relative">
      <div className="relative flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center"
        >
          {/* 로고 아이콘 박스 */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-blue-100 border border-slate-100 mb-6"
          >
            <Cpu className="w-12 h-12 text-blue-600" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 tracking-tight mb-3 drop-shadow-[0_2px_10px_rgba(37,99,235,0.1)]"
          >
            PickPC
          </motion.h1>

          {/* 서브타이틀 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-base text-slate-500 font-semibold mb-6 tracking-tight"
          >
            나에게 알맞은 부품을 찾아보세요
          </motion.p>

          {/* 인텔리전스 배지 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-600 text-xs font-bold tracking-wide"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>지능형 호환성 매칭 엔진</span>
          </motion.div>
        </motion.div>

        {/* 하단 로딩 인디케이터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className="w-2 h-2 bg-blue-600 rounded-full"
            />
          ))}
        </motion.div>
        
      </div>
    </div>
  );
}