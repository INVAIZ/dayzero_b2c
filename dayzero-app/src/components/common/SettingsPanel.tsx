import { Fragment, useState, useRef, useEffect, useMemo } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, Truck, TrendingUp, Calculator, AlertTriangle, CheckCircle, LogOut, Link2, X, Settings, BadgePercent, Package, User, Eye, EyeOff, Globe, RefreshCw, Store } from 'lucide-react';
import { useOnboarding, type ForwarderValue } from '../onboarding/OnboardingContext';
import { colors, font, radius, spacing, shadow, zIndex } from '../../design/tokens';
import { FORWARDER_PRESETS, FORWARDER_RATES, lookupShippingFee, PLATFORM_FEE_RATE, EXCHANGE_RATE, WEIGHT_OPTIONS } from '../../utils/forwarder';

/* ── 네비게이션 탭 (배송 정보 먼저) ── */

type SettingsTab = 'shipping' | 'sales' | 'qoo10' | 'account';

const NAV_ITEMS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: 'shipping', label: '배송 정보', icon: Truck },
    { key: 'sales', label: '판매 설정', icon: BadgePercent },
    { key: 'qoo10', label: 'Qoo10 연동', icon: Store },
    { key: 'account', label: '계정', icon: User },
];

/* ── 공통 스타일 ── */

const settingRowStyle: React.CSSProperties = {
    padding: `${spacing['5']} 0`,
    borderBottom: `1px solid ${colors.bg.subtle}`,
};

const settingLabelStyle: React.CSSProperties = {
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    color: colors.text.primary,
    marginBottom: '2px',
};

const settingDescStyle: React.CSSProperties = {
    fontSize: font.size.sm,
    color: colors.text.muted,
    lineHeight: font.lineHeight.normal,
    marginBottom: spacing['3'],
};

const selectTriggerStyle: React.CSSProperties = {
    padding: `${spacing['3']} ${spacing['4']}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.border.default}`,
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['3'],
    background: colors.bg.surface,
    color: colors.text.primary,
    transition: 'border-color 0.15s',
    width: '100%',
};

const inputFieldStyle: React.CSSProperties = {
    padding: `${spacing['3']} ${spacing['4']}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.border.default}`,
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
    color: colors.text.primary,
    background: colors.bg.surface,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    width: '100%',
    boxSizing: 'border-box' as const,
};

/* ── 메인 컴포넌트 ── */

