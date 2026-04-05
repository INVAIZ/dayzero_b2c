import { Fragment, useMemo, useState, useRef, useEffect } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, Calculator, Package, Truck, Globe, RefreshCw, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingTransition } from '../../components/onboarding/useOnboardingTransition';
import { useOnboarding, type ForwarderValue } from '../../components/onboarding/OnboardingContext';
import { colors, font, radius, spacing, shadow } from '../../design/tokens';
import { FORWARDER_RATES, lookupShippingFee, PLATFORM_FEE_RATE, EXCHANGE_RATE as DAILY_EXCHANGE_RATE, WEIGHT_OPTIONS } from '../../utils/forwarder';

function WeightDropdown({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div style={{ width: '120px', flexShrink: 0 }} ref={ref}>
            <label style={{ display: 'block', fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: '6px', fontWeight: font.weight.semibold }}>무게 (kg)</label>
            <div style={{ position: 'relative' }}>
                <div
                    onClick={() => setOpen(!open)}
                    style={{
                        width: '100%', padding: `${spacing['3']} ${spacing['3']}`,
                        borderRadius: radius.lg, fontSize: font.size.md, fontWeight: font.weight.semibold,
                        border: `1.5px solid ${open ? colors.primary : colors.border.default}`,
                        boxShadow: open ? '0 0 0 3px rgba(49, 130, 246, 0.1)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', userSelect: 'none',
                        backgroundColor: colors.bg.surface, color: colors.text.primary,
                        boxSizing: 'border-box' as const,
                    }}
                >
                    <span>{value}kg</span>
                    <ChevronDown size={14} color={open ? colors.primary : colors.text.muted}
                        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {open && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                        background: colors.bg.surface, border: `1px solid ${colors.border.default}`,
                        borderRadius: radius.lg, boxShadow: shadow.md, overflow: 'hidden', zIndex: 10,
                        maxHeight: '200px', overflowY: 'auto',
                    }}>
                        {WEIGHT_OPTIONS.map(w => (
                            <div key={w} onClick={() => { onChange(w); setOpen(false); }}
                                style={{
                                    padding: '10px 14px', fontSize: font.size.md, cursor: 'pointer',
                                    transition: 'background 0.15s',
                                    background: value === w ? colors.primaryLight : colors.bg.surface,
                                    color: value === w ? colors.primary : colors.text.primary,
                                    fontWeight: value === w ? font.weight.semibold : font.weight.regular,
                                }}
                                onMouseEnter={e => { if (value !== w) e.currentTarget.style.background = colors.bg.page; }}
                                onMouseLeave={e => { if (value !== w) e.currentTarget.style.background = colors.bg.surface; }}
                            >
                                {w}kg
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── 공통 스타일 ── */

const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing['4'],
    borderRadius: radius.lg,
    border: `1px solid ${colors.border.default}`,
    fontSize: font.size.base,
    color: colors.text.primary,
    backgroundColor: colors.bg.surface,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
    fontFamily: font.family.sans,
};

const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing['2'],
};

const introLineStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    lineHeight: '1.4',
    wordBreak: 'keep-all',
    margin: '0 0 10px',
    letterSpacing: '-0.5px',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
};

const cardStyle: React.CSSProperties = {
    background: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing['8'],
    boxShadow: shadow.sm,
    border: `1px solid ${colors.bg.subtle}`,
    animation: 'fadeSlideIn 0.3s ease',
};

const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = colors.primary;
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(49, 130, 246, 0.1)';
};

const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = colors.border.default;
    e.currentTarget.style.boxShadow = 'none';
};

