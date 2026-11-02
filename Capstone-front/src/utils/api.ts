import { fetchWithTimeout, API_TIMEOUT_MS } from './requestTimeout';
import type { BuildInput, ManualBuildSelection, ManualCategory, ManualPartListResponse, RecommendationResponse, OwnedEstimateRequest } from '../types/pc';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
export default API_BASE;

/** Legacy EstimateRequest: { usage, budget, preference }. Multiple preferred brands
 * cannot be expressed by this DTO. Only the FIRST selected brand is submitted.
 * Do not send unsupported `brands`, `WORK`, or a hard-coded minimum budget override. */
export async function fetchRecommendations(
    input: BuildInput
): Promise<RecommendationResponse> {
  const budget = Number(input.budget);

  if (!Number.isSafeInteger(budget) || budget <= 0) {
    throw new Error('예산은 0원보다 큰 정수로 입력해 주세요.');
  }

  if (!['GAMING', 'OFFICE', 'HIGH_END'].includes(input.purpose)) {
    throw new Error(
        '현재 서버에서 지원하지 않는 사용 용도입니다. 게이밍, 사무용, 하이엔드 중 선택해 주세요.'
    );
  }

  const response = await fetchWithTimeout(`${API_BASE}/api/estimates/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      usage: input.purpose,
      budget,
      brands: input.brands
          .map(brand => brand.trim().toUpperCase())
          .filter(Boolean),
    }),
  }, API_TIMEOUT_MS.recommend, '자동 견적 생성');

  if (!response.ok) {
    throw new Error(await getApiError(response, '자동 견적 요청 실패'));
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.recommendations)) {
    throw new Error('추천 API 응답 형식이 올바르지 않습니다.');
  }

  return data;
}

export async function getApiError(response: Response, fallback: string): Promise<string> {
  const raw = await response.text().catch(() => '');
  let detail = '';
  try {
    const parsed = JSON.parse(raw);
    detail = String(parsed.message || parsed.error?.message || parsed.error || '');
  } catch {
    detail = raw.slice(0, 200);
  }
  if (response.status === 400 || response.status === 422) {
    return detail || '요청 조건을 확인하고 다시 시도해 주세요.';
  }
  if (response.status === 408 || response.status === 504) {
    return detail || `${fallback}: 응답 시간이 초과되었습니다. 다시 시도해 주세요.`;
  }
  if (response.status === 429) return detail || '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
  if (response.status === 502 || response.status === 503) {
    return detail || '서버 또는 AI 서비스가 일시적으로 응답하지 않습니다. 다시 시도해 주세요.';
  }
  if (response.status >= 500) return `${fallback} (HTTP ${response.status}): 서버에서 오류가 발생했습니다.`;
  return `${fallback} (HTTP ${response.status})${detail ? `: ${detail}` : ''}`;
}

export async function fetchManualParts(
  targetCategory: ManualCategory,
  selectedParts: Partial<ManualBuildSelection> = {},
  signal?: AbortSignal,
): Promise<ManualPartListResponse> {
  const response = await fetchWithTimeout(`${API_BASE}/api/manual-build/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ targetCategory, selectedParts }),
    signal,
  }, API_TIMEOUT_MS.manualParts, '부품 목록 조회');
  if (!response.ok) throw new Error(await getApiError(response, `${targetCategory} 부품 목록 요청 실패`));
  const data = await response.json();
  if (!data || !Array.isArray(data.parts)) throw new Error('수동 조립 API 응답 형식이 올바르지 않습니다.');
  return data;
}

/**
 * Capstone-back(10) 보유 부품 자동 견적 API (Spring Boot 구현 완료 버전).
 * POST /api/estimates/recommend-with-owned
 * - budget: 기존 보유 부품의 구매 가격을 제외한 추가 지출 한도
 * - ownedParts: 부품별 DB PK (예: { gpuId: 123 })
 * - usage: 기존 화면에는 별도 용도 선택이 없으므로 서버 기본값과 동일하게 GAMING
 * 결과는 ResponseDTO.ResultList의 recommendations를 그대로 사용합니다.
 */