export const SettingsPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('shipping');

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    return (
        <>
            <button
                onClick={() => { setIsOpen(true); setActiveTab('shipping'); }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['3'],
                    width: '100%',
                    padding: `${spacing['3']} ${spacing['3']}`,
                    background: 'transparent',
                    border: 'none',
                    borderRadius: radius.lg,
                    cursor: 'pointer',
                    color: colors.text.tertiary,
                    fontWeight: font.weight.medium,
                    fontSize: font.size.base,
                    transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = colors.bg.subtle}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
                <Settings size={20} color={colors.text.muted} />
                설정
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: zIndex.modal,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.4)',
                            animation: 'settingsFadeIn 0.15s ease',
                        }}
                    />

                    <div style={{
                        position: 'relative',
                        width: '900px',
                        maxWidth: 'calc(100vw - 64px)',
                        height: '640px',
                        maxHeight: 'calc(100vh - 64px)',
                        background: colors.bg.surface,
                        borderRadius: radius.xl,
                        boxShadow: shadow.lg,
                        display: 'flex',
                        overflow: 'hidden',
                        animation: 'settingsModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        fontFamily: 'Pretendard, sans-serif',
                    }}>
                        <style>{`
                            @keyframes settingsFadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                            @keyframes settingsModalIn {
                                from { opacity: 0; transform: scale(0.97) translateY(4px); }
                                to { opacity: 1; transform: scale(1) translateY(0); }
                            }
                            .settings-slider {
                                -webkit-appearance: none;
                                appearance: none;
                                width: 100%;
                                height: 4px;
                                border-radius: 9999px;
                                outline: none;
                                cursor: pointer;
                                transition: background 0.3s ease;
                            }
                            .settings-slider::-webkit-slider-thumb {
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
                            .settings-slider::-webkit-slider-thumb:hover {
                                box-shadow: 0 0 0 12px color-mix(in srgb, var(--slider-color, ${colors.primary}) 20%, transparent);
                            }
                            .settings-slider::-webkit-slider-thumb:active {
                                box-shadow: 0 0 0 16px color-mix(in srgb, var(--slider-color, ${colors.primary}) 25%, transparent);
                            }
                            .settings-slider::-moz-range-thumb {
                                width: 14px;
                                height: 14px;
                                border-radius: 50%;
                                background: var(--slider-color, ${colors.primary});
                                border: none;
                                box-shadow: 0 0 0 8px color-mix(in srgb, var(--slider-color, ${colors.primary}) 15%, transparent);
                                cursor: pointer;
                            }
                            .no-spinner::-webkit-outer-spin-button,
                            .no-spinner::-webkit-inner-spin-button {
                                -webkit-appearance: none;
                                margin: 0;
                            }
                            .settings-input:focus {
                                border-color: ${colors.primary} !important;
                                box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
                            }
                        `}</style>

                        {/* Left nav */}
                        <nav style={{
                            width: '220px',
                            flexShrink: 0,
                            background: colors.bg.page,
                            borderRight: `1px solid ${colors.border.default}`,
                            padding: `${spacing['8']} ${spacing['4']}`,
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <div style={{
                                fontSize: font.size.xs,
                                fontWeight: font.weight.bold,
                                color: colors.text.muted,
                                padding: `0 ${spacing['3']}`,
                                marginBottom: spacing['4'],
                                letterSpacing: '0.3px',
                            }}>
                                설정
                            </div>

                            {NAV_ITEMS.map(item => {
                                const active = activeTab === item.key;
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => setActiveTab(item.key)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: spacing['3'],
                                            width: '100%',
                                            padding: `${spacing['3']} ${spacing['3']}`,
                                            background: active ? colors.bg.surface : 'transparent',
                                            border: 'none',
                                            borderRadius: radius.md,
                                            cursor: 'pointer',
                                            color: active ? colors.text.primary : colors.text.tertiary,
                                            fontWeight: active ? font.weight.semibold : font.weight.medium,
                                            fontSize: font.size.base,
                                            transition: 'all 0.15s',
                                            textAlign: 'left',
                                            marginBottom: '2px',
                                            boxShadow: active ? shadow.sm : 'none',
                                        }}
                                        onMouseOver={e => { if (!active) e.currentTarget.style.background = colors.bg.subtle; }}
                                        onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Icon size={17} color={active ? colors.text.primary : colors.text.muted} />
                                        {item.label}
                                    </button>
                                );
                            })}

                            <div style={{ flex: 1 }} />
                            <button
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing['3'],
                                    width: '100%',
                                    padding: `${spacing['3']} ${spacing['3']}`,
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: radius.md,
                                    cursor: 'pointer',
                                    color: colors.text.muted,
                                    fontWeight: font.weight.medium,
                                    fontSize: font.size.base,
                                    transition: 'all 0.15s',
                                    textAlign: 'left',
                                }}
                                onMouseOver={e => { e.currentTarget.style.color = colors.danger; e.currentTarget.style.background = colors.dangerBg; }}
                                onMouseOut={e => { e.currentTarget.style.color = colors.text.muted; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <LogOut size={17} />
                                로그아웃
                            </button>
                        </nav>

                        {/* Right content */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: `${spacing['8']} ${spacing['10']}`,
                        }}>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    position: 'absolute',
                                    top: spacing['5'],
                                    right: spacing['5'],
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: spacing['1'],
                                    borderRadius: radius.sm,
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: colors.text.muted,
                                    transition: 'all 0.15s',
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = colors.bg.subtle; e.currentTarget.style.color = colors.text.primary; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.text.muted; }}
                            >
                                <X size={20} />
                            </button>

                            {activeTab === 'shipping' && <ShippingInfo />}
                            {activeTab === 'sales' && <SalesSettings />}
                            {activeTab === 'qoo10' && <Qoo10Info />}
                            {activeTab === 'account' && <AccountInfo />}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

/* ══════════════════════════════════════════════════
   탭 1: 배송 정보 (배송대행사 + 출하지 + 반품 + 연락처)
   ══════════════════════════════════════════════════ */

