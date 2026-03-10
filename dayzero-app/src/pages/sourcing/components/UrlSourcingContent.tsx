import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SOURCING_PROVIDERS, MOCK_URL_TO_PROVIDER } from '../../../types/sourcing';
import type { SourcingProvider, SourcedProduct } from '../../../types/sourcing';
import { useSourcingStore } from '../../../store/useSourcingStore';
import { Link2, AlertCircle, Loader2, CheckCircle2, XCircle, ArrowRight, X } from 'lucide-react';
import { useOnboarding } from '../../../components/onboarding/OnboardingContext';

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

    const setUrls = (updater: import('react').SetStateAction<string[]>) => {
        const current = useSourcingStore.getState().urlSourcing.urls;
        setUrlSourcing({ urls: typeof updater === 'function' ? (updater as any)(current) : updater });
    };
    const setParsedUrls = (updater: import('react').SetStateAction<ParsedUrl[]>) => {
        const current = useSourcingStore.getState().urlSourcing.parsedUrls;
        setUrlSourcing({ parsedUrls: typeof updater === 'function' ? (updater as any)(current) : updater });
    };
    const setIsCollecting = (b: boolean) => setUrlSourcing({ isCollecting: b });
    const setCollectionStarted = (b: boolean) => setUrlSourcing({ collectionStarted: b });

    const [pendingInput, setPendingInput] = useState('');
    const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const startButtonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Parse URLs on input change
    useEffect(() => {
        if (collectionStarted) return;

        const newParsed: ParsedUrl[] = urls.map((url, index) => {
            const provider = MOCK_URL_TO_PROVIDER(url);
            return {
                id: `url-${index}`,
                url,
                provider,
                status: 'idle',
                error: !url.startsWith('http') ? '올바른 URL을 입력해주세요'
                    : !provider ? '지원하지 않는 소싱처예요'
                        : undefined
            };
        });

        setParsedUrls(newParsed);
    }, [urls, collectionStarted]);

    const validCount = parsedUrls.filter(p => p.provider && !p.error).length;
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

        setCollectionStarted(true);
        setIsCollecting(true);

        const urlsSnapshot = parsedUrls;
        let successProcessed = 0;

        for (let i = 0; i < urlsSnapshot.length; i++) {
            const current = urlsSnapshot[i];
            if (current.error) continue;

            setParsedUrls(prev => prev.map(p => p.id === current.id ? { ...p, status: 'running' } : p));

            await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 2500));

            let isSuccess = Math.random() > 0.1;
            const currentStoreState = useSourcingStore.getState().urlSourcing;

            if (!isSuccess && currentStoreState.hasFailedOnce) {
                isSuccess = true;
            } else if (!isSuccess) {
                setUrlSourcing({ hasFailedOnce: true });
            }

            if (isSuccess && current.provider) {
                const kpopProviders = ['알라딘', 'Ktown4u', '케이타운포유', 'YES24', '메이크스타', '위버스샵', 'Weverse Shop', 'FANS', '팬스'];
                const isKpop = kpopProviders.some(p => current.provider?.toLowerCase().includes(p.toLowerCase()));

                const kpopTitles = [
                    '[예약판매] 뉴진스 (NewJeans) - 2nd EP [Get Up] (Bunny Beach Bag ver.)',
                    '세븐틴 (SEVENTEEN) - 10th Mini Album [FML] (일반반)',
                    '르세라핌 (LE SSERAFIM) - 1st Studio Album [UNFORGIVEN] (Weverse Albums ver.)',
                    '스트레이 키즈 (Stray Kids) - 5-STAR (Limited Edition)',
                    '에스파 (aespa) - 3rd Mini Album [MY WORLD] (Poster ver.)'
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
                    jobId: 'manual-url-job',
                    provider: current.provider,
                    title: realTitle,
                    thumbnailUrl: '', // 더미 데이터이므로 UI에서 배경색으로 대체
                    originalPriceKrw: orgPrice,
                    optionCount: Math.floor(Math.random() * 5),
                    sourceUrl: current.url,
                    translationStatus: 'pending',
                    qoo10Category: null,
                    editStatus: 'pending'
                };

                addProduct(mockProduct);
                setParsedUrls(prev => prev.map(p =>
                    p.id === current.id ? { ...p, status: 'completed', product: mockProduct } : p
                ));

                successProcessed++;
            } else {
                setParsedUrls(prev => prev.map(p =>
                    p.id === current.id ? { ...p, status: 'failed', error: '소싱처 접속이 일시적으로 불안정해요. 잠시 후 재시도해보세요' } : p
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
        if (current && current.provider) {
            const mockProduct: SourcedProduct = {
                id: `prod-retry-${Date.now()}`,
                jobId: 'manual-url-job',
                provider: current.provider,
                title: `${current.provider} 재시도 상품`,
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
        navigate('/edit'); // Placeholder for navigation to editing page
    };

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '16px', marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Link2 size={20} color="#3182F6" style={{ marginTop: '2px' }} />
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#191F28', marginBottom: '4px' }}>URL 수집이란?</h3>
                    <p style={{ fontSize: '14px', color: '#4E5968', lineHeight: '1.5' }}>
                        원하는 특정 상품의 상세 페이지 주소(URL)를 직접 입력하여 리스트 형태로 수집하는 기능이에요. 주소를 입력하고 엔터(Enter)나 스페이스바를 누르거나, 여러 개의 주소를 한 번에 붙여넣기 하여 최대 20개까지 추가할 수 있어요.
                    </p>
                </div>
            </div>

            {/* Input Area */}
            {!collectionStarted && (
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E8EB', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#4E5968' }}>수집할 URL 목록 ({urls.length}/20)</span>
                    </div>
                    <div
                        onClick={() => inputRef.current?.focus()}
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid #D1D6DB',
                            background: '#F9FAFB',
                            minHeight: '160px',
                            alignItems: 'flex-start',
                            alignContent: 'flex-start',
                            cursor: 'text',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#3182F6')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D6DB')}
                    >
                        {parsedUrls.map(p => (
                            <div key={p.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                borderRadius: '20px',
                                background: '#FFFFFF',
                                border: `1px solid ${p.provider ? '#E5E8EB' : '#FDE2E4'}`,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}>
                                {p.provider ? (
                                    <>
                                        <img src={SOURCING_PROVIDERS.find(s => s.name === p.provider)?.logo} alt={p.provider} style={{ width: 16, height: 16, borderRadius: 4 }} />
                                        <span style={{ color: '#191F28', fontSize: '13px', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</span>
                                        <CheckCircle2 size={14} color="#00C853" />
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={14} color="#F04452" />
                                        <span style={{ color: '#8B95A1', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'line-through' }}>{p.url}</span>
                                        <span style={{ color: '#F04452', fontSize: '12px', fontWeight: 600 }}>{p.error}</span>
                                    </>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUrls(prev => prev.filter(u => u !== p.url));
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', marginLeft: '2px', display: 'flex', color: '#8B95A1', borderRadius: '50%' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#F2F4F6'}
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
                                    inputRef.current.parentElement.style.borderColor = '#D1D6DB';
                                }
                            }}
                            onFocus={() => {
                                if (inputRef.current?.parentElement) {
                                    inputRef.current.parentElement.style.borderColor = '#3182F6';
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
                            placeholder={urls.length === 0 ? "상품 URL을 입력하고 엔터(줄바꿈)를 누르세요" : ""}
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: '14px',
                                color: '#191F28',
                                fontFamily: 'Pretendard, -apple-system, sans-serif',
                                padding: '6px 4px'
                            }}
                            disabled={urls.length >= 20}
                        />
                    </div>

                    {/* Supported Providers Grid: Always Open */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid #E5E8EB', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#8B95A1', marginBottom: '12px' }}>
                            지원 소싱처
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            {SOURCING_PROVIDERS.map(p => (
                                <a
                                    key={p.name}
                                    href={p.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px',
                                        background: '#F9FAFB',
                                        borderRadius: '8px',
                                        border: '1px solid #E5E8EB',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        color: 'inherit'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.background = '#F2F4F6';
                                        e.currentTarget.style.borderColor = '#D1D6DB';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.background = '#F9FAFB';
                                        e.currentTarget.style.borderColor = '#E5E8EB';
                                    }}
                                >
                                    <img src={p.logo} alt={p.name} style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#4E5968' }}>{p.name}</span>
                                </a>
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
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E8EB', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', animation: 'slideUp 0.4s ease' }}>

                    {/* Overall Progress */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#191F28', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isCollecting ? <Loader2 size={20} className="spin" color="#3182F6" /> : <CheckCircle2 size={20} color="#00C853" />}
                                {isCollecting ? '상품 정보를 수집하고 있어요' : '수집이 완료됐어요'}
                            </h2>
                            <span style={{ fontSize: '15px', fontWeight: 600, color: '#3182F6' }}>
                                {completedCount} / {parsedUrls.length}건 완료
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#F2F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(completedCount / parsedUrls.length) * 100}%`,
                                height: '100%',
                                background: isAllCompleted && successCount === parsedUrls.length ? '#00C853' : '#3182F6',
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
                                    background: item.status === 'failed' ? '#FEF0F1' : '#F9FAFB',
                                    border: `1px solid ${item.status === 'failed' ? '#FDE2E4' : '#E5E8EB'}`,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {/* Status Icon */}
                                <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                                    {item.status === 'idle' && <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #D1D6DB' }} />}
                                    {item.status === 'running' && <Loader2 size={20} color="#3182F6" className="spin" />}
                                    {item.status === 'completed' && (
                                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #00C853', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                    {item.status === 'failed' && <XCircle size={20} color="#F04452" />}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>

                                    {/* Product Title or Provider Name (if completed) vs URL (if not completed) */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {item.provider && <img src={SOURCING_PROVIDERS.find(p => p.name === item.provider)?.logo} alt={item.provider} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />}
                                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#191F28', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.product ?
                                                <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>
                                                    {item.product.title}
                                                </a>
                                                : item.url}
                                        </div>
                                    </div>

                                    {/* URL or Price details */}
                                    {item.product ? (() => {
                                        const margin = onboardingState.marginType === '%'
                                            ? Math.round(item.product.originalPriceKrw * (onboardingState.marginValue / 100))
                                            : onboardingState.marginValue;
                                        const krw = item.product.originalPriceKrw + margin + onboardingState.domesticShipping + onboardingState.prepCost;
                                        const finalJpy = Math.round(krw / 9.2) + onboardingState.intlShipping;

                                        return (
                                            <div style={{ fontSize: '13px', color: '#4E5968', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#8B95A1' }}>원가</span>
                                                <span style={{ fontWeight: 600 }}>₩{item.product.originalPriceKrw.toLocaleString()}</span>
                                                <span style={{ color: '#E5E8EB', margin: '0 4px' }}>|</span>
                                                <span style={{ color: '#8B95A1' }}>예상 판매가</span>
                                                <span style={{ fontWeight: 600, color: '#3182F6' }}>¥{finalJpy.toLocaleString()}</span>
                                                <span style={{ color: '#E5E8EB', margin: '0 4px' }}>|</span>
                                                <span style={{ color: '#8B95A1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{item.url}</span>
                                            </div>
                                        );
                                    })() : (
                                        <>
                                            {item.error && (
                                                <div style={{ fontSize: '13px', color: '#F04452', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {item.error}
                                                    <button onClick={() => handleRetry(item.id)} style={{ background: 'none', border: 'none', color: '#F04452', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>재시도</button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {item.status === 'idle' && !item.error && <div style={{ fontSize: '13px', color: '#8B95A1', marginTop: '4px' }}>대기 중...</div>}
                                    {item.status === 'running' && <div style={{ fontSize: '13px', color: '#3182F6', marginTop: '4px' }}>정보를 가져오고 있어요...</div>}
                                </div>

                                {/* Thumbnail Preview */}
                                {item.product && (
                                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', border: '1px solid #E5E8EB', backgroundColor: '#F2F4F6', flexShrink: 0 }} />
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
                            <button className="btn-google" onClick={() => { setCollectionStarted(false); setUrls([]); }} style={{ width: '100%', background: '#F2F4F6', border: 'none', padding: '16px', fontSize: '15px' }}>
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
