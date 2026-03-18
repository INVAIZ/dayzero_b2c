import { Fragment, useState, useRef, useEffect } from 'react';
import { ArrowRight, ExternalLink, Loader2, CheckCircle2, Info, ChevronRight } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingTransition } from '../../components/onboarding/useOnboardingTransition';
import { mockQoo10Connect } from '../../mock/authMock';
import { useOnboarding } from '../../components/onboarding/OnboardingContext';

export default function Qoo10ConnectPage() {
    const inputRef = useRef<HTMLInputElement>(null);

    const { state, setState } = useOnboarding();
    const { apiKey, connected, storeName, sellerId } = state;

    const { exiting, transitionTo } = useOnboardingTransition();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showQsmPanel, setShowQsmPanel] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [panelCollapsed, setPanelCollapsed] = useState(false);

    // Focus input automatically for better UX
    useEffect(() => {
        if (!loading && !connected) {
            const id = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(id);
        }
    }, [loading, connected]);

    // 탭 복귀 감지: QSM 패널 열려있을 때 다른 탭 갔다 돌아오면 패널 접기 + 입력란 포커스
    useEffect(() => {
        if (!showQsmPanel) {
            setPanelCollapsed(false);
            return;
        }
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && showQsmPanel && !panelCollapsed) {
                setPanelCollapsed(true);
                setTimeout(() => inputRef.current?.focus(), 200);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [showQsmPanel, panelCollapsed]);

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
        setShowQsmPanel(false);
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
                    <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                background: '#FFFFFF',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                border: '1px solid #E5E8EB',
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
                                fontSize: '28px',
                                fontWeight: 800,
                                color: '#191F28',
                                margin: '0 0 12px',
                                letterSpacing: '-0.5px',
                            }}
                        >
                            Qoo10 판매 계정을 연결해주세요
                        </h1>
                        <p
                            style={{
                                fontSize: '15px',
                                color: '#6B7684',
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
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {/* Input Field */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', position: 'relative' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: '#191F28' }}>
                                    Qoo10 API Key
                                </label>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', color: '#8B95A1', cursor: 'pointer' }}
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
                                        marginBottom: '8px',
                                        background: '#191F28',
                                        color: '#FFFFFF',
                                        padding: '12px 14px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        lineHeight: 1.5,
                                        width: '280px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        zIndex: 10,
                                        wordBreak: 'keep-all'
                                    }}>
                                        API Key는 DayZero가 스토어에 상품을 관리할 수 있도록 허가해주는 고유 암호(열쇠)입니다.
                                        <svg style={{ position: 'absolute', top: '100%', left: '16px', color: '#191F28' }} width="12" height="6" viewBox="0 0 12 6" fill="currentColor">
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
                                        background: '#FFFFFF',
                                        border: error ? '1.5px solid #F04452' : '1.5px solid #E5E8EB',
                                        borderRadius: '12px',
                                        padding: '16px 16px',
                                        fontSize: '15px',
                                        color: '#191F28',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        fontFamily: 'JetBrains Mono, Pretendard, sans-serif',
                                    }}
                                    onFocus={(e) => {
                                        if (!error) e.target.style.borderColor = '#191F28';
                                    }}
                                    onBlur={(e) => {
                                        if (!error) e.target.style.borderColor = '#E5E8EB';
                                    }}
                                />
                                {error && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px' }}>
                                        <span style={{ fontSize: '13px', color: '#F04452', fontWeight: 500 }}>{error}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guide Block */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#F2F4F6',
                                borderRadius: '12px',
                                padding: '16px',
                            }}
                        >
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#4E5968' }}>
                                API Key 발급이 필요하신가요?
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowQsmPanel(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#191F28',
                                    background: '#FFFFFF',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #E5E8EB',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#F9FAFB'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#FFFFFF'}
                            >
                                QSM 가서 발급받기 <ExternalLink size={14} color="#8B95A1" />
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !apiKey.trim()}
                            style={{
                                width: '100%',
                                height: '52px',
                                background: !apiKey.trim() ? '#E5E8EB' : '#3182F6',
                                color: !apiKey.trim() ? '#8B95A1' : '#FFFFFF',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: (!apiKey.trim() || loading) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
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
                    /* Success State - Clean Design (Toss App Style) */
                    <div
                        style={{
                            animation: 'resultSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                            paddingTop: '16px'
                        }}
                    >
                        {/* Top margin spacing */}
                        <div style={{ height: '24px' }} />

                        {/* Title */}
                        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#191F28', textAlign: 'center', margin: '0 0 12px', lineHeight: 1.4, letterSpacing: '-0.5px' }}>
                            축하해요!<br />
                            {storeName} 스토어가 연결되었어요.
                        </h2>

                        <p style={{ fontSize: '15px', color: '#8B95A1', textAlign: 'center', margin: '0 0 48px' }}>
                            이제부터 상품 자동 등록과 주문 처리가 가능해져요.
                        </p>

                        {/* Highlight Floating Circle Logo */}
                        <div style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '48px',
                            background: '#FFFFFF',
                            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '48px',
                            border: '1px solid #F2F4F6',
                            position: 'relative'
                        }}>
                            <img src="/Qoo10.png" alt="Qoo10" style={{ width: '56px', height: 'auto', objectFit: 'contain' }} />
                            {/* Decorative Check */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                right: '-4px',
                                background: '#FFFFFF',
                                borderRadius: '50%',
                                padding: '2px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                <CheckCircle2 size={24} color="#3182F6" fill="#E8F3FF" />
                            </div>
                        </div>

                        {/* Info Box */}
                        <div style={{
                            background: '#F2F4F6',
                            borderRadius: '16px',
                            padding: '24px 0',
                            width: '100%',
                            textAlign: 'center',
                            marginBottom: '32px'
                        }}>
                            <div style={{ fontSize: '14px', color: '#6B7684', fontWeight: 500, marginBottom: '6px' }}>연결된 스토어 ID</div>
                            <div style={{ fontSize: '18px', color: '#191F28', fontWeight: 700, fontFamily: 'JetBrains Mono, Pretendard, sans-serif' }}>
                                {sellerId}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <button
                                onClick={() => transitionTo('/basic-info')}
                                style={{
                                    width: '100%',
                                    height: '52px',
                                    background: '#3182F6',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
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
                                    color: '#6B7684',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#191F28'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#6B7684'}
                            >
                                다른 계정으로 연결하기
                            </button>
                        </div>
                    </div>
                )}
            </OnboardingLayout>

            {/* QSM Slide-over Overlay */}
            {showQsmPanel && (
                <>
                    {/* Dimmed Backdrop — 접혔을 때는 숨김 */}
                    {!panelCollapsed && (
                        <div
                            onClick={() => setShowQsmPanel(false)}
                            style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0, 0, 0, 0.4)',
                                zIndex: 999,
                                animation: 'fadeIn 0.2s ease-out forwards'
                            }}
                        />
                    )}

                    {/* Slide Panel */}
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: panelCollapsed ? '340px' : '1100px',
                        maxWidth: panelCollapsed ? '35vw' : '90vw',
                        background: '#FFFFFF',
                        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        borderLeft: '1px solid #E5E8EB',
                        overflow: 'hidden',
                    }}>
                        {/* Overlay Header with Visual Guide */}
                        <div style={{
                            padding: '24px 40px',
                            borderBottom: '1px solid #E5E8EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#F9FAFB',
                            flexShrink: 0,
                            overflow: 'hidden',
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <button
                                        onClick={() => setPanelCollapsed(!panelCollapsed)}
                                        style={{
                                            background: '#FFFFFF',
                                            border: '1px solid #E5E8EB',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            color: '#4E5968',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            flexShrink: 0,
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#191F28'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#4E5968'; }}
                                        title={panelCollapsed ? '패널 펼치기' : '패널 닫기'}
                                    >
                                        <ChevronRight size={24} style={{ transform: panelCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    </button>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#191F28', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                                        <img src="/Qoo10.png" alt="Qoo10" style={{ height: '20px', width: 'auto' }} />
                                        API Key 발급 가이드
                                    </h3>
                                </div>

                                {/* Visual Step Guide — 접혔을 때 숨김 */}
                                {!panelCollapsed && (
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#FFFFFF', padding: '14px 20px', borderRadius: '12px', border: '1px solid #E5E8EB' }}>
                                        {[
                                            { num: 1, text: 'QSM 로그인' },
                                            { num: 2, text: '좌측 하단 QAPI 개발가이드 클릭' },
                                            { num: 3, text: 'API Key 발급' },
                                            { num: 4, text: '발급된 API Key 복사 후 연동란에 붙여넣기' },
                                        ].map((step, idx) => (
                                            <Fragment key={step.num}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0F6FF', padding: '6px 12px', borderRadius: '8px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '12px', background: '#3182F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.num}</div>
                                                    <span style={{ fontSize: '14px', color: '#191F28', fontWeight: 600, whiteSpace: 'nowrap' }}>{step.text}</span>
                                                </div>
                                                {idx < 3 && <ArrowRight size={16} color="#3182F6" style={{ flexShrink: 0 }} />}
                                            </Fragment>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* iFrame Content Container — 항상 렌더링, 로그인 상태 유지 */}
                        <div style={{ flex: 1, position: 'relative', background: '#F9FAFB', overflow: 'hidden' }}>
                            <iframe
                                src="https://qsm.qoo10.jp/GMKT.INC.Gsm.Web/Login.aspx"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="QSM Login"
                            />
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
