import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { useParams, useBlocker } from 'react-router-dom';
import {
    Truck, ChevronDown, ChevronRight, ArrowRight,
    AlertTriangle, CheckCircle, TrendingUp, Calculator,
    Package, Globe, RefreshCw, Link2, Eye, EyeOff,
    Check,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useOnboarding, type ForwarderValue } from '../../components/onboarding/OnboardingContext';
import { colors, font, radius, spacing, shadow, zIndex } from '../../design/tokens';
import {
    FORWARDER_PRESETS, FORWARDER_RATES, lookupShippingFee,
    PLATFORM_FEE_RATE, EXCHANGE_RATE, WEIGHT_OPTIONS,
} from '../../utils/forwarder';

/* ── 타입 ── */

type SettingsTab = 'sales' | 'qoo10' | 'account';

interface DraftState {
    forwarder: ForwarderValue;
    zipCode: string;
    addressLine1: string;
    addressLine2: string;
    sameAsShipping: boolean;
    returnZipCode: string;
    returnAddressLine1: string;
    returnAddressLine2: string;
    contact: string;
    marginValue: number;
    prepCost: number;
    intlShipping: number;
    exchangeRateMode: 'realtime' | 'fixed';
    fixedExchangeRate: number;
}

/* ── 가격 영향 필드 ── */

const PRICE_FIELD_KEYS: (keyof DraftState)[] = [
    'marginValue', 'prepCost', 'intlShipping', 'forwarder',
    'exchangeRateMode', 'fixedExchangeRate',
];

const PRICE_FIELD_LABELS: Partial<Record<keyof DraftState, string>> = {
    marginValue: '기본 마진율',
    prepCost: '작업비',
    intlShipping: '해외 배송비',
    forwarder: '배송대행사 (배송비)',
    exchangeRateMode: '환율',
    fixedExchangeRate: '환율',
};

/* ── 탭 정보 ── */

const TAB_INFO: Record<SettingsTab, { title: string; description: string }> = {
    sales: { title: '판매 설정', description: '배송, 환율, 마진 등 상품 판매에 필요한 기본값을 설정합니다.' },
    qoo10: { title: 'Qoo10 연동', description: 'Qoo10 계정 연동 상태와 스토어 정보를 확인합니다.' },
    account: { title: '계정', description: '로그인 정보를 확인합니다.' },
};

/* ── 공통 스타일 ── */

const sectionStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing['10'],
    padding: `${spacing['8']} 0`,
    borderBottom: `1px solid ${colors.border.default}`,
};

const sectionInfoStyle: React.CSSProperties = {
    width: '260px',
    flexShrink: 0,
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: font.size.base,
    fontWeight: font.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing['1'],
};

const sectionDescStyle: React.CSSProperties = {
    fontSize: font.size.sm,
    color: colors.text.muted,
    lineHeight: font.lineHeight.normal,
    wordBreak: 'keep-all',
};

const inputFieldStyle: React.CSSProperties = {
    padding: `${spacing['3']} ${spacing['4']}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.border.default}`,
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
    fontFamily: font.family.sans,
    color: colors.text.primary,
    background: colors.bg.surface,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    width: '100%',
    boxSizing: 'border-box' as const,
};

/* ── 유틸 ── */

function extractDraft(s: ReturnType<typeof useOnboarding>['state']): DraftState {
    return {
        forwarder: s.forwarder, zipCode: s.zipCode, addressLine1: s.addressLine1,
        addressLine2: s.addressLine2, sameAsShipping: s.sameAsShipping,
        returnZipCode: s.returnZipCode, returnAddressLine1: s.returnAddressLine1,
        returnAddressLine2: s.returnAddressLine2, contact: s.contact,
        marginValue: s.marginValue, prepCost: s.prepCost, intlShipping: s.intlShipping,
        exchangeRateMode: s.exchangeRateMode, fixedExchangeRate: s.fixedExchangeRate,
    };
}

function getChangedKeys(a: DraftState, b: DraftState): (keyof DraftState)[] {
    return (Object.keys(a) as (keyof DraftState)[]).filter(k => a[k] !== b[k]);
}

/* ══════════════════════════════════════════════════
   메인 페이지
   ══════════════════════════════════════════════════ */