function ShippingInfo() {
    const { state, setState } = useOnboarding();
    const [forwarderOpen, setForwarderOpen] = useState(false);
    const ddRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ddRef.current && !ddRef.current.contains(e.target as Node)) setForwarderOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selectForwarder = (val: ForwarderValue) => {
        const preset = FORWARDER_PRESETS.find(p => p.id === val);
        setState(prev => ({
            ...prev,
            forwarder: val,
            ...(preset && preset.id !== 'other' ? {
                zipCode: preset.zipCode,
                addressLine1: preset.addressLine1,
                addressLine2: preset.addressLine2,
            } : {
                zipCode: '',
                addressLine1: '',
                addressLine2: '',
            }),
        }));
        setForwarderOpen(false);
    };

    const currentPreset = FORWARDER_PRESETS.find(p => p.id === state.forwarder);
    const isOther = state.forwarder === 'other';

    return (
        <div>
            <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: `0 0 ${spacing['1']}` }}>
                배송 정보
            </h2>
            <p style={{ fontSize: font.size.md, color: colors.text.muted, margin: `0 0 ${spacing['8']}` }}>
                Qoo10에 등록되는 배송대행사, 출하지 주소, 반품 주소를 관리합니다.
            </p>

            {/* 배송대행사 */}
            <div style={settingRowStyle}>
                <div style={settingLabelStyle}>배송대행사</div>
                <div style={settingDescStyle}>선택하면 출하지 주소와 배송 요율이 자동 적용됩니다.</div>
                <div style={{ position: 'relative' }} ref={ddRef}>
                    <div
                        onClick={() => setForwarderOpen(!forwarderOpen)}
                        style={{
                            ...selectTriggerStyle,
                            borderColor: forwarderOpen ? colors.primary : colors.border.default,
                            boxShadow: forwarderOpen ? '0 0 0 3px rgba(49, 130, 246, 0.1)' : 'none',
                        }}
                    >
                        <span>{currentPreset?.label || '배송대행사를 선택하세요'}</span>
                        <ChevronDown size={16} color={colors.text.muted} style={{ transform: forwarderOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </div>
                    {forwarderOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            width: '100%',
                            background: colors.bg.surface,
                            border: `1px solid ${colors.border.default}`,
                            borderRadius: radius.lg,
                            boxShadow: shadow.md,
                            overflow: 'hidden',
                            zIndex: 20,
                        }}>
                            {FORWARDER_PRESETS.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => selectForwarder(p.id)}
                                    style={{
                                        padding: `${spacing['3']} ${spacing['4']}`,
                                        fontSize: font.size.md,
                                        cursor: 'pointer',
                                        background: state.forwarder === p.id ? colors.primaryLight : colors.bg.surface,
                                        color: state.forwarder === p.id ? colors.primary : colors.text.primary,
                                        fontWeight: state.forwarder === p.id ? font.weight.semibold : font.weight.regular,
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => { if (state.forwarder !== p.id) e.currentTarget.style.background = colors.bg.page; }}
                                    onMouseLeave={e => { if (state.forwarder !== p.id) e.currentTarget.style.background = colors.bg.surface; }}
                                >
                                    {p.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 출하지 주소 — 배송대행사와 연결 */}
            {state.forwarder && (
                <div style={{ paddingBottom: spacing['5'], borderBottom: `1px solid ${colors.bg.subtle}` }}>
                    <div style={{
                        padding: spacing['5'],
                        background: colors.bg.faint,
                        borderRadius: radius.lg,
                        border: `1px solid ${colors.border.default}`,
                    }}>
                        <div style={{
                            fontSize: font.size.sm,
                            fontWeight: font.weight.semibold,
                            color: colors.text.tertiary,
                            marginBottom: spacing['3'],
                        }}>
                            {isOther ? '출하지 주소' : '출하지 (일본 창고 주소)'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                            <input
                                value={state.zipCode}
                                onChange={e => setState(prev => ({ ...prev, zipCode: e.target.value }))}
                                placeholder="우편번호 (예: 273-0012)"
                                className="settings-input"
                                style={{
                                    ...inputFieldStyle,
                                    background: !isOther ? colors.bg.subtle : colors.bg.surface,
                                }}
                                disabled={!isOther}
                            />
                            <input
                                value={state.addressLine1}
                                onChange={e => setState(prev => ({ ...prev, addressLine1: e.target.value }))}
                                placeholder="기본 주소"
                                className="settings-input"
                                style={{
                                    ...inputFieldStyle,
                                    background: !isOther ? colors.bg.subtle : colors.bg.surface,
                                }}
                                disabled={!isOther}
                            />
                            <input
                                value={state.addressLine2}
                                onChange={e => setState(prev => ({ ...prev, addressLine2: e.target.value }))}
                                placeholder="상세 주소"
                                className="settings-input"
                                style={{
                                    ...inputFieldStyle,
                                    background: !isOther ? colors.bg.subtle : colors.bg.surface,
                                }}
                                disabled={!isOther}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 반품 주소 */}
            <div style={settingRowStyle}>
                <div style={settingLabelStyle}>반품 주소</div>
                <div style={settingDescStyle}>반품 시 사용되는 주소입니다.</div>
                <label style={{
                    display: 'flex', alignItems: 'center', gap: spacing['2'],
                    cursor: 'pointer', marginBottom: state.sameAsShipping ? 0 : spacing['3'],
                }}>
                    <input
                        type="checkbox"
                        checked={state.sameAsShipping}
                        onChange={e => setState(prev => ({ ...prev, sameAsShipping: e.target.checked }))}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: colors.primary }}
                    />
                    <span style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.tertiary }}>
                        출하지 주소와 동일
                    </span>
                </label>
                {!state.sameAsShipping && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                        <input
                            value={state.returnZipCode}
                            onChange={e => setState(prev => ({ ...prev, returnZipCode: e.target.value }))}
                            placeholder="우편번호"
                            className="settings-input"
                            style={inputFieldStyle}
                        />
                        <input
                            value={state.returnAddressLine1}
                            onChange={e => setState(prev => ({ ...prev, returnAddressLine1: e.target.value }))}
                            placeholder="기본 주소"
                            className="settings-input"
                            style={inputFieldStyle}
                        />
                        <input
                            value={state.returnAddressLine2}
                            onChange={e => setState(prev => ({ ...prev, returnAddressLine2: e.target.value }))}
                            placeholder="상세 주소"
                            className="settings-input"
                            style={inputFieldStyle}
                        />
                    </div>
                )}
            </div>

            {/* 연락처 */}
            <div style={{ ...settingRowStyle, borderBottom: 'none' }}>
                <div style={settingLabelStyle}>스토어 연락처</div>
                <div style={settingDescStyle}>배송 문제나 클레임 발생 시 연락 가능한 번호입니다.</div>
                <input
                    value={state.contact}
                    onChange={e => setState(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="010-1234-5678"
                    className="settings-input"
                    style={inputFieldStyle}
                />
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   탭 2: 판매 설정 (작업비 → 해외배송비 → 마진율)
   ══════════════════════════════════════════════════ */

function SalesSettings() {
    const { state, setState } = useOnboarding();

    const hasForwarderRate = state.forwarder !== '' && state.forwarder !== 'other';
    const currentPreset = FORWARDER_PRESETS.find(p => p.id === state.forwarder);
    const marginSignal = state.marginValue < 15
        ? { color: colors.danger, Icon: AlertTriangle, text: '마진이 너무 낮아요. 수익이 거의 남지 않을 수 있어요.' }
        : state.marginValue < 25
            ? { color: '#E67E22', Icon: TrendingUp, text: '가격은 경쟁력 있지만, 수익이 많지 않을 수 있어요.' }
            : state.marginValue <= 40
                ? { color: colors.primary, Icon: CheckCircle, text: '적정 마진율이에요. 초보 셀러에게 권장하는 범위입니다.' }
                : state.marginValue <= 50
                    ? { color: '#E67E22', Icon: TrendingUp, text: '경쟁 상품 대비 가격이 높아 판매가 어려울 수 있어요.' }
                    : { color: colors.danger, Icon: AlertTriangle, text: '가격이 너무 높아요.' };

    const sliderPct = ((state.marginValue - 5) / (60 - 5)) * 100;

    const handleMarginInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (val >= 5 && val <= 60) {
            setState(prev => ({ ...prev, marginValue: val }));
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: `0 0 ${spacing['1']}` }}>
                판매 설정
            </h2>
            <p style={{ fontSize: font.size.md, color: colors.text.muted, margin: `0 0 ${spacing['8']}` }}>
                마진율, 배송비 등 가격 계산에 사용되는 기본값을 설정합니다.
            </p>

            {/* 1. 작업비 */}
            <div style={settingRowStyle}>
                <div style={settingLabelStyle}>작업비</div>
                <div style={settingDescStyle}>배송대행사에서 포장·검수할 때 발생하는 수수료입니다.</div>
                <div style={{ position: 'relative' }}>
                    <span style={{
                        position: 'absolute', left: spacing['4'], top: '50%', transform: 'translateY(-50%)',
                        fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.secondary,
                    }}>₩</span>
                    <input
                        type="number"
                        value={state.prepCost === 0 ? '' : state.prepCost}
                        onChange={e => setState(prev => ({ ...prev, prepCost: Math.max(0, Number(e.target.value)) }))}
                        placeholder="0"
                        className="settings-input"
                        style={{ ...inputFieldStyle, paddingLeft: '32px' }}
                    />
                </div>
            </div>

            {/* 2. 해외 배송비 */}
            <div style={settingRowStyle}>
                <div style={settingLabelStyle}>해외 배송비</div>
                <div style={settingDescStyle}>
                    {hasForwarderRate
                        ? `${currentPreset?.shortLabel} 요율표 기준으로 무게별 자동 계산됩니다.`
                        : '한국에서 일본 소비자에게 배송할 때 발생하는 국제 배송 비용입니다.'
                    }
                </div>
                {hasForwarderRate ? (
                    <ShippingRateDisplay forwarder={state.forwarder} presetLabel={currentPreset?.shortLabel || ''} />
                ) : (
                    <div style={{ position: 'relative' }}>
                        <span style={{
                            position: 'absolute', left: spacing['4'], top: '50%', transform: 'translateY(-50%)',
                            fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.secondary,
                        }}>¥</span>
                        <input
                            type="number"
                            value={state.intlShipping === 0 ? '' : state.intlShipping}
                            onChange={e => setState(prev => ({ ...prev, intlShipping: Math.max(0, Number(e.target.value)) }))}
                            placeholder="0"
                            className="settings-input"
                            style={{ ...inputFieldStyle, paddingLeft: '32px' }}
                        />
                    </div>
                )}
            </div>

            {/* 3. 기본 마진율 — 온보딩과 동일 레이아웃 */}
            <div style={{ ...settingRowStyle, borderBottom: 'none' }}>
                <div style={settingLabelStyle}>기본 마진율</div>
                <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginBottom: spacing['3'] }}>모든 상품에 기본 적용됩니다. 상품별로 개별 변경 가능합니다.</div>

                {/* 입력 (왼쪽) + 슬라이더 (오른쪽) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['4'] }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <input
                            type="number"
                            value={state.marginValue || ''}
                            onChange={handleMarginInput}
                            className="no-spinner"
                            style={{
                                width: '72px', padding: `${spacing['3']} ${spacing['3']}`,
                                paddingRight: '26px',
                                fontSize: font.size.md, fontWeight: font.weight.semibold,
                                fontFamily: font.family.sans,
                                color: colors.text.primary, background: colors.bg.surface,
                                border: `1.5px solid ${colors.border.default}`,
                                borderRadius: radius.md, outline: 'none',
                                MozAppearance: 'textfield' as never,
                                transition: 'border-color 0.2s ease',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = colors.primary; }}
                            onBlur={e => { e.currentTarget.style.borderColor = colors.border.default; }}
                        />
                        <span style={{
                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                            fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.muted,
                        }}>%</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <input
                            type="range"
                            min={5} max={60} step={5}
                            value={state.marginValue}
                            onChange={e => setState(prev => ({ ...prev, marginValue: Number(e.target.value) }))}
                            className="settings-slider"
                            style={{
                                '--slider-color': marginSignal.color,
                                background: `linear-gradient(to right, ${marginSignal.color} ${sliderPct}%, ${colors.border.default} ${sliderPct}%)`,
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
                    borderRadius: radius.lg,
                    background: marginSignal.color === colors.primary ? colors.bg.info
                        : marginSignal.color === colors.danger ? colors.dangerBg
                        : colors.warningLight,
                    border: `1px solid ${marginSignal.color === colors.primary ? colors.primaryLightBorder
                        : marginSignal.color === colors.danger ? colors.dangerLight
                        : colors.warningBorder}`,
                    display: 'flex', alignItems: 'center', gap: spacing['2'],
                    transition: 'all 0.25s ease',
                }}>
                    <marginSignal.Icon size={15} style={{ color: marginSignal.color, flexShrink: 0 }} />
                    <span style={{ fontSize: font.size.sm, color: marginSignal.color, fontWeight: font.weight.medium, lineHeight: font.lineHeight.normal }}>
                        {marginSignal.text}
                    </span>
                </div>
            </div>

            {/* 가격 시뮬레이션 — 온보딩과 동일 */}
            <PriceSimulation
                marginValue={state.marginValue}
                prepCost={state.prepCost}
                forwarder={state.forwarder}
                intlShipping={state.intlShipping}
            />
        </div>
    );
}

