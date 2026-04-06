import { EXCHANGE_RATE } from '../mock/categoryMap';
import { QOO10_FEE_RATE } from '../constants/fees';

/** 기본 마진율 (%) — marginType이 '%'가 아닐 때 fallback */
export const DEFAULT_MARGIN_RATE = 30;

/** JPY 판매가를 KRW로 환산 */
export function jpyToKrw(jpy: number): number {
    return jpy * EXCHANGE_RATE;
}

/** 온보딩 상태에서 마진율(%) 추출 */
export function getMarginRate(onboarding: { marginType: string; marginValue: number }): number {
    return onboarding.marginType === '%' ? onboarding.marginValue : DEFAULT_MARGIN_RATE;
}

/** 예상 수익 계산 (1건 판매 시 순이익, 원화) — 정산금액 - 총비용 역산 */
export function calcExpectedProfit(salePriceJpy: number, marginRate: number): number {
    const salePriceKrw = Math.round(salePriceJpy * EXCHANGE_RATE);
    const totalCostKrw = Math.round(salePriceKrw / (1 + marginRate / 100));
    const settlementKrw = Math.round(salePriceKrw * (1 - QOO10_FEE_RATE));
    return settlementKrw - totalCostKrw;
}

/** 마진율 계산 (%) — 원가(KRW)와 판매가(JPY) 기준 */
export function calcMarginPercent(costKrw: number, salePriceJpy: number): number {
    const saleInKrw = jpyToKrw(salePriceJpy);
    if (saleInKrw <= 0) return 0;
    return ((saleInKrw - costKrw) / saleInKrw) * 100;
}

/** 실제 마진 기준으로 역마진 여부 판단 (모니터링 활성 + negative_margin + 5% 이하) */
export function isActualNegativeMargin(monitoring: { status?: string; lastCheckResult?: string; currentSourcePriceKrw?: number } | undefined, product: { originalPriceKrw: number; salePriceJpy: number }): boolean {
    if (monitoring?.status !== 'active' || monitoring.lastCheckResult !== 'negative_margin') return false;
    const cost = monitoring.currentSourcePriceKrw ?? product.originalPriceKrw;
    const margin = calcMarginPercent(cost, product.salePriceJpy);
    return margin <= 5;
}
