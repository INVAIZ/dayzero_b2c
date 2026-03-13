import type { ProductDetail } from './editing';

// 에러 유형 6가지
export type RegistrationErrorType =
    | 'api_error'
    | 'missing_required'
    | 'category_mismatch'
    | 'image_spec'
    | 'policy_violation'
    | 'server_timeout';

// 에러 상세 정보
export interface RegistrationError {
    type: RegistrationErrorType;
    message: string;       // 요약 메시지
    detail: string;        // Qoo10 API 응답 원문
    code: string;          // 에러 코드
    resolution: string;    // 해결 방법 안내
}

// 판매처 (마켓플레이스)
export type Marketplace = 'qoo10_jp';

export const MARKETPLACES: { key: Marketplace; label: string; logo: string }[] = [
    { key: 'qoo10_jp', label: 'Qoo10 JP', logo: '/logos/qoo10.png' },
];

// 개별 상품 등록 결과
export interface RegistrationResult {
    id: string;
    productId: string;
    product: ProductDetail;              // 등록 시점의 상품 스냅샷
    status: 'success' | 'failed';
    marketplace: Marketplace;
    registeredAt: string;

    // 성공 시
    qoo10ItemCode?: string;              // Qoo10 상품 ID
    qoo10ProductUrl?: string;            // Qoo10 상품 페이지 URL

    // 실패 시
    error?: RegistrationError;
}

// 등록 Job (배치 단위)
export interface RegistrationJob {
    id: string;
    productIds: string[];
    results: RegistrationResult[];
    totalCount: number;
    currentCount: number;
    successCount: number;
    failedCount: number;
    status: 'processing' | 'completed';
    createdAt: string;
    completedAt?: string;
    elapsedTime?: number;                // ms
}

// 판매처 필터
export type MarketplaceFilter = 'all' | Marketplace;