/* ══════════════════════════════════════════════════
   탭 3: Qoo10 연동 (API Key 숨김)
   ══════════════════════════════════════════════════ */

function Qoo10Info() {
    const { state } = useOnboarding();
    const [showKey, setShowKey] = useState(false);
    const connected = state.connected;

    const displayKey = state.apiKey
        ? showKey
            ? state.apiKey
            : '••••••••••••'
        : '—';

    const infoRowStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing['4']} 0`,
        borderBottom: `1px solid ${colors.bg.subtle}`,
    };

    return (
        <div>
            <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: `0 0 ${spacing['1']}` }}>
                Qoo10 연동
            </h2>
            <p style={{ fontSize: font.size.md, color: colors.text.muted, margin: `0 0 ${spacing['8']}` }}>
                Qoo10 계정 연동 상태와 스토어 정보를 확인합니다.
            </p>

            <div style={infoRowStyle}>
                <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>연동 상태</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: radius.full,
                        background: connected ? colors.success : colors.text.muted,
                    }} />
                    <span style={{
                        fontSize: font.size.md,
                        fontWeight: font.weight.semibold,
                        color: connected ? colors.successDark : colors.text.muted,
                    }}>
                        {connected ? '연동됨' : '미연동'}
                    </span>
                </div>
            </div>
            <div style={infoRowStyle}>
                <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>스토어명</span>
                <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>{state.storeName || '—'}</span>
            </div>
            <div style={infoRowStyle}>
                <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>Seller ID</span>
                <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>{state.sellerId || '—'}</span>
            </div>
            <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
                <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>API Key</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                    <span style={{
                        fontSize: font.size.md,
                        fontWeight: font.weight.semibold,
                        color: colors.text.primary,
                        fontFamily: showKey ? font.family.mono : 'inherit',
                        letterSpacing: showKey ? '0.5px' : '2px',
                    }}>
                        {displayKey}
                    </span>
                    {state.apiKey && (
                        <button
                            onClick={() => setShowKey(!showKey)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: radius.sm,
                                display: 'flex',
                                alignItems: 'center',
                                color: colors.text.muted,
                                transition: 'all 0.15s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = colors.bg.subtle; e.currentTarget.style.color = colors.text.primary; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.text.muted; }}
                        >
                            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    )}
                </div>
            </div>

            <button
                style={{
                    marginTop: spacing['6'],
                    padding: `${spacing['3']} ${spacing['5']}`,
                    background: 'transparent',
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.md,
                    fontSize: font.size.md,
                    fontWeight: font.weight.medium,
                    color: colors.text.secondary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['2'],
                    transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.color = colors.primary; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = colors.border.default; e.currentTarget.style.color = colors.text.secondary; }}
            >
                <Link2 size={15} />
                API Key 재연동
            </button>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   탭 4: 계정
   ══════════════════════════════════════════════════ */

function AccountInfo() {
    const accountEmail = 'seller@dayzero.kr';

    const infoRowStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing['4']} 0`,
        borderBottom: `1px solid ${colors.bg.subtle}`,
    };

    return (
        <div>
            <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: `0 0 ${spacing['1']}` }}>
                계정
            </h2>
            <p style={{ fontSize: font.size.md, color: colors.text.muted, margin: `0 0 ${spacing['8']}` }}>
                로그인 정보를 확인합니다.
            </p>

            <div style={infoRowStyle}>
                <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>이메일</span>
                <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>{accountEmail}</span>
            </div>
            <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
                <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>로그인 방식</span>
                <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>이메일</span>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   배송비 요율표 표시 (토글)
   ══════════════════════════════════════════════════ */

