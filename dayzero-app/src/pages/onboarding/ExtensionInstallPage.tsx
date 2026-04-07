import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Download, ExternalLink, CheckCircle2 } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingTransition } from '../../components/onboarding/useOnboardingTransition';
import { useOnboarding } from '../../components/onboarding/OnboardingContext';
import { colors, font, radius, spacing } from '../../design/tokens';
import { ANIM } from '../../design/animations';

type Phase = 'idle' | 'waiting' | 'done';

const WEBSTORE_URL = 'https://chromewebstore.google.com/';

export default function ExtensionInstallPage() {
    const { state } = useOnboarding();
    const { exiting, transitionTo } = useOnboardingTransition();
    const [phase, setPhase] = useState<Phase>('idle');
    const [showComplete, setShowComplete] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const handleInstall = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        window.open(WEBSTORE_URL, '_blank');
        setPhase('waiting');
        timerRef.current = setTimeout(() => {
            setPhase('done');
            sessionStorage.setItem('ext_installed', 'true');
            setShowComplete(true);
        }, 10000);
    };

    const handleOpenWebstore = () => {
        window.open(WEBSTORE_URL, '_blank');
    };

    const handleSkip = () => {
        setShowComplete(true);
    };

    return (
        <>
            <OnboardingLayout
                currentStep={4}
                exiting={exiting}
                onStepClick={(stepId) => {
                    if (stepId === 1) transitionTo('/qoo10-connect');
                    if (stepId === 2) transitionTo('/basic-info');
                    if (stepId === 3) transitionTo('/basic-margin');
                }}
            >
                {phase === 'idle' && (
                    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
                        <div style={{ textAlign: 'center', marginBottom: spacing['8'] }}>
                            <h1
                                style={{
                                    fontSize: font.size['xl+'],
                                    fontWeight: font.weight.semibold,
                                    color: colors.text.primary,
                                    margin: `0 0 ${spacing['3']}`,
                                    lineHeight: '1.4',
                                    letterSpacing: '-0.5px',
                                    wordBreak: 'keep-all',
                                }}
                            >
                                빠른 상품 수집을 위해 프로그램 설치가 필요해요
                            </h1>
                            <p
                                style={{
                                    fontSize: font.size.base,
                                    color: colors.text.tertiary,
                                    margin: 0,
                                    fontWeight: font.weight.medium,
                                    lineHeight: font.lineHeight.normal,
                                    animation: 'fadeInUp 0.4s ease 0.05s both',
                                }}
                            >
                                DayZero 전용 프로그램을 설치하면 쇼핑몰을 둘러보면서<br />
                                원하는 상품을 바로바로 담을 수 있어요.
                            </p>
                        </div>

                        {/* 모션 일러스트 */}
                        <div style={{
                            position: 'relative',
                            width: '100%', height: '190px',
                            background: colors.bg.subtle, borderRadius: radius.xl,
                            marginBottom: spacing['8'], overflow: 'hidden',
                            border: `1px solid ${colors.border.default}`,
                        }}>
                            {/* 쇼핑몰 상품 리스트 */}
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* 쇼핑몰 헤더 */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px 4px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: font.weight.bold, color: colors.text.primary }}>인기 상품 추천</span>
                                    <span style={{ fontSize: '7px', color: colors.text.muted }}>더보기</span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', padding: '4px 10px 10px', flex: 1 }}>
                                {[
                                    { brand: '닥터지', name: '레드 블레미쉬 클리어 수딩 크림 70ml', discount: '32%', price: '18,900원' },
                                    { brand: '라네즈', name: '네오 쿠션 매트 15g 본품+리필 세트', discount: '28%', price: '32,000원' },
                                    { brand: '코스알엑스', name: '어드밴스드 스네일 96 에센스 100ml', discount: '41%', price: '11,900원' },
                                ].map((item, i) => (
                                    <div key={i} className={`demo-card demo-card-${i}`} style={{
                                        flex: 1, background: colors.bg.surface, borderRadius: radius.xs,
                                        display: 'flex', flexDirection: 'column', position: 'relative',
                                        overflow: 'hidden',
                                    }}>
                                        {/* 상품 이미지 */}
                                        <div style={{
                                            flex: 1, background: colors.bg.subtle,
                                            borderRadius: '4px 4px 0 0',
                                        }} />
                                        {/* 상품 정보 */}
                                        <div style={{ padding: '5px 4px 4px' }}>
                                            <div style={{ fontSize: '8px', color: colors.text.primary, fontWeight: font.weight.semibold, marginBottom: '1px' }}>
                                                {item.brand}
                                            </div>
                                            <div style={{
                                                fontSize: '8px', color: colors.text.secondary,
                                                fontWeight: font.weight.medium,
                                                lineHeight: '1.3', marginBottom: '3px',
                                                overflow: 'hidden', display: '-webkit-box',
                                                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                                            }}>
                                                {item.name}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                <span style={{ fontSize: '9px', color: colors.danger, fontWeight: font.weight.bold }}>{item.discount}</span>
                                                <span style={{ fontSize: '9px', color: colors.text.primary, fontWeight: font.weight.bold }}>{item.price}</span>
                                            </div>
                                        </div>
                                        {/* DayZero 수집 버튼 오버레이 */}
                                        <div className={`demo-overlay demo-overlay-${i}`} style={{
                                            position: 'absolute', top: '8px', left: '8px',
                                        }}>
                                            <div className={`demo-btn demo-btn-${i}`} style={{
                                                width: '22px', height: '22px', borderRadius: radius.sm,
                                                background: colors.primary, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(49, 130, 246, 0.35)',
                                            }}>
                                                <img src="/dayzero-icon.png" alt="" style={{ width: '13px', height: '13px', borderRadius: radius['2xs'] }} />
                                            </div>
                                        </div>
                                        {/* 수집 완료 체크 */}
                                        <div className={`demo-check demo-check-${i}`} style={{
                                            position: 'absolute', top: '8px', left: '8px',
                                            width: '22px', height: '22px', borderRadius: radius.sm,
                                            background: colors.primary, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 1px 4px rgba(49, 130, 246, 0.35)',
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                <polyline points="20 6 9 17 4 12" stroke={colors.white} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                            {/* 장바구니 배지 (우하단) */}
                            <div className="demo-badge" style={{
                                position: 'absolute', bottom: '12px', right: '16px',
                                background: colors.primary, borderRadius: radius.full,
                                padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px',
                                boxShadow: '0 2px 8px rgba(49, 130, 246, 0.3)',
                            }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
                                </svg>
                                <span className="demo-badge-num" style={{ color: colors.white, fontSize: font.size['2xs+'], fontWeight: font.weight.bold, minWidth: '8px', textAlign: 'center' }} />
                            </div>
                            {/* 커서 (macOS 화살표) */}
                            <div className="demo-cursor" style={{
                                position: 'absolute', zIndex: 3, pointerEvents: 'none',
                                filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.3))',
                            }}>
                                <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                                    <path d="M2.5 1L2.5 19L7 14L10.5 21L13 19.5L9.5 12.5L15 12L2.5 1Z" fill={colors.text.primary} stroke="white" strokeWidth="2" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                            <button
                                onClick={handleInstall}
                                style={{
                                    width: '100%',
                                    height: '52px',
                                    background: colors.primary,
                                    color: colors.bg.surface,
                                    border: 'none',
                                    borderRadius: radius.lg,
                                    fontSize: font.size.md,
                                    fontWeight: font.weight.semibold,
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
                                <Download size={18} />
                                프로그램 설치하기
                            </button>
                            <button
                                onClick={handleSkip}
                                style={{
                                    width: '100%',
                                    height: '52px',
                                    background: colors.bg.surface,
                                    color: colors.text.secondary,
                                    border: `1px solid ${colors.border.default}`,
                                    borderRadius: radius.lg,
                                    fontSize: font.size.md,
                                    fontWeight: font.weight.semibold,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s, transform 0.1s',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = colors.bg.page}
                                onMouseOut={(e) => e.currentTarget.style.background = colors.bg.surface}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                나중에 설치할게요
                            </button>
                            <button
                                onClick={() => transitionTo('/basic-margin')}
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    background: 'transparent',
                                    color: colors.text.tertiary,
                                    border: 'none',
                                    borderRadius: radius.lg,
                                    fontSize: font.size.base,
                                    fontWeight: font.weight.medium,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = colors.text.primary}
                                onMouseOut={(e) => e.currentTarget.style.color = colors.text.tertiary}
                            >
                                이전으로
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'waiting' && (
                    <div style={{
                        animation: 'modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        textAlign: 'center', paddingTop: spacing['6'],
                    }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: radius.full,
                            background: colors.bg.info, border: `1px solid ${colors.primaryLightBorder}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: spacing['8'],
                        }}>
                            <ExternalLink size={28} color={colors.primary} />
                        </div>
                        <h2 style={{
                            fontSize: font.size['xl+'], fontWeight: font.weight.semibold,
                            color: colors.text.primary, margin: `0 0 ${spacing['2']}`,
                            lineHeight: '1.4', letterSpacing: '-0.5px', wordBreak: 'keep-all' as const,
                        }}>
                            웹스토어에서 설치를 진행해주세요
                        </h2>
                        <p style={{
                            fontSize: font.size.base, color: colors.text.tertiary,
                            margin: `0 0 ${spacing['10']}`, fontWeight: font.weight.medium,
                            lineHeight: font.lineHeight.normal,
                        }}>
                            새 탭에서 열린 Chrome 웹스토어에서 프로그램을 설치해주세요.<br />
                            설치가 완료되면 자동으로 다음 단계로 넘어가요.
                        </p>
                        <button
                            onClick={handleOpenWebstore}
                            style={{
                                width: '100%',
                                height: '52px',
                                background: colors.bg.surface,
                                color: colors.text.secondary,
                                border: `1px solid ${colors.border.default}`,
                                borderRadius: radius.lg,
                                fontSize: font.size.md,
                                fontWeight: font.weight.semibold,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: spacing['2'],
                                transition: 'background 0.2s, transform 0.1s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = colors.bg.page}
                            onMouseOut={(e) => e.currentTarget.style.background = colors.bg.surface}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <ExternalLink size={16} />
                            웹스토어 다시 가기
                        </button>
                    </div>
                )}

                {phase === 'done' && (
                    <div style={{
                        animation: 'modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        width: '100%', paddingTop: spacing['4'],
                    }}>
                        <div style={{ height: spacing['6'] }} />

                        <h2 style={{
                            fontSize: font.size.xl, fontWeight: font.weight.extrabold,
                            color: colors.text.primary, textAlign: 'center',
                            margin: `0 0 ${spacing['3']}`, lineHeight: 1.4, letterSpacing: '-0.5px',
                        }}>
                            프로그램 설치가 완료됐어요!
                        </h2>
                        <p style={{
                            fontSize: font.size.base, color: colors.text.muted,
                            textAlign: 'center', margin: `0 0 ${spacing['12']}`,
                        }}>
                            이제 쇼핑몰에서 원하는 상품을 바로 담을 수 있어요.
                        </p>

                        <div style={{
                            width: '96px', height: '96px', borderRadius: radius.full,
                            background: colors.bg.surface,
                            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: spacing['12'],
                            border: `1px solid ${colors.bg.subtle}`,
                            position: 'relative',
                        }}>
                            <Download size={40} color={colors.primary} strokeWidth={1.5} />
                            <div style={{
                                position: 'absolute', bottom: '-4px', right: '-4px',
                                background: colors.bg.surface, borderRadius: '50%',
                                padding: '2px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}>
                                <CheckCircle2 size={24} color={colors.primary} fill={colors.primaryLight} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'], width: '100%' }}>
                            <button
                                onClick={() => setShowComplete(true)}
                                style={{
                                    width: '100%', height: '52px',
                                    background: colors.primary, color: colors.bg.surface,
                                    border: 'none', borderRadius: radius.lg,
                                    fontSize: font.size.md, fontWeight: font.weight.semibold,
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', gap: spacing['2'],
                                    transition: 'background 0.2s, transform 0.1s',
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                시작하기
                            </button>
                        </div>
                    </div>
                )}

                <style>{ANIM.fadeInUp + ANIM.modalSlideUp + `
                    /* 9초 사이클: 카드0 클릭(0-3s) → 카드1 클릭(3-6s) → 카드2 클릭(6-8s) → 리셋(8-9s) */

                    /* 커서: 왼쪽→가운데→오른쪽 순차 이동 */
                    .demo-cursor {
                        animation: cursorPath 9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    }
                    @keyframes cursorPath {
                        0%   { top: 65%; left: 3%;  opacity: 0; }
                        4%   { top: 65%; left: 3%;  opacity: 1; }
                        12%  { top: 20%; left: 5%;  opacity: 1; transform: scale(1); }
                        14%  { top: 20%; left: 5%;  opacity: 0.7; transform: scale(0.7); }
                        15.5%{ top: 20%; left: 5%;  opacity: 0.85; transform: scale(0.85); }
                        17%  { top: 20%; left: 5%;  opacity: 1; transform: scale(1); }
                        25%  { top: 20%; left: 5%;  opacity: 1; transform: scale(1); }
                        38%  { top: 20%; left: 37%; opacity: 1; transform: scale(1); }
                        40%  { top: 20%; left: 37%; opacity: 0.7; transform: scale(0.7); }
                        41.5%{ top: 20%; left: 37%; opacity: 0.85; transform: scale(0.85); }
                        43%  { top: 20%; left: 37%; opacity: 1; transform: scale(1); }
                        52%  { top: 20%; left: 37%; opacity: 1; transform: scale(1); }
                        64%  { top: 20%; left: 69%; opacity: 1; transform: scale(1); }
                        66%  { top: 20%; left: 69%; opacity: 0.7; transform: scale(0.7); }
                        67.5%{ top: 20%; left: 69%; opacity: 0.85; transform: scale(0.85); }
                        69%  { top: 20%; left: 69%; opacity: 1; transform: scale(1); }
                        80%  { top: 20%; left: 69%; opacity: 1; }
                        88%  { top: 65%; left: 69%; opacity: 0; }
                        100% { top: 65%; left: 3%;  opacity: 0; }
                    }

                    /* 카드 하이라이트: 각각 다른 타이밍 */
                    .demo-card-0 { animation: cardHL0 9s ease infinite; }
                    .demo-card-1 { animation: cardHL1 9s ease infinite; }
                    .demo-card-2 { animation: cardHL2 9s ease infinite; }
                    @keyframes cardHL0 {
                        0%,8%    { box-shadow: none; background: ${colors.bg.surface}; }
                        12%      { box-shadow: 0 0 0 2px ${colors.primary}60; background: ${colors.bg.surface}; }
                        16%      { box-shadow: 0 0 0 2px ${colors.primary}60, 0 0 12px ${colors.primary}20; background: ${colors.bg.info}; }
                        20%      { box-shadow: 0 0 0 2px ${colors.primary}30; background: ${colors.bg.surface}; }
                        25%,100% { box-shadow: none; background: ${colors.bg.surface}; }
                    }
                    @keyframes cardHL1 {
                        0%,32%   { box-shadow: none; background: ${colors.bg.surface}; }
                        38%      { box-shadow: 0 0 0 2px ${colors.primary}60; background: ${colors.bg.surface}; }
                        42%      { box-shadow: 0 0 0 2px ${colors.primary}60, 0 0 12px ${colors.primary}20; background: ${colors.bg.info}; }
                        46%      { box-shadow: 0 0 0 2px ${colors.primary}30; background: ${colors.bg.surface}; }
                        52%,100% { box-shadow: none; background: ${colors.bg.surface}; }
                    }
                    @keyframes cardHL2 {
                        0%,58%   { box-shadow: none; background: ${colors.bg.surface}; }
                        64%      { box-shadow: 0 0 0 2px ${colors.primary}60; background: ${colors.bg.surface}; }
                        68%      { box-shadow: 0 0 0 2px ${colors.primary}60, 0 0 12px ${colors.primary}20; background: ${colors.bg.info}; }
                        72%      { box-shadow: 0 0 0 2px ${colors.primary}30; background: ${colors.bg.surface}; }
                        80%,100% { box-shadow: none; background: ${colors.bg.surface}; }
                    }

                    /* DayZero 버튼 오버레이: 커서 도착 전에 먼저 등장 */
                    .demo-overlay-0 { animation: ov0 9s ease infinite; }
                    .demo-overlay-1 { animation: ov1 9s ease infinite; }
                    .demo-overlay-2 { animation: ov2 9s ease infinite; }
                    @keyframes ov0 {
                        0%,6%   { opacity: 0; transform: scale(0.5); }
                        10%     { opacity: 1; transform: scale(1); }
                        18%     { opacity: 1; transform: scale(1); }
                        20%     { opacity: 0; transform: scale(0.5); }
                        100%    { opacity: 0; }
                    }
                    @keyframes ov1 {
                        0%,30%  { opacity: 0; transform: scale(0.5); }
                        34%     { opacity: 1; transform: scale(1); }
                        44%     { opacity: 1; transform: scale(1); }
                        46%     { opacity: 0; transform: scale(0.5); }
                        100%    { opacity: 0; }
                    }
                    @keyframes ov2 {
                        0%,56%  { opacity: 0; transform: scale(0.5); }
                        60%     { opacity: 1; transform: scale(1); }
                        70%     { opacity: 1; transform: scale(1); }
                        72%     { opacity: 0; transform: scale(0.5); }
                        100%    { opacity: 0; }
                    }

                    /* 버튼 클릭 바운스 */
                    .demo-btn-0 { animation: btnClick0 9s ease infinite; }
                    .demo-btn-1 { animation: btnClick1 9s ease infinite; }
                    .demo-btn-2 { animation: btnClick2 9s ease infinite; }
                    @keyframes btnClick0 {
                        0%,15% { transform: scale(1); } 16% { transform: scale(0.75); } 18% { transform: scale(1.1); } 20% { transform: scale(1); } 100% { transform: scale(1); }
                    }
                    @keyframes btnClick1 {
                        0%,41% { transform: scale(1); } 42% { transform: scale(0.75); } 44% { transform: scale(1.1); } 46% { transform: scale(1); } 100% { transform: scale(1); }
                    }
                    @keyframes btnClick2 {
                        0%,67% { transform: scale(1); } 68% { transform: scale(0.75); } 70% { transform: scale(1.1); } 72% { transform: scale(1); } 100% { transform: scale(1); }
                    }

                    /* 수집 완료 체크: 클릭 후 나타나서 리셋까지 유지 */
                    .demo-check-0 { animation: chk0 9s ease infinite; }
                    .demo-check-1 { animation: chk1 9s ease infinite; }
                    .demo-check-2 { animation: chk2 9s ease infinite; }

                    @keyframes chk0 {
                        0%,16%  { opacity: 0; transform: scale(0); }
                        17%     { opacity: 1; transform: scale(1.2); }
                        19%     { opacity: 1; transform: scale(1); }
                        99%     { opacity: 1; transform: scale(1); }
                        100%    { opacity: 0; transform: scale(0); }
                    }
                    @keyframes chk1 {
                        0%,42%  { opacity: 0; transform: scale(0); }
                        43%     { opacity: 1; transform: scale(1.2); }
                        45%     { opacity: 1; transform: scale(1); }
                        99%     { opacity: 1; transform: scale(1); }
                        100%    { opacity: 0; transform: scale(0); }
                    }
                    @keyframes chk2 {
                        0%,68%  { opacity: 0; transform: scale(0); }
                        69%     { opacity: 1; transform: scale(1.2); }
                        71%     { opacity: 1; transform: scale(1); }
                        99%     { opacity: 1; transform: scale(1); }
                        100%    { opacity: 0; transform: scale(0); }
                    }

                    /* 배지: 0→1→2→3 카운트 */
                    .demo-badge { animation: badgeAppear 9s linear infinite; }
                    @keyframes badgeAppear {
                        0%      { opacity: 0; transform: scale(1); }
                        17%     { opacity: 0; transform: scale(1); }
                        18%     { opacity: 1; transform: scale(1.25); }
                        19.5%   { opacity: 1; transform: scale(1); }
                        45%     { transform: scale(1); }
                        46%     { transform: scale(1.25); }
                        47.5%   { transform: scale(1); }
                        71%     { transform: scale(1); }
                        72%     { transform: scale(1.25); }
                        73.5%   { transform: scale(1); }
                        88%     { opacity: 1; transform: scale(1); }
                        92%     { opacity: 0; transform: scale(1); }
                        100%    { opacity: 0; transform: scale(1); }
                    }
                    .demo-badge-num::after {
                        animation: badgeCount 9s step-end infinite;
                        content: '0';
                    }
                    @keyframes badgeCount {
                        0%,19%  { content: '0'; }
                        20%     { content: '1'; }
                        46%     { content: '2'; }
                        72%     { content: '3'; }
                    }
                `}</style>
            </OnboardingLayout>

            {/* 완료 화면 */}
            {showComplete && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    background: colors.bg.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}>
                    <style>{ANIM.fadeIn + `
                        @keyframes riseUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                        @keyframes checkCircle { to { stroke-dashoffset: 0; } }
                        @keyframes checkMark { to { stroke-dashoffset: 0; } }
                    `}</style>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 24px', maxWidth: '440px', width: '100%' }}>
                        <svg width="72" height="72" viewBox="0 0 72 72" fill="none"
                            style={{ marginBottom: '32px', animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both' }}>
                            <circle cx="36" cy="36" r="33" stroke={colors.primary} strokeWidth="2.5" fill="none"
                                strokeDasharray="207" strokeDashoffset="207"
                                style={{ animation: 'checkCircle 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards' }} />
                            <polyline points="22,36 31,46 50,26" stroke={colors.primary} strokeWidth="3" fill="none"
                                strokeLinecap="round" strokeLinejoin="round"
                                strokeDasharray="50" strokeDashoffset="50"
                                style={{ animation: 'checkMark 0.35s cubic-bezier(0.4, 0, 0.2, 1) 0.6s forwards' }} />
                        </svg>

                        <h2 style={{
                            fontSize: font.size['2xl-'], fontWeight: font.weight.extrabold, color: colors.text.primary,
                            margin: '0 0 8px', letterSpacing: '-0.5px',
                            animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
                        }}>
                            기본 설정이 완료됐어요
                        </h2>
                        <p style={{
                            fontSize: font.size.base, color: colors.text.tertiary,
                            margin: '0 0 40px', lineHeight: font.lineHeight.normal,
                            animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both',
                        }}>
                            아래 설정은 이후에 언제든 변경할 수 있어요.
                        </p>

                        <div style={{
                            width: '100%', border: `1px solid ${colors.bg.subtle}`, borderRadius: radius.xl,
                            overflow: 'hidden', marginBottom: '32px',
                            animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both',
                        }}>
                            {[
                                { label: 'Qoo10 JP 연동', desc: state.storeName || '연동 완료' },
                                { label: '배송지 및 기본 정보', desc: '출하지 · 반품지 설정 완료' },
                                { label: '배송비 및 마진', desc: '작업비 · 배송비 · 마진 설정 완료' },
                                { label: '프로그램 설치', desc: phase === 'done' ? '설치 완료' : '나중에 설치' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: `${spacing['3']} ${spacing['5']}`,
                                    borderTop: i > 0 ? `1px solid ${colors.bg.subtle}` : 'none',
                                    background: colors.bg.surface,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], flexShrink: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="8" fill={colors.primaryLight} />
                                            <polyline points="4.5,8 6.5,10.5 11.5,5.5" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        </svg>
                                        <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, whiteSpace: 'nowrap' }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontSize: font.size.sm, color: colors.text.muted, textAlign: 'right', minWidth: 0, wordBreak: 'keep-all' }}>{item.desc}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => transitionTo('/sourcing')}
                            style={{
                                width: '100%', height: '54px',
                                background: colors.primary, color: colors.bg.surface,
                                border: 'none', borderRadius: radius.lg,
                                fontSize: font.size['base+'], fontWeight: font.weight.bold,
                                cursor: 'pointer', letterSpacing: '-0.2px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing['2'],
                                transition: 'background 0.15s, transform 0.1s',
                                animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = colors.primaryDark}
                            onMouseLeave={e => e.currentTarget.style.background = colors.primary}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            수집 시작하기
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
