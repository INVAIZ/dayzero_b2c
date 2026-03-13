import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SOURCING_PROVIDERS, MOCK_URL_TO_PROVIDER } from '../../../types/sourcing';
import type { SourcingProvider, SourcedProduct } from '../../../types/sourcing';
import { useSourcingStore } from '../../../store/useSourcingStore';
import { useEditingStore } from '../../../store/useEditingStore';

import { Link2, AlertCircle, Loader2, CheckCircle2, XCircle, ArrowRight, X } from 'lucide-react';
import { useOnboarding } from '../../../components/onboarding/OnboardingContext';
import { colors } from '../../../design/tokens';

interface ParsedUrl {
    id: string;
    url: string;
    provider: SourcingProvider | null;
    status: 'idle' | 'running' | 'completed' | 'failed';
    error?: string;
    product?: SourcedProduct;
}

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

    // Use urls.length instead of parsedUrls since parsedUrls might not update instantly, or just check parsing correctly. Wait, parsedUrls length is already derived from urls.
    const validCount = parsedUrls.filter(p => !p.error).length;
    const completedCount = parsedUrls.filter(p => p.status === 'completed' || p.status === 'failed').length;
    const isAllCompleted = collectionStarted && completedCount === parsedUrls.length;
    const successCount = parsedUrls.filter(p => p.status === 'completed').length;

    const handleStartCollection = async () => {
        if (validCount === 0) return;

        const notifId = `notif-url-${Date.now()}`;
        addNotification({
            id: notifId,
            type: 'url',
            title: `URL 수집 (${validCount}건)`,
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

        for (let i = 0; i < urlsSnapshot.length; i++) {
            const current = urlsSnapshot[i];
            if (current.error) continue;

            setParsedUrls(prev => prev.map(p => p.id === current.id ? { ...p, status: 'running' } : p));

            await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 2500));

            let isProductUrl = true;
            try {
                const urlObj = new URL(current.url);
                if (urlObj.pathname === '/' || urlObj.pathname === '') {
                    isProductUrl = false;
                }
            } catch (e) {
                isProductUrl = false;
            }

            let isSuccess = isProductUrl;

            if (isSuccess) {
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
                const kpopTitlesJa = [
                    '【予約販売】NewJeans - 2nd EP [Get Up] (Bunny Beach Bag ver.)',
                    'SEVENTEEN - 10th ミニアルバム [FML] (通常版)',
                    'LE SSERAFIM - 1st スタジオアルバム [UNFORGIVEN] (Weverse Albums ver.)',
                    'Stray Kids - 5-STAR (Limited Edition)',
                    'aespa - 3rd ミニアルバム [MY WORLD] (ポスター版)',
                    'LE SSERAFIM - 3rd ミニアルバム [EASY] (Weverse Albums ver.)',
                ];
                const generalTitles = [
                    '[단독기획] 닥터지 레드 블레미쉬 클리어 수딩 크림 70ml+30ml 세트',
                    '일리윤 세라마이드 아토 집중 크림 200ml 탑퍼 기획',
                    '[NEW/2026년까지] 라네즈 네오 쿠션 매트 15g 본품+리필',
                    '코스알엑스 패드 3종 비교 기획세트 (오리지널/모이스쳐/포어리스)',
                    '클리오 킬커버 더뉴 파운웨어 쿠션 (본품+리필+퍼프2매)',
                ];
                const generalTitlesJa = [
                    '【独占企画】Dr.G レッドブレミッシュ クリア スージングクリーム 70ml+30ml セット',
                    'illiyoon セラミドアト 集中クリーム 200ml トッパー企画セット',
                    '【NEW/2026年まで】LANEIGE ネオクッション マット 15g 本品+リフィル',
                    'COSRX パッド 3種 比較企画セット (オリジナル/モイスチャー/ポアレス)',
                    'CLIO キルカバー ザニュー ファウンウェアクッション (本品+リフィル+パフ2枚)',
                ];

                const realisticTitles = isKpop ? kpopTitles : generalTitles;
                const realisticTitlesJa = isKpop ? kpopTitlesJa : generalTitlesJa;
                const realTitle = realisticTitles[i % realisticTitles.length];
                const realTitleJa = realisticTitlesJa[i % realisticTitlesJa.length];
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

                // Realistic category mapping
                const providerName = typeof current.provider === 'string' ? current.provider : (current.provider as any)?.name || '기타';
                let catId = '100000001';
                let catPath = '뷰티 > 스킨케어 > 크림';

                if (isKpop || providerName.includes('알라딘') || providerName.includes('케이타운') || providerName.includes('Weverse')) {
                    catId = '200000001';
                    catPath = '엔터테인먼트 > 음반 > K-POP';
                } else if (providerName.includes('쿠팡') || providerName.includes('다이소')) {
                    catId = '300000001';
                    catPath = '생활용품 > 세제/세정 > 주방세제';
                }

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
                    const optSet = catPath.includes('생활용품') ? dailyOptions : beautyOptions;
                    const chosen = optSet[i % optSet.length];
                    return chosen.map((o, vi) => ({
                        id: `opt-${pid}-${vi}`, nameKo: o.nameKo, nameJa: null, stock: o.stock,
                    }));
                };

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
                    provider: mockProduct.provider,
                    sourceUrl: mockProduct.sourceUrl,
                    thumbnailUrl: mockProduct.thumbnailUrl,
                    originalPriceKrw: mockProduct.originalPriceKrw,
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
                });

                addProduct(mockProduct);
                setParsedUrls(prev => prev.map(p =>
                    p.id === current.id ? { ...p, status: 'completed', product: mockProduct } : p
                ));

                successProcessed++;
            } else {
                setParsedUrls(prev => prev.map(p =>
                    p.id === current.id ? { ...p, status: 'failed', error: '제품의 상세 페이지 주소가 아닐 수 있어요. 상세 페이지에서 URL을 다시 복사해주세요.' } : p
                ));
            }

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

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease', position: 'relative' }}>
            {/* Info Callout */}
            <div style={{ background: colors.bg.faint, borderRadius: '12px', padding: '16px', marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Link2 size={16} color={colors.primary} style={{ marginTop: '3px', flexShrink: 0 }} />
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: colors.text.primary, marginBottom: '4px' }}>URL 수집이란?</h3>
                    <p style={{ fontSize: '14px', color: colors.text.secondary, lineHeight: '1.5' }}>
                        원하는 특정 상품의 상세 페이지 주소(URL)를 직접 입력하여 리스트 형태로 수집하는 기능이에요. 주소를 입력하고 엔터(Enter)나 스페이스바를 누르거나, 여러 개의 주소를 한 번에 붙여넣기 하여 최대 20개까지 추가할 수 있어요.
                    </p>
                </div>
            </div>

            {/* Input Area */}
            {!collectionStarted && (
                <div style={{ background: colors.bg.surface, borderRadius: '16px', border: `1px solid ${colors.border.default}`, padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text.secondary }}>수집할 URL 목록 ({urls.length}/20)</span>
                    </div>
                    <div
                        onClick={() => inputRef.current?.focus()}
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            padding: '16px',
                            borderRadius: '12px',
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
                                borderRadius: '20px',
                                background: colors.bg.surface,
                                border: `1px solid ${!p.error ? colors.border.default : colors.dangerLight}`,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}>
                                {!p.error ? (
                                    <>
                                        {p.provider && <img src={SOURCING_PROVIDERS.find(s => s.name === p.provider)?.logo} alt={p.provider} style={{ width: 16, height: 16, borderRadius: 4 }} />}
                                        <span style={{ color: colors.text.primary, fontSize: '13px', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</span>
                                        <CheckCircle2 size={14} color={colors.success} />
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={14} color={colors.danger} />
                                        <span style={{ color: colors.text.muted, fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'line-through' }}>{p.url}</span>
                                        <span style={{ color: colors.danger, fontSize: '12px', fontWeight: 600 }}>{p.error}</span>
                                    </>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUrls(prev => prev.filter(u => u !== p.url));
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', marginLeft: '2px', display: 'flex', color: colors.text.muted, borderRadius: '50%' }}
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
                                            return Array.from(new Set(combined)).slice(0, 20);
                                        });
                                    } else {
                                        const newUrl = pendingInput.trim();
                                        if (newUrl && !urls.includes(newUrl)) {
                                            if (urls.length < 20) {
                                                setUrls(prev => [...prev, newUrl]);
                                            }
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
                                    if (urls.length < 20) {
                                        setUrls(prev => [...prev, newUrl]);
                                    }
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
                                        return Array.from(new Set(combined)).slice(0, 20);
                                    });
                                } else {
                                    const newUrls = pastedText.split(/[\n\s]+/).map(s => s.trim()).filter(Boolean);
                                    if (newUrls.length > 0) {
                                        setUrls(prev => {
                                            const combined = [...prev, ...newUrls];
                                            return Array.from(new Set(combined)).slice(0, 20);
                                        });
                                    }
                                }
                            }}
                            placeholder={urls.length === 0 ? "지원 소싱처의 상품 URL을 입력하고 엔터 및 스페이스 바를 누르세요" : ""}
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: '14px',
                                color: colors.text.primary,
                                fontFamily: 'Pretendard, -apple-system, sans-serif',
                                padding: '6px 4px'
                            }}
                            disabled={urls.length >= 20}
                        />
                    </div>

                    <div style={{ marginTop: '24px', borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text.muted }}>
                                지원 소싱처에서 찾아보세요
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            {SOURCING_PROVIDERS.map(p => (
                                <button
                                    key={p.name}
                                    onClick={(e) => handleProviderClick(e as any, p)}
                                    style={{
                                        border: `1px solid ${colors.border.default}`,
                                        background: colors.bg.page,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px',
                                        borderRadius: '8px',
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
                                    <img src={p.logo} alt={p.name} style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text.secondary }}>{p.name}</span>
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
                    style={{ height: '56px', fontSize: '16px' }}
                >
                    <Link2 size={20} />
                    총 {validCount}건 수집 시작하기
                </button>
            )}

            {/* Progress Area */}
            {collectionStarted && (
                <div style={{ background: colors.bg.surface, borderRadius: '16px', border: `1px solid ${colors.border.default}`, padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', animation: 'slideUp 0.4s ease' }}>

                    {/* Overall Progress */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.text.primary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isCollecting ? <Loader2 size={20} className="spin" color={colors.primary} /> : <CheckCircle2 size={20} color={colors.success} />}
                                {isCollecting ? '상품 정보를 수집하고 있어요' : '수집이 완료됐어요'}
                            </h2>
                            <span style={{ fontSize: '15px', fontWeight: 600, color: colors.primary }}>
                                {completedCount} / {parsedUrls.length}건 완료
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: colors.bg.subtle, borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(completedCount / parsedUrls.length) * 100}%`,
                                height: '100%',
                                background: isAllCompleted && successCount === parsedUrls.length ? colors.success : colors.primary,
                                borderRadius: '4px',
                                transition: 'width 0.4s ease, background 0.4s ease'
                            }} />
                        </div>
                    </div>

                    {/* Item List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                        {parsedUrls.map(item => (
                            <div
                                key={item.id}
                                ref={el => { itemRefs.current[item.id] = el; }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '16px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: item.status === 'failed' ? colors.dangerBg : colors.bg.page,
                                    border: `1px solid ${item.status === 'failed' ? colors.dangerLight : colors.border.default}`,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {/* Status Icon */}
                                <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                                    {item.status === 'idle' && <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${colors.border.light}` }} />}
                                    {item.status === 'running' && <Loader2 size={20} color={colors.primary} className="spin" />}
                                    {item.status === 'completed' && (
                                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${colors.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                    {item.status === 'failed' && <XCircle size={20} color={colors.danger} />}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {item.provider && <img src={SOURCING_PROVIDERS.find(p => p.name === item.provider)?.logo} alt={item.provider} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />}
                                        <div style={{ fontSize: '15px', fontWeight: 600, color: colors.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.product ?
                                                <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>
                                                    {item.product.title}
                                                </a>
                                                : item.url}
                                        </div>
                                    </div>

                                    {item.product ? (() => {
                                        return (
                                            <div style={{ fontSize: '13px', color: colors.text.secondary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: colors.text.muted }}>원가</span>
                                                <span style={{ fontWeight: 600 }}>₩{item.product.originalPriceKrw.toLocaleString()}</span>
                                                <span style={{ color: colors.border.default, margin: '0 4px' }}>|</span>
                                                <span style={{ color: colors.text.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{item.url}</span>
                                            </div>
                                        );
                                    })() : (
                                        <>
                                            {item.error && (
                                                <div style={{ fontSize: '13px', color: colors.danger, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {item.error}
                                                    <button onClick={() => handleRetry(item.id)} style={{ background: 'none', border: 'none', color: colors.danger, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>재시도</button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {item.status === 'idle' && !item.error && <div style={{ fontSize: '13px', color: colors.text.muted, marginTop: '4px' }}>대기 중...</div>}
                                    {item.status === 'running' && <div style={{ fontSize: '13px', color: colors.primary, marginTop: '4px' }}>정보를 가져오고 있어요...</div>}
                                </div>

                                {/* Thumbnail Preview */}
                                {item.product && (
                                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, backgroundColor: colors.bg.subtle, flexShrink: 0 }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Result Actions */}
                    {isAllCompleted && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeInUp 0.4s ease' }}>
                            {successCount > 0 && (
                                <button className="btn-primary" onClick={handleEditClick} style={{ width: '100%', padding: '16px', fontSize: '15px' }}>
                                    수집된 상품 확인하기 <ArrowRight size={18} />
                                </button>
                            )}
                            <button className="btn-google" onClick={() => { setCollectionStarted(false); setUrls([]); }} style={{ width: '100%', background: colors.bg.subtle, border: 'none', padding: '16px', fontSize: '15px' }}>
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
