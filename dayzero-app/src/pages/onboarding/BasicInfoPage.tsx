import { Fragment, useMemo, useState, useRef, useEffect } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, FileText, Calculator, Package, Truck, Globe, RefreshCw, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingTransition } from '../../components/onboarding/useOnboardingTransition';
import { colors, font, radius, spacing, shadow } from '../../design/tokens';
import { useOnboarding, type ForwarderValue } from '../../components/onboarding/OnboardingContext';
import { FORWARDER_PRESETS, FORWARDER_RATES, lookupShippingFee, PLATFORM_FEE_RATE, EXCHANGE_RATE as DAILY_EXCHANGE_RATE, WEIGHT_OPTIONS } from '../../utils/forwarder';

const PRESETS = FORWARDER_PRESETS;

/* ── WeightDropdown ── */

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
    danger: { bg: colors.dangerBg, border: colors.dangerLight, text: colors.dangerDark, Icon: AlertTriangle },
    warning: { bg: colors.warningLight, border: colors.warningBorder, text: colors.warningIcon, Icon: TrendingUp },
    success: { bg: colors.bg.info, border: colors.primaryLightBorder, text: colors.primary, Icon: CheckCircle },
} as const;

const STEP_TITLES: Record<number, { title: string; desc: string }> = {
    1: {
        title: '연락처를 입력해주세요',
        desc: '배송 문제나 클레임 발생 시 연락 가능한 번호를 입력해주세요.',
    },
    2: {
        title: '일본 출하지와 반품 주소를 설정해주세요',
        desc: '배송대행사를 선택하면 해당 창고 주소가 자동으로 입력됩니다.',
    },
    3: {
        title: '해외 배송비를 설정해주세요',
        desc: '한국에서 일본 소비자에게 배송할 때 발생하는 국제 배송 비용입니다.',
    },
    4: {
        title: '작업비를 설정해주세요',
        desc: '배송대행사에 포장·검수를 맡기고 있다면 해당 비용을 입력해주세요.',
    },
    5: {
        title: '기본 마진율을 설정해주세요',
        desc: '설정한 마진율이 모든 상품에 기본 적용됩니다. 상품별로 나중에 변경할 수 있어요.',
    },
};

const SHIPPING_WEIGHTS = [0.5, 1.0, 1.5, 2.0, 2.5];

/* ── 메인 컴포넌트 ── */

