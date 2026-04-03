export interface ProductOption {
    id: string;
    nameKo: string;
    nameJa: string | null;
    stock: number;
}

export interface ProductImage {
    id: string;
    url: string;
    translatedUrl: string | null;
    translationStatus: 'none' | 'processing' | 'completed';
    backgroundRemoved: boolean;
}

export interface ProductDetail {
    id: string;

    // 원문 (한국어)
    titleKo: string;
    descriptionKo: string;
    options: ProductOption[];

    // 번역본 (일본어)
    titleJa: string | null;
    descriptionJa: string | null;

    // 이미지
    thumbnails: ProductImage[];   // 최대 10장, [0] = 대표
    detailImages: ProductImage[]; // 최대 30장

    // 가격 (소싱 단계에서 계산 완료)
    salePriceJpy: number;

    // Qoo10 카테고리 (자동 매핑)
    qoo10CategoryId: string;
    qoo10CategoryPath: string;    // 표시용 "스킨케어 > 기초화장품 > 에센스"
    aiRecommendedCategoryId: string;   // AI가 최초 추천한 소분류 코드
    aiRecommendedCategoryPath: string; // AI가 최초 추천한 카테고리 경로 (변경 추적용)

    // 브랜드 (Qoo10 DB 매칭)
    brand: string;
    brandMatchStatus: 'matched' | 'unmatched' | 'none'; // matched=Qoo10 DB 등록, unmatched=미등록, none=브랜드없음
    brandQoo10Code?: string; // Qoo10 브랜드 코드 (현재 선택)
    aiRecommendedBrandCode?: string; // AI가 최초 추천한 Qoo10 브랜드 코드 (변경 추적용)

    // 상품 기본 정보
    manufacturer: string;
    productionPlace: string; // 원산지
    sourceCategoryPath: string; // 소싱처 원본 카테고리

    // 소싱 정보
    provider: string;
    sourceUrl: string;
    thumbnailUrl: string;
    originalPriceKrw: number;

    // 상태
    translationStatus: 'pending' | 'processing' | 'completed' | 'failed';
    editStatus: 'pending' | 'processing' | 'completed' | 'failed';
    lastSavedAt: string | null;
    createdAt: string; // 최근 수집일 (ISO string)
    isRead: boolean;
    jobId?: string; // 소싱 작업 고유 ID (알림 연동용)
    weightKg: number;
    isWeightEstimated: boolean; // deprecated — weightSource 사용
    weightSource: 'crawled' | 'ai' | 'manual';
    priceSource: 'crawled' | 'ai' | 'manual';
    shippingType: 'standard' | 'sameday' | 'preorder'; // 일반발송 | 당일발송 | 예약발송
    shippingDays: number; // 발송까지 영업일 수
    isReTranslating?: boolean;
}

export interface TranslationJob {
    id: string;
    productId: string;
    productTitleKo: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    errorMessage?: string;
    targets: ('title' | 'description' | 'options')[];
    isRead?: boolean;
}

export type EditTabFilter = 'all' | 'needs_translation' | 'translated';

export interface TranslationBatch {
    id: string;
    productIds: string[];
    totalCount: number;
    currentCount: number;
    status: 'processing' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
    isRead?: boolean;
    label?: string;
}

export interface RegistrationBatch {
    id: string;
    totalCount: number;
    currentCount: number;
    status: 'processing' | 'completed' | 'failed';
    createdAt: string;
    isRead?: boolean;
}
