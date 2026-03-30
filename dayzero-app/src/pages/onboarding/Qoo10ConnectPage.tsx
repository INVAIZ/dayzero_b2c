import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Loader2, CheckCircle2, Info } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingTransition } from '../../components/onboarding/useOnboardingTransition';
import { mockQoo10Connect } from '../../mock/authMock';
import { useOnboarding } from '../../components/onboarding/OnboardingContext';
import { colors, font, radius, spacing } from '../../design/tokens';

export default function Qoo10ConnectPage() {
    const inputRef = useRef<HTMLInputElement>(null);

    const { state, setState } = useOnboarding();
    const { apiKey, connected, storeName, sellerId } = state;

    const { exiting, transitionTo } = useOnboardingTransition();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Focus input automatically for better UX
    useEffect(() => {
        if (!loading && !connected) {
            const id = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(id);
        }
    }, [loading, connected]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!apiKey.trim()) {
            setError('API Key를 입력해주세요');
            return;
        }

        setError(null);
        setLoading(true);

        const res = await mockQoo10Connect(apiKey);

        setLoading(false);
        setState(prev => ({
            ...prev,
            connected: true,
            storeName: res.storeName,
            sellerId: res.sellerId
        }));
    };

    return (
        <>
            <OnboardingLayout currentStep={1} exiting={exiting} onStepClick={(stepId) => { if (stepId === 2) transitionTo('/basic-info'); if (stepId === 3) transitionTo('/basic-margin'); }}>
                {/* Title Area - Large, isolated focus */}
                {!connected && (
                    <div style={{ marginBottom: spacing['12'], textAlign: 'center' }}>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                background: colors.bg.surface,
                                borderRadius: radius.xl,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: `0 auto ${spacing['6']}`,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                border: `1px solid ${colors.border.default}`,
                                overflow: 'hidden',
                            }}
                        >
                            <img
                                src="/Qoo10.png"
                                alt="Qoo10"
                                style={{ width: '48px', height: 'auto', objectFit: 'contain' }}
                            />
                        </div>
                        <h1
                            style={{
                                fontSize: font.size['2xl'],
                                fontWeight: 800,
                                color: colors.text.primary,
                                margin: `0 0 ${spacing['3']}`,
                                letterSpacing: '-0.5px',
                            }}
                        >
                            Qoo10 판매 계정을 연결해주세요
                        </h1>
                        <p
                            style={{
                                fontSize: font.size.base,
                                color: colors.text.tertiary,
                                margin: 0,
                                fontWeight: 500,
                                lineHeight: 1.5,
                            }}
                        >
                            API Key를 연동하면 상품 자동 등록과 주문 관리가 가능해져요.
                        </p>
                    </div>
                )}

                {!connected ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing['7'] }}>
                        {/* Input Field */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing['1.5'], marginBottom: spacing['2'], position: 'relative' }}>
                                <label style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.text.primary }}>
                                    Qoo10 API Key
                                </label>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', color: colors.text.muted, cursor: 'pointer' }}
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                >
                                    <Info size={16} />
                                </div>

                                {/* Tooltip */}
                                {showTooltip && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '0',
                                        marginBottom: spacing['2'],
                                        background: colors.text.primary,
                                        color: colors.bg.surface,
                                        padding: `${spacing['3']} ${spacing['3.5']}`,
                                        borderRadius: radius.md,
                                        fontSize: font.size.sm,
                                        fontWeight: 500,
                                        lineHeight: 1.5,
                                        width: '280px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        zIndex: 10,
                                        wordBreak: 'keep-all'
                                    }}>
                                        API Key는 DayZero가 스토어에 상품을 관리할 수 있도록 허가해주는 고유 암호(열쇠)입니다.
                                        <svg style={{ position: 'absolute', top: '100%', left: '16px', color: colors.text.primary }} width="12" height="6" viewBox="0 0 12 6" fill="currentColor">
                                            <path d="M0 0h12L6 6z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    ref={inputRef}
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => {
                                        setState(prev => ({ ...prev, apiKey: e.target.value }));
                                        if (error) setError(null);
                                    }}
                                    placeholder="발급받은 API Key를 붙여넣어 주세요"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        background: colors.bg.surface,
                                        border: error ? `1.5px solid ${colors.danger}` : `1.5px solid ${colors.border.default}`,
                                        borderRadius: radius.lg,
                                        padding: `${spacing['4']} ${spacing['4']}`,
                                        fontSize: font.size.base,
                                        color: colors.text.primary,
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        fontFamily: 'JetBrains Mono, Pretendard, sans-serif',
                                    }}
                                    onFocus={(e) => {
                                        if (!error) e.target.style.borderColor = colors.text.primary;
                                    }}
                                    onBlur={(e) => {
                                        if (!error) e.target.style.borderColor = colors.border.default;
                                    }}
                                />
                                {error && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: spacing['1.5'] }}>
                                        <span style={{ fontSize: font.size.sm, color: colors.danger, fontWeight: 500 }}>{error}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guide Block */}
                        <div style={{ background: colors.bg.subtle, borderRadius: radius.lg, padding: spacing['4'], display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text.secondary }}>
                                    API Key 발급이 필요하신가요?
                                </span>
                                <button
                                    type="button"
                                    onClick={() => window.open('https://qsm.qoo10.jp/GMKT.INC.Gsm.Web/Login.aspx', '_blank')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        fontSize: font.size.sm, fontWeight: 600, color: colors.text.primary,
                                        background: colors.bg.surface, padding: '8px 14px',
                                        borderRadius: radius.md, border: `1px solid ${colors.border.default}`,
                                        cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = colors.bg.page}
                                    onMouseOut={(e) => e.currentTarget.style.background = colors.bg.surface}
                                >
                                    QSM 가서 발급받기 <ExternalLink size={14} color={colors.text.muted} />
                                </button>
                            </div>

                            {/* 발급 방법 안내 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {[
                                    { num: 1, text: 'QSM에 로그인합니다.' },
                                    { num: 2, text: '좌측 하단 QAPI 개발가이드를 클릭합니다.' },
                                    { num: 3, text: 'API Key 발급 버튼을 눌러 키를 생성합니다.' },
                                    { num: 4, text: '발급된 API Key를 복사하여 위 입력란에 붙여넣습니다.' },
                                ].map((step) => (
                                    <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '6px 0' }}>
                                        <span style={{
                                            fontSize: font.size.sm, fontWeight: 700, color: colors.primary,
                                            lineHeight: '20px', flexShrink: 0, width: '18px', textAlign: 'center',
                                        }}>{step.num}.</span>
                                        <span style={{ fontSize: font.size.sm, color: colors.text.secondary, fontWeight: 500, lineHeight: '20px' }}>{step.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !apiKey.trim()}
                            style={{
                                width: '100%',
                                height: '52px',
                                background: !apiKey.trim() ? colors.border.default : colors.primary,
                                color: !apiKey.trim() ? colors.text.muted : colors.bg.surface,
                                border: 'none',
                                borderRadius: radius.lg,
                                fontSize: font.size.md,
                                fontWeight: 600,
                                cursor: (!apiKey.trim() || loading) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: spacing['2'],
                                transition: 'background 0.2s, transform 0.1s',
                            }}
                            onMouseDown={(e) => {
                                if (apiKey.trim() && !loading) e.currentTarget.style.transform = 'scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                                if (apiKey.trim() && !loading) e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                    연동 중...
                                </>
                            ) : (
                                '계정 연동하기'
                            )}
                        </button>
                    </form>
                ) : (
                    /* Success State */
                    <div
                        style={{
                            animation: 'resultSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                            paddingTop: spacing['4']
                        }}
                    >
                        <div style={{ height: spacing['6'] }} />

                        <h2 style={{ fontSize: font.size.xl, fontWeight: 800, color: colors.text.primary, textAlign: 'center', margin: `0 0 ${spacing['3']}`, lineHeight: 1.4, letterSpacing: '-0.5px' }}>
                            축하해요!<br />
                            {storeName} 스토어가 연결되었어요.
                        </h2>

                        <p style={{ fontSize: font.size.base, color: colors.text.muted, textAlign: 'center', margin: `0 0 ${spacing['12']}` }}>
                            이제부터 상품 자동 등록과 주문 처리가 가능해져요.
                        </p>

                        <div style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '48px',
                            background: colors.bg.surface,
                            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: spacing['12'],
                            border: `1px solid ${colors.bg.subtle}`,
                            position: 'relative'
                        }}>
                            <img src="/Qoo10.png" alt="Qoo10" style={{ width: '56px', height: 'auto', objectFit: 'contain' }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                right: '-4px',
                                background: colors.bg.surface,
                                borderRadius: '50%',
                                padding: '2px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                <CheckCircle2 size={24} color={colors.primary} fill={colors.primaryLight} />
                            </div>
                        </div>

                        <div style={{
                            background: colors.bg.subtle,
                            borderRadius: radius.xl,
                            padding: `${spacing['6']} 0`,
                            width: '100%',
                            textAlign: 'center',
                            marginBottom: spacing['8']
                        }}>
                            <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, fontWeight: 500, marginBottom: spacing['1.5'] }}>연결된 스토어 ID</div>
                            <div style={{ fontSize: font.size.lg, color: colors.text.primary, fontWeight: 700, fontFamily: 'JetBrains Mono, Pretendard, sans-serif' }}>
                                {sellerId}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'], width: '100%' }}>
                            <button
                                onClick={() => transitionTo('/basic-info')}
                                style={{
                                    width: '100%',
                                    height: '52px',
                                    background: colors.primary,
                                    color: colors.bg.surface,
                                    border: 'none',
                                    borderRadius: radius.lg,
                                    fontSize: font.size.md,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: spacing['2'],
                                    transition: 'background 0.2s, transform 0.1s',
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                다음 단계로 계속
                            </button>

                            <button
                                onClick={() => {
                                    setState(prev => ({ ...prev, connected: false }));
                                }}
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    background: 'transparent',
                                    color: colors.text.tertiary,
                                    border: 'none',
                                    borderRadius: radius.lg,
                                    fontSize: font.size.base,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = colors.text.primary}
                                onMouseOut={(e) => e.currentTarget.style.color = colors.text.tertiary}
                            >
                                다른 계정으로 연결하기
                            </button>
                        </div>
                    </div>
                )}
            </OnboardingLayout>

        </>
    );
}