function ShippingRateDisplay({ forwarder, presetLabel }: { forwarder: ForwarderValue; presetLabel: string }) {
    const [showRates, setShowRates] = useState(false);
    const table = FORWARDER_RATES[forwarder];
    const rows = table?.rows;

    return (
        <div>
            <div style={{
                padding: `${spacing['3']} ${spacing['4']}`,
                borderRadius: radius.md,
                background: colors.bg.subtle,
                border: `1px solid ${colors.border.default}`,
                fontSize: font.size.md,
                color: colors.text.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: spacing['2'],
            }}>
                <Truck size={15} color={colors.text.muted} />
                <span>{presetLabel} 요율 적용 중</span>
                <span style={{ marginLeft: 'auto', fontWeight: font.weight.semibold, color: colors.text.primary }}>
                    ¥{lookupShippingFee(forwarder, 0.3).toLocaleString()} (0.3kg 기준)
                </span>
            </div>
            {rows && (
                <>
                    <button
                        onClick={() => setShowRates(!showRates)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: font.size.sm, fontWeight: font.weight.medium,
                            color: colors.primary, background: 'transparent',
                            border: 'none', cursor: 'pointer', padding: `${spacing['2']} 0`,
                            marginTop: spacing['1'],
                        }}
                    >
                        {showRates ? '요율표 접기' : '전체 요율표 보기'}
                        <ChevronDown size={13} style={{ transform: showRates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {showRates && (
                        <div style={{
                            background: colors.bg.surface, borderRadius: radius.md,
                            padding: `${spacing['3']} ${spacing['4']}`,
                            border: `1px solid ${colors.border.default}`, fontSize: font.size.xs,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: font.weight.semibold, color: colors.text.secondary }}>
                                <span>무게</span><span>배송비</span>
                            </div>
                            {rows.map((row, i) => (
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
                    )}
                </>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════
   가격 시뮬레이션 (온보딩과 동일)
   ══════════════════════════════════════════════════ */

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
                        borderRadius: radius.md, fontSize: font.size.md, fontWeight: font.weight.semibold,
                        border: `1.5px solid ${open ? colors.primary : colors.border.default}`,
                        boxShadow: open ? '0 0 0 3px rgba(49, 130, 246, 0.1)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', userSelect: 'none' as const,
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
                        borderRadius: radius.md, boxShadow: shadow.md, overflow: 'hidden', zIndex: 20,
                        maxHeight: '200px', overflowY: 'auto',
                    }}>
                        {WEIGHT_OPTIONS.map(w => (
                            <div key={w} onClick={() => { onChange(w); setOpen(false); }}
                                style={{
                                    padding: '10px 14px', fontSize: font.size.md, cursor: 'pointer',
                                    background: value === w ? colors.primaryLight : colors.bg.surface,
                                    color: value === w ? colors.primary : colors.text.primary,
                                    fontWeight: value === w ? font.weight.semibold : font.weight.regular,
                                    transition: 'background 0.15s',
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

function PriceSimulation({ marginValue, prepCost, forwarder, intlShipping }: {
    marginValue: number; prepCost: number; forwarder: ForwarderValue; intlShipping: number;
}) {
    const [simBaseCost, setSimBaseCost] = useState(15000);
    const [simWeight, setSimWeight] = useState(0.3);
    const [showCalculation, setShowCalculation] = useState(false);

    const hasForwarderRate = forwarder !== '' && forwarder !== 'other';
    const shippingJpy = hasForwarderRate ? lookupShippingFee(forwarder, simWeight) : intlShipping;
    const exchangeRate = EXCHANGE_RATE;

    const sim = useMemo(() => {
        const costKrw = simBaseCost + prepCost;
        const marginAmt = Math.round(costKrw * (marginValue / 100));
        const shippingKrw = Math.round(shippingJpy * exchangeRate);
        const requiredPayout = costKrw + marginAmt + shippingKrw;
        const requiredJpy = Math.round(requiredPayout / exchangeRate);
        const finalJpy = Math.round(requiredJpy / (1 - PLATFORM_FEE_RATE));
        const feeJpy = Math.round(finalJpy * PLATFORM_FEE_RATE);
        const payoutJpy = finalJpy - feeJpy;
        const payoutKrw = Math.round(payoutJpy * exchangeRate);
        const profit = payoutKrw - costKrw - shippingKrw;
        return { costKrw, marginAmt, shippingKrw, feeJpy, finalJpy, payoutKrw, profit };
    }, [marginValue, prepCost, shippingJpy, simBaseCost, exchangeRate]);

    const calcRows = [
        { icon: <Package size={14} />, label: '원가 + 작업비', value: `₩${sim.costKrw.toLocaleString()}`, highlight: false },
        { icon: <TrendingUp size={14} />, label: `+ 마진 ${marginValue}%`, value: `₩${sim.marginAmt.toLocaleString()}`, highlight: false },
        { icon: <Truck size={14} />, label: '+ 배송비', value: `₩${sim.shippingKrw.toLocaleString()} (¥${shippingJpy.toLocaleString()})`, highlight: false },
        { icon: <Calculator size={14} />, label: '+ Qoo10 수수료 12% 보전', value: `¥${sim.feeJpy.toLocaleString()}`, highlight: false },
        { icon: <Globe size={14} />, label: '= Qoo10 판매가', value: `¥${sim.finalJpy.toLocaleString()}`, highlight: true },
        { icon: <RefreshCw size={14} />, label: '− 수수료 12% 차감 → 수령액', value: `₩${sim.payoutKrw.toLocaleString()}`, highlight: false },
        { icon: <Package size={14} />, label: '− 원가·작업비·배송비 → 순수익', value: `₩${sim.profit.toLocaleString()}`, highlight: true },
    ];

    return (
        <div style={{
            marginTop: spacing['6'],
            background: colors.bg.subtle, borderRadius: radius.xl,
            border: `1px solid ${colors.border.default}`,
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
                                className="settings-input"
                                style={{ ...inputFieldStyle, paddingLeft: '24px', fontWeight: font.weight.semibold }}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.text.muted, fontWeight: font.weight.semibold, fontSize: font.size.sm }}>₩</span>
                        </div>
                    </div>
                    <WeightDropdown value={simWeight} onChange={setSimWeight} />
                </div>

                {/* 결과: 판매가 → 실수령액 → 순수익 */}
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    background: colors.bg.page, borderRadius: radius.lg,
                    border: `1px solid ${colors.border.default}`,
                    overflow: 'hidden',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}` }}>
                        <span style={{ fontSize: font.size.sm, color: colors.text.muted, fontWeight: font.weight.medium }}>Qoo10 판매가</span>
                        <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.primary, fontFamily: font.family.sans }}>
                            ¥{sim.finalJpy.toLocaleString()}
                        </span>
                    </div>
                    <div style={{ height: '1px', background: colors.border.default, margin: `0 ${spacing['4']}` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}` }}>
                        <span style={{ fontSize: font.size.sm, color: colors.text.muted, fontWeight: font.weight.medium }}>실수령액 (수수료 차감 후)</span>
                        <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.text.primary, fontFamily: font.family.sans }}>
                            ₩{sim.payoutKrw.toLocaleString()}
                        </span>
                    </div>
                    <div style={{ height: '1px', background: colors.border.default, margin: `0 ${spacing['4']}` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}`, background: sim.profit > 0 ? '#F0FFF4' : '#FEF2F2' }}>
                        <span style={{ fontSize: font.size.sm, color: sim.profit > 0 ? colors.success : colors.danger, fontWeight: font.weight.semibold }}>순수익</span>
                        <span style={{
                            fontSize: font.size.base, fontWeight: font.weight.bold, fontFamily: font.family.sans,
                            color: sim.profit > 0 ? colors.success : colors.danger,
                        }}>
                            {sim.profit >= 0 ? '+' : ''}₩{sim.profit.toLocaleString()}
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
    );
}
