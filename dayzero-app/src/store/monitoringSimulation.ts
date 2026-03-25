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
    } else if (rand < 0.65) {
        const change = Math.round(originalPrice * (0.05 + Math.random() * 0.1));
        const newPrice = originalPrice + change;
        return {
            result: 'price_changed',
            currentPrice: newPrice,
            issueDescription: `쇼핑몰 구매가가 ₩${originalPrice.toLocaleString()} → ₩${newPrice.toLocaleString()}로 변동됐어요. 현재 마진율은 유지되고 있어요.`,
        };
    } else if (rand < 0.85) {
        const increase = Math.round(originalPrice * (0.4 + Math.random() * 0.3));
        const newPrice = originalPrice + increase;
        const saleInKrw = salePriceJpy / 0.11;
        const marginPct = ((saleInKrw - newPrice) / saleInKrw * 100).toFixed(1);
        const recommendedJpy = Math.ceil((newPrice * 1.2) * 0.11);
        return {
            result: 'negative_margin',
            currentPrice: newPrice,
            issueDescription: `쇼핑몰 구매가가 ₩${originalPrice.toLocaleString()} → ₩${newPrice.toLocaleString()}로 올라 현재 판매가(¥${salePriceJpy.toLocaleString()}) 기준 마진율이 ${marginPct}%예요. 판매가를 ¥${recommendedJpy.toLocaleString()} 이상으로 조정하거나, 다른 쇼핑몰을 검토해주세요.`,
        };
    } else {
        return {
            result: 'out_of_stock',
            currentPrice: originalPrice,
            issueDescription: `쇼핑몰에서 해당 상품이 품절됐어요. Qoo10 판매를 일시 중지하거나, 다른 쇼핑몰을 찾아주세요.`,
        };
    }
}

/** 더미 가격 이력 생성 (최근 14일) */
export function generateDummyPriceHistory(
    basePrice: number,
    salePriceJpy: number,
    checkResult: MonitoringCheckResult,
    currentPrice: number,
): PriceHistoryEntry[] {
    const entries: PriceHistoryEntry[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
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