export default function SettingsPage() {
    const { tab } = useParams<{ tab: string }>();
    const activeTab = (tab as SettingsTab) || 'sales';
    const tabInfo = TAB_INFO[activeTab] || TAB_INFO.sales;

    const { state, setState } = useOnboarding();
    const [draft, setDraft] = useState<DraftState>(() => extractDraft(state));
    const [savedSnapshot, setSavedSnapshot] = useState<DraftState>(() => extractDraft(state));

    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [navigateAfterSave, setNavigateAfterSave] = useState(false);

    const changedKeys = useMemo(() => getChangedKeys(draft, savedSnapshot), [draft, savedSnapshot]);
    const hasChanges = changedKeys.length > 0;

    const changedPriceFields = useMemo(() => {
        const set = new Set<string>();
        changedKeys.forEach(k => {
            if (PRICE_FIELD_KEYS.includes(k)) {
                if (k === 'exchangeRateMode' || k === 'fixedExchangeRate') set.add('환율');
                else { const label = PRICE_FIELD_LABELS[k]; if (label) set.add(label); }
            }
        });
        return Array.from(set);
    }, [changedKeys]);

    const doSave = useCallback(() => {
        setState(prev => ({ ...prev, ...draft }));
        setSavedSnapshot({ ...draft });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    }, [draft, setState]);

    const handleSave = useCallback(() => {
        setNavigateAfterSave(false);
        if (changedPriceFields.length > 0) setShowApplyModal(true);
        else doSave();
    }, [changedPriceFields, doSave]);

    const handleSaveAndLeave = useCallback(() => {
        setNavigateAfterSave(true);
        if (changedPriceFields.length > 0) setShowApplyModal(true);
        else { doSave(); blockerRef.current?.proceed?.(); }
    }, [changedPriceFields, doSave]);

    const handleApplyConfirm = useCallback(() => {
        setShowApplyModal(false);
        doSave();
        if (navigateAfterSave) {
            setTimeout(() => blockerRef.current?.proceed?.(), 50);
        }
    }, [doSave, navigateAfterSave]);

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasChanges && currentLocation.pathname !== nextLocation.pathname
    );
    const blockerRef = useRef(blocker);
    blockerRef.current = blocker;

    useEffect(() => {
        if (!hasChanges) return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasChanges]);

    const updateDraft = useCallback((patch: Partial<DraftState>) => {
        setDraft(prev => ({ ...prev, ...patch }));
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: font.family.sans }}>
            <Sidebar />

            <main style={{
                marginLeft: '280px', flex: 1, height: '100vh',
                display: 'flex', flexDirection: 'column', background: colors.bg.surface,
            }}>
                {/* ── Sticky 헤더 ── */}
                <header style={{
                    background: colors.bg.surface,
                    borderBottom: `1px solid ${colors.border.default}`,
                    flexShrink: 0, zIndex: 10,
                    padding: '0 64px',
                }}>
                    <div style={{
                        maxWidth: '960px', margin: '0 auto',
                        padding: '48px 0 24px',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    }}>
                        <div>
                            <h1 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary, margin: 0 }}>
                                {tabInfo.title}
                            </h1>
                            <p style={{ fontSize: font.size.md, color: colors.text.muted, margin: `${spacing['1']} 0 0` }}>
                                {tabInfo.description}
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], flexShrink: 0, marginTop: spacing['1'] }}>
                            {hasChanges && (
                                <span style={{
                                    fontSize: font.size.sm, color: colors.warningIcon, fontWeight: font.weight.medium,
                                    display: 'flex', alignItems: 'center', gap: spacing['1'],
                                }}>
                                    <div style={{ width: 6, height: 6, borderRadius: radius.full, background: colors.warningIcon }} />
                                    변경사항 있음
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges}
                                style={{
                                    padding: `${spacing['2']} ${spacing['6']}`,
                                    borderRadius: radius.md, border: 'none',
                                    fontSize: font.size.base, fontWeight: font.weight.semibold,
                                    cursor: hasChanges ? 'pointer' : 'default',
                                    background: hasChanges ? colors.primary : colors.bg.subtle,
                                    color: hasChanges ? '#FFFFFF' : colors.text.muted,
                                    transition: 'all 0.2s',
                                    opacity: hasChanges ? 1 : 0.6,
                                }}
                                onMouseOver={e => { if (hasChanges) e.currentTarget.style.background = '#2563EB'; }}
                                onMouseOut={e => { if (hasChanges) e.currentTarget.style.background = colors.primary; }}
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── 컨텐츠 ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 64px 48px' }}>
                    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                        {activeTab === 'sales' && <SalesContent draft={draft} updateDraft={updateDraft} />}
                        {activeTab === 'qoo10' && <Qoo10Content />}
                        {activeTab === 'account' && <AccountContent />}
                    </div>
                </div>
            </main>

            {/* CSS */}
            <style>{`
                .settings-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 9999px; outline: none; cursor: pointer; transition: background 0.3s ease; }
                .settings-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--slider-color, ${colors.primary}); border: none; box-shadow: 0 0 0 8px color-mix(in srgb, var(--slider-color, ${colors.primary}) 15%, transparent); cursor: pointer; transition: box-shadow 0.2s ease; }
                .settings-slider::-webkit-slider-thumb:hover { box-shadow: 0 0 0 12px color-mix(in srgb, var(--slider-color, ${colors.primary}) 20%, transparent); }
                .settings-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--slider-color, ${colors.primary}); border: none; box-shadow: 0 0 0 8px color-mix(in srgb, var(--slider-color, ${colors.primary}) 15%, transparent); cursor: pointer; }
                .no-spinner::-webkit-outer-spin-button, .no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .settings-input:focus { border-color: ${colors.primary} !important; box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1); }
                @keyframes settingsFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes toastSlideIn { from { opacity: 0; transform: translateX(-50%) translateY(-12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
            `}</style>

            {/* ── 토스트 ── */}
            {showToast && (
                <div style={{
                    position: 'fixed', top: spacing['6'],
                    left: 'calc(280px + (100vw - 280px) / 2)',
                    transform: 'translateX(-50%)',
                    zIndex: zIndex.toast, display: 'flex', alignItems: 'center', gap: spacing['2'],
                    padding: `${spacing['3']} ${spacing['6']}`,
                    background: colors.text.primary, color: '#FFFFFF',
                    borderRadius: radius.lg, fontSize: font.size.base, fontWeight: font.weight.semibold,
                    boxShadow: shadow.lg, animation: 'toastSlideIn 0.25s ease forwards',
                }}>
                    <Check size={16} color={colors.success} />
                    설정이 저장되었습니다
                </div>
            )}

            {/* ── 미저장 이탈 방지 모달 ── */}
            {blocker.state === 'blocked' && (
                <ModalOverlay>
                    <div style={{ width: '420px', background: colors.bg.surface, borderRadius: radius.xl, padding: spacing['8'], boxShadow: shadow.lg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], marginBottom: spacing['3'] }}>
                            <AlertTriangle size={20} color={colors.warningIcon} />
                            <h3 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0 }}>
                                변경사항이 저장되지 않았습니다
                            </h3>
                        </div>
                        <p style={{ fontSize: font.size.md, color: colors.text.secondary, margin: `0 0 ${spacing['6']}`, lineHeight: font.lineHeight.normal }}>
                            저장하지 않고 나가면 변경 내용이 사라집니다.
                        </p>
                        <div style={{ display: 'flex', gap: spacing['3'] }}>
                            <button onClick={() => blocker.proceed?.()} style={{ flex: 1, padding: `${spacing['3']} ${spacing['4']}`, borderRadius: radius.md, border: `1px solid ${colors.border.default}`, background: colors.bg.surface, fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.secondary, cursor: 'pointer' }}
                                onMouseOver={e => e.currentTarget.style.background = colors.bg.subtle}
                                onMouseOut={e => e.currentTarget.style.background = colors.bg.surface}>나가기</button>
                            <button onClick={handleSaveAndLeave} style={{ flex: 1, padding: `${spacing['3']} ${spacing['4']}`, borderRadius: radius.md, border: 'none', background: colors.primary, fontSize: font.size.base, fontWeight: font.weight.semibold, color: '#FFFFFF', cursor: 'pointer' }}
                                onMouseOver={e => e.currentTarget.style.background = '#2563EB'}
                                onMouseOut={e => e.currentTarget.style.background = colors.primary}>저장하고 나가기</button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* ── 적용 범위 선택 모달 ── */}
            {showApplyModal && (
                <ApplyScopeModal changedFields={changedPriceFields} onConfirm={handleApplyConfirm} onCancel={() => setShowApplyModal(false)} />
            )}
        </div>
    );
}

