/** 요청 목적에 맞게 프론트 시간 제한을 설정합니다. 서버 내부 탐색 제한과는 별도입니다. */
export const API_TIMEOUT_MS = {
  recommend: 80_000,       // 서버 자동 견적 탐색 최대 60초 + DB/네트워크 여유
  ownedRecommend: 45_000,  // 보유 부품 탐색 최대 27초 + 네트워크 여유
  naturalRecommend: 145_000, // 조건 분석 + (미등록 게임만 추가 분석) + 최대 60초 추천 탐색
  manualParts: 20_000,
  aiAnalysis: 35_000,
  capabilityCards: 60_000,  // 필요 시 Gemini 문장 재요약 추가 호출
} as const;

export class ApiTimeoutError extends Error {
  constructor(label: string) {
    super(`${label} 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.`);
    this.name = 'ApiTimeoutError';
  }
}

/**
 * AbortController를 이용해 실제 fetch 호출에 제한 시간을 걸고 취소합니다.
 * 외부 signal이 있는 경우 외부 취소와 제한시간 초과를 구분합니다.
 * 브라우저 호출 취소는 서버에서 이미 실행 중인 추천 탐색을 강제 종료하지 않습니다.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  label: string,
): Promise<Response> {
  const controller = new AbortController();
  const externalSignal = init.signal;
  let timedOut = false;
  const abortExternally = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener('abort', abortExternally, { once: true });

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new ApiTimeoutError(label);
    if (externalSignal?.aborted) throw error;
    if (error instanceof TypeError) {
      throw new Error('서버에 연결할 수 없습니다. 인터넷 연결 또는 서버 상태를 확인해 주세요.');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    externalSignal?.removeEventListener('abort', abortExternally);
  }
}
