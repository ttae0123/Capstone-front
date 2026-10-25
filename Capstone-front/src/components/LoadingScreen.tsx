import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Cpu, HardDrive, Zap, TrendingUp } from 'lucide-react';

export function LoadingScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Cpu, text: 'CPU 및 메인보드 분석 중', color: 'text-blue-600' },
    { icon: Zap, text: 'GPU 성능 비교 중', color: 'text-purple-600' },
    { icon: HardDrive, text: '저장장치 및 메모리 최적화 중', color: 'text-green-600' },
    { icon: TrendingUp, text: '가격 및 호환성 확인 중', color: 'text-orange-600' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate('/results'), 300);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }, 2000);

    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-10"
        >
          {/* Animated Icon */}
          <div className="text-center mb-8">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4"
            >
              <Cpu className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl mb-2">AI가 분석하고 있습니다</h2>
            <p className="text-gray-600">최적의 조합을 찾는 중입니다</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">진행 상황</span>
              <span className="text-sm font-medium text-blue-600">{progress}%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Loading Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isActive ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-600' : 'bg-gray-300'
                  }`}>
                    {isCompleted ? (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    ) : (
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm md:text-base ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {step.text}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="flex-shrink-0"
                    >
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Info Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            최신 시장 데이터를 기반으로 분석하고 있습니다
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