/* ── 모달 오버레이 ── */

function ModalOverlay({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: zIndex.modal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
            <div style={{ position: 'relative' }}>{children}</div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   적용 범위 선택 모달
   ══════════════════════════════════════════════════ */

function ApplyScopeModal({ changedFields, onConfirm, onCancel }: {
    changedFields: string[]; onConfirm: () => void; onCancel: () => void;
}) {
    const [checked, setChecked] = useState<Record<string, boolean>>(
        () => Object.fromEntries(changedFields.map(f => [f, true]))
    );
    const [scope, setScope] = useState<'new' | 'all'>('new');

    return (
        <ModalOverlay>
            <div style={{ width: '480px', maxWidth: 'calc(100vw - 64px)', background: colors.bg.surface, borderRadius: radius.xl, padding: spacing['8'], boxShadow: shadow.lg, fontFamily: font.family.sans }}>
                <h3 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, margin: `0 0 ${spacing['5']}` }}>
                    어떤 항목을 적용하시겠어요?
                </h3>
                <div style={{ padding: spacing['4'], border: `1px solid ${colors.border.default}`, borderRadius: radius.lg, marginBottom: spacing['6'], display: 'flex', flexWrap: 'wrap', gap: spacing['3'] }}>
                    {changedFields.map(field => (
                        <label key={field} style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], cursor: 'pointer', fontSize: font.size.md, color: colors.text.primary, fontWeight: font.weight.medium }}>
                            <input type="checkbox" checked={checked[field] ?? true} onChange={() => setChecked(prev => ({ ...prev, [field]: !prev[field] }))} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.primary }} />
                            {field}
                        </label>
                    ))}
                </div>

                <h3 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, margin: `0 0 ${spacing['4']}` }}>
                    어떤 상품에 적용할까요?
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'], marginBottom: spacing['5'] }}>
                    {(['new', 'all'] as const).map(val => (
                        <label key={val} onClick={() => setScope(val)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: `${spacing['4']} ${spacing['5']}`,
                            border: `2px solid ${scope === val ? colors.primary : colors.border.default}`,
                            borderRadius: radius.lg, cursor: 'pointer',
                            background: scope === val ? colors.bg.info : colors.bg.surface,
                            transition: 'all 0.15s',
                        }}>
                            <span style={{ fontSize: font.size.base, fontWeight: scope === val ? font.weight.semibold : font.weight.medium, color: colors.text.primary }}>
                                {val === 'new' ? '새로 수집하는 상품부터 적용' : '모든 상품에 적용'}
                            </span>
                            <div style={{
                                width: '20px', height: '20px', borderRadius: radius.full,
                                border: `2px solid ${scope === val ? colors.primary : colors.border.light}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: scope === val ? colors.primary : 'transparent', transition: 'all 0.15s',
                            }}>
                                {scope === val && <div style={{ width: '6px', height: '6px', borderRadius: radius.full, background: '#FFFFFF' }} />}
                            </div>
                        </label>
                    ))}
                </div>

                {scope === 'all' && (
                    <div style={{ padding: `${spacing['4']} ${spacing['5']}`, background: colors.warningLight, border: `1px solid ${colors.warningBorder}`, borderRadius: radius.lg, marginBottom: spacing['5'] }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], marginBottom: spacing['2'] }}>
                            <AlertTriangle size={16} color={colors.warningIcon} />
                            <span style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.warningTextDark }}>항목 적용 전 확인해주세요</span>
                        </div>
                        <p style={{ fontSize: font.size.sm, color: colors.warningTextDark, margin: 0, lineHeight: font.lineHeight.normal }}>
                            수집한 상품과 등록한 상품의 판매가가 일괄 변경됩니다.
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', gap: spacing['3'] }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: `${spacing['3']} ${spacing['4']}`, borderRadius: radius.md, border: `1px solid ${colors.border.default}`, background: colors.bg.surface, fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.secondary, cursor: 'pointer' }}
                        onMouseOver={e => e.currentTarget.style.background = colors.bg.subtle}
                        onMouseOut={e => e.currentTarget.style.background = colors.bg.surface}>취소</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: `${spacing['3']} ${spacing['4']}`, borderRadius: radius.md, border: 'none', background: colors.primary, fontSize: font.size.base, fontWeight: font.weight.semibold, color: '#FFFFFF', cursor: 'pointer' }}
                        onMouseOver={e => e.currentTarget.style.background = '#2563EB'}
                        onMouseOut={e => e.currentTarget.style.background = colors.primary}>저장하기</button>
                </div>
            </div>
        </ModalOverlay>
    );
}

/* ══════════════════════════════════════════════════
   판매 설정 (배송 + 환율 + 판매가 통합)
   ══════════════════════════════════════════════════ */

function SalesContent({ draft, updateDraft }: { draft: DraftState; updateDraft: (p: Partial<DraftState>) => void }) {
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
        updateDraft({
            forwarder: val,
            ...(preset && preset.id !== 'other' ? { zipCode: preset.zipCode, addressLine1: preset.addressLine1, addressLine2: preset.addressLine2 }
                : { zipCode: '', addressLine1: '', addressLine2: '' }),
        });
        setForwarderOpen(false);
    };

    const hasForwarderRate = draft.forwarder !== '' && draft.forwarder !== 'other';
    const currentPreset = FORWARDER_PRESETS.find(p => p.id === draft.forwarder);
    const isOther = draft.forwarder === 'other';
    const effectiveExchangeRate = draft.exchangeRateMode === 'fixed' ? draft.fixedExchangeRate : EXCHANGE_RATE;

    const marginSignal = draft.marginValue < 15
        ? { color: colors.danger, Icon: AlertTriangle, text: '마진이 너무 낮아요. 수익이 거의 남지 않을 수 있어요.' }
        : draft.marginValue < 25
            ? { color: '#E67E22', Icon: TrendingUp, text: '가격은 경쟁력 있지만, 수익이 많지 않을 수 있어요.' }
            : draft.marginValue <= 40
                ? { color: colors.primary, Icon: CheckCircle, text: '적정 마진율이에요. 초보 셀러에게 권장하는 범위입니다.' }
                : draft.marginValue <= 50
                    ? { color: '#E67E22', Icon: TrendingUp, text: '경쟁 상품 대비 가격이 높아 판매가 어려울 수 있어요.' }
                    : { color: colors.danger, Icon: AlertTriangle, text: '가격이 너무 높아요.' };
    const sliderPct = ((draft.marginValue - 5) / (60 - 5)) * 100;

    return (
        <>
            {/* 출하지 · 반품 주소 */}
            <div id="forwarder-section" style={sectionStyle}>
                <div style={sectionInfoStyle}>
                    <div style={sectionTitleStyle}>출하지 · 반품 주소</div>
                    <div style={sectionDescStyle}>배송대행사를 선택하면 출하지 주소와 배송 요율이 자동 적용됩니다.</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>
                    {/* 배송대행사 선택 */}
                    <div>
                        <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: spacing['2'] }}>배송대행사</div>
                        <div style={{ position: 'relative' }} ref={ddRef}>
                            <div onClick={() => setForwarderOpen(!forwarderOpen)} style={{
                                padding: `${spacing['3']} ${spacing['4']}`, borderRadius: radius.md,
                                border: `1px solid ${forwarderOpen ? colors.primary : colors.border.default}`,
                                boxShadow: forwarderOpen ? '0 0 0 3px rgba(49, 130, 246, 0.1)' : 'none',
                                fontSize: font.size.md, fontWeight: font.weight.medium, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: colors.bg.surface, color: colors.text.primary,
                            }}>
                                <span>{currentPreset?.label || '배송대행사를 선택하세요'}</span>
                                <ChevronDown size={16} color={colors.text.muted} style={{ transform: forwarderOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                            </div>
                            {forwarderOpen && (
                                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: radius.lg, boxShadow: shadow.md, overflow: 'hidden', zIndex: 20 }}>
                                    {FORWARDER_PRESETS.map(p => (
                                        <div key={p.id} onClick={() => selectForwarder(p.id)} style={{
                                            padding: `${spacing['3']} ${spacing['4']}`, fontSize: font.size.md, cursor: 'pointer',
                                            background: draft.forwarder === p.id ? colors.primaryLight : colors.bg.surface,
                                            color: draft.forwarder === p.id ? colors.primary : colors.text.primary,
                                            fontWeight: draft.forwarder === p.id ? font.weight.semibold : font.weight.regular,
                                        }}
                                            onMouseEnter={e => { if (draft.forwarder !== p.id) e.currentTarget.style.background = colors.bg.page; }}
                                            onMouseLeave={e => { if (draft.forwarder !== p.id) e.currentTarget.style.background = colors.bg.surface; }}
                                        >{p.label}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 출하지 주소 */}
                    {draft.forwarder && (
                        <div style={{ padding: spacing['4'], background: colors.bg.faint, borderRadius: radius.lg, border: `1px solid ${colors.border.default}` }}>
                            <div style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.tertiary, marginBottom: spacing['2'] }}>
                                {isOther ? '출하지 주소' : '출하지 (일본 창고 주소)'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                                <input value={draft.zipCode} onChange={e => updateDraft({ zipCode: e.target.value })} placeholder="우편번호 (예: 273-0012)" className="settings-input" style={{ ...inputFieldStyle, background: !isOther ? colors.bg.subtle : colors.bg.surface }} disabled={!isOther} />
                                <input value={draft.addressLine1} onChange={e => updateDraft({ addressLine1: e.target.value })} placeholder="기본 주소" className="settings-input" style={{ ...inputFieldStyle, background: !isOther ? colors.bg.subtle : colors.bg.surface }} disabled={!isOther} />
                                <input value={draft.addressLine2} onChange={e => updateDraft({ addressLine2: e.target.value })} placeholder="상세 주소" className="settings-input" style={{ ...inputFieldStyle, background: !isOther ? colors.bg.subtle : colors.bg.surface }} disabled={!isOther} />
                            </div>
                        </div>
                    )}

                    {/* 반품 주소 */}
                    <div style={{ borderTop: `1px solid ${colors.bg.subtle}`, paddingTop: spacing['4'] }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: draft.sameAsShipping ? 0 : spacing['3'] }}>
                            <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>반품 주소</div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], cursor: 'pointer' }}>
                                <input type="checkbox" checked={draft.sameAsShipping} onChange={e => updateDraft({ sameAsShipping: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: colors.primary }} />
                                <span style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.tertiary }}>출하지 주소와 동일</span>
                            </label>
                        </div>
                        {!draft.sameAsShipping && (
                            <div style={{ padding: spacing['4'], background: colors.bg.faint, borderRadius: radius.lg, border: `1px solid ${colors.border.default}` }}>
                                <div style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.tertiary, marginBottom: spacing['2'] }}>반품 주소</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                                    <input value={draft.returnZipCode} onChange={e => updateDraft({ returnZipCode: e.target.value })} placeholder="우편번호 (예: 273-0012)" className="settings-input" style={inputFieldStyle} />
                                    <input value={draft.returnAddressLine1} onChange={e => updateDraft({ returnAddressLine1: e.target.value })} placeholder="기본 주소" className="settings-input" style={inputFieldStyle} />
                                    <input value={draft.returnAddressLine2} onChange={e => updateDraft({ returnAddressLine2: e.target.value })} placeholder="상세 주소" className="settings-input" style={inputFieldStyle} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 스토어 연락처 */}
            <div style={sectionStyle}>
                <div style={sectionInfoStyle}>
                    <div style={sectionTitleStyle}>스토어 연락처</div>
                    <div style={sectionDescStyle}>배송 문제나 클레임 발생 시 연락 가능한 번호입니다.</div>
                </div>
                <div style={{ flex: 1 }}>
                    <input value={draft.contact} onChange={e => updateDraft({ contact: e.target.value })} placeholder="010-1234-5678" className="settings-input" style={inputFieldStyle} />
                </div>
            </div>

            {/* 환율 설정 */}
            <div style={sectionStyle}>
                <div style={sectionInfoStyle}>
                    <div style={sectionTitleStyle}>환율 설정</div>
                    <div style={sectionDescStyle}>소싱몰 상품 가격을 원화로 계산할 때의 환율 기준을 설정할 수 있어요.</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>

                    {/* 환율 */}
                    <div>
                        <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: spacing['2'] }}>환율</div>
                        <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginBottom: spacing['3'] }}>소싱몰 상품 가격을 원화로 계산할 때의 환율 기준을 설정할 수 있어요.</div>

                        {/* 라디오 선택 */}
                        <div style={{ display: 'flex', gap: spacing['5'], alignItems: 'center', marginBottom: spacing['3'] }}>
                            {(['realtime', 'fixed'] as const).map(mode => (
                                <label key={mode} onClick={() => updateDraft({ exchangeRateMode: mode })} style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], cursor: 'pointer' }}>
                                    <div style={{
                                        width: '18px', height: '18px', borderRadius: radius.full,
                                        border: `2px solid ${draft.exchangeRateMode === mode ? colors.primary : colors.border.light}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: draft.exchangeRateMode === mode ? colors.primary : 'transparent',
                                        transition: 'all 0.25s ease',
                                    }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: radius.full, background: '#FFFFFF', opacity: draft.exchangeRateMode === mode ? 1 : 0, transform: draft.exchangeRateMode === mode ? 'scale(1)' : 'scale(0)', transition: 'all 0.2s ease' }} />
                                    </div>
                                    <span style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.text.primary }}>
                                        {mode === 'realtime' ? '실시간 환율 적용' : '원하는 환율 고정'}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {/* 환율 값 — 콜아웃 박스 */}
                        <div style={{
                            padding: `${spacing['4']} ${spacing['5']}`,
                            background: colors.bg.faint, borderRadius: radius.lg,
                            border: `1px solid ${colors.border.default}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'all 0.3s ease',
                        }}>
                            {draft.exchangeRateMode === 'realtime' ? (
                                <div key="realtime" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', animation: 'settingsFadeIn 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'] }}>
                                        <RefreshCw size={16} color={colors.primary} />
                                        <div>
                                            <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>
                                                🇯🇵 100엔 = {Math.round(EXCHANGE_RATE * 100).toLocaleString()}원
                                            </div>
                                            <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: '2px' }}>
                                                매일 자동 갱신 · 오늘 기준
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: `${spacing['1']} ${spacing['3']}`,
                                        background: colors.bg.info, borderRadius: radius.full,
                                        border: `1px solid ${colors.primaryLightBorder}`,
                                        fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.primary,
                                    }}>자동</div>
                                </div>
                            ) : (
                                <div key="fixed" style={{ width: '100%', animation: 'settingsFadeIn 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], marginBottom: spacing['2'] }}>
                                        <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>🇯🇵 100엔</span>
                                        <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>(오늘 실시간 {Math.round(EXCHANGE_RATE * 100).toLocaleString()}원)</span>
                                    </div>
                                    <CompactInput
                                        value={draft.fixedExchangeRate * 100 || ''}
                                        onChange={v => updateDraft({ fixedExchangeRate: Math.max(0, Number(v)) / 100 })}
                                        unit="원"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 판매가 구성 (작업비, 배송비, 마진) */}
            <div style={sectionStyle}>
                <div style={sectionInfoStyle}>
                    <div style={sectionTitleStyle}>판매가 구성</div>
                    <div style={sectionDescStyle}>판매가를 구성하는 항목의 기본값을 설정해요. 이 항목의 금액은 자동으로 판매가에 가산돼요.</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>
                    {/* 작업비 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing['3']} 0`, borderBottom: `1px solid ${colors.bg.subtle}` }}>
                        <div>
                            <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>작업비</div>
                            <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>포장·검수 수수료</div>
                        </div>
                        <CompactInput value={draft.prepCost === 0 ? '' : draft.prepCost} onChange={v => updateDraft({ prepCost: Math.max(0, Number(v)) })} unit="원" />
                    </div>

                    {/* 해외 배송비 */}
                    <ShippingFeeRow
                        hasForwarderRate={hasForwarderRate}
                        presetLabel={currentPreset?.shortLabel || ''}
                        forwarder={draft.forwarder}
                        intlShipping={draft.intlShipping}
                        onChangeShipping={v => updateDraft({ intlShipping: Math.max(0, Number(v)) })}
                    />

                    {/* 마진율 — 가로 배치 + 슬라이더 */}
                    <div style={{ padding: `${spacing['3']} 0` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing['3'] }}>
                            <div>
                                <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>기본 마진율</div>
                                <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>상품별로 개별 변경 가능</div>
                            </div>
                            <CompactInput value={draft.marginValue || ''} onChange={v => { const n = Number(v); if (n >= 5 && n <= 60) updateDraft({ marginValue: n }); }} unit="%" />
                        </div>

                        <div>
                            <input type="range" min={5} max={60} step={5} value={draft.marginValue} onChange={e => updateDraft({ marginValue: Number(e.target.value) })} className="settings-slider" style={{ '--slider-color': marginSignal.color, background: `linear-gradient(to right, ${marginSignal.color} ${sliderPct}%, ${colors.border.default} ${sliderPct}%)` } as React.CSSProperties} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>5%</span>
                                <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>60%</span>
                            </div>
                        </div>

                        <div style={{
                            marginTop: spacing['3'], padding: `${spacing['4']} ${spacing['4']}`, borderRadius: radius.md,
                            background: marginSignal.color === colors.primary ? colors.bg.info : marginSignal.color === colors.danger ? colors.dangerBg : colors.warningLight,
                            border: `1px solid ${marginSignal.color === colors.primary ? colors.primaryLightBorder : marginSignal.color === colors.danger ? colors.dangerLight : colors.warningBorder}`,
                            display: 'flex', alignItems: 'center', gap: spacing['2'],
                        }}>
                            <marginSignal.Icon size={14} style={{ color: marginSignal.color, flexShrink: 0 }} />
                            <span style={{ fontSize: font.size.sm, color: marginSignal.color, fontWeight: font.weight.medium }}>{marginSignal.text}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 가격 시뮬레이션 */}
            <div style={{ ...sectionStyle, borderBottom: 'none' }}>
                <div style={sectionInfoStyle}>
                    <div style={sectionTitleStyle}>가격 시뮬레이션</div>
                    <div style={sectionDescStyle}>위 설정값을 기준으로 실제 판매가와 순수익을 미리 확인해 보세요.</div>
                </div>
                <div style={{ flex: 1 }}>
                    <PriceSimulation marginValue={draft.marginValue} prepCost={draft.prepCost} forwarder={draft.forwarder} intlShipping={draft.intlShipping} exchangeRate={effectiveExchangeRate} />
                </div>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════════════
   Qoo10 연동 (2컬럼)
   ══════════════════════════════════════════════════ */

