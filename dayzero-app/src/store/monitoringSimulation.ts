import type { MonitoringCheckResult, PriceHistoryEntry } from '../types/registration';

/** 최초 등록 시 결과 (항상 정상) */
export function generateInitialMonitoringResult(originalPrice: number): {
    result: MonitoringCheckResult;
    currentPrice: number;
    issueDescription?: string;
} {
    return { result: 'normal', currentPrice: originalPrice };
}

/** 시뮬레이션 확인 결과 생성 (UT 프로토타입용 — "확인 실행" 시) */
export function generateSimulatedCheckResult(originalPrice: number, salePriceJpy: number): {
    result: MonitoringCheckResult;
    currentPrice: number;
    issueDescription?: string;
} {
    const rand = Math.random();
    if (rand < 0.45) {
        return { result: 'normal', currentPrice: originalPrice };
    } else if (rand < 0.75) {
        // 원가 변동 → 판매가 자동 조정 (역마진 발생하지 않음)
        const change = Math.round(originalPrice * (0.05 + Math.random() * 0.15));
        const adjustedPrice = Math.max(originalPrice + (Math.random() < 0.5 ? change : -Math.round(change * 0.5)), Math.round(originalPrice * 0.7));
        const newSaleJpy = Math.ceil((adjustedPrice * 1.2) * 0.11);
        return {
            result: 'price_changed',
            currentPrice: adjustedPrice,
            issueDescription: `원가 ₩${originalPrice.toLocaleString()} → ₩${adjustedPrice.toLocaleString()}로 변동, 판매가를 ¥${salePriceJpy.toLocaleString()} → ¥${newSaleJpy.toLocaleString()}로 자동 조정했어요.`,
        };
    } else {
        return {
            result: 'out_of_stock',
            currentPrice: originalPrice,
            issueDescription: '쇼핑몰에서 해당 상품이 품절됐어요. 판매를 자동 일시중지했어요.',
        };
    }
}

/** 더미 가격 이력 생성 (days일치, 기본 14일) */
export function generateDummyPriceHistory(
    basePrice: number,
    salePriceJpy: number,
    checkResult: MonitoringCheckResult,
    currentPrice: number,
    days: number = 14,
): PriceHistoryEntry[] {
    const entries: PriceHistoryEntry[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        let price: number;
        if (i <= 2 && checkResult !== 'normal') {
            price = currentPrice;
        } else {
            const jitter = basePrice * (Math.random() * 0.06 - 0.03);
            price = Math.round(basePrice + jitter);
        }

        const saleInKrw = salePriceJpy / 0.11;
        const margin = saleInKrw > 0 ? ((saleInKrw - price) / saleInKrw * 100) : 0;

        entries.push({
            date: date.toISOString(),
            sourcePriceKrw: price,
            stockStatus: (i <= 1 && checkResult === 'out_of_stock') ? 'out_of_stock' : 'in_stock',
            marginPercent: Math.round(margin * 10) / 10,
        });
    }
    return entries;
}
