import { Fragment, useMemo, useState, useRef, useEffect } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, Calculator, Package, Truck, Globe, RefreshCw, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingTransition } from '../../components/onboarding/useOnboardingTransition';
import { useOnboarding, type ForwarderValue } from '../../components/onboarding/OnboardingContext';
import { colors, font, radius, spacing, shadow } from '../../design/tokens';

const PLATFORM_FEE_RATE = 0.12;
const DAILY_EXCHANGE_RATE = 9.2;

/* ── 배송대행사별 요율표 (무게 kg → 배송비 ¥) ── */
interface RateRow { maxKg: number; fee: number }

const FORWARDER_RATES: Record<string, { label: string; rows: RateRow[] }> = {
    kse: {
        label: 'KSE 국제로지스틱',
        rows: [
            { maxKg: 0.10, fee: 490 }, { maxKg: 0.25, fee: 560 }, { maxKg: 0.50, fee: 620 },
            { maxKg: 0.75, fee: 700 }, { maxKg: 1.00, fee: 750 }, { maxKg: 1.25, fee: 780 },
            { maxKg: 1.50, fee: 830 }, { maxKg: 1.75, fee: 880 }, { maxKg: 2.00, fee: 940 },
            { maxKg: 2.50, fee: 1090 },
        ],
    },
    qx: {
        label: '큐익스프레스',
        rows: [
            { maxKg: 0.10, fee: 433 }, { maxKg: 0.25, fee: 537 }, { maxKg: 0.50, fee: 622 },
            { maxKg: 0.75, fee: 750 }, { maxKg: 1.00, fee: 881 }, { maxKg: 1.25, fee: 975 },
            { maxKg: 1.50, fee: 1071 }, { maxKg: 1.75, fee: 1130 }, { maxKg: 2.00, fee: 1191 },
            { maxKg: 2.50, fee: 1245 },
        ],
    },
    rincos: {
        label: '링코스',
        rows: [
            { maxKg: 0.10, fee: 450 }, { maxKg: 0.25, fee: 545 }, { maxKg: 0.50, fee: 615 },
            { maxKg: 0.75, fee: 690 }, { maxKg: 1.00, fee: 810 }, { maxKg: 1.25, fee: 860 },
            { maxKg: 1.50, fee: 920 }, { maxKg: 1.75, fee: 970 }, { maxKg: 2.00, fee: 1050 },
            { maxKg: 2.50, fee: 1180 },
        ],
    },
};

function lookupShippingFee(forwarder: ForwarderValue, weightKg: number): number {
    const table = FORWARDER_RATES[forwarder];
    if (!table) return 0;
    for (const row of table.rows) {
        if (weightKg <= row.maxKg) return row.fee;
    }
    return table.rows[table.rows.length - 1].fee;
}

const WEIGHT_OPTIONS = [0.1, 0.25, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5];

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