function Qoo10Content() {
    const { state } = useOnboarding();
    const [showKey, setShowKey] = useState(false);
    const connected = state.connected;
    const displayKey = state.apiKey ? (showKey ? state.apiKey : '••••••••••••') : '—';

    const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing['3']} 0`, borderBottom: `1px solid ${colors.bg.subtle}` }}>
            <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>{label}</span>
            {children}
        </div>
    );

    return (
        <div style={{ ...sectionStyle, borderBottom: 'none' }}>
            <div style={sectionInfoStyle}>
                <div style={sectionTitleStyle}>연동 정보</div>
                <div style={sectionDescStyle}>Qoo10 계정 연동 상태와 스토어 정보입니다.</div>
            </div>
            <div style={{ flex: 1 }}>
                <InfoRow label="연동 상태">
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: radius.full, background: connected ? colors.success : colors.text.muted }} />
                        <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: connected ? colors.successDark : colors.text.muted }}>
                            {connected ? '연동됨' : '미연동'}
                        </span>
                    </div>
                </InfoRow>
                <InfoRow label="스토어명">
                    <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>{state.storeName || '—'}</span>
                </InfoRow>
                <InfoRow label="Seller ID">
                    <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>{state.sellerId || '—'}</span>
                </InfoRow>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing['3']} 0` }}>
                    <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>API Key</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, fontFamily: showKey ? font.family.mono : 'inherit', letterSpacing: showKey ? '0.5px' : '2px' }}>{displayKey}</span>
                        {state.apiKey && (
                            <button onClick={() => setShowKey(!showKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: radius.sm, display: 'flex', color: colors.text.muted }}
                                onMouseOver={e => { e.currentTarget.style.background = colors.bg.subtle; e.currentTarget.style.color = colors.text.primary; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.text.muted; }}
                            >{showKey ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                        )}
                    </div>
                </div>
                <button style={{ marginTop: spacing['4'], padding: `${spacing['3']} ${spacing['5']}`, background: 'transparent', border: `1px solid ${colors.border.default}`, borderRadius: radius.md, fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.text.secondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: spacing['2'] }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.color = colors.primary; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = colors.border.default; e.currentTarget.style.color = colors.text.secondary; }}
                ><Link2 size={15} />API Key 재연동</button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   계정 (2컬럼)
   ══════════════════════════════════════════════════ */

