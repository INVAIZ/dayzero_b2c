import { useState, useCallback, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import type { ProductDetail } from '../../../types/editing';
import { useEditingStore } from '../../../store/useEditingStore';
import { useOnboarding } from '../../../components/onboarding/OnboardingContext';
import { EXCHANGE_RATE } from '../../../mock/categoryMap';
import { colors, font, radius, shadow, spacing, zIndex } from '../../../design/tokens';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { SourceTag } from '../../../components/common/SourceTag';

interface Props {
    product: ProductDetail;
}

// ── 공통 스타일 상수 ────────────────────────────────────────────────────────
const flexBetween: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const sectionBadgeStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '20px', height: '20px',
    background: colors.primary, color: '#fff', borderRadius: radius.full,
    fontSize: font.size.xs, fontWeight: 700,
    marginRight: '7px', flexShrink: 0,
};

const costSummaryBadgeStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '18px', height: '18px',
    background: '#fff', color: colors.primary,
    border: `1.5px solid ${colors.primary}`, borderRadius: radius.full,
    fontSize: font.size['2xs'], fontWeight: 700,
};

const summaryRowStyle: React.CSSProperties = {
    ...flexBetween,
    padding: `11px ${spacing['4']}`,
    background: colors.bg.subtle,
    borderTop: `1px solid ${colors.border.default}`,
};

const calcRowStyle: React.CSSProperties = {
    ...flexBetween,
    padding: '11px 0',
};

const subAmountStyle: React.CSSProperties = {
    fontSize: font.size['2xs+'], color: colors.text.muted, marginTop: '1px',
};

const KSE_RATES: [number, number][] = [
    [0.10, 490], [0.25, 560], [0.50, 620], [0.75, 700],
    [1.00, 750], [1.25, 780], [1.50, 830], [1.75, 880],
    [2.00, 940], [2.50, 1090],
];

const lookupKseRate = (kg: number): number => {
    for (const [limit, fee] of KSE_RATES) if (kg <= limit) return fee;
    return KSE_RATES[KSE_RATES.length - 1][1];
};

const QOO10_FEE_RATE = 0.108;

const SOURCE_TOOLTIPS: Record<string, string> = {
    ai_weight: '상품 무게 정보가 없어 AI가 예측한 무게입니다.',
    crawled_weight: '실제 상품 페이지에서 수집한 무게 정보입니다.',
    ai_price: '상품 가격 정보가 없어 AI가 예측한 가격입니다.',
    crawled_price: '실제 상품 페이지에서 수집한 가격 정보입니다.',
    crawled_domestic: '실제 상품 페이지에서 수집한 배송비입니다.',
};