export default function BasicMarginPage() {
    const { state, setState } = useOnboarding();
    const { exiting, transitionTo } = useOnboardingTransition();
    const [step, setStep] = useState(1);

    const { marginValue, prepCost, intlShipping, forwarder } = state;
    const updateState = (updates: Partial<typeof state>) => setState(prev => ({ ...prev, ...updates }));

    const hasForwarderRate = forwarder !== '' && forwarder !== 'other';
    const forwarderLabel = hasForwarderRate ? FORWARDER_RATES[forwarder]?.label ?? '' : '';

    // 배송비 계산용 배송대행사 (기본: 앞에서 선택한 것, 이 페이지에서 변경 가능)
    type ShippingMode = 'auto' | 'manual';
    const [shippingMode, setShippingMode] = useState<ShippingMode>(hasForwarderRate ? 'auto' : 'manual');
    const [shippingForwarder, setShippingForwarder] = useState<string>(hasForwarderRate ? forwarder : '');
    const [isShippingDropdownOpen, setIsShippingDropdownOpen] = useState(false);
    const shippingDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (shippingDropdownRef.current && !shippingDropdownRef.current.contains(e.target as Node))
                setIsShippingDropdownOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const activeForwarder = shippingMode === 'auto' ? shippingForwarder : '';

    const [showComplete, setShowComplete] = useState(false);
    const [showSimulation, setShowSimulation] = useState(false);
    const [showCalculation, setShowCalculation] = useState(false);
    const [simBaseCost, setSimBaseCost] = useState(15000);
    const [simWeight, setSimWeight] = useState(0.3);

    const exchangeRate = DAILY_EXCHANGE_RATE;

    const shippingJpy = shippingMode === 'auto' && activeForwarder
        ? lookupShippingFee(activeForwarder as ForwarderValue, simWeight)
        : intlShipping;

    const { marginAmount, totalCostKrw, finalPriceJpy, payoutKrw, actualProfitKrw } = useMemo(() => {
        // 셀러 총 비용 (원가 + 작업비)
        const costKrw = simBaseCost + prepCost;
        // 셀러가 원하는 수익
        const desiredProfit = Math.round(costKrw * (marginValue / 100));
        // 역산: 수수료·배송비 감안해서 실제 수익이 마진율%가 되는 판매가 산출
        // payoutJpy * exchangeRate = costKrw + desiredProfit + shippingJpy * exchangeRate
        // sellingPrice * (1 - feeRate) = 필요한 payoutJpy
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
        else setShowComplete(true);
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

    const stepTitles: Record<number, { title: string; desc: string }> = {
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

    return (
        <>
            <OnboardingLayout currentStep={3} exiting={exiting} onStepClick={(stepId) => { if (stepId === 1) transitionTo('/qoo10-connect'); if (stepId === 2) transitionTo('/basic-info'); }}>
                <div style={{ padding: `0 ${spacing['5']}` }}>
                    <h2 style={{
                        fontSize: '26px', fontWeight: 800, color: colors.text.primary,
                        textAlign: 'center', margin: `0 0 ${spacing['3']}`, letterSpacing: '-0.5px',
                    }}>
                        {stepTitles[step].title}
                    </h2>
                    <p style={{
                        fontSize: font.size.base, color: colors.text.tertiary,
                        textAlign: 'center', margin: `0 0 ${spacing['8']}`,
                        lineHeight: font.lineHeight.normal, wordBreak: 'keep-all',
                    }}>
                        {stepTitles[step].desc}
                    </p>

                    {/* Step 1: 작업비 */}
                    {step === 1 && (
                        <div style={{
                            background: colors.bg.surface, borderRadius: radius.xl,
                            padding: spacing['8'], boxShadow: shadow.sm,
                            border: `1px solid ${colors.bg.subtle}`,
                            animation: 'fadeSlideIn 0.3s ease',
                        }}>
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
                                    onFocus={e => {
                                        e.currentTarget.style.borderColor = colors.primary;
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(49, 130, 246, 0.1)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.borderColor = colors.border.default;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                                <span style={{
                                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                                    color: colors.text.primary, fontWeight: font.weight.semibold,
                                }}>₩</span>
                            </div>

                            {/* 작업비 설명 카드 */}
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
                        <div style={{
                            background: colors.bg.surface, borderRadius: radius.xl,
                            padding: spacing['8'], boxShadow: shadow.sm,
                            border: `1px solid ${colors.bg.subtle}`,
                            animation: 'fadeSlideIn 0.3s ease',
                            display: 'flex', flexDirection: 'column', gap: spacing['5'],
                        }}>
                            {/* 앞에서 선택한 배송대행사 안내 */}
                            {/* 배송대행사 드롭다운 (직접 설정 포함) */}
                            <div>
                                <label style={labelStyles}>배송대행사 선택</label>
                                <div style={{ position: 'relative' }} ref={shippingDropdownRef}>
                                    <div
                                        onClick={() => setIsShippingDropdownOpen(!isShippingDropdownOpen)}
                                        style={{
                                            ...inputStyles,
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            cursor: 'pointer', userSelect: 'none',
                                            color: (shippingMode === 'auto' && shippingForwarder) || shippingMode === 'manual' ? colors.text.primary : colors.text.muted,
                                            borderColor: isShippingDropdownOpen ? colors.primary : colors.border.default,
                                            boxShadow: isShippingDropdownOpen ? '0 0 0 3px rgba(49, 130, 246, 0.1)' : 'none',
                                        }}
                                    >
                                        <span>
                                            {shippingMode === 'manual'
                                                ? '직접 설정'
                                                : shippingForwarder
                                                    ? FORWARDER_RATES[shippingForwarder]?.label
                                                    : '배송대행사를 선택해주세요'}
                                        </span>
                                        <ChevronDown size={20} color={isShippingDropdownOpen ? colors.primary : colors.text.muted}
                                            style={{ transform: isShippingDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                                    </div>
                                    {isShippingDropdownOpen && (
                                        <div style={{
                                            position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%',
                                            background: colors.bg.surface, border: `1px solid ${colors.border.default}`,
                                            borderRadius: radius.lg, boxShadow: shadow.md, overflow: 'hidden', zIndex: 10,
                                        }}>
                                            {Object.entries(FORWARDER_RATES).map(([key, val]) => (
                                                <div key={key}
                                                    onClick={() => {
                                                        setShippingForwarder(key);
                                                        setShippingMode('auto');
                                                        setIsShippingDropdownOpen(false);
                                                    }}
                                                    style={{
                                                        padding: spacing['4'], fontSize: font.size.base, cursor: 'pointer',
                                                        transition: 'background 0.2s',
                                                        background: shippingMode === 'auto' && shippingForwarder === key ? colors.primaryLight : colors.bg.surface,
                                                        color: shippingMode === 'auto' && shippingForwarder === key ? colors.primary : colors.text.primary,
                                                        fontWeight: shippingMode === 'auto' && shippingForwarder === key ? font.weight.semibold : font.weight.regular,
                                                    }}
                                                    onMouseEnter={e => { if (!(shippingMode === 'auto' && shippingForwarder === key)) e.currentTarget.style.background = colors.bg.page; }}
                                                    onMouseLeave={e => { if (!(shippingMode === 'auto' && shippingForwarder === key)) e.currentTarget.style.background = colors.bg.surface; }}
                                                >
                                                    {val.label}
                                                </div>
                                            ))}
                                            {/* 요율표 없이 직접 설정 옵션 */}
                                            <div
                                                onClick={() => {
                                                    setShippingMode('manual');
                                                    setShippingForwarder('');
                                                    setIsShippingDropdownOpen(false);
                                                }}
                                                style={{
                                                    padding: spacing['4'], fontSize: font.size.base, cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                    borderTop: `1px solid ${colors.bg.subtle}`,
                                                    background: shippingMode === 'manual' ? colors.primaryLight : colors.bg.surface,
                                                    color: shippingMode === 'manual' ? colors.primary : colors.text.tertiary,
                                                    fontWeight: shippingMode === 'manual' ? font.weight.semibold : font.weight.regular,
                                                }}
                                                onMouseEnter={e => { if (shippingMode !== 'manual') e.currentTarget.style.background = colors.bg.page; }}
                                                onMouseLeave={e => { if (shippingMode !== 'manual') e.currentTarget.style.background = colors.bg.surface; }}
                                            >
                                                직접 설정
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* 드롭다운 아래 안내 */}
                                {hasForwarderRate && shippingMode === 'auto' && shippingForwarder === forwarder && (
                                    <p style={{ margin: `${spacing['2']} 0 0`, fontSize: font.size.sm, color: colors.text.muted }}>
                                        출하지 설정에서 선택한 배송대행사가 적용되어 있어요. 다른 대행사로 변경할 수도 있어요.
                                    </p>
                                )}
                            </div>

                            {/* 요율표 (auto 모드 + 배송대행사 선택됨) */}
                            {shippingMode === 'auto' && shippingForwarder && (
                                <div style={{
                                    background: colors.bg.info, border: `1px solid ${colors.primaryLightBorder}`,
                                    borderRadius: radius.lg, padding: spacing['4'],
                                    display: 'flex', flexDirection: 'column', gap: spacing['2'],
                                    animation: 'fadeSlideIn 0.25s ease',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                                        <Truck size={14} color={colors.primary} />
                                        <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>
                                            {FORWARDER_RATES[shippingForwarder]?.label} 요율표 적용
                                        </span>
                                    </div>
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
                                            {FORWARDER_RATES[shippingForwarder]?.rows.map((row, i) => (
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

                            {/* 직접 입력 (manual 모드) */}
                            {shippingMode === 'manual' && (
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
                                            onFocus={e => {
                                                e.currentTarget.style.borderColor = colors.primary;
                                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(49, 130, 246, 0.1)';
                                            }}
                                            onBlur={e => {
                                                e.currentTarget.style.borderColor = colors.border.default;
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
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
                    {step === 3 && (() => {
                        const marginSignal = marginValue < 15
                                ? { color: colors.danger, text: '마진이 너무 낮아요. 판매해도 수익이 거의 남지 않을 수 있어요.', sliderColor: colors.danger, type: 'danger' as const }
                                : marginValue < 25
                                    ? { color: '#E67E22', text: '가격은 경쟁력 있지만, 수익이 많지 않을 수 있어요.', sliderColor: '#E67E22', type: 'warning' as const }
                                    : marginValue <= 40
                                        ? { color: colors.success, text: '적정 마진율이에요. 초보 셀러에게 권장하는 범위입니다.', sliderColor: colors.primary, type: 'success' as const }
                                        : marginValue <= 50
                                            ? { color: '#E67E22', text: '경쟁 상품 대비 가격이 높아 판매가 어려울 수 있어요.', sliderColor: '#E67E22', type: 'warning' as const }
                                            : { color: colors.danger, text: '가격이 너무 높아요. 경쟁 상품 대비 판매가 어려울 수 있어요.', sliderColor: colors.danger, type: 'danger' as const };

                        const sliderPct = ((marginValue - 5) / (60 - 5)) * 100;

                        return (
                        <div style={{ animation: 'fadeSlideIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: spacing['6'] }}>
                            {/* 마진 설정 */}
                            <div style={{
                                background: colors.bg.surface, borderRadius: radius.xl,
                                padding: spacing['8'], boxShadow: shadow.sm,
                                border: `1px solid ${colors.bg.subtle}`,
                            }}>
                                <label style={{ ...labelStyles, marginBottom: spacing['3'] }}>기본 마진율</label>

                                {/* 입력 + 슬라이더 한 줄 */}
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
                                        {/* 구간 레이블 */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>5%</span>
                                            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>60%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 시그널 콜아웃 */}
                                {marginSignal.text && (() => {
                                    const t = marginSignal.type;
                                    const signalStyles = {
                                        danger: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', Icon: AlertTriangle },
                                        warning: { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C', Icon: TrendingUp },
                                        success: { bg: colors.bg.info, border: colors.primaryLightBorder, text: colors.primary, Icon: CheckCircle },
                                    }[t];
                                    return (
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
                                    );
                                })()}

                            </div>

                            {/* 가격 시뮬레이션 */}
                            <div style={{
                                background: colors.bg.subtle, borderRadius: radius.xl,
                                border: `1px solid ${colors.border.default}`,
                                overflow: 'hidden',
                            }}>
                                {/* 헤더 (토글) */}
                                <button
                                    onClick={() => setShowSimulation(!showSimulation)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: spacing['2'],
                                        width: '100%', padding: `${spacing['4']} ${spacing['6']}`,
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        color: colors.text.primary, fontSize: font.size.base, fontWeight: font.weight.bold,
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = colors.bg.page}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Calculator size={16} color={colors.primary} />
                                    가격 시뮬레이션
                                    <span style={{ marginLeft: 'auto' }}>
                                        {showSimulation ? <ChevronDown size={14} color={colors.text.muted} /> : <ChevronRight size={14} color={colors.text.muted} />}
                                    </span>
                                </button>

                                {showSimulation && (
                                <div style={{
                                    padding: `0 ${spacing['6']} ${spacing['6']}`,
                                    display: 'flex', flexDirection: 'column', gap: spacing['5'],
                                    animation: 'fadeSlideIn 0.2s ease',
                                }}>
                                    {/* 환율 뱃지 */}
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start',
                                        gap: spacing['1'], padding: '4px 10px',
                                        background: colors.bg.info, borderRadius: radius.full,
                                        border: `1px solid ${colors.primaryLightBorder}`,
                                    }}>
                                        <RefreshCw size={11} color={colors.primary} />
                                        <span style={{ fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.primary }}>
                                            실시간 환율
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
                                    {shippingMode === 'auto' && activeForwarder && (
                                        <WeightDropdown value={simWeight} onChange={setSimWeight} />
                                    )}
                                </div>

                                {/* 결과: 판매가 + 수령액 + 순수익 */}
                                <div style={{
                                    display: 'flex', gap: spacing['3'],
                                    background: colors.bg.page, borderRadius: radius.lg,
                                    padding: spacing['4'], border: `1px solid ${colors.border.default}`,
                                }}>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginBottom: '6px', fontWeight: font.weight.medium }}>Qoo10 판매가</div>
                                        <div style={{ fontSize: '22px', fontWeight: 800, color: colors.primary, fontFamily: font.family.sans }}>
                                            ¥{finalPriceJpy.toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ width: '1px', background: colors.border.default }} />
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginBottom: '6px', fontWeight: font.weight.medium }}>수령액</div>
                                        <div style={{ fontSize: '22px', fontWeight: 800, color: colors.text.primary, fontFamily: font.family.sans }}>
                                            ₩{payoutKrw.toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ width: '1px', background: colors.border.default }} />
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginBottom: '6px', fontWeight: font.weight.medium }}>순수익</div>
                                        <div style={{
                                            fontSize: '22px', fontWeight: 800, fontFamily: font.family.sans,
                                            color: actualProfitKrw > 0 ? colors.success : colors.danger,
                                        }}>
                                            {actualProfitKrw >= 0 ? '+' : ''}₩{actualProfitKrw.toLocaleString()}
                                        </div>
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
                                        {/* 수수료 참고 */}
                                        <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: spacing['3'], fontSize: font.size.xs, color: colors.text.muted }}>
                                            Qoo10 수수료: 패션/뷰티 10~12% · 기타 6~10% (현재 12% 적용)
                                        </div>
                                    </div>
                                )}
                                </div>
                                )}
                            </div>
                        </div>
                        );
                    })()}

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
                            {step === 3 ? '설정 완료' : '다음'}
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

            {/* 완료 화면 */}
            {showComplete && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    background: colors.bg.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'completeFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}>
                    <style>{`
                        @keyframes completeFadeIn { from { opacity: 0; } to { opacity: 1; } }
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
                            fontSize: '26px', fontWeight: 800, color: colors.text.primary,
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
                            이제 첫 상품을 수집해볼까요?
                        </p>

                        <div style={{
                            width: '100%', border: `1px solid ${colors.bg.subtle}`, borderRadius: radius.xl,
                            overflow: 'hidden', marginBottom: '32px',
                            animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both',
                        }}>
                            {[
                                { label: 'Qoo10 JP 연동', desc: state.storeName || '연동 완료' },
                                { label: '배송지 및 기본 정보', desc: '출하지 · 반품지 설정 완료' },
                                { label: '마진 및 비용', desc: hasForwarderRate ? `마진 ${marginValue}% · ${forwarderLabel} 요율 적용` : `마진 ${marginValue}% · 해외배송 ¥${intlShipping.toLocaleString()}` },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: `${spacing['3']} ${spacing['5']}`,
                                    borderTop: i > 0 ? `1px solid ${colors.bg.subtle}` : 'none',
                                    background: colors.bg.surface,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'] }}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="8" fill={colors.primaryLight} />
                                            <polyline points="4.5,8 6.5,10.5 11.5,5.5" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        </svg>
                                        <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontSize: font.size.sm, color: colors.text.muted }}>{item.desc}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => transitionTo('/sourcing')}
                            style={{
                                width: '100%', height: '54px',
                                background: colors.primary, color: colors.bg.surface,
                                border: 'none', borderRadius: radius.lg,
                                fontSize: '16px', fontWeight: font.weight.bold,
                                cursor: 'pointer', letterSpacing: '-0.2px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing['2'],
                                transition: 'background 0.15s, transform 0.1s',
                                animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#1B64DA'}
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
