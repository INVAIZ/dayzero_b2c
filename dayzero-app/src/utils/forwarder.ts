/**
 * 배송대행사 프리셋, 요율표, 가격 계산 상수
 * SettingsPanel / BasicInfoPage / BasicMarginPage 에서 공용 사용
 */

import type { ForwarderValue } from '../components/onboarding/OnboardingContext';

/* ── 배송대행사 프리셋 ── */

export interface ForwarderPreset {
    id: ForwarderValue;
    label: string;
    shortLabel: string;
    zipCode: string;
    addressLine1: string;
    addressLine2: string;
}

export const FORWARDER_PRESETS: ForwarderPreset[] = [
    { id: 'qx', label: '큐익스프레스 (Qxpress)', shortLabel: '큐익스프레스', zipCode: '273-0012', addressLine1: '千葉県船橋市浜町2-5-7', addressLine2: 'MFLP船橋1-3階 Qxpress' },
    { id: 'rincos', label: '링코스 (Rincos)', shortLabel: '링코스', zipCode: '143-0001', addressLine1: '東京都大田区東海4-2-3', addressLine2: 'リンコス東京物流管理センター' },
    { id: 'kse', label: 'KSE 국제로지스틱 (Kokusai Express)', shortLabel: 'KSE', zipCode: '812-0051', addressLine1: '福岡県福岡市東区箱崎ふ頭4丁目2-39', addressLine2: '国際エキスプレス 福岡保税倉庫' },
    { id: 'enterround', label: '엔터라운드 (Enter Round)', shortLabel: '엔터라운드', zipCode: '121-0836', addressLine1: '東京都足立区入谷9-27-1', addressLine2: 'エンターラウンド 東京物流センター' },
    { id: 'hanjin', label: '한진 원클릭 (Hanjin Express)', shortLabel: '한진 원클릭', zipCode: '230-0054', addressLine1: '神奈川県横浜市鶴見区大黒ふ頭15-1', addressLine2: '韓進エクスプレス 横浜デポ' },
    { id: 'other', label: '직접 입력하기 (기타)', shortLabel: '직접 입력', zipCode: '', addressLine1: '', addressLine2: '' },
];

/* ── 배송대행사별 요율표 ── */

export interface RateRow { maxKg: number; fee: number }

export const FORWARDER_RATES: Record<string, { label: string; rows: RateRow[] }> = {
    qx: {
        label: '큐익스프레스 (Qxpress)',
        rows: [
            { maxKg: 0.10, fee: 433 }, { maxKg: 0.25, fee: 537 }, { maxKg: 0.50, fee: 622 },
            { maxKg: 0.75, fee: 750 }, { maxKg: 1.00, fee: 881 }, { maxKg: 1.25, fee: 975 },
            { maxKg: 1.50, fee: 1071 }, { maxKg: 1.75, fee: 1130 }, { maxKg: 2.00, fee: 1191 },
            { maxKg: 2.50, fee: 1245 },
        ],
    },
    rincos: {
        label: '링코스 (Rincos)',
        rows: [
            { maxKg: 0.10, fee: 450 }, { maxKg: 0.25, fee: 545 }, { maxKg: 0.50, fee: 615 },
            { maxKg: 0.75, fee: 690 }, { maxKg: 1.00, fee: 810 }, { maxKg: 1.25, fee: 860 },
            { maxKg: 1.50, fee: 920 }, { maxKg: 1.75, fee: 970 }, { maxKg: 2.00, fee: 1050 },
            { maxKg: 2.50, fee: 1180 },
        ],
    },
    kse: {
        label: 'KSE 국제로지스틱 (Kokusai Express)',
        rows: [
            { maxKg: 0.10, fee: 490 }, { maxKg: 0.25, fee: 560 }, { maxKg: 0.50, fee: 620 },
            { maxKg: 0.75, fee: 700 }, { maxKg: 1.00, fee: 750 }, { maxKg: 1.25, fee: 780 },
            { maxKg: 1.50, fee: 830 }, { maxKg: 1.75, fee: 880 }, { maxKg: 2.00, fee: 940 },
            { maxKg: 2.50, fee: 1090 },
        ],
    },
    enterround: {
        label: '엔터라운드 (Enter Round)',
        rows: [
            { maxKg: 0.10, fee: 410 }, { maxKg: 0.25, fee: 500 }, { maxKg: 0.50, fee: 590 },
            { maxKg: 0.75, fee: 670 }, { maxKg: 1.00, fee: 760 }, { maxKg: 1.25, fee: 820 },
            { maxKg: 1.50, fee: 890 }, { maxKg: 1.75, fee: 940 }, { maxKg: 2.00, fee: 1000 },
            { maxKg: 2.50, fee: 1120 },
        ],
    },
    hanjin: {
        label: '한진 원클릭 (Hanjin Express)',
        rows: [
            { maxKg: 0.10, fee: 380 }, { maxKg: 0.25, fee: 470 }, { maxKg: 0.50, fee: 560 },
            { maxKg: 0.75, fee: 650 }, { maxKg: 1.00, fee: 740 }, { maxKg: 1.25, fee: 800 },
            { maxKg: 1.50, fee: 860 }, { maxKg: 1.75, fee: 920 }, { maxKg: 2.00, fee: 980 },
            { maxKg: 2.50, fee: 1090 },
        ],
    },
};

export function lookupShippingFee(forwarder: ForwarderValue, weightKg: number): number {
    const table = FORWARDER_RATES[forwarder];
    if (!table) return 0;
    for (const row of table.rows) {
        if (weightKg <= row.maxKg) return row.fee;
    }
    return table.rows[table.rows.length - 1].fee;
}

/* ── 상수 ── */

export const PLATFORM_FEE_RATE = 0.12;
export const EXCHANGE_RATE = 9.2;
export const WEIGHT_OPTIONS = [0.1, 0.25, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5];