export async function fetchOwnedRecommendations(
  request: OwnedEstimateRequest,
  signal?: AbortSignal,
): Promise<RecommendationResponse> {
  if (!Number.isSafeInteger(request.budget) || request.budget <= 0) {
    throw new Error('추가 예산은 0원보다 큰 정수로 입력해 주세요.');
  }
  const allowedKeys = new Set(['cpuId', 'mainboardId', 'ramId', 'gpuId', 'ssdId', 'powerId', 'caseId', 'coolerId']);
  const entries = Object.entries(request.ownedParts ?? {}).filter(([, id]) => id !== null && id !== undefined);
  if (entries.length === 0 || entries.some(([key, id]) => !allowedKeys.has(key) || !Number.isSafeInteger(id) || (id as number) <= 0)) {
    throw new Error('DB에서 확인한 보유 부품 ID를 지정해 주세요.');
  }
  const usage = request.usage ?? 'GAMING';
  if (!['GAMING', 'OFFICE', 'VIDEO_EDITING'].includes(usage)) {
    throw new Error('지원하지 않는 사용 용도입니다.');
  }
  const response = await fetchWithTimeout(`${API_BASE}/api/estimates/recommend-with-owned`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      budget: request.budget,
      ownedParts: Object.fromEntries(entries),
      usage,
      ...(request.preference ? { preference: request.preference } : {}),
    }),
    signal,
  }, API_TIMEOUT_MS.ownedRecommend, '보유 부품 자동 견적 생성');
  if (!response.ok) {
    // 400/422에서는 백엔드 ApiErrorHandler가 반환한 message를 사용자에게 보여 줍니다.
    // 404/405/501도 임의로 '미구현'이라 단정하지 않고 실제 HTTP 상태를 알립니다.
    throw new Error(await getApiError(response, '보유 부품 자동 견적 요청 실패'));
  }
  const data: RecommendationResponse = await response.json();
  if (!data || !Array.isArray(data.recommendations) || data.recommendations.length === 0) {
    throw new Error('보유 부품 자동 견적 API에서 추천 조합을 반환하지 않았습니다.');
  }
  const requiredCategories = new Set(['CPU', 'GPU', 'MAINBOARD', 'RAM', 'SSD', 'POWER', 'CASE', 'COOLER']);
  for (const recommendation of data.recommendations) {
    if (!Array.isArray(recommendation.parts) || recommendation.parts.length !== requiredCategories.size) {
      throw new Error('백엔드 견적 결과는 8종 부품을 모두 포함해야 합니다.');
    }
    const seen = new Set<string>();
    let purchases = 0;
    for (const part of recommendation.parts) {
      const category = part.category?.toUpperCase() === 'MOTHERBOARD' ? 'MAINBOARD' : part.category?.toUpperCase();
      if (!category || !requiredCategories.has(category) || seen.has(category)) {
        throw new Error('백엔드 견적 결과의 부품 카테고리가 누락되거나 중복됐습니다.');
      }
      seen.add(category);
      if (!Number.isSafeInteger(part.id) || (part.id as number) <= 0 ||
          !Number.isSafeInteger(part.price) || part.price < 0 ||
          typeof part.isOwned !== 'boolean') {
        throw new Error('백엔드 견적 결과의 부품 ID·가격·보유 여부가 올바르지 않습니다.');
      }
      purchases += part.price;
      const fixedId = request.ownedParts[`${category.toLowerCase()}Id` as keyof typeof request.ownedParts];
      if (fixedId !== null && fixedId !== undefined) {
        if (part.id !== fixedId || part.isOwned !== true || part.price !== 0) {
          throw new Error('보유 부품이 요청한 DB ID로 고정되지 않았습니다.');
        }
      } else if (part.isOwned !== false) {
        throw new Error('신규 구매 부품의 보유 여부가 올바르지 않습니다.');
      }
    }
    if (purchases > request.budget || recommendation.totalEstimatedPrice !== purchases) {
      throw new Error('신규 구매 총액이 추가 예산을 초과하거나 부품 가격 합계와 일치하지 않습니다.');
    }
  }
  return data;
}
