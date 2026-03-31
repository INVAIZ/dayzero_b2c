const EXCHANGE_RATE_JPY_TO_KRW = 0.11;

/** JPY 판매가를 KRW로 환산 */
export function jpyToKrw(jpy: number): number {
    return jpy / EXCHANGE_RATE_JPY_TO_KRW;
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