export default function BasicInfoPage() {
    const { state, setState } = useOnboarding();
    const { exiting, transitionTo } = useOnboardingTransition();
    const [step, setStep] = useState(1);
    const isRevisit = (state.visitedPages ?? []).includes('basic-info');
    const [showIntro, setShowIntro] = useState(!isRevisit);
    const [introFading, setIntroFading] = useState(false);
    const [introLine, setIntroLine] = useState(isRevisit ? 3 : 0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        forwarder,
        zipCode,
        addressLine1,
        addressLine2,
        sameAsShipping,
        returnZipCode,
        returnAddressLine1,
        returnAddressLine2,
        contact,
        marginValue,
        prepCost,
        intlShipping,
    } = state;

    const updateState = (updates: Partial<typeof state>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

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
            setState(prev => ({ ...prev, visitedPages: [...prev.visitedPages, 'basic-info'] }));
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePresetSelect = (val: ForwarderValue) => {
        const preset = PRESETS.find(p => p.id === val);
        const updates: Parameters<typeof updateState>[0] = { forwarder: val };

        if (preset && preset.id !== 'other') {
            updates.zipCode = preset.zipCode;
            updates.addressLine1 = preset.addressLine1;
            updates.addressLine2 = preset.addressLine2;
        } else if (preset?.id === 'other') {
            updates.zipCode = '';
            updates.addressLine1 = '';
            updates.addressLine2 = '';
        }

        updateState(updates);
        setIsDropdownOpen(false);
    };

    /* ── 무게별 배송비 로컬 state ── */
    const [shippingShowKrw, setShippingShowKrw] = useState(false);
    const [shippingByWeight, setShippingByWeight] = useState<Record<number, number>>(() => {
        const init: Record<number, number> = {};
        SHIPPING_WEIGHTS.forEach(w => { init[w] = 0; });
        return init;
    });

    const updateShippingWeight = (weight: number, value: number) => {
        setShippingByWeight(prev => {
            const next = { ...prev, [weight]: value };
            // 가장 가벼운 무게(0.5kg)의 값을 intlShipping에 동기화
            if (weight === SHIPPING_WEIGHTS[0]) {
                updateState({ intlShipping: value });
            }
            return next;
        });
    };

    /* ── 유효성 검사 ── */
    const isStep1Valid = () => !!contact;
    const isStep2Valid = () => {
        if (!forwarder) return false;
        if (!zipCode || !addressLine1) return false;
        if (!sameAsShipping) {
            if (!returnZipCode || !returnAddressLine1) return false;
        }
        return true;
    };

    const isValid = step === 1 ? isStep1Valid() : step === 2 ? isStep2Valid() : true;

    /* ── 마진 계산 (Step 5) ── */
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

    const marginSignal = marginValue < 15
        ? { text: '마진이 너무 낮아요. 판매해도 수익이 거의 남지 않을 수 있어요.', sliderColor: colors.danger, type: 'danger' as const }
        : marginValue < 25
            ? { text: '가격은 경쟁력 있지만, 수익이 많지 않을 수 있어요.', sliderColor: colors.orangeIcon, type: 'warning' as const }
            : marginValue <= 40
                ? { text: '적정 마진율이에요. 초보 셀러에게 권장하는 범위입니다.', sliderColor: colors.primary, type: 'success' as const }
                : marginValue <= 50
                    ? { text: '경쟁 상품 대비 가격이 높아 판매가 어려울 수 있어요.', sliderColor: colors.orangeIcon, type: 'warning' as const }
                    : { text: '가격이 너무 높아요. 경쟁 상품 대비 판매가 어려울 수 있어요.', sliderColor: colors.danger, type: 'danger' as const };

    const sliderPct = ((marginValue - 5) / (60 - 5)) * 100;
    const signalStyles = MARGIN_SIGNALS[marginSignal.type];

    /* ── 네비게이션 ── */
    const handleNext = () => {
        if (step < 5) setStep(step + 1);
        else transitionTo('/extension-install');
    };

    return (
        <OnboardingLayout currentStep={2} exiting={exiting} onStepClick={(stepId) => { if (stepId === 1) transitionTo('/qoo10-connect'); }}>
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
                            fontSize: font.size['xl+'], fontWeight: font.weight.semibold,
                            color: colors.text.primary, lineHeight: '1.4',
                            wordBreak: 'keep-all', margin: '0 0 10px', letterSpacing: '-0.5px',
                            opacity: introLine >= 1 ? 1 : 0,
                            transform: introLine >= 1 ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'opacity 0.6s ease, transform 0.6s ease',
                        }}>
                            일본에 상품을 보내려면
                        </p>
                        <p style={{
                            fontSize: font.size['xl+'], fontWeight: font.weight.semibold,
                            color: colors.text.primary, lineHeight: '1.4',
                            wordBreak: 'keep-all', margin: '0 0 10px', letterSpacing: '-0.5px',
                            opacity: introLine >= 2 ? 1 : 0,
                            transform: introLine >= 2 ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'opacity 0.6s ease, transform 0.6s ease',
                        }}>
                            몇 가지{' '}
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '9px',
                                padding: '6px 16px', borderRadius: radius.img,
                                border: `2px solid ${colors.border.default}`,
                                background: colors.bg.surface,
                                verticalAlign: 'middle',
                                fontSize: font.size['lg+'], fontWeight: font.weight.semibold,
                                margin: '0 4px',
                                position: 'relative', top: '-2px',
                            }}>
                                <FileText size={18} color={colors.primary} style={{ flexShrink: 0 }} />
                                기본 정보
                            </span>
                            가 필요해요.
                        </p>
                        <p style={{
                            fontSize: font.size['xl+'], fontWeight: font.weight.semibold,
                            color: colors.text.primary, lineHeight: '1.4',
                            wordBreak: 'keep-all', margin: '0 0 10px', letterSpacing: '-0.5px',
                            opacity: introLine >= 3 ? 1 : 0,
                            transform: introLine >= 3 ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'opacity 0.6s ease, transform 0.6s ease',
                        }}>
                            같이 채워볼까요?
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
                {/* Step title + desc */}
                <h2 style={{
                    fontSize: font.size['2xl-'], fontWeight: font.weight.bold, color: colors.text.primary,
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

                {/* Step 1: 연락처 */}
                {step === 1 && (
                    <div style={cardStyle}>
                        <label style={labelStyles}>
                            스토어 연락처 <span style={{ color: colors.primary }}>*</span>
                        </label>
                        <input
                            value={contact}
                            onChange={(e) => updateState({ contact: e.target.value })}
                            placeholder="고객 응대용 연락처 입력 (예: 010-1234-5678)"
                            style={inputStyles}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        />
                    </div>
                )}

                {/* Step 2: 출하지 주소 + 반품 */}
                {step === 2 && (
                    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
                        {/* Forwarder Dropdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>
                            <div>
                                <label style={labelStyles}>출하지 주소 <span style={{ color: colors.primary }}>*</span></label>
                                <div style={{ position: 'relative' }} ref={dropdownRef}>
                                    <div
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        style={{
                                            ...inputStyles,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            color: forwarder ? colors.text.primary : colors.text.muted,
                                            borderColor: isDropdownOpen ? colors.primary : colors.border.default,
                                            boxShadow: isDropdownOpen ? '0 0 0 3px rgba(49, 130, 246, 0.1)' : 'none',
                                            userSelect: 'none',
                                        }}
                                    >
                                        <span>
                                            {forwarder ? PRESETS.find(p => p.id === forwarder)?.label : '배송대행사를 선택하면 주소가 자동 입력됩니다'}
                                        </span>
                                        <ChevronDown
                                            size={20}
                                            color={isDropdownOpen ? colors.primary : colors.text.muted}
                                            style={{
                                                transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                                                transition: 'transform 0.2s ease, color 0.2s ease',
                                            }}
                                        />
                                    </div>

                                    {isDropdownOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 8px)',
                                            left: 0,
                                            width: '100%',
                                            background: colors.bg.surface,
                                            border: `1px solid ${colors.border.default}`,
                                            borderRadius: radius.lg,
                                            boxShadow: shadow.md,
                                            overflow: 'hidden',
                                            zIndex: 10,
                                            animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        }}>
                                            <style>{`
                                                @keyframes dropdownFadeIn {
                                                    from { opacity: 0; transform: translateY(-8px); }
                                                    to { opacity: 1; transform: translateY(0); }
                                                }
                                                .dropdown-item {
                                                    padding: 16px;
                                                    font-size: 15px;
                                                    color: ${colors.text.primary};
                                                    cursor: pointer;
                                                    transition: background 0.2s ease;
                                                }
                                                .dropdown-item:hover {
                                                    background: ${colors.bg.page};
                                                }
                                                .dropdown-item-selected {
                                                    background: ${colors.primaryLight};
                                                    color: ${colors.primary};
                                                    font-weight: 600;
                                                }
                                                .dropdown-item-selected:hover {
                                                    background: ${colors.primaryHover};
                                                }
                                            `}</style>
                                            {PRESETS.map((p) => (
                                                <div
                                                    key={p.id}
                                                    className={`dropdown-item ${forwarder === p.id ? 'dropdown-item-selected' : ''}`}
                                                    onClick={() => handlePresetSelect(p.id)}
                                                >
                                                    {p.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Address auto-fill */}
                            {forwarder && (
                                <div style={{
                                    padding: spacing['5'],
                                    background: colors.bg.faint,
                                    borderRadius: radius.lg,
                                    border: `1px solid ${colors.border.default}`,
                                    animation: 'fadeSlideIn 0.25s ease',
                                }}>
                                    <div style={{
                                        fontSize: font.size.base,
                                        fontWeight: font.weight.bold,
                                        color: colors.text.primary,
                                        marginBottom: spacing['3'],
                                    }}>
                                        출하지 (일본 창고 주소)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                                        <input
                                            value={zipCode}
                                            onChange={(e) => updateState({ zipCode: e.target.value })}
                                            placeholder="우편번호 (예: 273-0012)"
                                            style={{
                                                ...inputStyles,
                                                background: forwarder !== 'other' ? colors.bg.subtle : colors.bg.surface,
                                            }}
                                            disabled={forwarder !== 'other'}
                                        />
                                        <input
                                            value={addressLine1}
                                            onChange={(e) => updateState({ addressLine1: e.target.value })}
                                            placeholder="기본 주소"
                                            style={{
                                                ...inputStyles,
                                                background: forwarder !== 'other' ? colors.bg.subtle : colors.bg.surface,
                                            }}
                                            disabled={forwarder !== 'other'}
                                        />
                                        <input
                                            value={addressLine2}
                                            onChange={(e) => updateState({ addressLine2: e.target.value })}
                                            placeholder="상세 주소"
                                            style={{
                                                ...inputStyles,
                                                background: forwarder !== 'other' ? colors.bg.subtle : colors.bg.surface,
                                            }}
                                            disabled={forwarder !== 'other'}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Return Address */}
                        <div style={{
                            borderTop: `1px solid ${colors.bg.subtle}`,
                            paddingTop: spacing['6'],
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ ...labelStyles, marginBottom: 0 }}>
                                    반품 주소 <span style={{ color: colors.primary }}>*</span>
                                </label>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing['2'],
                                    cursor: 'pointer',
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={sameAsShipping}
                                        onChange={(e) => updateState({ sameAsShipping: e.target.checked })}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer',
                                            accentColor: colors.primary,
                                        }}
                                    />
                                    <span style={{
                                        fontSize: font.size.md,
                                        fontWeight: font.weight.medium,
                                        color: colors.text.secondary,
                                    }}>
                                        위 출하지 주소와 동일
                                    </span>
                                </label>
                            </div>

                            {!sameAsShipping && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: spacing['3'],
                                    marginTop: spacing['4'],
                                    animation: 'fadeSlideIn 0.25s ease',
                                }}>
                                    <input
                                        value={returnZipCode}
                                        onChange={(e) => updateState({ returnZipCode: e.target.value })}
                                        placeholder="우편번호"
                                        style={inputStyles}
                                    />
                                    <input
                                        value={returnAddressLine1}
                                        onChange={(e) => updateState({ returnAddressLine1: e.target.value })}
                                        placeholder="기본 주소"
                                        style={inputStyles}
                                    />
                                    <input
                                        value={returnAddressLine2}
                                        onChange={(e) => updateState({ returnAddressLine2: e.target.value })}
                                        placeholder="상세 주소"
                                        style={inputStyles}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: 해외 배송비 */}
                {step === 3 && (
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
                                이전 단계에서 선택한 배송대행사가 적용되어 있습니다.
                            </p>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <p style={{ margin: 0, fontSize: font.size.sm, color: colors.text.tertiary, lineHeight: font.lineHeight.normal }}>
                                        상품 무게에 따라 배송비가 자동으로 계산됩니다.
                                    </p>
                                    <div style={{ display: 'flex', borderRadius: radius.sm, overflow: 'hidden', border: `1px solid ${colors.border.default}` }}>
                                        <button onClick={() => setShippingShowKrw(false)} style={{
                                            padding: `2px ${spacing['2']}`, border: 'none', cursor: 'pointer',
                                            fontSize: font.size.xs, fontWeight: font.weight.semibold,
                                            background: !shippingShowKrw ? colors.primary : colors.bg.surface,
                                            color: !shippingShowKrw ? colors.white : colors.text.muted,
                                            transition: 'all 0.15s',
                                        }}>¥</button>
                                        <button onClick={() => setShippingShowKrw(true)} style={{
                                            padding: `2px ${spacing['2']}`, border: 'none', cursor: 'pointer',
                                            fontSize: font.size.xs, fontWeight: font.weight.semibold,
                                            background: shippingShowKrw ? colors.primary : colors.bg.surface,
                                            color: shippingShowKrw ? colors.white : colors.text.muted,
                                            borderLeft: `1px solid ${colors.border.default}`,
                                            transition: 'all 0.15s',
                                        }}>₩</button>
                                    </div>
                                </div>
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
                                            <span style={{ fontWeight: font.weight.semibold, color: colors.text.primary, textAlign: 'right' }}>
                                                {shippingShowKrw ? `₩${Math.round(row.fee * exchangeRate).toLocaleString()}` : `¥${row.fee.toLocaleString()}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!hasForwarderRate && (
                            <div style={{ animation: 'fadeSlideIn 0.25s ease' }}>
                                <div style={{
                                    border: `1px solid ${colors.border.default}`,
                                    borderRadius: radius.lg,
                                    overflow: 'hidden',
                                    background: colors.bg.faint,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing['2']} ${spacing['4']}` }}>
                                        <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>
                                            무게별 배송비를 입력해주세요.
                                        </span>
                                        <div style={{ display: 'flex', borderRadius: radius.sm, overflow: 'hidden', border: `1px solid ${colors.border.default}` }}>
                                            <button onClick={() => setShippingShowKrw(false)} style={{
                                                padding: `2px ${spacing['2']}`, border: 'none', cursor: 'pointer',
                                                fontSize: font.size.xs, fontWeight: font.weight.semibold,
                                                background: !shippingShowKrw ? colors.primary : colors.bg.surface,
                                                color: !shippingShowKrw ? colors.white : colors.text.muted,
                                                transition: 'all 0.15s',
                                            }}>¥</button>
                                            <button onClick={() => setShippingShowKrw(true)} style={{
                                                padding: `2px ${spacing['2']}`, border: 'none', cursor: 'pointer',
                                                fontSize: font.size.xs, fontWeight: font.weight.semibold,
                                                background: shippingShowKrw ? colors.primary : colors.bg.surface,
                                                color: shippingShowKrw ? colors.white : colors.text.muted,
                                                borderLeft: `1px solid ${colors.border.default}`,
                                                transition: 'all 0.15s',
                                            }}>₩</button>
                                        </div>
                                    </div>
                                    {SHIPPING_WEIGHTS.map((w) => {
                                        const krw = Math.round((shippingByWeight[w] || 0) * exchangeRate);
                                        return (
                                        <div key={w} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: `${spacing['2']} ${spacing['4']}`,
                                            borderTop: `1px solid ${colors.bg.subtle}`,
                                        }}>
                                            <span style={{
                                                fontSize: font.size.sm, fontWeight: font.weight.medium,
                                                color: colors.text.primary,
                                            }}>
                                                {w}kg
                                            </span>
                                            {shippingShowKrw ? (
                                                <div style={{ position: 'relative', width: '100px' }}>
                                                    <input
                                                        type="number"
                                                        className="no-spinner"
                                                        value={krw === 0 ? '' : krw}
                                                        onChange={e => {
                                                            const krwVal = Number(e.target.value);
                                                            updateShippingWeight(w, Math.round(Math.max(0, krwVal) / exchangeRate));
                                                        }}
                                                        placeholder="0"
                                                        style={{
                                                            ...inputStyles,
                                                            width: '100px', borderRadius: radius.sm,
                                                            padding: `${spacing['2']} ${spacing['2']}`, paddingRight: '22px',
                                                            textAlign: 'right', fontSize: font.size.sm,
                                                            fontWeight: font.weight.semibold,
                                                            MozAppearance: 'textfield' as never,
                                                        }}
                                                        onFocus={handleInputFocus}
                                                        onBlur={handleInputBlur}
                                                    />
                                                    <span style={{
                                                        position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                                                        fontSize: font.size.xs, color: colors.text.muted, pointerEvents: 'none',
                                                    }}>₩</span>
                                                </div>
                                            ) : (
                                                <div style={{ position: 'relative', width: '100px' }}>
                                                    <input
                                                        type="number"
                                                        className="no-spinner"
                                                        value={shippingByWeight[w] === 0 ? '' : shippingByWeight[w]}
                                                        onChange={e => updateShippingWeight(w, Number(e.target.value))}
                                                        placeholder="0"
                                                        style={{
                                                            ...inputStyles,
                                                            width: '100px', borderRadius: radius.sm,
                                                            padding: `${spacing['2']} ${spacing['2']}`, paddingRight: '22px',
                                                            textAlign: 'right', fontSize: font.size.sm,
                                                            fontWeight: font.weight.semibold,
                                                            MozAppearance: 'textfield' as never,
                                                        }}
                                                        onFocus={handleInputFocus}
                                                        onBlur={handleInputBlur}
                                                    />
                                                    <span style={{
                                                        position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                                                        fontSize: font.size.xs, color: colors.text.muted, pointerEvents: 'none',
                                                    }}>¥</span>
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: 작업비 */}
                {step === 4 && (
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

                {/* Step 5: 마진율 + 시뮬레이션 */}
                {step === 5 && (
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

                        {/* 가격 시뮬레이션 사이드 패널 */}
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}`, background: actualProfitKrw > 0 ? colors.successBg : colors.dangerBg }}>
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
                        disabled={!isValid}
                        style={{
                            width: '100%', height: '52px',
                            background: !isValid ? colors.border.light : colors.primary,
                            color: colors.bg.surface,
                            border: 'none', borderRadius: radius.lg,
                            fontSize: font.size['base+'], fontWeight: font.weight.semibold,
                            cursor: !isValid ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing['2'],
                            transition: 'background 0.2s, transform 0.1s',
                        }}
                        onMouseDown={e => { if (isValid) e.currentTarget.style.transform = 'scale(0.98)'; }}
                        onMouseUp={e => { if (isValid) e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        {step < 5 ? '다음' : '다음 단계로 계속'}
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
                    @keyframes introPopIn {
                        from { opacity: 0; transform: scale(0.6); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    @keyframes introTextIn {
                        from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes introCardIn {
                        from { opacity: 0; transform: translateY(16px) scale(0.96); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
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
    );
}