// ── 플로팅 툴팁 ─────────────────────────────────────────────────────────────
const FloatingTooltip: React.FC<{
    pos: { x: number; y: number };
    source: 'crawled' | 'ai';
    tooltipKey: string;
}> = ({ pos, source, tooltipKey }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [adjusted, setAdjusted] = useState(pos);
    const text = SOURCE_TOOLTIPS[tooltipKey] ?? '';

    useEffect(() => {
        if (!ref.current) return;
        const { width, height } = ref.current.getBoundingClientRect();
        const vw = window.innerWidth;
        let x = pos.x, y = pos.y + 12;
        if (x + width > vw - 16) x = vw - width - 16;
        if (y + height > window.innerHeight - 16) y = pos.y - height - 12;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAdjusted({ x, y });
    }, [pos.x, pos.y]);

    if (!text) return null;
    return (
        <div ref={ref} style={{
            position: 'fixed', left: adjusted.x, top: adjusted.y, zIndex: zIndex.toast,
            background: colors.text.primary, color: '#fff',
            borderRadius: radius.lg, padding: `${spacing['3']} ${spacing['4']}`,
            boxShadow: shadow.lg, pointerEvents: 'none', maxWidth: '340px', fontSize: font.size.sm,
            animation: 'koIn 0.12s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SourceTag source={source} />
                <span style={{ lineHeight: 1.6 }}>{text}</span>
            </div>
        </div>
    );
};

// ── 섹션 레이블 ─────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.text.secondary }}>
        {children}
    </span>
);

const Divider = () => (
    <div style={{ height: '1px', background: colors.border.default }} />
);

const SectionDivider = () => (
    <div style={{ height: '1px', background: colors.border.default, margin: `${spacing['6']} 0` }} />
);

type EditingField = null | 'originalPrice' | 'domestic' | 'prep' | 'weight';

// ── 비용 행 (읽기 모드 — 호버 시 연필, 태그 호버 시 툴팁) ──────────────────
const CostRow: React.FC<{
    label: string;
    sub?: string;
    value: number;
    prefix?: string;
    suffix?: string;
    source?: 'crawled' | 'ai' | 'manual';
    showTag?: boolean;
    onClick: () => void;
    onTooltipMove?: (pos: { x: number; y: number }) => void;
    onTooltipLeave?: () => void;
}> = ({ label, sub, value, prefix, suffix, source, showTag, onClick, onTooltipMove, onTooltipLeave }) => {
    const [hovering, setHovering] = useState(false);
    const hasTag = showTag && source && source !== 'manual';

    return (
        <div
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => { setHovering(false); onTooltipLeave?.(); }}
            onMouseMove={hasTag && onTooltipMove ? (e) => onTooltipMove({ x: e.clientX, y: e.clientY }) : undefined}
            onClick={onClick}
            style={{ ...flexBetween, padding: '13px 0', cursor: 'pointer' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing['1'] }}>
                <span style={{ fontSize: font.size.sm, color: colors.text.secondary }}>{label}</span>
                {sub && <span style={{ fontSize: font.size.xs, color: colors.text.muted, marginLeft: '2px' }}>{sub}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Pencil
                    size={10} color={colors.text.muted}
                    style={{ opacity: hovering ? 0.6 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}
                />
                {hasTag && <SourceTag source={source!} />}
                <span style={{
                    fontSize: font.size.sm, fontWeight: 600, color: colors.text.primary,
                    textDecoration: hasTag ? 'underline' : 'none',
                    textDecorationStyle: 'dotted',
                    textUnderlineOffset: '3px',
                    textDecorationColor: colors.text.muted,
                }}>
                    {prefix ?? ''}{value.toLocaleString()}{suffix ?? ''}
                </span>
            </div>
        </div>
    );
};

// ── 비용 행 (편집 모드) ─────────────────────────────────────────────────────
const CostEditRow: React.FC<{
    label: string;
    value: string;
    prefix?: string;
    suffix?: string;
    hint?: string;
    onChange: (v: string) => void;
    onSave: () => void;
    onCancel: () => void;
}> = ({ label, value, prefix, suffix, hint, onChange, onSave, onCancel }) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.select(); }, []);

    return (
        <div style={{ padding: '12px 0' }}>
            <div style={flexBetween}>
                <span style={{ fontSize: font.size.sm, color: colors.text.secondary }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {prefix && <span style={{ fontSize: font.size.sm, color: colors.text.muted }}>{prefix}</span>}
                        <input
                            ref={ref}
                            type="text" inputMode="decimal" className="price-input"
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
                            onFocus={e => e.target.select()}
                            style={{
                                width: '90px', textAlign: 'right',
                                padding: '0 0 3px', fontSize: font.size.sm, fontWeight: 600,
                                color: colors.primary, background: 'transparent',
                                border: 'none', borderBottom: `2px solid ${colors.primary}`,
                                outline: 'none', fontFamily: 'inherit',
                            }}
                        />
                        {suffix && <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>{suffix}</span>}
                    </div>
                    <button onClick={onSave} style={{ padding: '4px 12px', borderRadius: radius.md, background: colors.primary, border: 'none', fontSize: font.size.xs, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>저장</button>
                    <button onClick={onCancel} style={{ padding: '4px 10px', borderRadius: radius.md, background: 'none', border: `1px solid ${colors.border.default}`, fontSize: font.size.xs, color: colors.text.secondary, cursor: 'pointer' }}>취소</button>
                </div>
            </div>
            {hint && <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '6px' }}>{hint}</div>}
        </div>
    );
};

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export const PriceEditTab: React.FC<Props> = ({ product }) => {
    const { updateProduct } = useEditingStore();
    const { state: onboarding } = useOnboarding();

    const defaultMarginRate = onboarding.marginType === '%' ? onboarding.marginValue : 30;

    const initDomestic = onboarding.domesticShipping;
    const initPrep = onboarding.prepCost;
    const initIntl = onboarding.intlShipping > 0 ? onboarding.intlShipping : lookupKseRate(product.weightKg);

    const calcPrice = (origPrice: number, margin: number, domestic: number, prep: number, intl: number) => {
        const total = (origPrice + domestic + prep) / EXCHANGE_RATE + intl;
        return Math.round(total * (1 + margin / 100) / 10) * 10;
    };

    // ── 로컬 상태 ─────────────────────────────────────────────────────────
    const [originalPrice, setOriginalPrice] = useState(product.originalPriceKrw);
    const initCostJpy = (product.originalPriceKrw + initDomestic + initPrep) / EXCHANGE_RATE + initIntl;
    const hasExistingPrice = product.salePriceJpy > 0;
    const initMarginRate = hasExistingPrice
        ? Math.round(((product.salePriceJpy / initCostJpy) - 1) * 100 * 10) / 10
        : defaultMarginRate;

    const [marginRate, setMarginRate] = useState(initMarginRate);
    const [domesticShipping, setDomesticShipping] = useState(initDomestic);
    const [prepCost, setPrepCost] = useState(initPrep);
    const [intlShipping, setIntlShipping] = useState(initIntl);
    const [weight, setWeight] = useState(product.weightKg);
    const [salePriceJpy, setSalePriceJpy] = useState(
        hasExistingPrice ? product.salePriceJpy : calcPrice(product.originalPriceKrw, defaultMarginRate, initDomestic, initPrep, initIntl)
    );
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // 편집 상태
    const [editingField, setEditingField] = useState<EditingField>(null);
    const [editInput, setEditInput] = useState('');
    const [confirmField, setConfirmField] = useState<EditingField>(null);

    // 사용자 수정 추적 (태그 제거용)
    const [isPriceUserEdited, setIsPriceUserEdited] = useState(false);
    const [isDomesticUserEdited, setIsDomesticUserEdited] = useState(false);
    const [isWeightUserEdited, setIsWeightUserEdited] = useState(false);

    // 호버 툴팁
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const [tooltipKey, setTooltipKey] = useState('');
    const [tooltipSource, setTooltipSource] = useState<'ai' | 'crawled'>('crawled');

    const showTooltip = useCallback((source: 'ai' | 'crawled', key: string) => (pos: { x: number; y: number }) => {
        setTooltipPos(pos);
        setTooltipSource(source);
        setTooltipKey(key);
    }, []);
    const hideTooltip = useCallback(() => setTooltipPos(null), []);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const priceRef = useRef(salePriceJpy);
    priceRef.current = salePriceJpy;

    // 상품 전환 시 초기화
    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        const newDomestic = onboarding.domesticShipping;
        const newPrep = onboarding.prepCost;
        const newIntl = onboarding.intlShipping > 0 ? onboarding.intlShipping : lookupKseRate(product.weightKg);
        setOriginalPrice(product.originalPriceKrw);
        setDomesticShipping(newDomestic);
        setPrepCost(newPrep);
        setIntlShipping(newIntl);
        // 등록된 상품(salePriceJpy가 이미 설정됨)은 기존 판매가 유지 + 마진율 역산
        if (product.salePriceJpy > 0) {
            const existingPrice = product.salePriceJpy;
            const costJpy = (product.originalPriceKrw + newDomestic + newPrep) / EXCHANGE_RATE + newIntl;
            const reverseMargin = costJpy > 0 ? ((existingPrice / costJpy) - 1) * 100 : 0;
            setSalePriceJpy(existingPrice);
            setMarginRate(Math.round(reverseMargin * 10) / 10);
        } else {
            setMarginRate(defaultMarginRate);
            setSalePriceJpy(calcPrice(product.originalPriceKrw, defaultMarginRate, newDomestic, newPrep, newIntl));
        }
        setWeight(product.weightKg);
        setIsPriceUserEdited(false);
        setIsDomesticUserEdited(false);
        setIsWeightUserEdited(false);
        setSaveStatus('idle');
        setEditingField(null);
        setConfirmField(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id]);

    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            if (savedTimer.current) clearTimeout(savedTimer.current);
        };
    }, []);

    const triggerSave = useCallback(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        setSaveStatus('saving');
        saveTimer.current = setTimeout(() => {
            updateProduct(product.id, { salePriceJpy: priceRef.current });
            setSaveStatus('saved');
            savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
        }, 2000);
    }, [product.id, updateProduct]);

    // ── 계산 ──────────────────────────────────────────────────────────────
    const totalCostKrw = originalPrice + domesticShipping + prepCost;
    const costJpy = totalCostKrw / EXCHANGE_RATE;
    const totalCostJpy = costJpy + intlShipping;

    const recalcPrice = (origP: number, margin: number, domestic: number, prep: number, intl: number) => {
        const newPrice = calcPrice(origP, margin, domestic, prep, intl);
        setSalePriceJpy(newPrice > 0 ? newPrice : 0);
        priceRef.current = newPrice > 0 ? newPrice : 0;
        triggerSave();
    };

    // ── 행 클릭 핸들러 ─────────────────────────────────────────────────────
    const handleRowClick = (field: EditingField) => {
        if (editingField) return; // 이미 편집 중이면 무시
        const needsConfirm =
            (field === 'originalPrice' && !isPriceUserEdited && product.priceSource !== 'manual') ||
            (field === 'domestic' && !isDomesticUserEdited) ||
            (field === 'weight' && !isWeightUserEdited && product.weightSource !== 'manual');

        if (needsConfirm) {
            setConfirmField(field);
        } else {
            startEditing(field);
        }
    };

    const startEditing = (field: EditingField) => {
        if (field === 'originalPrice') setEditInput(String(originalPrice));
        else if (field === 'domestic') setEditInput(String(domesticShipping));
        else if (field === 'prep') setEditInput(String(prepCost));
        else if (field === 'weight') setEditInput(String(weight));
        setEditingField(field);
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditInput('');
    };

    // ── 저장 핸들러 ────────────────────────────────────────────────────────
    const handleSaveOriginalPrice = () => {
        const v = Number(editInput) || 0;
        setOriginalPrice(v);
        setIsPriceUserEdited(true);
        setEditingField(null);
        updateProduct(product.id, { originalPriceKrw: v, priceSource: 'manual' });
        recalcPrice(v, marginRate, domesticShipping, prepCost, intlShipping);
    };

    const handleSaveDomestic = () => {
        const v = Number(editInput) || 0;
        setDomesticShipping(v);
        setIsDomesticUserEdited(true);
        setEditingField(null);
        recalcPrice(originalPrice, marginRate, v, prepCost, intlShipping);
    };

    const handleSavePrep = () => {
        const v = Number(editInput) || 0;
        setPrepCost(v);
        setEditingField(null);
        recalcPrice(originalPrice, marginRate, domesticShipping, v, intlShipping);
    };

    const handleSaveWeight = () => {
        const numWeight = parseFloat(editInput) || 0;
        const newIntl = lookupKseRate(numWeight);
        setWeight(numWeight);
        setIsWeightUserEdited(true);
        setEditingField(null);
        setIntlShipping(newIntl);
        updateProduct(product.id, { weightKg: numWeight, weightSource: 'manual' });
        recalcPrice(originalPrice, marginRate, domesticShipping, prepCost, newIntl);
    };

    const handlePriceChange = (jpy: number) => {
        setSalePriceJpy(jpy);
        priceRef.current = jpy;
        if (totalCostJpy > 0) setMarginRate(Math.round((jpy / totalCostJpy - 1) * 100));
        triggerSave();
    };

    const handleMarginChange = (v: number) => {
        setMarginRate(v);
        recalcPrice(originalPrice, v, domesticShipping, prepCost, intlShipping);
    };

    // ── 수익 계산 ─────────────────────────────────────────────────────────
    const qoo10FeeJpy = Math.round(salePriceJpy * QOO10_FEE_RATE);
    const settlementJpy = salePriceJpy - qoo10FeeJpy;
    const profitJpy = settlementJpy - totalCostJpy;
    const profitKrw = Math.round(profitJpy * EXCHANGE_RATE);
    const effectiveMarginPct = settlementJpy > 0 ? Math.round(profitJpy / settlementJpy * 100) : 0;
    const isProfit = profitKrw > 0;

    // ── 확인 모달 내용 ───────────────────────────────────────────────────
    const confirmConfig: Partial<Record<NonNullable<EditingField>, { title: string; description: string }>> = {
        originalPrice: {
            title: '구매 원가를 수정할까요?',
            description: product.priceSource === 'ai'
                ? `AI가 예측한 가격이에요 (₩${originalPrice.toLocaleString()}).\n실제 가격과 다를 수 있으니 확인 후 수정하세요.`
                : `실제 상품 사이트에서 수집한 가격이에요 (₩${originalPrice.toLocaleString()}).\n정말 수정하시겠어요?`,
        },
        domestic: {
            title: '국내 배송비를 수정할까요?',
            description: `쇼핑몰에서 수집한 배송비에요 (₩${domesticShipping.toLocaleString()}).\n정말 수정하시겠어요?`,
        },
        weight: {
            title: '무게를 수정할까요?',
            description: product.weightSource === 'ai'
                ? `AI가 예측한 무게예요 (${weight}kg).\n실제 무게와 다를 수 있으니 확인 후 수정하세요.\n수정하면 해외 배송비가 자동 재계산됩니다.`
                : `쇼핑몰에서 수집한 실제 무게예요 (${weight}kg).\n정말 수정하시겠어요? 수정하면 해외 배송비가 재계산됩니다.`,
        },
    };

    const priceInputBase: React.CSSProperties = {
        width: '100%', boxSizing: 'border-box',
        padding: `12px ${spacing['3']}`,
        border: `1.5px solid ${colors.border.default}`,
        borderRadius: radius.md,
        fontSize: font.size.base, color: colors.text.primary,
        outline: 'none', fontFamily: 'inherit',
        background: colors.bg.surface,
        transition: 'border-color 0.15s',
    };

    return (
        <div style={{ maxWidth: '760px' }}>
            <style>{`
                @keyframes savedIn { from { opacity:0; } to { opacity:1; } }
                @keyframes koIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
                .price-input::-webkit-outer-spin-button,
                .price-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .price-input { -moz-appearance: textfield; }
            `}</style>

            {/* ── 원가 구조 ── */}
            <div style={{ ...flexBetween, marginBottom: spacing['2'] }}>
                <SectionLabel><span style={sectionBadgeStyle}>1</span>국내 비용</SectionLabel>
                <div style={{ fontSize: font.size.xs }}>
                    {saveStatus === 'saving' && <span style={{ color: colors.text.muted }}>저장 중...</span>}
                    {saveStatus === 'saved' && <span style={{ color: colors.success, animation: 'savedIn 0.2s ease' }}>저장됨 ✓</span>}
                </div>
            </div>

            <div style={{ border: `1px solid ${colors.border.default}`, borderRadius: radius.lg, overflow: 'hidden' }}>
                <div style={{ padding: `0 ${spacing['4']}` }}>
                    {/* 구매 원가 */}
                    {editingField === 'originalPrice' ? (
                        <CostEditRow
                            label="구매 원가"
                            value={editInput}
                            prefix="₩"
                            onChange={setEditInput}
                            onSave={handleSaveOriginalPrice}
                            onCancel={cancelEditing}
                        />
                    ) : (
                        <CostRow
                            label="구매 원가"
                            value={originalPrice}
                            prefix="₩"
                            source={product.priceSource}
                            showTag={!isPriceUserEdited}
                            onClick={() => handleRowClick('originalPrice')}
                            onTooltipMove={!isPriceUserEdited && product.priceSource !== 'manual' ? showTooltip(product.priceSource as 'ai' | 'crawled', `${product.priceSource}_price`) : undefined}
                            onTooltipLeave={hideTooltip}
                        />
                    )}
                    <Divider />

                    {/* 국내 배송비 */}
                    {editingField === 'domestic' ? (
                        <CostEditRow
                            label="국내 배송비"
                            value={editInput}
                            prefix="₩"
                            onChange={setEditInput}
                            onSave={handleSaveDomestic}
                            onCancel={cancelEditing}
                        />
                    ) : (
                        <CostRow
                            label="국내 배송비"
                            sub="쇼핑몰→집하센터"
                            value={domesticShipping}
                            prefix="₩"
                            source="crawled"
                            showTag={!isDomesticUserEdited}
                            onClick={() => handleRowClick('domestic')}
                            onTooltipMove={!isDomesticUserEdited ? showTooltip('crawled', 'crawled_domestic') : undefined}
                            onTooltipLeave={hideTooltip}
                        />
                    )}
                    <Divider />

                    {/* 작업비 */}
                    {editingField === 'prep' ? (
                        <CostEditRow
                            label="작업비"
                            value={editInput}
                            prefix="₩"
                            onChange={setEditInput}
                            onSave={handleSavePrep}
                            onCancel={cancelEditing}
                        />
                    ) : (
                        <CostRow
                            label="작업비"
                            sub="검수/포장"
                            value={prepCost}
                            prefix="₩"
                            onClick={() => handleRowClick('prep')}
                        />
                    )}
                </div>
                {/* 합계 행 */}
                <div style={summaryRowStyle}>
                    <span style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.text.secondary }}>국내 비용 소계</span>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: font.size.sm, fontWeight: 700, color: colors.text.primary }}>
                            ₩{totalCostKrw.toLocaleString()}
                        </span>
                        <div style={{ fontSize: font.size['2xs+'], color: colors.text.muted, marginTop: '2px' }}>
                            ¥{Math.round(costJpy).toLocaleString()} · 환율 ¥1=₩{EXCHANGE_RATE.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 해외 배송비 ── */}
            <div style={{ marginTop: spacing['8'], marginBottom: spacing['2'] }}>
                <SectionLabel><span style={sectionBadgeStyle}>2</span>해외 배송비</SectionLabel>
            </div>

            <div style={{ border: `1px solid ${colors.border.default}`, borderRadius: radius.lg, overflow: 'hidden' }}>
                <div style={{ padding: `0 ${spacing['4']}` }}>
                    {/* 상품 무게 */}
                    {editingField === 'weight' ? (
                        <CostEditRow
                            label="상품 무게"
                            value={editInput}
                            suffix="kg"
                            hint="KSE(SAGAWA) 요금표 기준으로 해외 배송비가 자동 계산됩니다"
                            onChange={setEditInput}
                            onSave={handleSaveWeight}
                            onCancel={cancelEditing}
                        />
                    ) : (
                        <CostRow
                            label="상품 무게"
                            value={weight}
                            suffix="kg"
                            source={product.weightSource}
                            showTag={!isWeightUserEdited}
                            onClick={() => handleRowClick('weight')}
                            onTooltipMove={!isWeightUserEdited && product.weightSource !== 'manual' ? showTooltip(product.weightSource as 'ai' | 'crawled', `${product.weightSource}_weight`) : undefined}
                            onTooltipLeave={hideTooltip}
                        />
                    )}
                </div>
                {/* 해외 배송비 합계 행 */}
                <div style={summaryRowStyle}>
                    <span style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.text.secondary }}>
                        해외 배송비
                        <span style={{ fontSize: font.size.xs, fontWeight: 400, color: colors.text.muted, marginLeft: '4px' }}>KSE SAGAWA 기준</span>
                    </span>
                    <span style={{ fontSize: font.size.sm, fontWeight: 700, color: colors.text.primary }}>¥{intlShipping.toLocaleString()}</span>
                </div>
            </div>

            {/* 전체 비용 요약 — 독립 파란 박스 */}
            <div style={{
                ...flexBetween,
                padding: `${spacing['3']} ${spacing['4']}`,
                background: colors.primaryLight,
                borderRadius: radius.lg,
                border: `1px solid ${colors.primaryLightBorder}`,
                marginTop: spacing['8'],
                marginBottom: spacing['6'],
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={costSummaryBadgeStyle}>1</span>
                        <span style={{ fontSize: font.size.xs, color: colors.primary, fontWeight: 600 }}>+</span>
                        <span style={costSummaryBadgeStyle}>2</span>
                        <span style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.primary, marginLeft: '4px' }}>전체 비용 합계</span>
                    </div>
                    <div style={{ fontSize: font.size.xs, color: colors.primary, opacity: 0.7, marginTop: '2px' }}>
                        국내 비용 + 해외 배송비 · 상품 구매에 드는 총 비용
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: font.size.base, fontWeight: 700, color: colors.primary }}>
                        ₩{Math.round(totalCostJpy * EXCHANGE_RATE).toLocaleString()}
                    </span>
                    <div style={{ fontSize: font.size.xs, color: colors.primary, opacity: 0.7, marginTop: '2px' }}>
                        ≈ ¥{Math.round(totalCostJpy).toLocaleString()}
                    </div>
                </div>
            </div>

            <SectionDivider />

            {/* ── 판매가 설정 ── */}
            <div style={{ marginBottom: spacing['3'] }}>
                <SectionLabel><span style={sectionBadgeStyle}>3</span>판매가 설정</SectionLabel>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 120px', gap: spacing['3'], alignItems: 'start' }}>
                <div>
                    <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginBottom: spacing['2'] }}>
                        Qoo10 판매가
                    </div>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: spacing['3'], top: '50%', transform: 'translateY(-50%)', fontSize: font.size.base, fontWeight: 700, color: colors.primary, pointerEvents: 'none' }}>¥</span>
                        <input
                            type="text" inputMode="decimal" className="price-input" value={salePriceJpy}
                            onChange={e => handlePriceChange(Number(e.target.value))}
                            onFocus={e => e.target.select()}
                            style={{ ...priceInputBase, paddingLeft: '28px', borderColor: colors.primary, color: colors.primary, fontWeight: 700 }}
                        />
                    </div>
                    <div style={{ marginTop: '5px', fontSize: font.size.xs, color: colors.text.muted }}>
                        ≈ ₩{Math.round(salePriceJpy * EXCHANGE_RATE).toLocaleString()}
                    </div>
                </div>

                <div style={{ paddingTop: '30px', color: colors.text.muted, fontSize: font.size.lg, userSelect: 'none' }}>↔</div>

                <div>
                    <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginBottom: spacing['2'] }}>
                        마진율
                    </div>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text" inputMode="decimal" className="price-input" value={marginRate}
                            onChange={e => handleMarginChange(Number(e.target.value))}
                            onFocus={e => { e.target.select(); e.target.style.borderColor = colors.primary; }}
                            onBlur={e => { e.target.style.borderColor = colors.border.default; }}
                            style={priceInputBase}
                        />
                        <span style={{ position: 'absolute', right: spacing['3'], top: '50%', transform: 'translateY(-50%)', fontSize: font.size.sm, fontWeight: 600, color: colors.text.muted, pointerEvents: 'none' }}>%</span>
                    </div>
                    <div style={{ marginTop: '5px', fontSize: font.size.xs, color: colors.text.muted }}>
                        추천 30~40%
                    </div>
                </div>
            </div>

            <SectionDivider />

            {/* ── 수익 계산 ── */}
            <div style={{ marginBottom: spacing['4'] }}>
                <SectionLabel><span style={sectionBadgeStyle}>4</span>수익 계산</SectionLabel>
            </div>

            <div style={{
                borderRadius: radius.lg,
                border: `1.5px solid ${isProfit ? colors.successBorder : colors.dangerLight}`,
                background: isProfit ? colors.successBg : colors.dangerBg,
                overflow: 'hidden',
            }}>
                <div style={{ padding: `0 ${spacing['4']}` }}>
                    <div style={calcRowStyle}>
                        <span style={{ fontSize: font.size.sm, color: colors.text.secondary }}>판매가</span>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.text.primary }}>₩{Math.round(salePriceJpy * EXCHANGE_RATE).toLocaleString()}</div>
                            <div style={subAmountStyle}>¥{salePriceJpy.toLocaleString()}</div>
                        </div>
                    </div>
                    <Divider />
                    <div style={calcRowStyle}>
                        <span style={{ fontSize: font.size.sm, color: colors.text.secondary }}>
                            Qoo10 수수료
                            <span style={{ fontSize: font.size.xs, color: colors.text.muted, marginLeft: '4px' }}>10.8%</span>
                        </span>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.danger }}>−₩{Math.round(qoo10FeeJpy * EXCHANGE_RATE).toLocaleString()}</div>
                            <div style={subAmountStyle}>¥{qoo10FeeJpy.toLocaleString()}</div>
                        </div>
                    </div>
                    <Divider />
                    <div style={calcRowStyle}>
                        <span style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.text.primary }}>정산금액</span>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: font.size.sm, fontWeight: 700, color: colors.text.primary }}>₩{Math.round(settlementJpy * EXCHANGE_RATE).toLocaleString()}</div>
                            <div style={subAmountStyle}>¥{settlementJpy.toLocaleString()}</div>
                        </div>
                    </div>
                    <Divider />
                    <div style={calcRowStyle}>
                        <span style={{ fontSize: font.size.sm, color: colors.text.secondary }}>
                            총 비용
                            <span style={{ fontSize: font.size.xs, color: colors.text.muted, marginLeft: '4px' }}>원가+배송</span>
                        </span>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.danger }}>−₩{Math.round(totalCostJpy * EXCHANGE_RATE).toLocaleString()}</div>
                            <div style={subAmountStyle}>¥{Math.round(totalCostJpy).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div style={{
                    ...flexBetween,
                    padding: `${spacing['4']} ${spacing['4']}`,
                    background: isProfit ? colors.successLight : colors.dangerLight,
                    borderTop: `1px solid ${isProfit ? colors.successBorder : colors.dangerLight}`,
                }}>
                    <span style={{ fontSize: font.size.sm, fontWeight: 700, color: colors.text.primary }}>순이익 (건당)</span>
                    {isProfit ? (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: font.size.base, fontWeight: 700, color: colors.successDark, lineHeight: 1.2 }}>
                                +₩{profitKrw.toLocaleString()}
                            </div>
                            <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '3px' }}>
                                정산 대비 {effectiveMarginPct}%
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: font.size.base, fontWeight: 700, color: colors.danger, lineHeight: 1.2 }}>
                                −₩{Math.abs(profitKrw).toLocaleString()}
                            </div>
                            <div style={{ fontSize: font.size.xs, color: colors.danger, marginTop: '3px' }}>
                                역마진 — 판매가를 올려야 합니다
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 확인 모달 (소싱원가 / 국내배송비 / 무게 공용) */}
            {confirmField && confirmConfig[confirmField] && (
                <ConfirmModal
                    isOpen
                    onClose={() => setConfirmField(null)}
                    onConfirm={() => { const f = confirmField; setConfirmField(null); startEditing(f); }}
                    title={confirmConfig[confirmField].title}
                    description={confirmConfig[confirmField].description}
                    confirmText="수정하기"
                    cancelText="취소"
                    type="info"
                />
            )}

            {/* 호버 툴팁 */}
            {tooltipPos && editingField === null && (
                <FloatingTooltip pos={tooltipPos} source={tooltipSource} tooltipKey={tooltipKey} />
            )}
        </div>
    );
};