const MARGIN_SIGNALS = {
    danger: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', Icon: AlertTriangle },
    warning: { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C', Icon: TrendingUp },
    success: { bg: colors.bg.info, border: colors.primaryLightBorder, text: colors.primary, Icon: CheckCircle },
} as const;

const STEP_TITLES: Record<number, { title: string; desc: string }> = {
    1: {
        title: '작업비를 설정해주세요',
        desc: '배송대행사에 포장·검수를 맡기고 있다면 해당 비용을 입력해주세요.',
    },
    2: {
        title: '해외 배송비를 설정해주세요',
        desc: '한국에서 일본 소비자에게 배송할 때 발생하는 국제 배송 비용입니다.',
    },
    3: {
        title: '기본 마진율을 설정해주세요',
        desc: '설정한 마진율이 모든 상품에 기본 적용됩니다. 상품별로 나중에 변경할 수 있어요.',
    },
};

/* ── 메인 컴포넌트 ── */

export default function BasicMarginPage() {
    const { state, setState } = useOnboarding();
    const { exiting, transitionTo } = useOnboardingTransition();
    const [step, setStep] = useState(1);
    const isRevisit = (state.visitedPages ?? []).includes('basic-margin');
    const [showIntro, setShowIntro] = useState(!isRevisit);
    const [introFading, setIntroFading] = useState(false);
    const [introLine, setIntroLine] = useState(isRevisit ? 3 : 0);
    const [introReady, setIntroReady] = useState(isRevisit);

    useEffect(() => {
        if (isRevisit) return;
        const t1 = setTimeout(() => setIntroLine(1), 300);
        const t2 = setTimeout(() => setIntroLine(2), 1300);
        const t3 = setTimeout(() => setIntroLine(3), 2300);
        const t4 = setTimeout(() => setIntroReady(true), 3100);
        return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
    }, [isRevisit]);

    const handleIntroDone = () => {
        setIntroFading(true);
        setTimeout(() => setShowIntro(false), 600);
        if (!isRevisit) {
            setState(prev => ({ ...prev, visitedPages: [...prev.visitedPages, 'basic-margin'] }));
        }
    };

    const { marginValue, prepCost, intlShipping, forwarder } = state;
    const updateState = (updates: Partial<typeof state>) => setState(prev => ({ ...prev, ...updates }));

    const hasForwarderRate = forwarder !== '' && forwarder !== 'other';
    const activeForwarder = hasForwarderRate ? forwarder : '';

    const [showCalculation, setShowCalculation] = useState(false);
    const [simBaseCost, setSimBaseCost] = useState(15000);
    const [simWeight, setSimWeight] = useState(0.3);

    const exchangeRate = DAILY_EXCHANGE_RATE;

    const shippingJpy = activeForwarder
        ? lookupShippingFee(activeForwarder as ForwarderValue, simWeight)
        : intlShipping;

    const { marginAmount, totalCostKrw, finalPriceJpy, payoutKrw, actualProfitKrw } = useMemo(() => {
        const costKrw = simBaseCost + prepCost;
        const desiredProfit = Math.round(costKrw * (marginValue / 100));
        const shippingCostKrw = Math.round(shippingJpy * exchangeRate);
        const requiredPayoutKrw = costKrw + desiredProfit + shippingCostKrw;
        const requiredPayoutJpy = Math.round(requiredPayoutKrw / exchangeRate);
        const finalJpy = Math.round(requiredPayoutJpy / (1 - PLATFORM_FEE_RATE));
        const fee = Math.round(finalJpy * PLATFORM_FEE_RATE);
        const payoutJpyVal = finalJpy - fee;
        const payoutKrwVal = Math.round(payoutJpyVal * exchangeRate);
        const profit = payoutKrwVal - costKrw - shippingCostKrw;
        return {
            marginAmount: desiredProfit,
            totalCostKrw: costKrw,
            finalPriceJpy: finalJpy,
            payoutKrw: payoutKrwVal,
            actualProfitKrw: profit,
        };
    }, [marginValue, prepCost, shippingJpy, simBaseCost, exchangeRate]);

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else transitionTo('/extension-install');
    };

    const feeJpy = Math.round(finalPriceJpy * PLATFORM_FEE_RATE);
    const shippingCostKrw = Math.round(shippingJpy * exchangeRate);
    const calcRows = [
        { icon: <Package size={14} />, label: `원가 + 작업비`, value: `₩${totalCostKrw.toLocaleString()}`, highlight: false },
        { icon: <TrendingUp size={14} />, label: `+ 마진 ${marginValue}%`, value: `₩${marginAmount.toLocaleString()}`, highlight: false },
        { icon: <Truck size={14} />, label: `+ 배송비`, value: `₩${shippingCostKrw.toLocaleString()} (¥${shippingJpy.toLocaleString()})`, highlight: false },
        { icon: <Calculator size={14} />, label: `+ Qoo10 수수료 12% 보전`, value: `¥${feeJpy.toLocaleString()}`, highlight: false },
        { icon: <Globe size={14} />, label: `= Qoo10 판매가`, value: `¥${finalPriceJpy.toLocaleString()}`, highlight: true },
        { icon: <RefreshCw size={14} />, label: `− 수수료 12% 차감 → 수령액`, value: `₩${payoutKrw.toLocaleString()}`, highlight: false },
        { icon: <Package size={14} />, label: `− 원가·작업비·배송비 → 순수익`, value: `₩${actualProfitKrw.toLocaleString()}`, highlight: true },
    ];

    // Step 3: 마진 시그널 계산
    const marginSignal = marginValue < 15
        ? { text: '마진이 너무 낮아요. 판매해도 수익이 거의 남지 않을 수 있어요.', sliderColor: colors.danger, type: 'danger' as const }
        : marginValue < 25
            ? { text: '가격은 경쟁력 있지만, 수익이 많지 않을 수 있어요.', sliderColor: '#E67E22', type: 'warning' as const }
            : marginValue <= 40
                ? { text: '적정 마진율이에요. 초보 셀러에게 권장하는 범위입니다.', sliderColor: colors.primary, type: 'success' as const }
                : marginValue <= 50
                    ? { text: '경쟁 상품 대비 가격이 높아 판매가 어려울 수 있어요.', sliderColor: '#E67E22', type: 'warning' as const }
                    : { text: '가격이 너무 높아요. 경쟁 상품 대비 판매가 어려울 수 있어요.', sliderColor: colors.danger, type: 'danger' as const };

    const sliderPct = ((marginValue - 5) / (60 - 5)) * 100;
    const signalStyles = MARGIN_SIGNALS[marginSignal.type];

    return (
        <>
            <OnboardingLayout currentStep={3} exiting={exiting} onStepClick={(stepId) => { if (stepId === 1) transitionTo('/qoo10-connect'); if (stepId === 2) transitionTo('/basic-info'); }}>
                <div style={{ padding: `0 ${spacing['5']}` }}>
                    {showIntro ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            minHeight: '320px', textAlign: 'center',
                            opacity: introFading ? 0 : 1,
                            transform: introFading ? 'translateY(-16px)' : 'translateY(0)',
                            transition: 'opacity 0.6s ease, transform 0.6s ease',
                        }}>
                            <p style={{
                                ...introLineStyle,
                                opacity: introLine >= 1 ? 1 : 0,
                                transform: introLine >= 1 ? 'translateY(0)' : 'translateY(10px)',
                            }}>
                                판매 가격을 자동으로 계산하려면
                            </p>
                            <p style={{
                                ...introLineStyle,
                                opacity: introLine >= 2 ? 1 : 0,
                                transform: introLine >= 2 ? 'translateY(0)' : 'translateY(10px)',
                            }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '9px',
                                    padding: '6px 16px', borderRadius: '10px',
                                    border: '2px solid #D9D9D9',
                                    background: '#FFFFFF',
                                    verticalAlign: 'middle',
                                    fontSize: '20px', fontWeight: font.weight.semibold,
                                    marginRight: '4px',
                                    position: 'relative', top: '-2px',
                                }}>
                                    <Calculator size={18} color={colors.primary} style={{ flexShrink: 0 }} />
                                    배송비/마진
                                </span>
                                에 대한 기본 설정이 필요해요.
                            </p>
                            <p style={{
                                ...introLineStyle,
                                opacity: introLine >= 3 ? 1 : 0,
                                transform: introLine >= 3 ? 'translateY(0)' : 'translateY(10px)',
                            }}>
                                순서대로 설정해볼게요.
                            </p>
                            <button
                                onClick={handleIntroDone}
                                style={{
                                    width: '48px', height: '48px',
                                    background: colors.primary, color: colors.bg.surface,
                                    border: 'none', borderRadius: radius.full,
                                    cursor: 'pointer', marginTop: spacing['6'],
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: introReady ? 1 : 0,
                                    transform: introReady ? 'translateY(0)' : 'translateY(10px)',
                                    transitionProperty: 'opacity, transform',
                                    transitionDuration: '0.5s',
                                    transitionTimingFunction: 'ease',
                                }}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <ArrowRight size={22} />
                            </button>
                        </div>
                    ) : (
                        <>
                    <h2 style={{
                        fontSize: '26px', fontWeight: font.weight.bold, color: colors.text.primary,
                        textAlign: 'center', margin: `0 0 ${spacing['3']}`, letterSpacing: '-0.5px',
                        animation: 'fadeSlideIn 0.4s ease both',
                    }}>
                        {STEP_TITLES[step].title}
                    </h2>
                    <p style={{
                        fontSize: font.size.base, color: colors.text.tertiary,
                        textAlign: 'center', margin: `0 0 ${spacing['8']}`,
                        lineHeight: font.lineHeight.normal, wordBreak: 'keep-all',
                        animation: 'fadeSlideIn 0.4s ease 0.05s both',
                    }}>
                        {STEP_TITLES[step].desc}
                    </p>

                    {/* Step 1: 작업비 */}
                    {step === 1 && (
                        <div style={cardStyle}>
                            <label style={labelStyles}>
                                작업비 (포장·검수비) <span style={{ color: colors.primary }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    value={prepCost === 0 ? '' : prepCost}
                                    onChange={e => updateState({ prepCost: Number(e.target.value) })}
                                    placeholder="0"
                                    style={{ ...inputStyles, paddingLeft: '32px' }}
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                />
                                <span style={{
                                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                                    color: colors.text.primary, fontWeight: font.weight.semibold,
                                }}>₩</span>
                            </div>

                            <div style={{
                                marginTop: spacing['5'],
                                padding: spacing['4'],
                                background: colors.bg.info,
                                borderRadius: radius.lg,
                                border: `1px solid ${colors.primaryLightBorder}`,
                            }}>
                                <div style={{ fontSize: font.size.sm, color: colors.text.secondary, lineHeight: font.lineHeight.relaxed }}>
                                    <strong style={{ color: colors.primary }}>작업비란?</strong>
                                    <br />
                                    배송대행사에서 상품을 포장·검수할 때 발생하는 수수료입니다.
                                    <br />
                                    예) 큐익스프레스 검수비 ¥100/건 (약 ₩920)
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: 해외 배송비 */}
                    {step === 2 && (
                        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>
                            <div>
                                <label style={labelStyles}>배송대행사</label>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: spacing['4'], borderRadius: radius.lg,
                                    border: `1px solid ${colors.border.default}`,
                                    background: colors.bg.subtle,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                                        <Truck size={16} color={hasForwarderRate ? colors.primary : colors.text.muted} />
                                        <span style={{
                                            fontSize: font.size.base, fontWeight: font.weight.semibold,
                                            color: hasForwarderRate ? colors.text.primary : colors.text.muted,
                                        }}>
                                            {hasForwarderRate
                                                ? FORWARDER_RATES[forwarder]?.label
                                                : forwarder === 'other' ? '직접 입력 (기타)' : '선택된 배송대행사 없음'}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ margin: `${spacing['2']} 0 0`, fontSize: font.size.sm, color: colors.text.muted }}>
                                    이전 단계(기본 정보)에서 선택한 배송대행사가 적용되어 있습니다.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => transitionTo('/basic-info')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        fontSize: font.size.sm, fontWeight: font.weight.semibold,
                                        color: colors.primary, background: 'transparent',
                                        border: 'none', cursor: 'pointer', padding: `${spacing['1']} 0`, marginTop: spacing['1'],
                                    }}
                                >
                                    다른 배송대행사를 쓰시나요? <ChevronRight size={14} />
                                </button>
                            </div>

                            {hasForwarderRate && (
                                <div style={{
                                    background: colors.bg.info, border: `1px solid ${colors.primaryLightBorder}`,
                                    borderRadius: radius.lg, padding: spacing['4'],
                                    display: 'flex', flexDirection: 'column', gap: spacing['2'],
                                    animation: 'fadeSlideIn 0.25s ease',
                                }}>
                                    <p style={{ margin: 0, fontSize: font.size.sm, color: colors.text.tertiary, lineHeight: font.lineHeight.normal }}>
                                        상품 무게에 따라 배송비가 자동으로 계산됩니다.
                                    </p>
                                    <div style={{
                                        background: colors.bg.surface, borderRadius: radius.md,
                                        padding: `${spacing['3']} ${spacing['3']}`,
                                        border: `1px solid ${colors.border.default}`, fontSize: font.size.xs,
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: font.weight.semibold, color: colors.text.secondary }}>
                                            <span>무게</span><span>배송비</span>
                                        </div>
                                        {FORWARDER_RATES[forwarder]?.rows.map((row, i) => (
                                            <div key={i} style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                padding: '3px 0', color: colors.text.tertiary,
                                                borderTop: i > 0 ? `1px solid ${colors.bg.subtle}` : 'none',
                                            }}>
                                                <span>~{row.maxKg}kg</span>
                                                <span style={{ fontWeight: font.weight.semibold, color: colors.text.primary }}>¥{row.fee.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!hasForwarderRate && (
                                <div style={{ animation: 'fadeSlideIn 0.25s ease' }}>
                                    <label style={labelStyles}>
                                        배송비 금액 <span style={{ color: colors.primary }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            value={intlShipping === 0 ? '' : intlShipping}
                                            onChange={e => updateState({ intlShipping: Number(e.target.value) })}
                                            placeholder="0"
                                            style={{ ...inputStyles, paddingLeft: '32px' }}
                                            onFocus={handleInputFocus}
                                            onBlur={handleInputBlur}
                                        />
                                        <span style={{
                                            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                                            color: colors.text.primary, fontWeight: font.weight.semibold,
                                        }}>¥</span>
                                    </div>
                                    <p style={{ margin: `${spacing['2']} 0 0`, fontSize: font.size.sm, color: colors.text.muted }}>
                                        대표 상품 기준으로 입력해주세요. 보통 ¥500~¥1,000 수준입니다.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: 마진율 + 시뮬레이션 */}
                    {step === 3 && (
                        <div style={{ animation: 'fadeSlideIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: spacing['6'], position: 'relative' }}>
                            {/* 마진 설정 */}
                            <div style={{
                                background: colors.bg.surface, borderRadius: radius.xl,
                                padding: spacing['8'], boxShadow: shadow.sm,
                                border: `1px solid ${colors.bg.subtle}`,
                            }}>
                                <label style={{ ...labelStyles, marginBottom: spacing['3'] }}>기본 마진율</label>

                                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['4'] }}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <input
                                            type="number"
                                            value={marginValue || ''}
                                            onChange={e => updateState({ marginValue: Math.min(60, Math.max(5, Number(e.target.value))) })}
                                            className="no-spinner"
                                            style={{
                                                width: '64px', padding: `${spacing['3']} ${spacing['3']}`,
                                                paddingRight: '24px',
                                                fontSize: font.size.md, fontWeight: font.weight.semibold,
                                                fontFamily: font.family.sans,
                                                color: colors.text.primary, background: colors.bg.surface,
                                                border: `1.5px solid ${colors.border.default}`,
                                                borderRadius: radius.md, outline: 'none',
                                                MozAppearance: 'textfield',
                                                transition: 'border-color 0.2s ease',
                                            }}
                                            onFocus={e => { e.currentTarget.style.borderColor = colors.primary; }}
                                            onBlur={e => { e.currentTarget.style.borderColor = colors.border.default; }}
                                        />
                                        <span style={{
                                            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                            fontSize: font.size.sm, fontWeight: font.weight.semibold,
                                            color: colors.text.muted,
                                        }}>%</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="range"
                                            min={5} max={60} step={5}
                                            value={marginValue}
                                            onChange={e => updateState({ marginValue: Number(e.target.value) })}
                                            className="margin-slider"
                                            style={{
                                                '--slider-color': marginSignal.sliderColor,
                                                width: '100%', height: '4px', appearance: 'none', WebkitAppearance: 'none',
                                                background: `linear-gradient(to right, ${marginSignal.sliderColor} ${sliderPct}%, ${colors.border.default} ${sliderPct}%)`,
                                                borderRadius: radius.full, outline: 'none', cursor: 'pointer',
                                                transition: 'background 0.3s ease',
                                            } as React.CSSProperties}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>5%</span>
                                            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>60%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 시그널 콜아웃 */}
                                <div style={{
                                    marginTop: spacing['4'],
                                    padding: `${spacing['3']} ${spacing['4']}`,
                                    background: signalStyles.bg,
                                    borderRadius: radius.lg,
                                    border: `1px solid ${signalStyles.border}`,
                                    display: 'flex', alignItems: 'center', gap: spacing['2'],
                                    transition: 'all 0.25s ease',
                                }}>
                                    <signalStyles.Icon size={15} style={{ color: signalStyles.text, flexShrink: 0 }} />
                                    <span style={{
                                        fontSize: font.size.sm, color: signalStyles.text,
                                        fontWeight: font.weight.medium, lineHeight: font.lineHeight.normal,
                                    }}>
                                        {marginSignal.text}
                                    </span>
                                </div>
                            </div>

                            {/* 가격 시뮬레이션 */}
                            <div style={{
                                position: 'absolute',
                                left: 'calc(100% + 24px)',
                                top: 0,
                                width: '360px',
                                maxHeight: 'calc(100vh - 200px)',
                                overflowY: 'auto',
                                background: colors.bg.subtle, borderRadius: radius.xl,
                                border: `1px solid ${colors.border.default}`,
                                zIndex: 10,
                            }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: spacing['2'],
                                    padding: `${spacing['4']} ${spacing['6']}`,
                                    color: colors.text.primary, fontSize: font.size.base, fontWeight: font.weight.bold,
                                }}>
                                    <Calculator size={16} color={colors.primary} />
                                    가격 시뮬레이션
                                </div>

                                <div style={{
                                    padding: `0 ${spacing['6']} ${spacing['6']}`,
                                    display: 'flex', flexDirection: 'column', gap: spacing['5'],
                                }}>
                                    {/* 환율 뱃지 */}
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start',
                                        gap: spacing['1'], padding: '4px 10px',
                                        background: colors.bg.info, borderRadius: radius.full,
                                        border: `1px solid ${colors.primaryLightBorder}`,
                                    }}>
                                        <span style={{ fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.primary }}>
                                            오늘의 환율
                                        </span>
                                        <span style={{ fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.text.primary }}>
                                            ¥1 = ₩{exchangeRate.toFixed(1)}
                                        </span>
                                    </div>

                                    {/* 입력: 원가 + 무게 */}
                                    <div style={{ display: 'flex', gap: spacing['3'] }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: '6px', fontWeight: font.weight.semibold }}>상품 원가</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    value={simBaseCost.toLocaleString()}
                                                    onChange={e => setSimBaseCost(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                                    style={{ ...inputStyles, padding: `${spacing['3']} ${spacing['3']}`, paddingLeft: '24px', fontSize: font.size.md, fontWeight: font.weight.semibold, fontFamily: font.family.sans }}
                                                />
                                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.text.muted, fontWeight: font.weight.semibold, fontSize: font.size.sm }}>₩</span>
                                            </div>
                                        </div>
                                        <WeightDropdown value={simWeight} onChange={setSimWeight} />
                                    </div>

                                    {/* 결과: 판매가 → 실수령액 → 순수익 */}
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', gap: 0,
                                        background: colors.bg.page, borderRadius: radius.lg,
                                        border: `1px solid ${colors.border.default}`,
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}` }}>
                                            <span style={{ fontSize: font.size.sm, color: colors.text.muted, fontWeight: font.weight.medium }}>Qoo10 판매가</span>
                                            <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.primary, fontFamily: font.family.sans }}>
                                                ¥{finalPriceJpy.toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{ height: '1px', background: colors.border.default, margin: `0 ${spacing['4']}` }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}` }}>
                                            <span style={{ fontSize: font.size.sm, color: colors.text.muted, fontWeight: font.weight.medium }}>실수령액 (수수료 차감 후)</span>
                                            <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.text.primary, fontFamily: font.family.sans }}>
                                                ₩{payoutKrw.toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{ height: '1px', background: colors.border.default, margin: `0 ${spacing['4']}` }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}`, background: actualProfitKrw > 0 ? '#F0FFF4' : '#FEF2F2' }}>
                                            <span style={{ fontSize: font.size.sm, color: actualProfitKrw > 0 ? colors.success : colors.danger, fontWeight: font.weight.semibold }}>순수익</span>
                                            <span style={{
                                                fontSize: font.size.base, fontWeight: font.weight.bold, fontFamily: font.family.sans,
                                                color: actualProfitKrw > 0 ? colors.success : colors.danger,
                                            }}>
                                                {actualProfitKrw >= 0 ? '+' : ''}₩{actualProfitKrw.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 계산 과정 토글 */}
                                    <button
                                        onClick={() => setShowCalculation(!showCalculation)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            width: '100%', background: 'transparent', border: `1px solid ${colors.border.default}`,
                                            borderRadius: radius.md, padding: `${spacing['2']} ${spacing['3']}`,
                                            color: colors.text.tertiary, fontSize: font.size.sm, fontWeight: font.weight.medium,
                                            cursor: 'pointer', transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = colors.bg.page}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {showCalculation ? '계산 과정 접기' : '계산 과정 보기'}
                                        {showCalculation ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    </button>
                                    {showCalculation && (
                                        <div style={{
                                            background: colors.bg.page, borderRadius: radius.md,
                                            padding: spacing['4'], border: `1px solid ${colors.border.default}`,
                                            display: 'flex', flexDirection: 'column', gap: spacing['3'],
                                        }}>
                                            {calcRows.map((row, i) => (
                                                <Fragment key={i}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], color: colors.text.muted, fontSize: font.size.xs }}>
                                                            {row.icon} {row.label}
                                                        </div>
                                                        <div style={{
                                                            fontSize: row.highlight ? font.size.md : font.size.sm,
                                                            fontWeight: row.highlight ? 800 : font.weight.bold,
                                                            color: row.highlight ? colors.primary : colors.text.primary,
                                                            fontFamily: font.family.sans,
                                                        }}>
                                                            {row.value}
                                                        </div>
                                                    </div>
                                                    {i < calcRows.length - 1 && (
                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                            <ArrowRight size={12} color={colors.border.default} style={{ transform: 'rotate(90deg)' }} />
                                                        </div>
                                                    )}
                                                </Fragment>
                                            ))}
                                            <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: spacing['3'], fontSize: font.size.xs, color: colors.text.muted }}>
                                                Qoo10 수수료: 패션/뷰티 10~12% · 기타 6~10% (현재 12% 적용)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div style={{
                        marginTop: spacing['6'],
                        display: 'flex', flexDirection: 'column', gap: spacing['3'],
                    }}>
                        <button
                            onClick={handleNext}
                            style={{
                                width: '100%', height: '52px',
                                background: colors.primary, color: colors.bg.surface,
                                border: 'none', borderRadius: radius.lg,
                                fontSize: '16px', fontWeight: font.weight.semibold, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing['2'],
                                transition: 'background 0.2s, transform 0.1s',
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            다음
                        </button>
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                style={{
                                    width: '100%', height: '44px',
                                    background: 'transparent', color: colors.text.tertiary,
                                    border: 'none', borderRadius: radius.lg,
                                    fontSize: font.size.base, fontWeight: font.weight.medium,
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'color 0.2s',
                                }}
                                onMouseOver={e => e.currentTarget.style.color = colors.text.primary}
                                onMouseOut={e => e.currentTarget.style.color = colors.text.tertiary}
                            >
                                이전으로
                            </button>
                        )}
                    </div>
                        </>
                    )}

                    <style>{`
                        @keyframes fadeSlideIn {
                            from { opacity: 0; transform: translateY(8px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .no-spinner::-webkit-outer-spin-button,
                        .no-spinner::-webkit-inner-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                        }
                        .margin-slider::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            width: 14px;
                            height: 14px;
                            border-radius: 50%;
                            background: var(--slider-color, ${colors.primary});
                            border: none;
                            box-shadow: 0 0 0 8px color-mix(in srgb, var(--slider-color, ${colors.primary}) 15%, transparent);
                            cursor: pointer;
                            transition: box-shadow 0.2s ease;
                        }
                        .margin-slider::-webkit-slider-thumb:hover {
                            box-shadow: 0 0 0 12px color-mix(in srgb, var(--slider-color, ${colors.primary}) 20%, transparent);
                        }
                        .margin-slider::-webkit-slider-thumb:active {
                            box-shadow: 0 0 0 16px color-mix(in srgb, var(--slider-color, ${colors.primary}) 25%, transparent);
                        }
                        .margin-slider::-moz-range-thumb {
                            width: 14px;
                            height: 14px;
                            border-radius: 50%;
                            background: var(--slider-color, ${colors.primary});
                            border: none;
                            box-shadow: 0 0 0 8px color-mix(in srgb, var(--slider-color, ${colors.primary}) 15%, transparent);
                            cursor: pointer;
                        }
                    `}</style>
                </div>
            </OnboardingLayout>

        </>
    );
}
