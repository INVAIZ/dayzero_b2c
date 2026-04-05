export type SourcingProvider = '올리브영' | '쿠팡' | '네이버 스마트스토어' | 'G마켓' | '다이소' | 'yes24' | '알라딘' | 'Ktown4u' | '위버스샵' | '메이크스타' | '위치폼' | 'FANS';

export interface SourcingJob {
    id: string;
    type: 'URL' | 'AUTO';
    provider: SourcingProvider;
    categorySummary: string; // e.g. "뷰티 인기상품"
    status: 'queued' | 'running' | 'completed' | 'failed';
    totalCount: number;
    currentCount: number;
    createdAt: string; // ISO string
    completedAt?: string;
    duplicateCount?: number;
    durationString?: string;
    errorMessage?: string;
}

export interface AutoSchedule {
    id: string;
    provider: SourcingProvider;
    categoryPath: string; // e.g. "대분류 > 중분류 > 소분류"
    criteria: '인기상품' | '전체상품';
    targetCount: number;
    timeString: string; // e.g. "06:00"
    isActive: boolean;
    lastRunAt?: string;
}

export interface SourcedProduct {
    id: string;
    jobId: string;
    provider: SourcingProvider;
    title: string;
    titleJa?: string | null;
    thumbnailUrl: string;
    originalPriceKrw: number;
    optionCount: number;
    sourceUrl: string;
    translationStatus: 'pending' | 'processing' | 'completed' | 'failed';
    qoo10Category: string | null;
    editStatus: 'pending' | 'completed';
}

export interface ParsedUrl {
    id: string;
    url: string;
    provider: SourcingProvider | null;
    status: 'idle' | 'running' | 'completed' | 'failed' | 'blocked';
    error?: string;
    product?: SourcedProduct;
}

export const SOURCING_PROVIDERS: { name: SourcingProvider; logo: string; url: string }[] = [
    { name: '올리브영', logo: '/logos/oliveyoung.png', url: 'https://www.oliveyoung.co.kr' },
    { name: '쿠팡', logo: '/logos/coupang.png', url: 'https://www.coupang.com' },
    { name: '네이버 스마트스토어', logo: '/logos/smartstore.png', url: 'https://shopping.naver.com/ns/home' },
    { name: 'G마켓', logo: '/logos/gmarket.png', url: 'https://www.gmarket.co.kr' },
    { name: '다이소', logo: '/logos/daiso.png', url: 'https://www.daisomall.co.kr' },
    { name: 'yes24', logo: '/logos/yes24.png', url: 'https://www.yes24.com' },
    { name: '알라딘', logo: '/logos/aladin.png', url: 'https://www.aladin.co.kr' },
    { name: 'Ktown4u', logo: '/logos/ktown4u.png', url: 'https://kr.ktown4u.com' },
    { name: '위버스샵', logo: '/logos/weverseshop.png', url: 'https://shop.weverse.io' },
    { name: '메이크스타', logo: '/logos/makestar.png', url: 'https://www.makestar.co' },
    { name: '위치폼', logo: '/logos/witchform.png?v=3', url: 'https://witchform.com' },
    { name: 'FANS', logo: '/logos/fans.png', url: 'https://app.fans/' },
];

export const getProviderLogo = (name: string): string =>
    SOURCING_PROVIDERS.find((p) => p.name === name)?.logo ?? '/logos/default.png';

export const MOCK_URL_TO_PROVIDER = (url: string): SourcingProvider | null => {
    if (url.includes('oliveyoung')) return '올리브영';
    if (url.includes('coupang')) return '쿠팡';
    if (url.includes('naver')) return '네이버 스마트스토어';
    if (url.includes('gmarket')) return 'G마켓';
    if (url.includes('daiso')) return '다이소';
    if (url.includes('yes24')) return 'yes24';
    if (url.includes('aladin')) return '알라딘';
    if (url.includes('ktown4u')) return 'Ktown4u';
    if (url.includes('weverse')) return '위버스샵';
    if (url.includes('makestar')) return '메이크스타';
    if (url.includes('witchform')) return '위치폼';
    if (url.includes('fans')) return 'FANS';
    return null;
}
