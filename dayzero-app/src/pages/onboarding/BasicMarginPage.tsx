import { Fragment, useMemo, useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronRight, Calculator, Package, Truck, Globe, RefreshCw } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboarding, type ForwarderValue } from '../../components/onboarding/OnboardingContext';

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

const inputStyles = {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #E5E8EB',
    fontSize: '15px',
    color: '#191F28',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
    outline: 'none',
    fontFamily: 'Pretendard, -apple-system, sans-serif',
};

const labelStyles = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#4E5968',
    marginBottom: '8px',
};

const cardStyles = {
    background: '#FFFFFF',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #F2F4F6',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
};

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
            <label style={{ ...labelStyles, fontSize: '13px', color: '#6B7684', marginBottom: '6px' }}>무게 (kg)</label>
            <div style={{ position: 'relative' }}>
                <div
                    onClick={() => setOpen(!open)}
                    style={{
                        ...inputStyles,
                        padding: '12px 14px',
                        fontSize: '14px',
                        fontWeight: 600,
                        border: open ? '1.5px solid #3182F6' : '1.5px solid #E5E8EB',
                        boxShadow: open ? '0 0 0 3px rgba(49, 130, 246, 0.1)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', userSelect: 'none',
                    }}
                >
                    <span>{value}kg</span>
                    <ChevronDown
                        size={14}
                        color={open ? '#3182F6' : '#8B95A1'}
                        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    />
                </div>
                {open && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                        background: '#FFFFFF', border: '1px solid #E5E8EB', borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)', overflow: 'hidden', zIndex: 10,
                        maxHeight: '200px', overflowY: 'auto',
                    }}>
                        {WEIGHT_OPTIONS.map(w => (
                            <div
                                key={w}
                                onClick={() => { onChange(w); setOpen(false); }}
                                style={{
                                    padding: '10px 14px', fontSize: '14px', cursor: 'pointer',
                                    transition: 'background 0.15s',
                                    background: value === w ? '#F2F8FF' : '#fff',
                                    color: value === w ? '#3182F6' : '#191F28',
                                    fontWeight: value === w ? 600 : 400,
                                }}
                                onMouseEnter={e => { if (value !== w) e.currentTarget.style.background = '#F9FAFB'; }}
                                onMouseLeave={e => { if (value !== w) e.currentTarget.style.background = '#fff'; }}
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

interface CostFieldProps {
    label: string;
    labelSub?: string;
    value: number;
    onChange: (v: number) => void;
    hint: string;
    prefix?: string;
    highlighted?: boolean;
    infoTip?: ReactNode;
}

function CostField({ label, labelSub, value, onChange, hint, prefix = '₩', highlighted = false, infoTip }: CostFieldProps) {
    const [showTip, setShowTip] = useState(false);
    return (
        <div>
            <label style={labelStyles}>
                {label}
                {labelSub && <span style={{ fontWeight: 400, color: '#8B95A1' }}>{labelSub}</span>}
                {infoTip && (
                    <span
                        style={{ position: 'relative', display: 'inline-block', marginLeft: '6px', cursor: 'pointer', verticalAlign: 'middle' }}
                        onMouseEnter={() => setShowTip(true)}
                        onMouseLeave={() => setShowTip(false)}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
                            <circle cx="8" cy="8" r="7.5" stroke="#B0B8C1" />
                            <text x="8" y="12" textAnchor="middle" fill="#8B95A1" fontSize="10" fontFamily="Pretendard, sans-serif" fontWeight="600">i</text>
                        </svg>
                        {showTip && (
                            <div style={{
                                position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                                background: '#191F28', color: '#fff', borderRadius: '10px', padding: '12px 14px',
                                fontSize: '12px', lineHeight: 1.7, whiteSpace: 'nowrap', zIndex: 100,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            }}>
                                {infoTip}
                                <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #191F28' }} />
                            </div>
                        )}
                    </span>
                )}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    type="number"
                    value={value === 0 ? '' : value}
                    onChange={e => onChange(Number(e.target.value))}
                    placeholder="0"
                    style={{
                        ...inputStyles,
                        paddingLeft: '32px',
                        ...(highlighted && { borderColor: '#3182F6', background: '#F2F8FF' }),
                    }}
                />
                <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: highlighted ? '#3182F6' : '#191F28', fontWeight: 600,
                }}>
                    {prefix}
                </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#8B95A1' }}>{hint}</p>
        </div>
    );
}

export default function BasicMarginPage() {
    const navigate = useNavigate();
    const { state, setState } = useOnboarding();

    const { marginType, marginValue, prepCost, intlShipping, forwarder } = state;
    const updateState = (updates: Partial<typeof state>) => setState(prev => ({ ...prev, ...updates }));

    const hasForwarderRate = forwarder !== '' && forwarder !== 'other';
    const forwarderLabel = hasForwarderRate ? FORWARDER_RATES[forwarder]?.label ?? '' : '';

    const [showFeeTable, setShowFeeTable] = useState(false);
    const [showMarginTip, setShowMarginTip] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    const [showCalculation, setShowCalculation] = useState(false);
    const [showRateTable, setShowRateTable] = useState(false);
    const [simBaseCost, setSimBaseCost] = useState(15000);
    const [simWeight, setSimWeight] = useState(0.3);

    const exchangeRate = DAILY_EXCHANGE_RATE;

    const shippingJpy = hasForwarderRate
        ? lookupShippingFee(forwarder, simWeight)
        : intlShipping;

    const { marginAmount, totalKrw, convertedJpy, finalPriceJpy, payoutJpy, payoutKrw } = useMemo(() => {
        const margin = marginType === '%' ? Math.round(simBaseCost * (marginValue / 100)) : marginValue;
        const krw = simBaseCost + margin + prepCost;
        const jpyAmount = Math.round(krw / exchangeRate);
        const finalJpy = jpyAmount + shippingJpy;
        const fee = Math.round(finalJpy * PLATFORM_FEE_RATE);
        const payoutJpyVal = finalJpy - fee;
        return {
            marginAmount: margin,
            totalKrw: krw,
            convertedJpy: jpyAmount,
            finalPriceJpy: finalJpy,
            payoutJpy: payoutJpyVal,
            payoutKrw: Math.round(payoutJpyVal * exchangeRate),
        };
    }, [marginType, marginValue, prepCost, shippingJpy, simBaseCost, exchangeRate]);

    const calcRows = [
        { icon: <Package size={14} />, label: `₩${simBaseCost.toLocaleString()} + 마진 ${marginValue}%`, value: `₩${Math.round(simBaseCost + marginAmount).toLocaleString()}`, highlight: false },
        { icon: <Truck size={14} />, label: '작업비 합산', value: `₩${totalKrw.toLocaleString()}`, highlight: false },
        { icon: <RefreshCw size={14} />, label: `엔화 환전 (₩${exchangeRate}:¥1)`, value: `¥${convertedJpy.toLocaleString()}`, highlight: false },
        { icon: <Globe size={14} />, label: `해외 배송비 ¥${shippingJpy.toLocaleString()} 합산`, value: `¥${finalPriceJpy.toLocaleString()}`, highlight: true },
    ];

    return (
        <>
            <OnboardingLayout currentStep={3} wide>
                <div style={{ width: '100%' }}>
                    <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#191F28', textAlign: 'center', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
                        마진 및 비용 기본 설정
                    </h2>
                    <p style={{ fontSize: '15px', color: '#6B7684', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.5, wordBreak: 'keep-all' }}>
                        모든 상품에 기본 적용되는 값입니다.<br />
                        상품별 개별 조정은 편집 단계에서 가능합니다.
                    </p>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'start', justifyContent: 'center', marginBottom: '8px' }}>
                        {/* 설정 컬럼 */}
                        <div style={{ width: '480px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* 마진 설정 */}
                            <div style={cardStyles}>
                                <div style={{ fontSize: '17px', fontWeight: 700, color: '#191F28' }}>마진 설정</div>
                                <div>
                                    <label style={labelStyles}>
                                        기본 마진율
                                        <span
                                            style={{ position: 'relative', display: 'inline-block', marginLeft: '6px', cursor: 'pointer', verticalAlign: 'middle' }}
                                            onMouseEnter={() => setShowMarginTip(true)}
                                            onMouseLeave={() => setShowMarginTip(false)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
                                                <circle cx="8" cy="8" r="7.5" stroke="#B0B8C1" />
                                                <text x="8" y="12" textAnchor="middle" fill="#8B95A1" fontSize="10" fontFamily="Pretendard, sans-serif" fontWeight="600">i</text>
                                            </svg>
                                            {showMarginTip && (
                                                <div style={{
                                                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                                                    background: '#191F28', color: '#fff', borderRadius: '10px', padding: '12px 14px',
                                                    fontSize: '12px', lineHeight: 1.7, whiteSpace: 'nowrap', zIndex: 100,
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                                }}>
                                                    <div style={{ fontWeight: 700, marginBottom: '6px', color: '#fff' }}>💡 셀러 평균 마진율</div>
                                                    <div>초보 셀러 추천 <strong style={{ color: '#60A5FA' }}>30~35%</strong></div>
                                                    <div>일반적인 범위 <strong style={{ color: '#60A5FA' }}>25~40%</strong></div>
                                                    <div>경쟁상품 많을 때 <strong style={{ color: '#FBBF24' }}>15~25%</strong></div>
                                                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#8B95A1' }}>상품 원가 대비 이익 비율입니다.</div>
                                                    <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #191F28' }} />
                                                </div>
                                            )}
                                        </span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            value={marginValue || ''}
                                            onChange={e => updateState({ marginValue: Number(e.target.value) })}
                                            placeholder="30"
                                            style={inputStyles}
                                        />
                                        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8B95A1', fontWeight: 700, fontSize: '15px' }}>%</span>
                                    </div>
                                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#8B95A1' }}>초보 셀러에게는 <strong style={{ color: '#3182F6' }}>30%</strong> 설정을 권장합니다.</p>
                                </div>
                            </div>

                            {/* 비용 설정 */}
                            <div style={cardStyles}>
                                <div style={{ fontSize: '17px', fontWeight: 700, color: '#191F28' }}>비용 설정</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <CostField
                                        label="작업비"
                                        value={prepCost}
                                        onChange={v => updateState({ prepCost: v })}
                                        hint="배송대행사의 포장·검수 수수료입니다."
                                        infoTip={
                                            <>
                                                <div style={{ fontWeight: 700, marginBottom: '6px', color: '#fff' }}>작업비란?</div>
                                                <div>배송대행사에서 상품을 포장·검수할 때</div>
                                                <div>발생하는 수수료입니다.</div>
                                                <div style={{ marginTop: '6px' }}>
                                                    <span style={{ color: '#60A5FA' }}>예)</span> 큐익스프레스 검수비 ¥100/건
                                                </div>
                                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#8B95A1' }}>
                                                    포장·검수비가 없다면 0원으로 설정하세요.
                                                </div>
                                            </>
                                        }
                                    />
                                    {hasForwarderRate ? (
                                        /* 배송대행사 선택됨 → 요율표 자동 적용 안내 */
                                        <div>
                                            <label style={labelStyles}>
                                                해외 배송비
                                                <span
                                                    style={{ position: 'relative', display: 'inline-block', marginLeft: '6px', cursor: 'pointer', verticalAlign: 'middle' }}
                                                    onMouseEnter={e => { const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement; if (tip) tip.style.display = 'block'; }}
                                                    onMouseLeave={e => { const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement; if (tip) tip.style.display = 'none'; }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
                                                        <circle cx="8" cy="8" r="7.5" stroke="#B0B8C1" />
                                                        <text x="8" y="12" textAnchor="middle" fill="#8B95A1" fontSize="10" fontFamily="Pretendard, sans-serif" fontWeight="600">i</text>
                                                    </svg>
                                                    <div data-tip style={{
                                                        display: 'none',
                                                        position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                                                        background: '#191F28', color: '#fff', borderRadius: '10px', padding: '12px 14px',
                                                        fontSize: '12px', lineHeight: 1.7, whiteSpace: 'nowrap', zIndex: 100,
                                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                                    }}>
                                                        <div style={{ fontWeight: 700, marginBottom: '6px' }}>해외 배송비란?</div>
                                                        <div>한국 집하센터에서 일본 소비자까지</div>
                                                        <div>배송하는 데 드는 비용입니다.</div>
                                                        <div style={{ marginTop: '6px' }}>
                                                            배송대행사마다 <span style={{ color: '#60A5FA' }}>무게(kg) 기반 요율표</span>가
                                                        </div>
                                                        <div>있어 상품 무게에 따라 자동 계산됩니다.</div>
                                                        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #191F28' }} />
                                                    </div>
                                                </span>
                                            </label>
                                            <div style={{
                                                background: '#F2F8FF', border: '1px solid #BFDBFE', borderRadius: '12px',
                                                padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Truck size={14} color="#3182F6" />
                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#191F28' }}>
                                                        {forwarderLabel} 요율표 자동 적용
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#6B7684', lineHeight: 1.5 }}>
                                                    상품 무게에 따라 배송비가 자동으로 계산됩니다.
                                                </p>
                                                <button
                                                    onClick={() => setShowRateTable(!showRateTable)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        background: 'none', border: 'none', padding: 0,
                                                        color: '#3182F6', fontSize: '12px', fontWeight: 600,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    요율표 보기 {showRateTable ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                </button>
                                                {showRateTable && (
                                                    <div style={{
                                                        background: '#fff', borderRadius: '8px', padding: '10px 12px',
                                                        border: '1px solid #E5E8EB', fontSize: '12px',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 600, color: '#4E5968' }}>
                                                            <span>무게</span><span>배송비</span>
                                                        </div>
                                                        {FORWARDER_RATES[forwarder]?.rows.map((row, i) => (
                                                            <div key={i} style={{
                                                                display: 'flex', justifyContent: 'space-between',
                                                                padding: '3px 0', color: '#6B7684',
                                                                borderTop: i > 0 ? '1px solid #F2F4F6' : 'none',
                                                            }}>
                                                                <span>~{row.maxKg}kg</span>
                                                                <span style={{ fontWeight: 600, color: '#191F28' }}>¥{row.fee.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* 직접 입력 (기타) → 수동 입력 */
                                        <CostField
                                            label="해외 배송비"
                                            value={intlShipping}
                                            onChange={v => updateState({ intlShipping: v })}
                                            hint="이용 중인 배송대행사의 요금을 직접 입력하세요."
                                            prefix="¥"
                                            highlighted
                                            infoTip={
                                                <>
                                                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>해외 배송비란?</div>
                                                    <div>한국 집하센터에서 일본 소비자까지</div>
                                                    <div>배송하는 데 드는 비용입니다.</div>
                                                    <div style={{ marginTop: '6px' }}>
                                                        보통 <span style={{ color: '#60A5FA' }}>¥500~¥1,000</span> 수준이며
                                                    </div>
                                                    <div>상품 무게에 따라 달라집니다.</div>
                                                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#8B95A1' }}>
                                                        대표 상품 기준으로 입력하세요.
                                                    </div>
                                                </>
                                            }
                                        />
                                    )}
                                </div>
                            </div>

                            {/* 버튼 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={() => setShowComplete(true)}
                                    style={{
                                        width: '100%', height: '52px',
                                        background: '#3182F6', color: '#FFFFFF',
                                        border: 'none', borderRadius: '12px',
                                        fontSize: '16px', fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        transition: 'background 0.2s, transform 0.1s',
                                    }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    설정 완료
                                    <ArrowRight size={18} />
                                </button>
                                <button
                                    onClick={() => navigate('/basic-info')}
                                    style={{
                                        width: '100%', height: '52px',
                                        background: 'transparent', color: '#6B7684',
                                        border: 'none', fontSize: '15px', fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#191F28'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#6B7684'}
                                >
                                    이전 화면으로 돌아가기
                                </button>
                            </div>
                        </div>

                        {/* 시뮬레이션 컬럼 */}
                        <div style={{ width: '360px', flexShrink: 0 }}>
                            <div style={{ ...cardStyles, gap: '16px', background: '#F4F5F7', border: '1px solid #E5E8EB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calculator size={16} color="#3182F6" />
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#191F28' }}>가격 시뮬레이션</div>
                                    </div>
                                    {/* 환율 인라인 */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            fontSize: '10px', fontWeight: 700, color: '#3182F6',
                                            background: '#fff', borderRadius: '4px', padding: '2px 6px',
                                            border: '1px solid #BFDBFE',
                                        }}>환율</span>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#4E5968' }}>
                                            ¥1 = ₩{exchangeRate.toFixed(1)}
                                        </span>
                                    </div>
                                </div>

                                {/* 원가 + 무게 한 줄 */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ ...labelStyles, fontSize: '13px', color: '#6B7684', marginBottom: '6px' }}>상품 원가 (₩)</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                value={simBaseCost.toLocaleString()}
                                                onChange={e => setSimBaseCost(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                                style={{ ...inputStyles, padding: '12px 14px', fontSize: '14px', fontWeight: 600, border: '1.5px solid #E5E8EB' }}
                                            />
                                        </div>
                                    </div>
                                    {hasForwarderRate && (
                                        <WeightDropdown value={simWeight} onChange={setSimWeight} />
                                    )}
                                </div>
                                {hasForwarderRate && (
                                    <p style={{ margin: '-6px 0 0', fontSize: '12px', color: '#8B95A1' }}>
                                        배송비 <strong style={{ color: '#3182F6' }}>¥{shippingJpy.toLocaleString()}</strong> 자동 적용 · 화장품 단품 약 0.1~0.3kg
                                    </p>
                                )}

                                {/* 최종 판매가 + 수령액 */}
                                <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E8EB', overflow: 'hidden', textAlign: 'center' }}>
                                    <div style={{ padding: '16px 16px 14px' }}>
                                        <div style={{ fontSize: '13px', color: '#4E5968', fontWeight: 600, marginBottom: '6px' }}>Qoo10 최종 판매가</div>
                                        <div style={{ color: '#3182F6', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '34px', fontWeight: 900 }}>¥{finalPriceJpy.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div style={{ height: '1px', background: '#F2F4F6', margin: '0 16px' }} />
                                    <div style={{ padding: '12px 16px 14px', background: '#FAFBFC' }}>
                                        <div style={{ fontSize: '12px', color: '#8B95A1' }}>수수료 12% 차감 후 예상 수령액</div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#191F28', marginTop: '4px' }}>
                                            ¥{payoutJpy.toLocaleString()}{' '}
                                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7684' }}>(약 ₩{payoutKrw.toLocaleString()})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 계산 과정 보기 */}
                                <div>
                                    <button
                                        onClick={() => setShowCalculation(!showCalculation)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            width: '100%', background: '#fff', border: '1px solid #E5E8EB',
                                            borderRadius: '10px', padding: '10px',
                                            color: '#4E5968', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                                    >
                                        {showCalculation ? '계산 과정 접기' : '계산 과정 보기'}
                                        {showCalculation ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    {showCalculation && (
                                        <div style={{ marginTop: '10px', background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #E5E8EB', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {calcRows.map((row, i) => (
                                                <Fragment key={i}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8B95A1', fontSize: '12px' }}>
                                                            {row.icon} {row.label}
                                                        </div>
                                                        <div style={{ fontSize: row.highlight ? '14px' : '13px', fontWeight: row.highlight ? 800 : 700, color: row.highlight ? '#3182F6' : '#191F28' }}>
                                                            {row.value}
                                                        </div>
                                                    </div>
                                                    {i < calcRows.length - 1 && (
                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                            <ArrowRight size={12} color="#E5E8EB" style={{ transform: 'rotate(90deg)' }} />
                                                        </div>
                                                    )}
                                                </Fragment>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 수수료 테이블 */}
                                <div>
                                    <button
                                        onClick={() => setShowFeeTable(!showFeeTable)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                            width: '100%', background: 'transparent', border: 'none',
                                            color: '#B0B8C1', fontSize: '11px', cursor: 'pointer', padding: '4px 0',
                                        }}
                                    >
                                        Qoo10 카테고리별 수수료율 {showFeeTable ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                    </button>
                                    {showFeeTable && (
                                        <div style={{ marginTop: '6px', background: '#fff', padding: '10px 12px', borderRadius: '8px', fontSize: '11px', color: '#8B95A1', border: '1px solid #E5E8EB' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span>패션 / 뷰티</span><span style={{ fontWeight: 600 }}>10~12%</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>기타 카테고리</span><span style={{ fontWeight: 600 }}>6~10%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </OnboardingLayout>

            {/* 완료 화면 */}
            {showComplete && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    background: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'completeFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 24px', maxWidth: '440px', width: '100%' }}>
                        {/* SVG 체크 애니메이션 */}
                        <svg width="72" height="72" viewBox="0 0 72 72" fill="none"
                            style={{ marginBottom: '32px', animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both' }}>
                            <circle
                                cx="36" cy="36" r="33"
                                stroke="#3182F6" strokeWidth="2.5" fill="none"
                                strokeDasharray="207" strokeDashoffset="207"
                                style={{ animation: 'checkCircle 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards' }}
                            />
                            <polyline
                                points="22,36 31,46 50,26"
                                stroke="#3182F6" strokeWidth="3" fill="none"
                                strokeLinecap="round" strokeLinejoin="round"
                                strokeDasharray="50" strokeDashoffset="50"
                                style={{ animation: 'checkMark 0.35s cubic-bezier(0.4, 0, 0.2, 1) 0.6s forwards' }}
                            />
                        </svg>

                        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#191F28', margin: '0 0 8px', letterSpacing: '-0.5px', animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}>
                            기본 설정이 완료됐어요
                        </h2>
                        <p style={{ fontSize: '15px', color: '#6B7684', margin: '0 0 40px', lineHeight: 1.6, animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both' }}>
                            이제 첫 상품을 수집해볼까요?
                        </p>

                        {/* 완료 항목 요약 */}
                        <div style={{ width: '100%', border: '1px solid #F2F4F6', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both' }}>
                            {[
                                { label: 'Qoo10 JP 연동', desc: state.storeName || '연동 완료' },
                                { label: '배송지 및 기본 정보', desc: '출하지 · 반품지 설정 완료' },
                                { label: '마진 및 비용', desc: hasForwarderRate ? `마진 ${marginValue}% · ${forwarderLabel} 요율 적용` : `마진 ${marginValue}% · 해외배송 ¥${intlShipping.toLocaleString()}` },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 20px',
                                    borderTop: i > 0 ? '1px solid #F2F4F6' : 'none',
                                    background: '#FFFFFF',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="8" fill="#EBF4FF" />
                                            <polyline points="4.5,8 6.5,10.5 11.5,5.5" stroke="#3182F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        </svg>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#191F28' }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#8B95A1' }}>{item.desc}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <button
                            onClick={() => navigate('/sourcing')}
                            style={{
                                width: '100%', height: '54px',
                                background: '#3182F6', color: '#FFFFFF',
                                border: 'none', borderRadius: '14px',
                                fontSize: '16px', fontWeight: 700,
                                cursor: 'pointer', letterSpacing: '-0.2px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'background 0.15s, transform 0.1s',
                                animation: 'riseUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#1B64DA'}
                            onMouseLeave={e => e.currentTarget.style.background = '#3182F6'}
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
