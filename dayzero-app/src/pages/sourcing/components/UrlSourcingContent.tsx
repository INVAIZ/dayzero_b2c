import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SOURCING_PROVIDERS, MOCK_URL_TO_PROVIDER } from '../../../types/sourcing';
import type { SourcedProduct, ParsedUrl } from '../../../types/sourcing';
import { useSourcingStore } from '../../../store/useSourcingStore';
import { useEditingStore } from '../../../store/useEditingStore';

import { Link2, AlertCircle, Loader2, CheckCircle2, XCircle, ArrowRight, X } from 'lucide-react';
import { useOnboarding } from '../../../components/onboarding/OnboardingContext';
import { colors, font, radius, spacing } from '../../../design/tokens';

export const UrlSourcingContent = () => {
    const navigate = useNavigate();
    const { addJob, addProduct, addNotification, updateNotification, urlSourcing, setUrlSourcing } = useSourcingStore();
    const { state: onboardingState } = useOnboarding();

    const { urls, parsedUrls, isCollecting, collectionStarted } = urlSourcing;
    const [lastJobId, setLastJobId] = useState<string | null>(null);

    const setUrls = (updater: import('react').SetStateAction<string[]>) => {
        const current = useSourcingStore.getState().urlSourcing.urls;
        setUrlSourcing({ urls: typeof updater === 'function' ? (updater as (prev: string[]) => string[])(current) : updater });
    };
    const setParsedUrls = (updater: import('react').SetStateAction<ParsedUrl[]>) => {
        const current = useSourcingStore.getState().urlSourcing.parsedUrls;
        setUrlSourcing({ parsedUrls: typeof updater === 'function' ? (updater as (prev: ParsedUrl[]) => ParsedUrl[])(current) : updater });
    };
    const setIsCollecting = (b: boolean) => setUrlSourcing({ isCollecting: b });
    const setCollectionStarted = (b: boolean) => setUrlSourcing({ collectionStarted: b });

    const [pendingInput, setPendingInput] = useState('');
    const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const startButtonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (collectionStarted) return;

        const newParsed: ParsedUrl[] = urls.map((url, index) => {
            const provider = MOCK_URL_TO_PROVIDER(url);
            return {
                id: `url-${index}`,
                url,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                provider: provider || ('기타' as any),
                status: 'idle',
                error: !url.startsWith('http') ? '올바른 URL을 입력해주세요' : undefined
            };
        });

        setParsedUrls(newParsed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urls, collectionStarted]);

    const validCount = parsedUrls.filter(p => !p.error).length;
    const completedCount = parsedUrls.filter(p => p.status === 'completed' || p.status === 'failed' || p.status === 'blocked').length;
    const isAllCompleted = collectionStarted && completedCount === parsedUrls.length;
    const successCount = parsedUrls.filter(p => p.status === 'completed').length;
    const blockedCount = parsedUrls.filter(p => p.status === 'blocked').length;

    const handleStartCollection = async () => {
        if (validCount === 0) return;

        const notifId = `notif-url-${Date.now()}`;
        addNotification({
            id: notifId,
            type: 'url',
            title: `직접 수집 (${validCount}건)`,
            status: 'running',
            currentCount: 0,
            totalCount: validCount,
            createdAt: new Date().toISOString(),
        });
        setLastJobId(notifId);
        setCollectionStarted(true);
        setIsCollecting(true);

        const urlsSnapshot = parsedUrls;
        let successProcessed = 0;

        // AI 무게 예측 최소 1개 보장: 유효한 URL 중 하나는 반드시 AI 예측
        const validIndices = urlsSnapshot.map((_, i) => i).filter(i => !urlsSnapshot[i].error);
        const guaranteedAIIdx = validIndices.length > 0
            ? validIndices[Math.floor(Math.random() * validIndices.length)]
            : -1;

        // 판매 중 차단 시뮬레이션: 유효 URL이 2건 이상이면 마지막 1건을 차단
        const blockedIdx = validIndices.length >= 2 ? validIndices[validIndices.length - 1] : -1;

        for (let i = 0; i < urlsSnapshot.length; i++) {
            const current = urlsSnapshot[i];
            if (current.error) continue;

            setParsedUrls(prev => prev.map(p => p.id === current.id ? { ...p, status: 'running' } : p));

            await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 2500));

            // 판매 중 차단 처리
            if (i === blockedIdx) {
                const blockedTitle = current.provider === '올리브영'
                    ? '[단독기획] 닥터지 레드 블레미쉬 클리어 수딩 크림 70ml'
                    : current.provider === '쿠팡'
                        ? '퍼실 파워젤 세탁세제 리필 2.7L 3개'
                        : '다이소 미니 선풍기 USB 충전식';
                const blockedProduct: SourcedProduct = {
                    id: `prod-blocked-${Date.now()}-${i}`,
                    jobId: notifId,
                    provider: current.provider || ('기타' as any),
                    title: blockedTitle,
                    thumbnailUrl: 'https://via.placeholder.com/300/F5F6F8/8B95A1?text=Product',
                    originalPriceKrw: Math.floor(Math.random() * 20000) + 10000,
                    optionCount: 1,
                    sourceUrl: current.url,
                    translationStatus: 'pending',
                    qoo10Category: null,
                    editStatus: 'pending',
                };
                setParsedUrls(prev => prev.map(p =>
                    p.id === current.id ? { ...p, status: 'blocked', product: blockedProduct } : p
                ));
                updateNotification(notifId, { currentCount: successProcessed });
                continue;
            }

                const kpopProviders = ['알라딘', 'Ktown4u', '케이타운포유', 'YES24', '메이크스타', '위버스샵', 'Weverse Shop', 'FANS', '팬스'];
                const isKpop = kpopProviders.some(p => (current.provider || '').toLowerCase().includes(p.toLowerCase()));

                const kpopTitles = [
                    '[예약판매] 뉴진스 (NewJeans) - 2nd EP [Get Up] (Bunny Beach Bag ver.)',
                    '세븐틴 (SEVENTEEN) - 10th Mini Album [FML] (일반반)',
                    '르세라핌 (LE SSERAFIM) - 1st Studio Album [UNFORGIVEN] (Weverse Albums ver.)',
                    '스트레이 키즈 (Stray Kids) - 5-STAR (Limited Edition)',
                    '에스파 (aespa) - 3rd Mini Album [MY WORLD] (Poster ver.)',
                    '르세라핌 (LE SSERAFIM) - 3rd Mini Album [EASY] (Weverse Albums ver.)'
                ];
                const generalTitles = [
                    '[단독기획] 닥터지 레드 블레미쉬 클리어 수딩 크림 70ml+30ml 세트',
                    '일리윤 세라마이드 아토 집중 크림 200ml 탑퍼 기획',
                    '[NEW/2026년까지] 라네즈 네오 쿠션 매트 15g 본품+리필',
                    '코스알엑스 패드 3종 비교 기획세트 (오리지널/모이스쳐/포어리스)',
                    '클리오 킬커버 더뉴 파운웨어 쿠션 (본품+리필+퍼프2매)',
                ];

                const realisticTitles = isKpop ? kpopTitles : generalTitles;
                const realTitle = realisticTitles[i % realisticTitles.length];
                const orgPrice = Math.floor(Math.random() * 20000) + 15000;

                const mockProduct: SourcedProduct = {
                    id: `prod-${Date.now()}-${i}`,
                    jobId: notifId,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    provider: current.provider || ('기타' as any),
                    title: realTitle,
                    thumbnailUrl: 'https://via.placeholder.com/300/F5F6F8/8B95A1?text=Product',
                    originalPriceKrw: orgPrice,
                    optionCount: Math.floor(Math.random() * 5),
                    sourceUrl: current.url,
                    translationStatus: 'pending',
                    qoo10Category: null,
                    editStatus: 'pending'
                };

                const costKrw = orgPrice + onboardingState.domesticShipping + onboardingState.prepCost + onboardingState.intlShipping;
                const margin = onboardingState.marginType === '%' ? costKrw * (onboardingState.marginValue / 100) : onboardingState.marginValue;
                const salePriceKrw = costKrw + margin;
                const salePriceJpy = Math.round(salePriceKrw * 0.11);

                // 상품명 키워드 기반 카테고리 자동 매칭
                const providerName = typeof current.provider === 'string' ? current.provider : (current.provider as any)?.name || '기타';
                const titleLower = realTitle.toLowerCase();

                const categoryRules: { match: (t: string) => boolean; catId: string; catPath: string; sourceCatPath: string }[] = [
                    // K-POP
                    { match: () => isKpop, catId: '320001783', catPath: 'KPOP > 세트 > 세트', sourceCatPath: '엔터테인먼트 > 음반 > K-POP' },
                    // 스킨케어
                    { match: t => /크림|cream/i.test(t), catId: '320001621', catPath: '스킨케어 > 기초화장품 > 크림', sourceCatPath: '올리브영 > 스킨케어 > 크림' },
                    { match: t => /토너|스킨|toner/i.test(t), catId: '320001619', catPath: '스킨케어 > 기초화장품 > 토너', sourceCatPath: '올리브영 > 스킨케어 > 토너' },
                    { match: t => /세럼|에센스|앰플|serum/i.test(t), catId: '320001623', catPath: '스킨케어 > 기초화장품 > 에센스', sourceCatPath: '올리브영 > 스킨케어 > 에센스' },
                    { match: t => /마스크|팩|패드|pad|mask/i.test(t), catId: '320001628', catPath: '스킨케어 > 팩 > 마스크 팩', sourceCatPath: '올리브영 > 스킨케어 > 마스크/팩' },
                    { match: t => /쿠션|파운데이션|파운웨어/i.test(t), catId: '320001657', catPath: '베이스 메이크업 > 파운데이션 > 쿠션 파운데이션', sourceCatPath: '올리브영 > 메이크업 > 쿠션' },
                    { match: t => /샴푸|shampoo/i.test(t), catId: '320001775', catPath: '헤어 > 헤어케어 > 샴푸', sourceCatPath: '올리브영 > 헤어케어 > 샴푸' },
                    // 생활용품
                    { match: t => /세제|세탁|퍼실|다우니/i.test(t), catId: '300003269', catPath: '생활용품・잡화 > 소모품 > 세탁 세제', sourceCatPath: '쿠팡 > 생활용품 > 세탁세제' },
                    { match: t => /라면|볶음면|면류/i.test(t), catId: '300000554', catPath: '식품 > 라면・면류 > 라면', sourceCatPath: '쿠팡 > 식품 > 라면' },
                    { match: t => /밀폐|용기|보관/i.test(t), catId: '320000820', catPath: '키친용품 > 키친 잡화 > 보존 용기・밀폐 용기', sourceCatPath: '쿠팡 > 주방용품 > 밀폐용기' },
                    { match: t => /프라이팬|냄비/i.test(t), catId: '300000501', catPath: '키친용품 > 조리용품 > 프라이팬', sourceCatPath: '쿠팡 > 주방용품 > 프라이팬' },
                    { match: t => /선풍기|팬/i.test(t), catId: '320002065', catPath: '계절가전 > 선풍기・서큘레이터 > 서큘레이터', sourceCatPath: '다이소 > 가전 > 선풍기' },
                    { match: t => /쓰레기통|분리수거/i.test(t), catId: '300002942', catPath: '가구・인테리어 > 인테리어・장식 > 쓰레기통', sourceCatPath: '다이소 > 생활 > 쓰레기통' },
                ];

                const matched = categoryRules.find(r => r.match(titleLower));
                let catId = matched?.catId ?? '320001621';
                let catPath = matched?.catPath ?? '스킨케어 > 기초화장품 > 크림';
                let sourceCatPath = matched?.sourceCatPath ?? (providerName + ' > 기타');

                // 무게 시뮬레이션 (수집된 무게 vs AI 예측 무게)
                const isAlbum = realTitle.includes('Album') || realTitle.includes('음반');

                // 지정된 인덱스는 반드시 AI 예측, 나머지는 20% 확률
                const isAIPredicted = i === guaranteedAIIdx || Math.random() < 0.2;
                const weightKg = isAlbum ? 0.45 : 0.25;

                // 상품 유형별 다양한 옵션 생성
                const makeOptions = () => {
                    const pid = mockProduct.id;
                    if (isKpop) {
                        // K-pop: 버전 옵션 2~3개
                        const versions = ['ver. A', 'ver. B', 'ver. C'];
                        const count = 2 + (i % 2); // 2 or 3
                        return versions.slice(0, count).map((v, vi) => ({
                            id: `opt-${pid}-${vi}`, nameKo: v, nameJa: null, stock: 500 + vi * 100,
                        }));
                    }
                    const beautyOptions = [
                        [{ nameKo: '본품', stock: 999 }, { nameKo: '본품+리필', stock: 500 }],
                        [{ nameKo: '21호 라이트', stock: 800 }, { nameKo: '23호 미디엄', stock: 600 }, { nameKo: '25호 딥', stock: 400 }],
                        [{ nameKo: '기본', stock: 999 }],
                        [{ nameKo: '50ml', stock: 700 }, { nameKo: '100ml', stock: 500 }],
                    ];
                    const dailyOptions = [
                        [{ nameKo: '기본', stock: 999 }],
                        [{ nameKo: '소', stock: 800 }, { nameKo: '중', stock: 600 }, { nameKo: '대', stock: 400 }],
                        [{ nameKo: '화이트', stock: 500 }, { nameKo: '블랙', stock: 500 }],
                    ];
                    const optSet = catPath.includes('생활용품') || catPath.includes('소모품') ? dailyOptions : beautyOptions;
                    const chosen = optSet[i % optSet.length];
                    return chosen.map((o, vi) => ({
                        id: `opt-${pid}-${vi}`, nameKo: o.nameKo, nameJa: null, stock: o.stock,
                    }));
                };

                // 상품 유형별 브랜드/제조사/원산지
                const productMeta = (() => {
                    if (isKpop) {
                        const labels = [
                            { brand: 'HYBE', manufacturer: '하이브(주)', productionPlace: '대한민국' },
                            { brand: 'SM Entertainment', manufacturer: '(주)에스엠엔터테인먼트', productionPlace: '대한민국' },
                            { brand: 'YG Entertainment', manufacturer: '(주)YG엔터테인먼트', productionPlace: '대한민국' },
                            { brand: 'JYP Entertainment', manufacturer: '(주)JYP엔터테인먼트', productionPlace: '대한민국' },
                        ];
                        return labels[i % labels.length];
                    }
                    if (catPath.includes('생활용품') || catPath.includes('소모품')) {
                        const labels = [
                            { brand: 'LG생활건강', manufacturer: 'LG생활건강(주)', productionPlace: '대한민국' },
                            { brand: '아모레퍼시픽', manufacturer: '(주)아모레퍼시픽', productionPlace: '대한민국' },
                        ];
                        return labels[i % labels.length];
                    }
                    // 뷰티 기본
                    const labels = [
                        { brand: 'Dr.G', manufacturer: '(주)고운세상코스메틱', productionPlace: '대한민국' },
                        { brand: 'illiyoon', manufacturer: '(주)아모레퍼시픽', productionPlace: '대한민국' },
                        { brand: 'LANEIGE', manufacturer: '(주)아모레퍼시픽', productionPlace: '대한민국' },
                        { brand: 'COSRX', manufacturer: '(주)코스알엑스', productionPlace: '대한민국' },
                        { brand: 'CLIO', manufacturer: '(주)클리오', productionPlace: '대한민국' },
                    ];
                    return labels[i % labels.length];
                })();

                useEditingStore.getState().addProduct({
                    id: mockProduct.id,
                    titleKo: mockProduct.title,
                    descriptionKo: '수집된 상세설명 입니다.',
                    options: makeOptions(),
                    titleJa: null,
                    descriptionJa: null,
                    thumbnails: [{ id: `thumb-${mockProduct.id}`, url: mockProduct.thumbnailUrl, translatedUrl: null, translationStatus: 'none', backgroundRemoved: false }],
                    detailImages: [],
                    salePriceJpy,
                    qoo10CategoryId: catId,
                    qoo10CategoryPath: catPath,
                    aiRecommendedCategoryId: catId,
                    aiRecommendedCategoryPath: catPath,
                    sourceCategoryPath: sourceCatPath,
                    brand: productMeta.brand,
                    brandMatchStatus: 'matched' as const,
                    manufacturer: productMeta.manufacturer,
                    productionPlace: productMeta.productionPlace,
                    provider: mockProduct.provider,
                    sourceUrl: mockProduct.sourceUrl,
                    thumbnailUrl: mockProduct.thumbnailUrl,
                    originalPriceKrw: mockProduct.originalPriceKrw,
                    thumbnailTranslated: false,
                    detailPageTranslated: false,
                    translationStatus: 'pending',
                    editStatus: 'pending',
                    lastSavedAt: null,
                    createdAt: new Date().toISOString(),
                    isRead: false,
                    jobId: mockProduct.jobId,
                    weightKg: weightKg,
                    isWeightEstimated: isAIPredicted,
                    weightSource: isAIPredicted ? 'ai' as const : 'crawled' as const,
                    priceSource: 'crawled' as const,
                    shippingType: 'standard' as const,
                    shippingDays: 3,
                });

                addProduct(mockProduct);
                setParsedUrls(prev => prev.map(p =>
                    p.id === current.id ? { ...p, status: 'completed', product: mockProduct } : p
                ));

                successProcessed++;

            updateNotification(notifId, { currentCount: successProcessed });
        }

        setIsCollecting(false);

        updateNotification(notifId, {
            status: 'completed',
            currentCount: successProcessed,
            completedAt: new Date().toISOString(),
        });

        if (successProcessed > 0) {
            addJob({
                id: `job-url-${Date.now()}`,
                type: 'URL',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                provider: urlsSnapshot.find(p => !p.error)?.provider || '기타' as any,
                categorySummary: `${successProcessed}건 수동 수집`,
                status: 'completed',
                totalCount: urlsSnapshot.filter(p => !p.error).length,
                currentCount: successProcessed,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
            });

        }
    };

    const handleRetry = async (id: string) => {
        setParsedUrls(prev => prev.map(p => p.id === id ? { ...p, status: 'running', error: undefined } : p));
        await new Promise(resolve => setTimeout(resolve, 2000));

        const current = parsedUrls.find(p => p.id === id);
        if (current) {
            const mockProduct: SourcedProduct = {
                id: `prod-retry-${Date.now()}`,
                jobId: 'manual-url-job',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                provider: current.provider || ('기타' as any),
                title: `${current.provider || '기타'} 재시도 상품`,
                thumbnailUrl: 'https://via.placeholder.com/150/F5F6F8/8B95A1?text=Retry',
                originalPriceKrw: 15000,
                optionCount: 2,
                sourceUrl: current.url,
                translationStatus: 'pending',
                qoo10Category: null,
                editStatus: 'pending'
            };
            addProduct(mockProduct);
            setParsedUrls(prev => prev.map(p =>
                p.id === id ? { ...p, status: 'completed', product: mockProduct } : p
            ));
        }
    };

    const handleEditClick = () => {
        setUrls([]);
        setCollectionStarted(false);
        const url = lastJobId ? `/editing?focusJobId=${lastJobId}` : '/editing';
        navigate(url);
    };

    const handleProviderClick = (e: React.MouseEvent, p: { name: string; url: string }) => {
        e.preventDefault();
        window.open(p.url, '_blank');
    };

    const [extInstalled, setExtInstalled] = useState(() => sessionStorage.getItem('ext_installed') === 'true');

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease', position: 'relative' }}>
            {/* 수집 프로그램 상태 콜아웃 */}
            {!collectionStarted && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: extInstalled ? colors.bg.info : colors.bg.faint,
                        border: `1px solid ${extInstalled ? colors.primaryLightBorder : colors.border.default}`,
                        borderRadius: radius.lg,
                        padding: `${spacing['3']} ${spacing['5']}`,
                        marginBottom: spacing['5'],
                        gap: spacing['4'],
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], flex: 1 }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: radius.full,
                            background: extInstalled ? colors.primaryLight : colors.bg.subtle,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            {extInstalled ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.text.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                            <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>
                                {extInstalled ? '수집 프로그램이 설치되어 있어요' : '수집 프로그램 미설치'}
                            </span>
                            <span style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.tertiary, lineHeight: font.lineHeight.normal }}>
                                {extInstalled
                                    ? '지원 쇼핑몰에서 상품을 둘러보면서 클릭 한 번으로 목록에 추가할 수 있어요'
                                    : '프로그램을 설치하면 URL 복사 없이 쇼핑몰에서 바로 상품을 담을 수 있어요'
                                }
                            </span>
                        </div>
                    </div>
                    {!extInstalled && (
                        <button
                            onClick={() => {
                                window.open('https://chromewebstore.google.com/', '_blank');
                                sessionStorage.setItem('ext_installed', 'true');
                                setExtInstalled(true);
                            }}
                            style={{
                                background: 'none', color: colors.text.tertiary,
                                border: 'none', padding: 0,
                                fontSize: font.size.sm, fontWeight: font.weight.semibold,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                textDecoration: 'none',
                            }}
                        >
                            + 설치하기
                        </button>
                    )}
                </div>
            )}

            {/* Input Area */}
            {!collectionStarted && (
                <div style={{ background: colors.bg.surface, borderRadius: radius.xl, border: `1px solid ${colors.border.default}`, padding: spacing['6'], marginBottom: spacing['6'], boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing['2'] }}>
                        <span style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.secondary }}>{`수집할 URL 목록 (최대 20개)`}</span>
                    </div>
                    <div
                        onClick={() => inputRef.current?.focus()}
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: spacing['2'],
                            padding: spacing['4'],
                            borderRadius: radius.lg,
                            border: `1px solid ${colors.border.light}`,
                            background: colors.bg.page,
                            minHeight: '160px',
                            alignItems: 'flex-start',
                            alignContent: 'flex-start',
                            cursor: 'text',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.primary)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = colors.border.light)}
                    >
                        {parsedUrls.map(p => (
                            <div key={p.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                borderRadius: radius.full,
                                background: colors.bg.surface,
                                border: `1px solid ${!p.error ? colors.border.default : colors.dangerLight}`,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}>
                                {!p.error ? (
                                    <>
                                        {p.provider && <img src={SOURCING_PROVIDERS.find(s => s.name === p.provider)?.logo} alt={p.provider} style={{ width: 16, height: 16, borderRadius: radius.xs }} />}
                                        <span style={{ color: colors.text.primary, fontSize: font.size.sm, fontWeight: font.weight.semibold, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</span>
                                        <CheckCircle2 size={14} color={colors.success} />
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={14} color={colors.danger} />
                                        <span style={{ color: colors.text.muted, fontSize: font.size.sm, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'line-through' }}>{p.url}</span>
                                        <span style={{ color: colors.danger, fontSize: font.size.xs, fontWeight: font.weight.semibold }}>{p.error}</span>
                                    </>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUrls(prev => prev.filter(u => u !== p.url));
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', marginLeft: '2px', display: 'flex', color: colors.text.muted, borderRadius: radius.full }}
                                    onMouseOver={(e) => e.currentTarget.style.background = colors.bg.subtle}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}

                        <input
                            ref={inputRef}
                            value={pendingInput}
                            onChange={e => setPendingInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    const urlRegex = /(https?:\/\/[^\s)]+)/g;
                                    const matches = pendingInput.match(urlRegex);
                                    if (matches && matches.length > 0) {
                                        setUrls(prev => {
                                            const combined = [...prev, ...matches];
                                            return Array.from(new Set(combined));
                                        });
                                    } else {
                                        const newUrl = pendingInput.trim();
                                        if (newUrl && !urls.includes(newUrl)) {
                                            setUrls(prev => [...prev, newUrl]);
                                        }
                                    }
                                    setPendingInput('');
                                } else if (e.key === 'Backspace' && !pendingInput && urls.length > 0) {
                                    setUrls(prev => prev.slice(0, -1));
                                }
                            }}
                            onBlur={() => {
                                const newUrl = pendingInput.trim();
                                if (newUrl && !urls.includes(newUrl)) {
                                    setUrls(prev => [...prev, newUrl]);
                                }
                                setPendingInput('');
                                if (inputRef.current?.parentElement) {
                                    inputRef.current.parentElement.style.borderColor = colors.border.light;
                                }
                            }}
                            onFocus={() => {
                                if (inputRef.current?.parentElement) {
                                    inputRef.current.parentElement.style.borderColor = colors.primary;
                                }
                            }}
                            onPaste={e => {
                                e.preventDefault();
                                const pastedText = e.clipboardData.getData('text');
                                const urlRegex = /(https?:\/\/[^\s)]+)/g;
                                const matches = pastedText.match(urlRegex);

                                if (matches && matches.length > 0) {
                                    setUrls(prev => {
                                        const combined = [...prev, ...matches];
                                        return Array.from(new Set(combined));
                                    });
                                } else {
                                    const newUrls = pastedText.split(/[\n\s]+/).map(s => s.trim()).filter(Boolean);
                                    if (newUrls.length > 0) {
                                        setUrls(prev => {
                                            const combined = [...prev, ...newUrls];
                                            return Array.from(new Set(combined));
                                        });
                                    }
                                }
                            }}
                            placeholder={urls.length === 0 ? "지원 쇼핑몰의 상품 URL만 붙여넣으면 모든 상품 정보를 가져와요. 여러 개도 한 번에 요청할 수 있어요." : ""}
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: font.size.md,
                                color: colors.text.primary,
                                fontFamily: 'Pretendard, -apple-system, sans-serif',
                                padding: '6px 4px'
                            }}
                        />
                    </div>

                    <div style={{ marginTop: spacing['6'], borderTop: `1px solid ${colors.border.default}`, paddingTop: spacing['4'] }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing['3'] }}>
                            <div style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.muted }}>
                                지원 쇼핑몰에서 찾아보세요
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing['3'] }}>
                            {SOURCING_PROVIDERS.map(p => (
                                <button
                                    key={p.name}
                                    onClick={(e) => handleProviderClick(e as any, p)}
                                    style={{
                                        border: `1px solid ${colors.border.default}`,
                                        background: colors.bg.page,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing['2'],
                                        padding: spacing['3'],
                                        borderRadius: radius.md,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        color: 'inherit',
                                        textAlign: 'left'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.background = colors.bg.subtle;
                                        e.currentTarget.style.borderColor = colors.border.light;
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.background = colors.bg.page;
                                        e.currentTarget.style.borderColor = colors.border.default;
                                    }}
                                >
                                    <img src={p.logo} alt={p.name} style={{ width: '24px', height: '24px', borderRadius: radius.xs }} />
                                    <span style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.secondary }}>{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!collectionStarted && (
                <button
                    ref={startButtonRef}
                    className="btn-primary"
                    disabled={validCount === 0}
                    onClick={handleStartCollection}
                    style={{ height: '56px', fontSize: font.size.base }}
                >
                    <Link2 size={20} />
                    총 {validCount}건 수집 시작하기
                </button>
            )}

            {/* Progress Area */}
            {collectionStarted && (
                <div style={{ background: colors.bg.surface, borderRadius: radius.xl, border: `1px solid ${colors.border.default}`, padding: spacing['8'], boxShadow: '0 4px 16px rgba(0,0,0,0.04)', animation: 'slideUp 0.4s ease' }}>

                    {/* Overall Progress */}
                    <div style={{ marginBottom: spacing['8'] }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['3'] }}>
                            <h2 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                                {isCollecting ? <Loader2 size={20} className="spin" color={colors.primary} /> : <CheckCircle2 size={20} color={colors.success} />}
                                {isCollecting ? '상품 정보를 수집하고 있어요' : '수집이 완료됐어요'}
                            </h2>
                            <span style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.primary }}>
                                {isAllCompleted && blockedCount > 0
                                    ? `${successCount}건 수집 완료, ${blockedCount}건 판매 중 제외`
                                    : `${completedCount} / ${parsedUrls.length}건 완료`
                                }
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: colors.bg.subtle, borderRadius: radius.xs, overflow: 'hidden' }}>
                            <div style={{
                                width: `${(completedCount / parsedUrls.length) * 100}%`,
                                height: '100%',
                                background: isAllCompleted && successCount === parsedUrls.length ? colors.success : colors.primary,
                                borderRadius: radius.xs,
                                transition: 'width 0.4s ease, background 0.4s ease'
                            }} />
                        </div>
                    </div>

                    {/* Item List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'], marginBottom: spacing['10'] }}>
                        {parsedUrls.map(item => (
                            <div
                                key={item.id}
                                ref={el => { itemRefs.current[item.id] = el; }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: spacing['4'],
                                    padding: spacing['4'],
                                    borderRadius: radius.lg,
                                    background: item.status === 'failed' ? colors.dangerBg : item.status === 'blocked' ? colors.bg.subtle : colors.bg.page,
                                    border: `1px solid ${item.status === 'failed' ? colors.dangerLight : colors.border.default}`,
                                    opacity: item.status === 'blocked' ? 0.75 : 1,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {/* Status Icon */}
                                <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                                    {item.status === 'idle' && <div style={{ width: '20px', height: '20px', borderRadius: radius.full, border: `2px solid ${colors.border.light}` }} />}
                                    {item.status === 'running' && <Loader2 size={20} color={colors.primary} className="spin" />}
                                    {item.status === 'completed' && (
                                        <div style={{ width: 20, height: 20, borderRadius: radius.full, border: `1.5px solid ${colors.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                    {item.status === 'failed' && <XCircle size={20} color={colors.danger} />}
                                    {item.status === 'blocked' && (
                                        <div style={{ width: 20, height: 20, borderRadius: radius.full, border: `1.5px solid ${colors.text.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg.subtle }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.text.muted} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                                        {item.provider && <img src={SOURCING_PROVIDERS.find(p => p.name === item.provider)?.logo} alt={item.provider} style={{ width: '20px', height: '20px', borderRadius: radius.full, objectFit: 'cover' }} />}
                                        <div style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.product ?
                                                <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>
                                                    {item.product.title}
                                                </a>
                                                : item.url}
                                        </div>
                                    </div>

                                    {item.product ? (() => {
                                        return (
                                            <div style={{ fontSize: font.size.sm, color: colors.text.secondary, display: 'flex', flexDirection: 'column', gap: spacing['1'] }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                                                    <span style={{ color: colors.text.muted }}>원가</span>
                                                    <span style={{ fontWeight: font.weight.semibold }}>₩{item.product.originalPriceKrw.toLocaleString()}</span>
                                                    <span style={{ color: colors.border.default, margin: '0 4px' }}>|</span>
                                                    <span style={{ color: colors.text.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{item.url}</span>
                                                </div>
                                                {item.status === 'blocked' && (
                                                    <span style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.muted }}>
                                                        이미 판매 중인 상품입니다
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })() : (
                                        <>
                                            {item.error && (
                                                <div style={{ fontSize: font.size.sm, color: colors.danger, marginTop: spacing['1'], display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                                                    {item.error}
                                                    <button onClick={() => handleRetry(item.id)} style={{ background: 'none', border: 'none', color: colors.danger, fontWeight: font.weight.semibold, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>재시도</button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {item.status === 'idle' && !item.error && <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: spacing['1'] }}>대기 중...</div>}
                                    {item.status === 'running' && <div style={{ fontSize: font.size.sm, color: colors.primary, marginTop: spacing['1'] }}>정보를 가져오고 있어요...</div>}
                                </div>

                                {/* Thumbnail Preview */}
                                {item.product && (
                                    <div style={{ width: '48px', height: '48px', borderRadius: radius.md, border: `1px solid ${colors.border.default}`, backgroundColor: colors.bg.subtle, flexShrink: 0 }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Result Actions */}
                    {isAllCompleted && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'], animation: 'fadeInUp 0.4s ease' }}>
                            {successCount > 0 && (
                                <button className="btn-primary" onClick={handleEditClick} style={{ width: '100%', padding: spacing['4'], fontSize: font.size.base }}>
                                    수집된 상품 확인하기 <ArrowRight size={18} />
                                </button>
                            )}
                            <button className="btn-google" onClick={() => { setCollectionStarted(false); setUrls([]); }} style={{ width: '100%', background: colors.bg.subtle, border: 'none', padding: spacing['4'], fontSize: font.size.base }}>
                                추가 수집하기
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style>{`
            @keyframes spinner {
                to { transform: rotate(360deg); }
            }
            .spinner {
                animation: spinner 1s linear infinite;
                transform-origin: center center;
            }
            `}</style>
        </div>
    );
};