function AccountContent() {
    const InfoRow = ({ label, value }: { label: string; value: string }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing['3']} 0`, borderBottom: `1px solid ${colors.bg.subtle}` }}>
            <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>{label}</span>
            <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>{value}</span>
        </div>
    );

    return (
        <div style={{ ...sectionStyle, borderBottom: 'none' }}>
            <div style={sectionInfoStyle}>
                <div style={sectionTitleStyle}>로그인 정보</div>
                <div style={sectionDescStyle}>계정 정보를 확인합니다.</div>
            </div>
            <div style={{ flex: 1 }}>
                <InfoRow label="이메일" value="seller@dayzero.kr" />
                <InfoRow label="로그인 방식" value="이메일" />
            </div>
        </div>
    );
}

/* ── 컴팩트 입력 필드 (단위 포함) ── */

function CompactInput({ value, onChange, unit, placeholder = '0' }: {
    value: string | number; onChange: (v: string) => void; unit: string; placeholder?: string;
}) {
    return (
        <div style={{ position: 'relative', width: '110px', flexShrink: 0 }}>
            <input
                type="number"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="settings-input no-spinner"
                style={{
                    ...inputFieldStyle,
                    width: '110px', paddingRight: '24px',
                    textAlign: 'right', fontWeight: font.weight.semibold,
                    MozAppearance: 'textfield' as never,
                }}
            />
            <span style={{
                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                fontSize: font.size.sm, color: colors.text.muted, fontWeight: font.weight.medium,
                pointerEvents: 'none',
            }}>{unit}</span>
        </div>
    );
}

/* ── 해외 배송비 행 ── */

function ShippingFeeRow({ hasForwarderRate, presetLabel, forwarder, intlShipping, onChangeShipping }: {
    hasForwarderRate: boolean; presetLabel: string; forwarder: ForwarderValue;
    intlShipping: number; onChangeShipping: (v: string) => void;
}) {
    const table = FORWARDER_RATES[forwarder];
    const rows = table?.rows;

    return (
        <div style={{ padding: `${spacing['3']} 0`, borderBottom: `1px solid ${colors.bg.subtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>해외 배송비</div>
                    <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                        {hasForwarderRate ? `${presetLabel} 요율표 자동 적용` : '국제 배송 비용'}
                    </div>
                </div>
                {hasForwarderRate ? (
                    <div /> /* 배송대행사 선택 시 오른쪽 빈 공간 — 아래 풀 배너로 표시 */
                ) : (
                    <CompactInput value={intlShipping === 0 ? '' : intlShipping} onChange={onChangeShipping} unit="엔" />
                )}
            </div>

            {/* 배송대행사 정보 배너 */}
            {hasForwarderRate && (
                <button
                    onClick={() => document.getElementById('forwarder-section')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{
                        display: 'flex', alignItems: 'center', gap: spacing['3'],
                        width: '100%', marginTop: spacing['3'],
                        padding: `${spacing['3']} ${spacing['4']}`,
                        background: colors.bg.info, borderRadius: radius.md,
                        border: `1px solid ${colors.primaryLightBorder}`,
                        cursor: 'pointer', transition: 'all 0.15s',
                        textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = colors.primaryHover}
                    onMouseOut={e => e.currentTarget.style.background = colors.bg.info}
                >
                    <Truck size={16} color={colors.primary} />
                    <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.primary, flex: 1 }}>
                        배송대행사 {presetLabel} 요율표 자동 적용 중
                    </span>
                    <span style={{ fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.medium }}>변경하기</span>
                </button>
            )}

            {/* 요율표 (항상 표시) */}
            {hasForwarderRate && rows && (
                <div style={{
                    marginTop: spacing['3'],
                    background: colors.bg.faint, borderRadius: radius.md,
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

        </div>
    );
}

/* ══════════════════════════════════════════════════
   가격 시뮬레이션
   ══════════════════════════════════════════════════ */

function WeightDropdown({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div style={{ width: '120px', flexShrink: 0 }} ref={ref}>
            <label style={{ display: 'block', fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: '6px', fontWeight: font.weight.semibold }}>무게 (kg)</label>
            <div style={{ position: 'relative' }}>
                <div onClick={() => setOpen(!open)} style={{
                    width: '100%', padding: `${spacing['3']} ${spacing['3']}`, borderRadius: radius.md,
                    fontSize: font.size.md, fontWeight: font.weight.semibold,
                    border: `1.5px solid ${open ? colors.primary : colors.border.default}`,
                    boxShadow: open ? '0 0 0 3px rgba(49, 130, 246, 0.1)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', userSelect: 'none' as const,
                    backgroundColor: colors.bg.surface, color: colors.text.primary, boxSizing: 'border-box' as const,
                }}>
                    <span>{value}kg</span>
                    <ChevronDown size={14} color={open ? colors.primary : colors.text.muted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {open && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: radius.md, boxShadow: shadow.md, overflow: 'hidden', zIndex: 20, maxHeight: '200px', overflowY: 'auto' }}>
                        {WEIGHT_OPTIONS.map(w => (
                            <div key={w} onClick={() => { onChange(w); setOpen(false); }} style={{
                                padding: '10px 14px', fontSize: font.size.md, cursor: 'pointer',
                                background: value === w ? colors.primaryLight : colors.bg.surface,
                                color: value === w ? colors.primary : colors.text.primary,
                                fontWeight: value === w ? font.weight.semibold : font.weight.regular,
                            }}
                                onMouseEnter={e => { if (value !== w) e.currentTarget.style.background = colors.bg.page; }}
                                onMouseLeave={e => { if (value !== w) e.currentTarget.style.background = colors.bg.surface; }}
                            >{w}kg</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function PriceSimulation({ marginValue, prepCost, forwarder, intlShipping, exchangeRate }: {
    marginValue: number; prepCost: number; forwarder: ForwarderValue; intlShipping: number; exchangeRate: number;
}) {
    const [simBaseCost, setSimBaseCost] = useState(15000);
    const [simWeight, setSimWeight] = useState(0.3);
    const [showCalculation, setShowCalculation] = useState(false);

    const hasForwarderRate = forwarder !== '' && forwarder !== 'other';
    const shippingJpy = hasForwarderRate ? lookupShippingFee(forwarder, simWeight) : intlShipping;

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
        <div style={{ background: colors.bg.subtle, borderRadius: radius.xl, border: `1px solid ${colors.border.default}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], padding: `${spacing['4']} ${spacing['5']}`, color: colors.text.primary, fontSize: font.size.base, fontWeight: font.weight.bold }}>
                <Calculator size={16} color={colors.primary} />
                가격 시뮬레이션
            </div>

            <div style={{ padding: `0 ${spacing['5']} ${spacing['5']}`, display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', gap: spacing['1'], padding: '4px 10px', background: colors.bg.info, borderRadius: radius.full, border: `1px solid ${colors.primaryLightBorder}` }}>
                    <span style={{ fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.primary }}>적용 환율</span>
                    <span style={{ fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.text.primary }}>¥1 = ₩{exchangeRate.toFixed(1)}</span>
                </div>

                <div style={{ display: 'flex', gap: spacing['3'] }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: '6px', fontWeight: font.weight.semibold }}>상품 원가</label>
                        <div style={{ position: 'relative' }}>
                            <input type="text" value={simBaseCost.toLocaleString()} onChange={e => setSimBaseCost(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="settings-input" style={{ ...inputFieldStyle, paddingLeft: '24px', fontWeight: font.weight.semibold }} />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.text.muted, fontWeight: font.weight.semibold, fontSize: font.size.sm }}>₩</span>
                        </div>
                    </div>
                    <WeightDropdown value={simWeight} onChange={setSimWeight} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', background: colors.bg.page, borderRadius: radius.lg, border: `1px solid ${colors.border.default}`, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}` }}>
                        <span style={{ fontSize: font.size.sm, color: colors.text.muted, fontWeight: font.weight.medium }}>Qoo10 판매가</span>
                        <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.primary }}>¥{sim.finalJpy.toLocaleString()}</span>
                    </div>
                    <div style={{ height: '1px', background: colors.border.default, margin: `0 ${spacing['4']}` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}` }}>
                        <span style={{ fontSize: font.size.sm, color: colors.text.muted, fontWeight: font.weight.medium }}>실수령액</span>
                        <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.text.primary }}>₩{sim.payoutKrw.toLocaleString()}</span>
                    </div>
                    <div style={{ height: '1px', background: colors.border.default, margin: `0 ${spacing['4']}` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['3']} ${spacing['4']}`, background: sim.profit > 0 ? '#F0FFF4' : '#FEF2F2' }}>
                        <span style={{ fontSize: font.size.sm, color: sim.profit > 0 ? colors.success : colors.danger, fontWeight: font.weight.semibold }}>순수익</span>
                        <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: sim.profit > 0 ? colors.success : colors.danger }}>
                            {sim.profit >= 0 ? '+' : ''}₩{sim.profit.toLocaleString()}
                        </span>
                    </div>
                </div>

                <button onClick={() => setShowCalculation(!showCalculation)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    width: '100%', background: 'transparent', border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.md, padding: `${spacing['2']} ${spacing['3']}`,
                    color: colors.text.tertiary, fontSize: font.size.sm, fontWeight: font.weight.medium, cursor: 'pointer',
                }}
                    onMouseEnter={e => e.currentTarget.style.background = colors.bg.page}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    {showCalculation ? '계산 과정 접기' : '계산 과정 보기'}
                    {showCalculation ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                {showCalculation && (
                    <div style={{ background: colors.bg.page, borderRadius: radius.md, padding: spacing['4'], border: `1px solid ${colors.border.default}`, display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
                        {calcRows.map((row, i) => (
                            <Fragment key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], color: colors.text.muted, fontSize: font.size.xs }}>{row.icon} {row.label}</div>
                                    <div style={{ fontSize: row.highlight ? font.size.md : font.size.sm, fontWeight: row.highlight ? 800 : font.weight.bold, color: row.highlight ? colors.primary : colors.text.primary }}>{row.value}</div>
                                </div>
                                {i < calcRows.length - 1 && <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={12} color={colors.border.default} style={{ transform: 'rotate(90deg)' }} /></div>}
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
