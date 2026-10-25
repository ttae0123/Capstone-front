import React from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 print:hidden">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        
        {/* 서비스명 및 카피라이트 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white font-black text-lg tracking-tight">
            <span>PickPC</span>
          </div>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Pusan National University IT Applied Engineering <br />
            2026년 Capstone Design Project
          </p>
          <p className="text-[11px] text-slate-600 font-medium">
            &copy; 2026 PickPC Team. All rights reserved.
          </p>
        </div>

        {/* 데이터 출처 명시 및 법적 고지 (Disclaimer) */}
        <div className="flex-1 md:max-w-xl space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-200 text-xs font-bold">
            <ShieldAlert size={14} className="text-amber-500" /> DATA SOURCE & LEGAL DISCLAIMER
          </div>
          
          <p className="text-[11px] text-slate-500 leading-relaxed break-keep">
            본 플랫폼에서 제공하는 하드웨어 부품의 명칭, 실시간 단가 및 링크 정보는 <span className="text-slate-300 font-semibold">주식회사 다나와(Danawa)</span>의 원천 데이터를 기반으로 수집 및 가공되었습니다. 또한, 각 부품별 성능 수치 지표는 <span className="text-slate-300 font-semibold">PassMark Software</span>의 공인 벤치마크 데이터베이스를 바탕으로 구성되었습니다.
          </p>
          
          <p className="text-[11px] text-slate-600 leading-relaxed break-keep border-t border-slate-900 pt-2">
            본 서비스는 학술 연구 및 포트폴리오 목적으로 제작된 비영리 데모 시스템이며, 실시간 시장 가격 변동 및 제조사 공급 상황에 따라 실제 판매가와 일부분 차이가 발생할 수 있습니다. 시스템의 조립 호환성 연산 결과 및 AI 리포트는 법적 구매 효력을 보장하지 않으므로 실제 하드웨어 구매 및 조립 시 최종 교차 검증을 권장합니다.
          </p>
        </div>

      </div>
    </footer>
  );
}