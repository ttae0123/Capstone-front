import type { ManualBuildSelection, ManualCategory, ManualPart, PartDetail } from '../types/pc';
export const MANUAL_CATEGORIES: ManualCategory[] = ['cpu', 'mainboard', 'ram', 'gpu', 'ssd', 'power', 'case', 'cooler'];
export const CATEGORY_LABEL: Record<ManualCategory, string> = {
  cpu: 'CPU', mainboard: '메인보드', ram: 'RAM', gpu: '그래픽카드',
  ssd: 'SSD', power: '파워', case: '케이스', cooler: '쿨러',
};
export const SELECTION_KEY: Record<ManualCategory, keyof ManualBuildSelection> = {
  cpu: 'cpuId', mainboard: 'mainboardId', ram: 'ramId', gpu: 'gpuId',
  ssd: 'ssdId', power: 'powerId', case: 'caseId', cooler: 'coolerId',
};
export const emptySelection = (): ManualBuildSelection => ({
  cpuId: null, mainboardId: null, ramId: null, gpuId: null,
  ssdId: null, powerId: null, caseId: null, coolerId: null,
});
export function specsText(part: ManualPart): string {
  return Object.entries(part.specs ?? {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' / ') || '상세 스펙 정보 없음';
}
export function benchScore(part: ManualPart | PartDetail): number | null {
  const direct = part.benchScore;
  const specs = 'specs' in part ? part.specs : undefined;
  const raw = direct ?? specs?.benchScore;
  const n = Number(raw);
  return raw != null && Number.isFinite(n) && n > 0 ? n : null;
}
export function danawaLink(part: Pick<ManualPart, 'name'|'productUrl'>): { url: string; isDirect: boolean } {
  const link = part.productUrl?.trim();
  if (link) {
    try {
      const parsed = new URL(link);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return { url: parsed.href, isDirect: true };
    } catch { /* Invalid external product URL: use a search fallback. */ }
  }
  return { url: `https://search.danawa.com/dsearch.php?query=${encodeURIComponent(part.name)}`, isDirect: false };
}
