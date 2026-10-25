export type UsageType = 'GAMING' | 'OFFICE' | 'VIDEO_EDITING';
export type ManualCategory = 'cpu' | 'mainboard' | 'ram' | 'gpu' | 'ssd' | 'power' | 'case' | 'cooler';

export interface PCComponent {
  id: string;
  category: string;
  name: string;
  brand: string;
  price: number;
  specs: string[];
  size?: string;
  lowestPriceSite?: string;
  purchaseUrl?: string;
  compareUrl?: string;
}
export interface PCBuild { budget: number; purpose: string; components: PCComponent[]; notes: string[]; }
export interface BuildInput { budget: string; purpose: string; brands: string[]; }

export interface ManualBuildSelection {
  cpuId: number | null;
  mainboardId: number | null;
  ramId: number | null;
  gpuId: number | null;
  ssdId: number | null;
  powerId: number | null;
  caseId: number | null;
  coolerId: number | null;
}
export interface ManualPart {
  id: number;
  category: string;
  name: string;
  price: number;
  brand?: string | null;
  chipsetBrand?: string | null;
  productCode?: number | string | null;
  productUrl?: string | null;
  benchScore?: number | null;
  specs?: Record<string, unknown>;
}
export interface ManualPartListResponse {
  category: string;
  totalCount: number;
  parts: ManualPart[];
}
export interface PartDetail {
  category: string;
  name: string;
  price: number;
  brand?: string | null;
  chipsetBrand?: string | null;
  benchScore?: number | null;
  specSummary?: string | null;
  productCode?: number | string | null;
  productUrl?: string | null;
  /** 보유 부품 전용 API는 실제 DB 부품 ID를 내려주어 고정 부품 여부를 검증합니다. */
  id?: number | null;
  isOwned?: boolean;
}
export interface Recommendation {
  rankName: string;
  totalEstimatedPrice?: number;
  parts: PartDetail[];
  message?: string;
}
export interface RecommendationResponse { recommendations: Recommendation[]; }
/** 백엔드 구현 완료: POST /api/estimates/recommend-with-owned
 * budget = 추가 구매에 사용 가능한 금액(보유 부품의 기존 구매가는 미포함).
 * ownedParts = ManualBuildSelection과 동일한 ID 키. 최소 1개, 다른 키는 생략 가능.
 * usage는 보유 부품 페이지에 용도 입력란이 없으므로 GAMING(서버 기본값)을 전송합니다.
 */
export interface OwnedEstimateRequest {
  budget: number;
  ownedParts: Partial<ManualBuildSelection>;
  usage?: UsageType;
  preference?: string | null;
}

export interface OwnedBuildSeed {
  category: ManualCategory;
  part: ManualPart;
  extraBudget: number;
}
