import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { MainPage } from './components/MainPage';
import { InputForm } from './components/InputForm';
import { NaturalInputForm } from './components/NaturalInputForm'; 
import { OwnedPartInputForm } from './components/OwnedPartInputForm';
import { ManualBuildPage } from './components/ManualBuildPage';
import { PartsListPage } from './components/PartsListPage'; 
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsPage } from './components/ResultsPage';
import { GuidePage } from './components/GuidePage';
import { Footer } from './components/Footer';
import { ArrowLeft } from 'lucide-react';

type ScreenType = 'start' | 'main' | 'input' | 'owned-input' | 'db-list' | 'manual-build' | 'loading' | 'result' | 'guide';

const App: React.FC = () => {
  const [screen, setScreenState] = useState<ScreenType>('start');
  const [inputMode, setInputMode] = useState<'manual' | 'ai'>('manual');

  // 화면 전환 함수 (브라우저 히스토리에 pushState 적용)
  const navigateTo = (newScreen: ScreenType, replace = false) => {
    setScreenState(newScreen);
    if (replace) {
      window.history.replaceState({ screen: newScreen }, '', '');
    } else {
      window.history.pushState({ screen: newScreen }, '', '');
    }
  };

  // 1. 진입 시 스플래시 화면 처리
  useEffect(() => {
    if (screen === 'start') {
      window.history.replaceState({ screen: 'start' }, '', '');
      const timer = setTimeout(() => {
        navigateTo('main', true); // 스플래시 후 메인으로 대체
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // 2. 브라우저 뒤로 가기 / 앞으로 가기 (popstate) 감지
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        setScreenState(event.state.screen);
      } else {
        setScreenState('main');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleComplete = () => {
    navigateTo('loading');
    setTimeout(() => {
      navigateTo('result', true); // 로딩 스크린은 히스토리에 남기지 않고 결과 화면으로 전환
    }, 2000);
  };

  return (
    <div className="app-container min-h-screen flex flex-col justify-between relative bg-slate-50 text-slate-900">
      <div className="flex-1">
        {screen === 'start' && <SplashScreen />}
        
        {screen === 'main' && (
          <MainPage 
            onStart={() => { setInputMode('manual'); navigateTo('input'); }} 
            onAiStart={() => { setInputMode('ai'); navigateTo('input'); }}
            onOwnedStart={() => navigateTo('owned-input')} 
            onDbStart={() => navigateTo('db-list')} 
            onGuide={() => navigateTo('guide')}
            onManualBuildStart={() => { sessionStorage.removeItem('ownedBuildSeed'); navigateTo('manual-build'); }} 
          />
        )}

        {screen === 'guide' && (
          <GuidePage onBack={() => window.history.back()} />
        )}
        
        {/* 화면 1: 새로운 PC 맞춤 견적 화면 */}
        {screen === 'input' && (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-xs">
              <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                <button 
                  onClick={() => window.history.back()} 
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-all active:scale-95"
                  title="뒤로 가기"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">나만의 맞춤 PC 견적</h1>
                  <p className="text-xs text-slate-500">원하는 방식을 선택하여 최적의 부품 조합을 매칭해보세요.</p>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-10 w-full">
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={() => setInputMode('manual')}
                  className={`px-6 py-2.5 rounded-full font-bold transition-all ${
                    inputMode === 'manual' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  직접 선택하기
                </button>
                <button
                  onClick={() => setInputMode('ai')}
                  className={`px-6 py-2.5 rounded-full font-bold transition-all ${
                    inputMode === 'ai' 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  AI에게 말하기
                </button>
              </div>

              {inputMode === 'manual' ? (
                <InputForm onComplete={handleComplete} />
              ) : (
                <NaturalInputForm onComplete={handleComplete} />
              )}
            </div>
          </div>
        )}

        {/* 화면 2: 기존 부품 활용 견적 화면 */}
        {screen === 'owned-input' && (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-xs">
              <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                <button 
                  onClick={() => window.history.back()} 
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-all active:scale-95"
                  title="뒤로 가기"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">기존 부품 활용 맞춤 견적</h1>
                  <p className="text-xs text-slate-500">이미 보유 중인 하드웨어 자산과 결합할 무결성 스펙을 추천합니다.</p>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12 w-full">
              <OwnedPartInputForm onComplete={handleComplete} />
            </div>
          </div>
        )}

        {screen === 'manual-build' && (
          <ManualBuildPage onBack={() => navigateTo('main')} onComplete={handleComplete} />
        )}

        {/* 화면 3: 하드웨어 DB & 벤치마크 화면 */}
        {screen === 'db-list' && (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-xs">
              <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                <button 
                  onClick={() => window.history.back()} 
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-all active:scale-95"
                  title="뒤로 가기"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">하드웨어 데이터베이스 & 벤치마크</h1>
                  <p className="text-xs text-slate-500">현재 PickPC 아키텍처 허브에 구축된 정밀 하드웨어 세부 제원 마스터 정보입니다.</p>
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-10 w-full">
              <PartsListPage />
            </div>
          </div>
        )}
        
        {screen === 'loading' && <LoadingScreen />}
        
        {screen === 'result' && (
          <ResultsPage onRestart={() => {
            sessionStorage.removeItem('pcBuildData');
            sessionStorage.removeItem('recommendationResult');
            sessionStorage.removeItem('extractedBudget');
            sessionStorage.removeItem('ownedBuildSeed');
            navigateTo('main');
          }} />
        )}
      </div>

      {/* 전역 푸터 */}
      {screen !== 'start' && screen !== 'loading' && <Footer />}
    </div>
  );
};

export default App;