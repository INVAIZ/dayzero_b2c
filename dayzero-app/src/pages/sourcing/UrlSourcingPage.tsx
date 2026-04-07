import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { SOURCING_PROVIDERS, MOCK_URL_TO_PROVIDER } from '../../types/sourcing';
import type { SourcingProvider, SourcedProduct } from '../../types/sourcing';
import { useSourcingStore } from '../../store/useSourcingStore';
import { Link2, ChevronDown, ChevronUp, AlertCircle, Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { colors, font, radius, spacing } from '../../design/tokens';

interface ParsedUrl {
    id: string;
    url: string;
    provider: SourcingProvider | null;
    status: 'idle' | 'running' | 'completed' | 'failed';
    error?: string;
    product?: SourcedProduct;
}

export default function UrlSourcingPage() {
    const navigate = useNavigate();
    const { addJob, addProduct, addNotification, updateNotification, triggerParticle } = useSourcingStore();

    const [inputValue, setInputValue] = useState('');
    const [parsedUrls, setParsedUrls] = useState<ParsedUrl[]>([]);
    const [showProviders, setShowProviders] = useState(false);
    const [isCollecting, setIsCollecting] = useState(false);
    const [collectionStarted, setCollectionStarted] = useState(false);
    const [showEditToast, setShowEditToast] = useState(false);
    const startButtonRef = useRef<HTMLButtonElement>(null);

    // Parse URLs on input change
    useEffect(() => {
        if (collectionStarted) return;

        const urls = inputValue.split('\n').map(s => s.trim()).filter(s => s);
        const uniqueUrls = Array.from(new Set(urls));

        const newParsed: ParsedUrl[] = uniqueUrls.slice(0, 20).map((url, index) => {
            const provider = MOCK_URL_TO_PROVIDER(url);
            return {
                id: `url-${index}`,
                url,
                provider,
                status: 'idle',
                error: !url.startsWith('http') ? '올바른 URL을 입력해주세요'
                    : !provider ? '지원하지 않는 쇼핑몰이에요. 올리브영·쿠팡·다이소 URL을 사용해주세요.'
                        : undefined
            };
        });

        setParsedUrls(newParsed);
    }, [inputValue, collectionStarted]);

    const validCount = parsedUrls.filter(p => p.provider && !p.error).length;
    const completedCount = parsedUrls.filter(p => p.status === 'completed' || p.status === 'failed').length;
    const isAllCompleted = collectionStarted && completedCount === parsedUrls.length;
    const successCount = parsedUrls.filter(p => p.status === 'completed').length;

    const handleStartCollection = async () => {
        if (validCount === 0) return;

        // Trigger particle animation from the start button
        if (startButtonRef.current) {
            const rect = startButtonRef.current.getBoundingClientRect();
            triggerParticle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        }

        // Add notification
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

        setCollectionStarted(true);
        setIsCollecting(true);

        const urlsSnapshot = parsedUrls;
        let successProcessed = 0;

        for (let i = 0; i < urlsSnapshot.length; i++) {
            const current = urlsSnapshot[i];
            if (current.error) continue;

            setParsedUrls(prev => prev.map(p => p.id === current.id ? { ...p, status: 'running' } : p));

            await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

            const isSuccess = Math.random() > 0.2;

            if (isSuccess && current.provider) {
                const mockProduct: SourcedProduct = {
                    id: `prod-${Date.now()}-${i}`,
                    jobId: 'manual-url-job',
                    provider: current.provider,
                    title: `${current.provider} 테스트 상품 ${i + 1}`,
                    thumbnailUrl: 'https://via.placeholder.com/150/F5F6F8/8B95A1?text=Product',
                    originalPriceKrw: Math.floor(Math.random() * 50000) + 10000,
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
                    p.id === current.id ? { ...p, status: 'failed', error: '쇼핑몰 접속이 일시적으로 불안정해요. 잠시 후 재시도해보세요' } : p
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
        if (current && current.provider) {
            const mockProduct: SourcedProduct = {
                // eslint-disable-next-line react-hooks/purity
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
        setShowEditToast(true);
        setTimeout(() => setShowEditToast(false), 2000);
    };

    return (
        <MainLayout>
            <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', paddingBottom: '100px', animation: 'fadeInUp 0.4s ease' }}>
                <button
                    onClick={() => navigate('/sourcing')}
                    style={{ background: 'none', border: 'none', color: colors.text.muted, fontSize: font.size.md, fontWeight: font.weight.semibold, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
                >
                    ← 수집 홈으로
                </button>

                <h1 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary, marginBottom: '8px' }}>
                    직접 수집
                </h1>
                <p style={{ fontSize: font.size.base, color: colors.text.tertiary, marginBottom: '32px' }}>
                    수집하려는 상품의 URL을 입력하세요. 줄바꿈으로 최대 20개까지 한 번에 수집할 수 있어요.
                </p>

                {/* Input Area */}
                {!collectionStarted && (
                    <div style={{ background: colors.bg.surface, borderRadius: radius.xl, border: `1px solid ${colors.border.default}`, padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={'쇼핑몰 상품 URL을 입력하세요 (줄바꿈으로 여러 개 입력 가능)\n예) https://www.oliveyoung.co.kr/store/...'}
                                    style={{
                                        width: '100%',
                                        minHeight: '160px',
                                        padding: '16px',
                                        borderRadius: radius.lg,
                                        border: `1px solid ${colors.border.light}`,
                                        background: colors.bg.page,
                                        fontSize: font.size.base,
                                        lineHeight: '1.6',
                                        color: colors.text.primary,
                                        fontFamily: 'Pretendard, -apple-system, sans-serif',
                                        resize: 'vertical',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                                    onBlur={(e) => (e.target.style.borderColor = colors.border.light)}
                                />
                            </div>

                            {/* Live Validation Panel */}
                            {parsedUrls.length > 0 && (
                                <div style={{ width: '280px', background: colors.bg.subtle, borderRadius: radius.lg, padding: '16px', maxHeight: '160px', overflowY: 'auto' }}>
                                    <h3 style={{ fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.text.secondary, marginBottom: '12px' }}>입력 확인 ({parsedUrls.length}/20)</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {parsedUrls.map(p => (
                                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: font.size.sm }}>
                                                {p.provider ? (
                                                    <>
                                                        <CheckCircle2 size={14} color={colors.success} />
                                                        <span style={{ color: colors.text.primary, fontWeight: font.weight.semibold }}>{p.provider}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle size={14} color={colors.danger} />
                                                        <span style={{ color: colors.danger }}>지원하지 않는 URL</span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Supported Providers Accordion */}
                        <div style={{ marginTop: '24px', borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px' }}>
                            <button
                                onClick={() => setShowProviders(!showProviders)}
                                style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.secondary, cursor: 'pointer', padding: 0 }}
                            >
                                지원 쇼핑몰 보기 {showProviders ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {showProviders && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px', animation: 'fadeIn 0.2s ease' }}>
                                    {SOURCING_PROVIDERS.map(p => (
                                        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: colors.bg.page, borderRadius: radius.md, border: `1px solid ${colors.border.default}` }}>
                                            <img src={p.logo} alt={p.name} style={{ width: '24px', height: '24px', borderRadius: radius.xs }} />
                                            <span style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.secondary }}>{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!collectionStarted && (
                    <button
                        ref={startButtonRef}
                        className="btn-primary"
                        disabled={validCount === 0}
                        onClick={handleStartCollection}
                        style={{ height: '56px', fontSize: font.size['base+'] }}
                    >
                        <Link2 size={20} />
                        총 {validCount}건 수집 시작하기
                    </button>
                )}

                {/* Progress Area */}
                {collectionStarted && (
                    <div style={{ background: colors.bg.surface, borderRadius: radius.xl, border: `1px solid ${colors.border.default}`, padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', animation: 'slideUp 0.4s ease' }}>

                        {/* Overall Progress */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h2 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isCollecting ? <Loader2 size={20} className="spinner" color={colors.primary} /> : <CheckCircle2 size={20} color={colors.success} />}
                                    {isCollecting ? '상품 정보를 수집하고 있어요' : '수집이 완료됐어요'}
                                </h2>
                                <span style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.primary }}>
                                    {completedCount} / {parsedUrls.length}건 완료
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                            {parsedUrls.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', borderRadius: radius.lg, background: item.status === 'failed' ? colors.dangerBg : colors.bg.page, border: `1px solid ${item.status === 'failed' ? colors.dangerLight : colors.border.default}` }}>
                                    {/* Status Icon */}
                                    <div style={{ marginTop: '2px' }}>
                                        {item.status === 'idle' && <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${colors.border.light}` }} />}
                                        {item.status === 'running' && <Loader2 size={20} color={colors.primary} className="spinner" />}
                                        {item.status === 'completed' && <CheckCircle2 size={20} color={colors.success} />}
                                        {item.status === 'failed' && <XCircle size={20} color={colors.danger} />}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            {item.provider && <img src={SOURCING_PROVIDERS.find(p => p.name === item.provider)?.logo} alt={item.provider} style={{ width: '18px', height: '18px', borderRadius: radius.xs }} />}
                                            <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.url}
                                            </div>
                                        </div>

                                        {item.product && (
                                            <div style={{ fontSize: font.size.sm, color: colors.text.secondary, display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                                <span>{item.product.title}</span>
                                                <span style={{ color: colors.border.light }}>|</span>
                                                <span style={{ fontWeight: font.weight.semibold }}>₩{item.product.originalPriceKrw.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {item.error && (
                                            <div style={{ fontSize: font.size.sm, color: colors.danger, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {item.error}
                                                <button onClick={() => handleRetry(item.id)} style={{ background: 'none', border: 'none', color: colors.danger, fontWeight: font.weight.semibold, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>재시도</button>
                                            </div>
                                        )}
                                        {item.status === 'idle' && !item.error && <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: '4px' }}>대기 중...</div>}
                                        {item.status === 'running' && <div style={{ fontSize: font.size.sm, color: colors.primary, marginTop: '4px' }}>정보를 가져오고 있어요...</div>}
                                    </div>

                                    {/* Thumbnail Preview */}
                                    {item.product && (
                                        <img src={item.product.thumbnailUrl} alt="Thumb" style={{ width: '48px', height: '48px', borderRadius: radius.md, border: `1px solid ${colors.border.default}`, objectFit: 'cover' }} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Result Actions */}
                        {isAllCompleted && (
                            <div style={{ display: 'flex', gap: '12px', animation: 'fadeInUp 0.4s ease' }}>
                                <button className="btn-google" onClick={() => navigate('/sourcing')} style={{ flex: 1, background: colors.bg.subtle, border: 'none' }}>
                                    수집 홈으로
                                </button>
                                {successCount > 0 && (
                                    <button className="btn-primary" onClick={handleEditClick} style={{ flex: 2, background: colors.text.primary, color: 'white' }}>
                                        편집으로 이동하기 <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 편집 준비 중 Toast */}
            {showEditToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '24px',
                    background: 'rgba(25, 31, 40, 0.9)',
                    color: colors.white,
                    padding: '12px 20px',
                    borderRadius: radius.img,
                    fontSize: font.size.md,
                    fontWeight: font.weight.medium,
                    zIndex: 9999,
                    animation: 'fadeInUp 0.25s ease',
                    fontFamily: 'Pretendard, sans-serif',
                }}>
                    준비 중이에요
                </div>
            )}

            <style>{`
            @keyframes spinner {
                to { transform: rotate(360deg); }
            }
            .spinner {
                animation: spinner 1s linear infinite;
            }
            `}</style>
        </MainLayout>
    );
}
