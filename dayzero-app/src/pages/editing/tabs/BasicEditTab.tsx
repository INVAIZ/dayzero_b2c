import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Check, Loader2, PenLine, Languages, Info } from 'lucide-react';
import { AIIcon } from '../../../components/common/AIIcon';
import type { ProductDetail, ProductOption } from '../../../types/editing';
import { useEditingStore } from '../../../store/useEditingStore';
import { CategorySelectModal } from '../../../components/common/CategorySelectModal';
import { BrandSelectModal, QOO10_BRANDS } from '../../../components/common/BrandSelectModal';
import { PENDING_JA_TITLES } from '../../../mock/editingMock';
import { colors, font, radius, shadow, spacing, zIndex } from '../../../design/tokens';
import { stripPrefix, toJaTitle, mockTranslateOption as mockTranslateOpt, hasKorean } from '../../../utils/editing';
import { handleImgError } from '../../../utils/image';
import { ConfirmModal } from '../../../components/common/ConfirmModal';

interface Props {
    product: ProductDetail;
    hideProgress?: boolean;
}

const MAX_DESC = 10000;

// ── 공통 스타일 상수 ────────────────────────────────────────────────────────
const flexBetween: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: `11px ${spacing['3']}`,
    border: `1.5px solid ${colors.border.default}`,
    borderRadius: radius.md,
    fontSize: font.size.base, color: colors.text.primary,
    outline: 'none', fontFamily: 'inherit',
    background: colors.bg.surface,
    transition: 'border-color 0.15s',
};

const sectionLabelStyle: React.CSSProperties = {
    fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.secondary,
};

const ghostButtonBase: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
};

const warningBorderStyle: React.CSSProperties = {
    borderLeftWidth: '3px', borderLeftColor: colors.warningIcon,
};

const tooltipStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
    transform: 'translateX(-50%)',
    background: colors.text.primary, color: colors.white,
    borderRadius: radius.md, padding: `${spacing['2']} ${spacing['3']}`,
    fontSize: font.size.xs, fontWeight: font.weight.medium, lineHeight: font.lineHeight.normal,
    zIndex: zIndex.dropdown, pointerEvents: 'none',
    animation: 'tooltipFadeIn 0.15s ease',
    boxShadow: shadow.md,
};

const handleWarningFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = colors.primary;
    e.target.style.borderLeftColor = colors.primary;
};

const createWarningBlur = (isComplete: boolean) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = colors.border.default;
    if (!isComplete) e.target.style.borderLeftColor = colors.warningIcon;
};

// ── StatusTag 설정 ──────────────────────────────────────────────────────────
const STATUS_TAG_CONFIG = {
    needsTranslation: { color: colors.warningIcon, bg: colors.warningLight, icon: <Info size={11} /> },
    translated: { color: colors.primary, bg: colors.primaryLight, icon: <Check size={11} /> },
    aiAvailable: { color: colors.primary, bg: colors.primaryLight, icon: <AIIcon size={11} /> },
} as const;

// ── CSS 애니메이션 (정적 문자열) ─────────────────────────────────────────────
const STATIC_STYLES = `
    @keyframes koIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
    @keyframes modalIn { from { opacity:0; transform:translate(-50%,-48%); } to { opacity:1; transform:translate(-50%,-50%); } }
    @keyframes savedIn { from { opacity:0; } to { opacity:1; } }
    @keyframes contentFadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
    @keyframes tooltipFadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
    .content-fade-in { animation: contentFadeIn 0.4s ease; }
    @keyframes checkPop {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
    }
    @keyframes textShimmer {
        0% { background-position: -100% 0; }
        100% { background-position: 200% 0; }
    }
    .ai-processing {
        background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryHover} 40%, ${colors.primary} 80%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: textShimmer 2s ease-in-out infinite;
    }
    .check-pop { animation: checkPop 0.3s ease; }
    .stock-input::-webkit-outer-spin-button,
    .stock-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .stock-input { -moz-appearance: textfield; }
`;

// ── 한국어 원문 hover 툴팁 ────────────────────────────────────────────────────

// ── 구분선 ───────────────────────────────────────────────────────────────────
const Divider = () => (
    <div style={{ height: '1px', background: colors.border.default, margin: `${spacing['6']} 0` }} />
);

// ── AI 버튼 ──────────────────────────────────────────────────────────────────
const AIButton: React.FC<{
    loading: boolean;
    onClick: () => void;
    label?: string;
    loadingLabel?: string;
    disabled?: boolean;
    size?: 'sm' | 'md';
    icon?: React.ReactNode;
}> = ({ loading, onClick, label = 'AI 번역', loadingLabel = '처리 중...', disabled = false, size = 'md', icon = <Languages size={13} /> }) => {
    const isDisabled = loading || disabled;
    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: size === 'sm' ? `5px ${spacing['2']}` : `7px ${spacing['3']}`,
                background: isDisabled ? colors.bg.subtle : colors.primaryLight,
                border: `1px solid ${isDisabled ? colors.border.default : colors.primaryBorder}`,
                borderRadius: radius.md,
                fontSize: font.size.sm, fontWeight: font.weight.semibold,
                color: isDisabled ? colors.text.muted : colors.primary,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = colors.primaryHover; }}
            onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.background = isDisabled ? colors.bg.subtle : colors.primaryLight; }}
        >
            {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
            {loading ? loadingLabel : label}
        </button>
    );
};

// ── 상태 태그 ──────────────────────────────────────────────────────────────────
const StatusTag: React.FC<{
    type: 'needsTranslation' | 'translated' | 'aiAvailable';
    label: string;
}> = ({ type, label }) => {
    const c = STATUS_TAG_CONFIG[type];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: font.size.xs, fontWeight: font.weight.semibold,
            color: c.color, background: c.bg,
            padding: `2px ${spacing['2']}`, borderRadius: radius.full,
            marginLeft: spacing['2'],
        }}>
            {c.icon} {label}
        </span>
    );
};

// CategoryModal → CategorySelectModal (공통 컴포넌트로 분리됨)

// ── 발송가능일 셀렉트 ────────────────────────────────────────────────────────
const SHIPPING_TYPE_OPTIONS = [
    { value: 'standard', label: '일반발송' },
    { value: 'sameday', label: '당일발송' },
    { value: 'preorder', label: '예약발송 (4일 이상)' },
] as const;

const SHIPPING_DAYS_STANDARD = [
    { value: 1, label: '1일 이내' },
    { value: 2, label: '2일 이내' },
    { value: 3, label: '3일 이내' },
];
const SHIPPING_DAYS_PREORDER = [
    { value: 4, label: '4일 이내' },
    { value: 5, label: '5일 이내' },
    { value: 6, label: '6일 이내' },
    { value: 7, label: '7일 이내' },
    { value: 8, label: '8일 이내' },
    { value: 9, label: '9일 이내' },
    { value: 10, label: '10일 이내' },
    { value: 11, label: '11일 이내' },
    { value: 12, label: '12일 이내' },
    { value: 13, label: '13일 이내' },
    { value: 14, label: '14일 이내' },
];

const CustomSelect: React.FC<{
    label: string;
    value: string;
    options: { value: string | number; label: string }[];
    onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
    const selected = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        if (!open) return;
        const onClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    // 트리거 위치 기반으로 드롭다운을 fixed 렌더링 (잘림 방지)
    useEffect(() => {
        if (!open || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropStyle({
            position: 'fixed',
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
        });
    }, [open]);

    return (
        <div ref={ref}>
            <div style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.medium, marginBottom: spacing['1'] }}>
                {label}
            </div>
            <div
                ref={triggerRef}
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: `11px ${spacing['3']}`,
                    border: `1.5px solid ${open ? colors.primary : colors.border.default}`,
                    borderRadius: radius.md,
                    fontSize: font.size.base,
                    color: selected ? colors.text.primary : colors.text.placeholder,
                    background: colors.bg.surface,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontFamily: 'inherit',
                }}
            >
                <span>{selected?.label ?? '선택'}</span>
                <ChevronDown size={18} color={open ? colors.primary : colors.text.muted} style={{
                    flexShrink: 0, transition: 'transform 0.2s ease',
                    transform: open ? 'rotate(180deg)' : 'none',
                }} />
            </div>
            {open && (
                <div style={{
                    ...dropStyle,
                    background: colors.bg.surface,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.lg,
                    boxShadow: shadow.md,
                    zIndex: zIndex.modal,
                    maxHeight: '280px', overflowY: 'auto',
                }}>
                    {options.map(opt => {
                        const isSelected = String(opt.value) === String(value);
                        return (
                            <div
                                key={opt.value}
                                onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                                style={{
                                    padding: `14px ${spacing['4']}`,
                                    fontSize: font.size.base,
                                    fontWeight: isSelected ? 600 : 400,
                                    color: colors.text.primary,
                                    cursor: 'pointer',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = colors.bg.faint; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                {opt.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const ShippingSelect: React.FC<{
    shippingType: 'standard' | 'sameday' | 'preorder';
    shippingDays: number;
    onChange: (type: 'standard' | 'sameday' | 'preorder', days: number) => void;
}> = ({ shippingType, shippingDays, onChange }) => {
    const showDays = shippingType !== 'sameday';
    return (
        <div>
            <div style={{ marginBottom: spacing['2'] }}>
                <span style={sectionLabelStyle}>발송가능일</span>
                <span style={{ color: colors.primary, marginLeft: '2px', fontWeight: font.weight.bold }}>*</span>
            </div>
            <CustomSelect
                label="발송 유형"
                value={shippingType}
                options={SHIPPING_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                onChange={v => {
                    const t = v as 'standard' | 'sameday' | 'preorder';
                    onChange(t, t === 'sameday' ? 0 : t === 'preorder' ? 5 : (shippingDays || 3));
                }}
            />
            <div style={{
                overflow: 'hidden',
                maxHeight: showDays ? '200px' : '0px',
                opacity: showDays ? 1 : 0,
                transition: 'max-height 0.25s ease, opacity 0.2s ease, margin 0.25s ease',
                marginTop: showDays ? spacing['3'] : '0px',
            }}>
                <CustomSelect
                    label="입금일 기준"
                    value={String(shippingDays)}
                    options={(shippingType === 'preorder' ? SHIPPING_DAYS_PREORDER : SHIPPING_DAYS_STANDARD).map(o => ({ value: String(o.value), label: o.label }))}
                    onChange={v => onChange(shippingType, Number(v))}
                />
                {shippingType === 'preorder' ? (
                    <div style={{ fontSize: font.size.xs, color: colors.primary, marginTop: spacing['2'], lineHeight: font.lineHeight.relaxed }}>
                        ※ 4일~14일 이내는 주말포함 일수로 카운트되며, 예약설정으로 취급됩니다.<br />
                        ※ 4일~14일은 배송포인트 플러스 점수가 부여되지 않습니다.<br />
                        ※ 4일~14일은 상품+옵션금액 기준 2% 수수료가 부과됩니다.
                    </div>
                ) : (
                    <div style={{ fontSize: font.size.xs, color: colors.primary, marginTop: spacing['2'] }}>
                        ※ 1~3일 이내는 영업일수로 카운트 됩니다. (토/일 휴무 제외)
                    </div>
                )}
            </div>
        </div>
    );
};

// ── 옵션 행 ───────────────────────────────────────────────────────────────────
const OptionRow: React.FC<{
    option: ProductOption;
    imageUrl: string;
    isTranslating: boolean;
    isRepresentative: boolean;
    onChange: (field: keyof ProductOption, value: string | number) => void;
    onDelete: () => void;
    onSetRepresentative: () => void;
    onFlushSave: () => void;
}> = ({ option, imageUrl, isTranslating, isRepresentative, onChange, onDelete, onSetRepresentative, onFlushSave }) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const needsTranslation = hasKorean(option.nameKo);
    const nameJaHasKorean = !!option.nameJa && hasKorean(option.nameJa);
    const hasNameJa = !isTranslating && (!!option.nameJa || !needsTranslation) && !nameJaHasKorean;

    return (
        <div style={{ paddingBottom: spacing['3'], marginBottom: spacing['3'], borderBottom: `1px solid ${colors.border.default}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '30px 44px 1fr 90px 36px', alignItems: 'center', gap: spacing['3'] }}>
                {/* 대표 라디오 */}
                <div
                    onClick={onSetRepresentative}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <div style={{
                        width: '16px', height: '16px', borderRadius: radius.full,
                        border: `2px solid ${isRepresentative ? colors.primary : colors.border.default}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.15s',
                    }}>
                        {isRepresentative && <div style={{ width: '8px', height: '8px', borderRadius: radius.full, background: colors.primary }} />}
                    </div>
                </div>
                <img src={imageUrl} alt=""
                    onError={handleImgError}
                    style={{
                        width: '44px', height: '44px',
                        borderRadius: radius.md, objectFit: 'cover',
                        border: `1px solid ${colors.border.default}`, flexShrink: 0,
                    }} />

                {/* 옵션명 */}
                <div style={{ minWidth: 0 }}>
                    {isTranslating ? (
                        <div style={{
                            ...inputBase,
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: colors.primaryLight,
                            borderColor: colors.primaryBorder,
                        }}>
                            <Loader2 size={13} color={colors.primary} className="spin" style={{ flexShrink: 0 }} />
                            <span className="ai-processing" style={{ fontWeight: font.weight.medium }}>번역하고 있어요...</span>
                        </div>
                    ) : (
                        <input
                            value={option.nameJa ?? ''}
                            onChange={e => onChange('nameJa', e.target.value)}
                            placeholder={option.nameKo || '옵션명 입력'}
                            style={{ ...inputBase, ...(!hasNameJa ? warningBorderStyle : {}) }}
                            onFocus={handleWarningFocus}
                            onBlur={e => { createWarningBlur(hasNameJa)(e); onFlushSave(); }}
                        />
                    )}
                </div>

                <input
                    type="number" min={0}
                    value={option.stock || ''}
                    onChange={e => onChange('stock', Number(e.target.value) || 0)}
                    className="stock-input"
                    style={{ ...inputBase, textAlign: 'left' }}
                    onFocus={e => (e.target.style.borderColor = colors.primary)}
                    onBlur={e => (e.target.style.borderColor = colors.border.default)}
                />

                <button
                    onClick={() => setConfirmOpen(true)}
                    style={{
                        ...ghostButtonBase,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: colors.text.muted, borderRadius: radius.sm,
                        padding: '6px', width: '100%', transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = colors.danger)}
                    onMouseLeave={e => (e.currentTarget.style.color = colors.text.muted)}
                >
                    <Trash2 size={14} />
                </button>

                <ConfirmModal
                    isOpen={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={onDelete}
                    title="옵션을 삭제할까요?"
                    description={`"${option.nameKo || option.nameJa || '이 옵션'}"을 삭제하면 복구할 수 없습니다.`}
                    confirmText="삭제하기"
                    cancelText="취소"
                />
            </div>
            {!isTranslating && nameJaHasKorean && (
                <p style={{ margin: `${spacing['1']} 0 0`, paddingLeft: '56px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: font.size.xs, color: colors.warningIcon }}>
                    <Info size={11} style={{ flexShrink: 0 }} />
                    한국어가 포함되어 있어요. 한국어를 지우거나 번역해 주세요.
                </p>
            )}
        </div>
    );
};

// ── 메인 탭 ────────────────────────────────────────────────────────────────────
export const BasicEditTab: React.FC<Props> = ({ product, hideProgress }) => {
    const { updateProduct } = useEditingStore();

    const [titleJa, setTitleJa] = useState(product.titleJa ? stripPrefix(product.titleJa) : stripPrefix(product.titleKo));
    const [descJa, setDescJa] = useState(product.descriptionJa ?? '');
    const [options, setOptions] = useState<ProductOption[]>([...product.options]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showBrandInfoTooltip, setShowBrandInfoTooltip] = useState(false);
    const [showBrandAiTooltip, setShowBrandAiTooltip] = useState(false);
    const [saveSection, setSaveSection] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const [isTranslatingTitle, setIsTranslatingTitle] = useState(false);
    const [titleKoEdited, setTitleKoEdited] = useState(false);
    const [isWritingDesc, setIsWritingDesc] = useState(false);
    const [isTranslatingDesc, setIsTranslatingDesc] = useState(false);
    const hasAIDraft = !!product.descriptionKo && product.descriptionKo.includes('【');
    const [descKo, setDescKo] = useState(hasAIDraft ? product.descriptionKo : '');
    const [descMode, setDescMode] = useState<'ko' | 'ja'>(
        product.descriptionJa ? 'ja' : (hasAIDraft ? 'ko' : 'ja')
    );
    const [showWriteConfirm, setShowWriteConfirm] = useState(false);
    const [showDescManual, setShowDescManual] = useState(false);
    const [showTranslateTooltip, setShowTranslateTooltip] = useState(false);
    const [translatingOptionIds, setTranslatingOptionIds] = useState<Set<string>>(new Set());
    const [isBatchTranslating, setIsBatchTranslating] = useState(false);
    const [batchStepLabel, setBatchStepLabel] = useState('');
    const [batchStep, setBatchStep] = useState(0);
    const [batchTotal, setBatchTotal] = useState(0);
    const batchAbortRef = useRef(false);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const composingRef = useRef(false);
    const titleRef = useRef(titleJa);
    const descRef = useRef(descJa);
    const optionsRef = useRef(options);
    titleRef.current = titleJa;
    descRef.current = descJa;
    optionsRef.current = options;

    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        setTitleJa(product.titleJa ? stripPrefix(product.titleJa) : stripPrefix(product.titleKo));
        setDescJa(product.descriptionJa ?? '');
        setOptions([...product.options]);
        setSaveStatus('idle');
        setIsTranslatingTitle(false);
        setIsWritingDesc(false);
        setIsTranslatingDesc(false);
        const hasDraft = !!product.descriptionKo && product.descriptionKo.includes('【');
        setDescKo(hasDraft ? product.descriptionKo : '');
        setDescMode(product.descriptionJa ? 'ja' : (hasDraft ? 'ko' : 'ja'));
        setShowWriteConfirm(false);
        setShowDescManual(false);
        setShowTranslateTooltip(false);
        setTranslatingOptionIds(new Set());
        setTitleKoEdited(false);
        setIsBatchTranslating(false);
        setBatchStepLabel('');
        setBatchStep(0);
        setBatchTotal(0);
        batchAbortRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id]);

    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            if (savedTimer.current) clearTimeout(savedTimer.current);
        };
    }, []);

    // 외부(일괄 번역 등)에서 store가 변경됐을 때 로컬 상태 동기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (composingRef.current) return;
        const incoming = product.titleJa ? stripPrefix(product.titleJa) : stripPrefix(product.titleKo);
        if (incoming !== titleRef.current) {
            setTitleJa(incoming);
        }
    }, [product.titleJa]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setOptions([...product.options]);
    }, [product.options]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (composingRef.current) return;
        if (product.descriptionJa && product.descriptionJa !== descRef.current) {
            setDescJa(product.descriptionJa);
            setDescMode('ja');
        }
    }, [product.descriptionJa]);

    const triggerSave = useCallback((section?: string) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        if (section) setSaveSection(section);
        setSaveStatus('saving');
        saveTimer.current = setTimeout(() => {
            updateProduct(product.id, {
                titleJa: titleRef.current || null,
                descriptionJa: descRef.current || null,
                options: optionsRef.current,
            });
            setSaveStatus('saved');
            savedTimer.current = setTimeout(() => { setSaveStatus('idle'); setSaveSection(null); }, 2000);
        }, 2000);
    }, [product.id, updateProduct]);

    const handleTranslateTitle = () => {
        if (isTranslatingTitle) return;
        setIsTranslatingTitle(true);
        setTimeout(() => {
            const raw = PENDING_JA_TITLES[product.id] ?? toJaTitle(product.titleKo);
            const translatedTitle = stripPrefix(raw);
            setTitleJa(translatedTitle);
            setIsTranslatingTitle(false);
            setTitleKoEdited(false);
            updateProduct(product.id, { titleJa: translatedTitle });
        }, 2500 + Math.random() * 1000);
    };

    const hasDescContent = descKo.trim() || descJa.trim();

    const doWriteDesc = () => {
        setIsWritingDesc(true);
        setTimeout(() => {
            const newKo = '이 제품은 피부 타입에 맞는 순한 성분으로 만들어진 스킨케어 제품입니다. 자극 없이 촉촉하게 피부를 정돈해 드립니다.\n\n【특징】\n・민감한 피부에도 부드러운 저자극 처방\n・오래 지속되는 보습을 유지하는 히알루론산 함유\n・한국 코스메틱 브랜드의 인기 상품\n\n【사용 방법】\n세안 후 적당량을 피부에 부드럽게 발라주세요.';
            setDescKo(newKo);
            setDescMode('ko');
            setIsWritingDesc(false);
            updateProduct(product.id, { descriptionKo: newKo });
        }, 3500 + Math.random() * 1500);
    };

    const handleWriteDesc = () => {
        if (isWritingDesc) return;
        if (hasDescContent) { setShowWriteConfirm(true); return; }
        doWriteDesc();
    };

    const handleTranslateDesc = () => {
        const koSource = descKo.trim() || (descJaHasKorean ? descJa.trim() : '');
        if (isTranslatingDesc || !koSource) return;
        if (!descKo.trim() && descJaHasKorean) {
            setDescKo(descJa);
        }
        setIsTranslatingDesc(true);
        setTimeout(() => {
            const newJa = '肌タイプに合わせた優しい成分で作られたスキンケア製品です。刺激なくしっとりと肌を整えます。\n\n【特徴】\n・敏感肌にも優しい低刺激処方\n・長時間保湿をキープするヒアルロン酸配合\n・韓国コスメブランドの人気商品\n\n【使用方法】\n洗顔後、適量をお肌に優しく馴染ませてください。';
            setDescJa(newJa);
            setDescMode('ja');
            setIsTranslatingDesc(false);
            updateProduct(product.id, {
                descriptionJa: newJa,
                translationStatus: 'completed',
            });
        }, 2500 + Math.random() * 1000);
    };

    const handleTranslateOptions = () => {
        if (options.length === 0) return;
        const targets = options.filter(o => {
            if (o.nameJa && !hasKorean(o.nameJa)) return false;
            if (!hasKorean(o.nameKo) && !o.nameJa) return false;
            return true;
        });
        if (targets.length === 0) return;
        const ids = new Set(targets.map(o => o.id));
        setTranslatingOptionIds(ids);
        let cumulativeDelay = 0;
        targets.forEach((opt, i) => {
            cumulativeDelay += 1200 + Math.random() * 600;
            const delay = cumulativeDelay;
            setTimeout(() => {
                const jaName = mockTranslateOpt(opt.nameKo);
                setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, nameJa: jaName } : o));
                setTranslatingOptionIds(prev => {
                    const next = new Set(prev);
                    next.delete(opt.id);
                    return next;
                });
                // 마지막 대상 완료 시 즉시 저장 (ref 동기화 지연 우회)
                if (i === targets.length - 1) {
                    const targetIds = new Set(targets.map(o => o.id));
                    const translatedOptions = options.map(o => targetIds.has(o.id) ? { ...o, nameJa: mockTranslateOpt(o.nameKo) } : o);
                    updateProduct(product.id, { options: translatedOptions });
                }
            }, delay);
        });
    };

    const handleBatchTranslate = async () => {
        if (isBatchTranslating || isTranslatingTitle || isTranslatingAnyOption || isWritingDesc || isTranslatingDesc) return;
        setIsBatchTranslating(true);
        batchAbortRef.current = false;

        const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

        const currentHasJaTitle = !!titleRef.current && titleRef.current !== stripPrefix(product.titleKo) && !hasKorean(titleRef.current);
        const currentOptions = optionsRef.current;
        const currentAllOptionsDone = currentOptions.length === 0 || currentOptions.every(o => (!!o.nameJa && !hasKorean(o.nameJa)) || !hasKorean(o.nameKo));
        const currentDescJa = descRef.current;
        const currentIsDescDone = !!currentDescJa && !hasKorean(currentDescJa);
        const total = [!currentHasJaTitle, !currentAllOptionsDone && currentOptions.length > 0, !currentIsDescDone].filter(Boolean).length;
        setBatchTotal(total);
        let step = 0;

        // Step 1: 상품명 번역
        if (!currentHasJaTitle && !batchAbortRef.current) {
            step++;
            setBatchStep(step);
            setBatchStepLabel('상품명을 번역하고 있어요...');
            await new Promise<void>(resolve => {
                setIsTranslatingTitle(true);
                setTimeout(() => {
                    const raw = PENDING_JA_TITLES[product.id] ?? toJaTitle(product.titleKo);
                    const translatedTitle = stripPrefix(raw);
                    setTitleJa(translatedTitle);
                    setIsTranslatingTitle(false);
                    setTitleKoEdited(false);
                    updateProduct(product.id, { titleJa: translatedTitle });
                    resolve();
                }, 2500 + Math.random() * 1000);
            });
            await wait(500);
        }

        // Step 2: 옵션 번역
        if (!currentAllOptionsDone && currentOptions.length > 0 && !batchAbortRef.current) {
            step++;
            setBatchStep(step);
            setBatchStepLabel('상품 옵션을 번역하고 있어요...');
            await new Promise<void>(resolve => {
                const targets = currentOptions.filter(o => {
                    if (o.nameJa && !hasKorean(o.nameJa)) return false;
                    if (!hasKorean(o.nameKo) && !o.nameJa) return false;
                    return true;
                });
                if (targets.length === 0) { resolve(); return; }
                const ids = new Set(targets.map(o => o.id));
                setTranslatingOptionIds(ids);
                let cumulativeDelay = 0;
                targets.forEach((opt, i) => {
                    cumulativeDelay += 1200 + Math.random() * 600;
                    const delay = cumulativeDelay;
                    setTimeout(() => {
                        const jaName = mockTranslateOpt(opt.nameKo);
                        setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, nameJa: jaName } : o));
                        setTranslatingOptionIds(prev => {
                            const next = new Set(prev);
                            next.delete(opt.id);
                            return next;
                        });
                        if (i === targets.length - 1) {
                            const targetIds = new Set(targets.map(o => o.id));
                            const translatedOptions = currentOptions.map(o => targetIds.has(o.id) ? { ...o, nameJa: mockTranslateOpt(o.nameKo) } : o);
                            updateProduct(product.id, { options: translatedOptions });
                            resolve();
                        }
                    }, delay);
                });
            });
            await wait(500);
        }

        // Step 3: 상세설명 작성 + 번역
        if (!currentIsDescDone && !batchAbortRef.current) {
            step++;
            setBatchStep(step);
            // 3a: 한국어 초안이 없으면 AI 작성
            if (!descKo.trim()) {
                setBatchStepLabel('상세설명을 작성하고 있어요...');
                await new Promise<void>(resolve => {
                    setIsWritingDesc(true);
                    setTimeout(() => {
                        const newKo = '이 제품은 피부 타입에 맞는 순한 성분으로 만들어진 스킨케어 제품입니다. 자극 없이 촉촉하게 피부를 정돈해 드립니다.\n\n【특징】\n・민감한 피부에도 부드러운 저자극 처방\n・오래 지속되는 보습을 유지하는 히알루론산 함유\n・한국 코스메틱 브랜드의 인기 상품\n\n【사용 방법】\n세안 후 적당량을 피부에 부드럽게 발라주세요.';
                        setDescKo(newKo);
                        setDescMode('ko');
                        setIsWritingDesc(false);
                        updateProduct(product.id, { descriptionKo: newKo });
                        resolve();
                    }, 3500 + Math.random() * 1500);
                });
                await wait(500);
            }

            // 3b: 일본어 번역
            if (!batchAbortRef.current) {
                setBatchStepLabel('작성된 상세설명을 번역하고 있어요...');
                await new Promise<void>(resolve => {
                    setIsTranslatingDesc(true);
                    setTimeout(() => {
                        const newJa = '肌タイプに合わせた優しい成分で作られたスキンケア製品です。刺激なくしっとりと肌を整えます。\n\n【特徴】\n・敏感肌にも優しい低刺激処方\n・長時間保湿をキープするヒアルロン酸配合\n・韓国コスメブランドの人気商品\n\n【使用方法】\n洗顔後、適量をお肌に優しく馴染ませてください。';
                        setDescJa(newJa);
                        setDescMode('ja');
                        setIsTranslatingDesc(false);
                        updateProduct(product.id, {
                            descriptionJa: newJa,
                            translationStatus: 'completed',
                        });
                        resolve();
                    }, 2500 + Math.random() * 1000);
                });
            }
        }

        setIsBatchTranslating(false);
        setBatchStepLabel('');
    };

    const updateOption = (id: string, field: keyof ProductOption, value: string | number) => {
        setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
        triggerSave('options');
    };

    const addOption = () => {
        const newOpt = { id: `opt-${Date.now()}`, nameKo: '', nameJa: '', stock: 0, priceKrw: 0, isRepresentative: false };
        const updated = [...options, newOpt];
        setOptions(updated);
        optionsRef.current = updated;
        updateProduct(product.id, { options: updated });
    };

    const deleteOption = (id: string) => {
        const updated = options.filter(o => o.id !== id);
        setOptions(updated);
        optionsRef.current = updated;
        updateProduct(product.id, { options: updated });
    };

    const [pendingRepId, setPendingRepId] = useState<string | null>(null);

    const flushSave = useCallback(() => {
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
            saveTimer.current = null;
        }
        updateProduct(product.id, {
            titleJa: titleRef.current || null,
            descriptionJa: descRef.current || null,
            options: optionsRef.current,
        });
    }, [product.id, updateProduct]);

    const handleSetRepresentative = (id: string) => {
        const hasRep = options.some(o => o.isRepresentative);
        const currentRepId = hasRep ? options.find(o => o.isRepresentative)?.id : options[0]?.id;
        if (currentRepId === id) return; // 이미 대표
        setPendingRepId(id);
    };

    const confirmRepresentative = () => {
        if (!pendingRepId) return;
        const updated = options.map(o => ({ ...o, isRepresentative: o.id === pendingRepId }));
        setOptions(updated);
        optionsRef.current = updated;
        updateProduct(product.id, { options: updated });
        setPendingRepId(null);
    };

    const descCount = (descMode === 'ko' ? descKo : descJa).length;
    const descCountColor =
        descCount > MAX_DESC * 0.95 ? colors.danger :
        descCount > MAX_DESC * 0.8 ? colors.warningIcon :
        colors.text.muted;

    const getOptionImage = (idx: number) =>
        product.thumbnails[idx]?.url ?? product.thumbnailUrl;

    const isTranslatingAnyOption = translatingOptionIds.size > 0;
    const allOptionsDone = options.length === 0 || options.every(o => (!!o.nameJa && !hasKorean(o.nameJa)) || !hasKorean(o.nameKo));
    const titleJaHasKorean = hasKorean(titleJa);
    const descJaHasKorean = hasKorean(descJa);
    const hasJaTitle = !!titleJa && titleJa !== stripPrefix(product.titleKo) && !titleJaHasKorean;
    const isDescDone = !!descJa && !descJaHasKorean;
    // titleJa가 null이거나 titleKoEdited가 true이면 AI 번역 버튼 활성화
    const titleTranslateDisabled = hasJaTitle && !titleKoEdited;

    // 카테고리가 AI 추천 그대로인지 확인
    const isAiCategory = !!product.aiRecommendedCategoryId &&
        product.qoo10CategoryId === product.aiRecommendedCategoryId;

    const progressItems = useMemo(() => [
        { label: '상품명을 번역하세요', done: hasJaTitle, target: 'section-title' },
        { label: '상품 옵션을 번역하세요', done: allOptionsDone, target: 'section-options' },
        { label: '상세설명을 작성 및 번역하세요', done: isDescDone, target: 'section-desc' },
    ], [hasJaTitle, allOptionsDone, isDescDone]);

    const progressDoneCount = progressItems.filter(i => i.done).length;
    const progressPercent = (progressDoneCount / progressItems.length) * 100;

    const scrollToSection = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }, []);

    return (
        <div style={{ maxWidth: '760px' }}>
            <style>{STATIC_STYLES}</style>

            {/* ── 진행 상태 콜아웃 ── */}
            {!hideProgress && (() => {
                const allDone = hasJaTitle && allOptionsDone && isDescDone;

                return (
                    <div style={{
                        padding: `${spacing['4']} ${spacing['5']}`,
                        background: colors.bg.info,
                        border: `1px solid ${colors.primaryLightBorder}`,
                        borderRadius: radius.lg,
                        marginBottom: spacing['6'],
                    }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing['2'], marginBottom: spacing['3'] }}>
                            <span style={{ fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.text.primary }}>
                                {allDone ? '등록 준비 완료!' : '등록하기 전 상품을 편집하세요'}
                            </span>
                            <span style={{ fontSize: font.size.sm, fontWeight: font.weight.regular, color: colors.text.muted }}>
                                {progressDoneCount}/{progressItems.length} 완료
                            </span>
                        </div>
                        <div style={{
                            height: '6px', background: colors.primaryBorder,
                            borderRadius: radius.full, overflow: 'hidden',
                            marginBottom: spacing['4'],
                        }}>
                            <div style={{
                                height: '100%', width: `${progressPercent}%`,
                                background: colors.primary, borderRadius: radius.full,
                                transition: 'width 0.4s ease',
                            }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                            {progressItems.map((item) => (
                                <div
                                    key={item.target}
                                    onClick={() => scrollToSection(item.target)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: spacing['2'],
                                        cursor: 'pointer', transition: 'opacity 0.15s', background: 'none',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                >
                                    {item.done ? (
                                        <div className="check-pop" style={{
                                            width: 16, height: 16, borderRadius: radius.full,
                                            border: `1.5px solid ${colors.primary}`, background: 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <Check size={10} color={colors.primary} strokeWidth={3} />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: 16, height: 16, borderRadius: radius.full,
                                            border: `1.5px solid ${colors.border.light}`, flexShrink: 0,
                                        }} />
                                    )}
                                    <span style={{
                                        flex: 1, fontSize: font.size.xs, fontWeight: font.weight.medium,
                                        color: item.done ? colors.primary : colors.text.secondary,
                                    }}>
                                        {item.label}
                                    </span>
                                    <ChevronDown size={12} color={colors.text.muted} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                        {/* 일괄 번역 버튼 */}
                        {(() => {
                            if (allDone) return null;
                            const isAnyRunning = isTranslatingTitle || isTranslatingAnyOption || isWritingDesc || isTranslatingDesc;
                            const isIdle = !isBatchTranslating;
                            const remaining = progressItems.length - progressDoneCount;

                            return (
                                <button
                                    onClick={isIdle ? handleBatchTranslate : undefined}
                                    disabled={isIdle && isAnyRunning}
                                    style={{
                                        width: '100%',
                                        marginTop: spacing['3'],
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        padding: `${spacing['3']} ${spacing['4']}`,
                                        background: colors.primary,
                                        border: 'none',
                                        borderRadius: radius.md,
                                        fontSize: font.size.sm, fontWeight: font.weight.semibold,
                                        color: colors.white,
                                        cursor: (isIdle && !isAnyRunning) ? 'pointer' : 'default',
                                        transition: 'all 0.25s',
                                        opacity: (isIdle && isAnyRunning) ? 0.5 : 1,
                                    }}
                                    onMouseEnter={e => { if (isIdle && !isAnyRunning) e.currentTarget.style.opacity = '0.85'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = (isIdle && isAnyRunning) ? '0.5' : '1'; }}
                                >
                                    {isBatchTranslating ? (
                                        <>
                                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                            {`${batchStepLabel} (${batchStep}/${batchTotal})`}
                                        </>
                                    ) : (
                                        <>
                                            <AIIcon size={14} color={colors.white} />
                                            {remaining === progressItems.length
                                                ? '한 번에 번역 및 작성하기'
                                                : `남은 ${remaining}개 항목 번역 및 작성하기`}
                                        </>
                                    )}
                                </button>
                            );
                        })()}
                    </div>
                );
            })()}

            {/* ── 브랜드 (Qoo10 DB 매칭) ── */}
            <div>
                <div style={{ marginBottom: spacing['2'] }}>
                    <span style={sectionLabelStyle}>브랜드</span>
                    <span style={{ color: colors.primary, marginLeft: '2px', fontWeight: font.weight.bold }}>*</span>
                </div>

                {/* 상품 브랜드 (브랜드가 있는 경우만 표시) */}
                {product.brand && (
                    <>
                        <div style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.medium, marginBottom: spacing['1'] }}>상품 브랜드</div>
                        <div style={{
                            ...inputBase,
                            background: colors.bg.faint,
                            color: colors.text.tertiary,
                            cursor: 'default',
                            marginBottom: spacing['3'],
                        }}>
                            {product.brand}
                        </div>
                    </>
                )}

                {/* Qoo10에 등록될 브랜드 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['1'], marginBottom: spacing['1'], position: 'relative' }}>
                    <span style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.medium }}>Qoo10에 등록될 브랜드</span>
                    <div
                        style={{ display: 'flex', alignItems: 'center', cursor: 'help', position: 'relative' }}
                        onMouseEnter={() => setShowBrandInfoTooltip(true)}
                        onMouseLeave={() => setShowBrandInfoTooltip(false)}
                    >
                        <Info size={13} color={colors.text.muted} />
                        {showBrandInfoTooltip && (
                            <div style={{
                                ...tooltipStyle,
                                width: 'max-content',
                                maxWidth: '420px',
                                left: 0,
                                transform: 'none',
                                whiteSpace: 'nowrap',
                            }}>
                                <div style={{ marginBottom: '6px', fontWeight: font.weight.semibold }}>브랜드 매칭이란?</div>
                                <div style={{ marginBottom: '4px' }}>• Qoo10 등록 브랜드와 매칭하면 브랜드 검색에 노출돼요</div>
                                <div>• 미등록 브랜드는 <span style={{ fontWeight: font.weight.bold }}>"브랜드 없음"</span>으로 등록됩니다</div>
                            </div>
                        )}
                    </div>
                </div>
                {product.brandMatchStatus === 'matched' ? (
                    /* 매칭됨: AI 아이콘 + 브랜드명 — 클릭하면 모달 */
                    <div
                        onClick={() => setShowBrandModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: `11px ${spacing['3']}`,
                            border: `1.5px solid ${colors.primaryBorder}`,
                            borderRadius: radius.md,
                            background: colors.bg.surface,
                            cursor: 'pointer', transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = colors.primaryBorder; }}
                    >
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], position: 'relative' }}
                            onMouseEnter={() => setShowBrandAiTooltip(true)}
                            onMouseLeave={() => setShowBrandAiTooltip(false)}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: colors.primary, borderRadius: radius.xs,
                                padding: '3px 5px', lineHeight: 1,
                            }}>
                                <AIIcon size={12} color={colors.white} />
                            </div>
                            <span style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary }}>
                                {product.brand}
                            </span>
                            {showBrandAiTooltip && (
                                <div style={{ ...tooltipStyle, whiteSpace: 'nowrap' }}>
                                    AI가 자동으로 매칭한 브랜드예요
                                </div>
                            )}
                        </div>
                        <ChevronRight size={15} color={colors.text.muted} style={{ flexShrink: 0 }} />
                    </div>
                ) : product.brandMatchStatus === 'unmatched' ? (
                    /* 미매칭: 브랜드 없음 — 클릭하면 모달로 직접 검색 가능 */
                    <>
                        <div
                            onClick={() => setShowBrandModal(true)}
                            style={{
                                ...inputBase,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: colors.bg.surface,
                                cursor: 'pointer', transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primary; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border.default; }}
                        >
                            <span style={{ fontSize: font.size.base, color: colors.text.muted }}>브랜드 없음</span>
                            <ChevronRight size={15} color={colors.text.muted} style={{ flexShrink: 0 }} />
                        </div>
                        <div style={{ fontSize: font.size.xs, color: colors.primary, marginTop: spacing['1'], lineHeight: font.lineHeight.normal }}>
                            * Qoo10에 등록되지 않은 브랜드라 "브랜드 없음"으로 설정됐어요. 직접 검색해서 변경할 수 있어요.
                        </div>
                    </>
                ) : (
                    /* 브랜드 없음 — 클릭하면 모달로 검색 가능 */
                    <div
                        onClick={() => setShowBrandModal(true)}
                        style={{
                            ...inputBase,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: colors.bg.surface,
                            cursor: 'pointer', transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border.default; }}
                    >
                        <span style={{ fontSize: font.size.base, color: colors.text.muted }}>브랜드 없음</span>
                        <ChevronRight size={15} color={colors.text.muted} style={{ flexShrink: 0 }} />
                    </div>
                )}
            </div>

            {showBrandModal && (() => {
                const fallbackCode = QOO10_BRANDS.find(b => b.name === product.brand)?.code;
                return <BrandSelectModal
                    currentCode={product.brandMatchStatus === 'matched'
                        ? (product.brandQoo10Code || fallbackCode)
                        : undefined}
                    aiMatchedCode={product.aiRecommendedBrandCode
                        || product.brandQoo10Code
                        || fallbackCode}
                    onSelect={(brand) => {
                        if (brand) {
                            updateProduct(product.id, {
                                brandMatchStatus: 'matched',
                                brandQoo10Code: brand.code,
                            });
                        } else {
                            updateProduct(product.id, {
                                brandMatchStatus: 'none',
                                brandQoo10Code: undefined,
                            });
                        }
                    }}
                    onClose={() => setShowBrandModal(false)}
                />;
            })()}

            <Divider />

            {/* ── 상품명 ── */}
            <div id="section-title">
                <div style={{ ...flexBetween, marginBottom: spacing['2'] }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={sectionLabelStyle}>상품명</span>
                        <span style={{ color: colors.primary, marginLeft: '2px', fontWeight: font.weight.bold }}>*</span>
                        {hasJaTitle
                            ? <StatusTag type="translated" label="작성 완료" />
                            : <StatusTag type="needsTranslation" label="번역 필요" />
                        }
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        {!hideProgress && saveSection === 'title' && saveStatus === 'saving' && (
                            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>저장 중...</span>
                        )}
                        {!hideProgress && saveSection === 'title' && saveStatus === 'saved' && (
                            <span style={{ fontSize: font.size.xs, color: colors.success, animation: 'savedIn 0.2s ease' }}>저장됨 ✓</span>
                        )}
                        <div
                            style={{ position: 'relative' }}
                            onMouseEnter={e => { if (titleTranslateDisabled) (e.currentTarget.querySelector('[data-title-tip]') as HTMLElement)?.style.setProperty('display', 'block'); }}
                            onMouseLeave={e => { (e.currentTarget.querySelector('[data-title-tip]') as HTMLElement)?.style.setProperty('display', 'none'); }}
                        >
                            <AIButton loading={isTranslatingTitle} onClick={handleTranslateTitle} label="AI 번역" disabled={titleTranslateDisabled} />
                            {titleTranslateDisabled && (
                                <div
                                    data-title-tip=""
                                    style={{
                                        display: 'none',
                                        position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
                                        background: colors.text.primary, color: colors.white,
                                        fontSize: font.size.xs, padding: '5px 10px',
                                        borderRadius: radius.md, whiteSpace: 'nowrap',
                                        pointerEvents: 'none', zIndex: zIndex.dropdown,
                                        animation: 'tooltipFadeIn 0.15s ease',
                                    }}
                                >
                                    이미 편집되어 있습니다
                                    <div style={{
                                        position: 'absolute', top: '100%', right: '12px',
                                        border: '4px solid transparent', borderTopColor: colors.text.primary,
                                    }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* 수집 원본 */}
                <div style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.medium, marginBottom: spacing['1'] }}>원본 상품명</div>
                <div style={{
                    ...inputBase,
                    background: colors.bg.faint,
                    color: colors.text.tertiary,
                    cursor: 'default',
                    marginBottom: spacing['3'],
                }}>
                    {stripPrefix(product.titleKo)}
                </div>
                <div style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.medium, marginBottom: spacing['1'] }}>판매 상품명</div>
                <div style={{ position: 'relative' }}>
                    {isTranslatingTitle ? (
                        <div style={{
                            ...inputBase,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: colors.primaryLight,
                            borderColor: colors.primaryBorder,
                        }}>
                            <Loader2 size={14} color={colors.primary} className="spin" style={{ flexShrink: 0 }} />
                            <span className="ai-processing" style={{ fontWeight: font.weight.medium }}>AI가 상품명을 번역하고 있어요...</span>
                        </div>
                    ) : (
                        <input
                            className={hasJaTitle ? 'content-fade-in' : undefined}
                            type="text"
                            value={titleJa}
                            onChange={e => { setTitleJa(e.target.value); if (!composingRef.current) triggerSave('title'); }}
                            onCompositionStart={() => { composingRef.current = true; }}
                            onCompositionEnd={e => { composingRef.current = false; setTitleJa((e.target as HTMLInputElement).value); triggerSave('title'); }}
                            placeholder={titleJa ? '일본어 상품명을 수정하세요' : 'AI 번역 버튼을 눌러 자동 번역하거나 직접 입력하세요'}
                            style={{ ...inputBase, ...(!hasJaTitle ? warningBorderStyle : {}) }}
                            onFocus={handleWarningFocus}
                            onBlur={createWarningBlur(hasJaTitle)}
                        />
                    )}
                    {!hasJaTitle && (
                        <p style={{ margin: `${spacing['1']} 0 0`, display: 'flex', alignItems: 'center', gap: '4px', fontSize: font.size.xs, color: colors.warningIcon }}>
                            <Info size={12} style={{ flexShrink: 0 }} />
                            {titleJaHasKorean && product.translationStatus === 'completed'
                                ? '한국어가 포함되어 있어요. 한국어를 지우거나 AI 번역 버튼을 눌러 번역해 주세요.'
                                : '현재 한국어 원본이에요. AI 번역 버튼을 누르면 일본어로 번역하고, Qoo10 가이드라인에 맞게 자동 수정해 드려요.'}
                        </p>
                    )}
                </div>
            </div>

            <Divider />

            {/* ── 옵션 ── */}
            <div id="section-options">
                <div style={{ ...flexBetween, marginBottom: spacing['3'] }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={sectionLabelStyle}>옵션</span>
                        <span style={{ color: colors.primary, marginLeft: '2px', fontWeight: font.weight.bold }}>*</span>
                        {allOptionsDone
                            ? <StatusTag type="translated" label="작성 완료" />
                            : <StatusTag type="needsTranslation" label="번역 필요" />
                        }
                        <span style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.medium, marginLeft: spacing['2'] }}>
                            {options.length}개
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        {!hideProgress && saveSection === 'options' && saveStatus === 'saving' && (
                            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>저장 중...</span>
                        )}
                        {!hideProgress && saveSection === 'options' && saveStatus === 'saved' && (
                            <span style={{ fontSize: font.size.xs, color: colors.success, animation: 'savedIn 0.2s ease' }}>저장됨 ✓</span>
                        )}
                    <div
                        style={{ position: 'relative' }}
                        onMouseEnter={e => { if (allOptionsDone) (e.currentTarget.querySelector('[data-opt-tip]') as HTMLElement)?.style.setProperty('display', 'block'); }}
                        onMouseLeave={e => { (e.currentTarget.querySelector('[data-opt-tip]') as HTMLElement)?.style.setProperty('display', 'none'); }}
                    >
                        <AIButton
                            loading={isTranslatingAnyOption}
                            onClick={handleTranslateOptions}
                            label="AI 번역"
                            disabled={allOptionsDone}
                        />
                        {allOptionsDone && (
                            <div data-opt-tip="" style={{
                                display: 'none', position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
                                background: colors.text.primary, color: colors.white,
                                fontSize: font.size.xs, padding: '5px 10px',
                                borderRadius: radius.md, whiteSpace: 'nowrap',
                                pointerEvents: 'none', zIndex: zIndex.dropdown,
                                animation: 'tooltipFadeIn 0.15s ease',
                            }}>
                                이미 편집되어 있습니다
                                <div style={{ position: 'absolute', top: '100%', right: '12px', border: '4px solid transparent', borderTopColor: colors.text.primary }} />
                            </div>
                        )}
                    </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: '30px 44px 1fr 90px 36px',
                    paddingBottom: spacing['2'],
                    gap: spacing['3'],
                }}>
                    {['대표', '사진', '옵션명', '재고', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.text.muted, textAlign: i === 0 ? 'center' : undefined }}>{h}</div>
                    ))}
                </div>

                {options.length === 0 ? (
                    <div style={{ padding: `${spacing['5']} 0`, fontSize: font.size.sm, color: colors.text.muted }}>
                        옵션이 없습니다
                    </div>
                ) : options.map((opt, idx) => {
                    const hasRep = options.some(o => o.isRepresentative);
                    const isRep = hasRep ? opt.isRepresentative : idx === 0;
                    return (
                        <OptionRow
                            key={opt.id}
                            option={opt}
                            imageUrl={getOptionImage(idx)}
                            isTranslating={translatingOptionIds.has(opt.id)}
                            isRepresentative={isRep}
                            onChange={(field, value) => updateOption(opt.id, field, value)}
                            onDelete={() => deleteOption(opt.id)}
                            onSetRepresentative={() => handleSetRepresentative(opt.id)}
                            onFlushSave={flushSave}
                        />
                    );
                })}

                <button
                    onClick={addOption}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        marginTop: spacing['1'], width: '100%', padding: `10px 0`,
                        background: 'none', border: `1.5px dashed ${colors.border.light}`,
                        borderRadius: radius.md, fontSize: font.size.sm, color: colors.text.muted,
                        cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = colors.primary;
                        e.currentTarget.style.borderColor = colors.primary;
                        e.currentTarget.style.background = colors.primaryLight;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = colors.text.muted;
                        e.currentTarget.style.borderColor = colors.border.light;
                        e.currentTarget.style.background = 'none';
                    }}
                >
                    <Plus size={14} /> 옵션 추가
                </button>

                {/* 대표 옵션 변경 확인 모달 */}
                {pendingRepId && (
                    <ConfirmModal
                        isOpen
                        onClose={() => setPendingRepId(null)}
                        onConfirm={confirmRepresentative}
                        title="대표 옵션 변경"
                        description={`'${options.find(o => o.id === pendingRepId)?.nameKo || options.find(o => o.id === pendingRepId)?.nameJa || '선택한'}' 옵션을 대표 상품으로 설정하시겠습니까? 대표 상품의 판매가가 Qoo10에 노출됩니다.`}
                        confirmText="변경하기"
                        cancelText="취소"
                        type="info"
                    />
                )}
            </div>

            <Divider />

            {/* ── 상세설명 ── */}
            <div id="section-desc">
                <div style={{ ...flexBetween, marginBottom: spacing['2'] }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={sectionLabelStyle}>상세설명</span>
                        <span style={{ color: colors.primary, marginLeft: '2px', fontWeight: font.weight.bold }}>*</span>
                        {isDescDone
                            ? <StatusTag type="translated" label="작성 완료" />
                            : !hasDescContent && !isWritingDesc && !isTranslatingDesc && !showDescManual
                                ? <StatusTag type="needsTranslation" label="작성 및 번역 필요" />
                                : <StatusTag type="needsTranslation" label="번역 필요" />
                        }
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        {!hideProgress && saveSection === 'desc' && saveStatus === 'saving' && (
                            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>저장 중...</span>
                        )}
                        {!hideProgress && saveSection === 'desc' && saveStatus === 'saved' && (
                            <span style={{ fontSize: font.size.xs, color: colors.success, animation: 'savedIn 0.2s ease' }}>저장됨 ✓</span>
                        )}
                        <AIButton loading={isWritingDesc} onClick={handleWriteDesc} label={hasDescContent ? 'AI 재작성' : 'AI 작성'} loadingLabel="작성 중..." icon={<PenLine size={13} />} />
                            <div
                                style={{ position: 'relative' }}
                                onMouseEnter={() => { if (!descKo.trim() || !!descJa) setShowTranslateTooltip(true); }}
                                onMouseLeave={() => setShowTranslateTooltip(false)}
                            >
                                <AIButton loading={isTranslatingDesc} onClick={handleTranslateDesc} label="AI 번역" loadingLabel="번역 중..." disabled={(!descKo.trim() && !descJa.trim()) || (!!descJa && !descJaHasKorean)} icon={<Languages size={13} />} />
                                {showTranslateTooltip && (!descKo.trim() || !!descJa) && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                                        background: colors.text.primary, color: colors.white,
                                        borderRadius: radius.md, padding: '6px 10px',
                                        fontSize: font.size.xs, fontWeight: font.weight.medium,
                                        whiteSpace: 'nowrap', zIndex: zIndex.dropdown,
                                        pointerEvents: 'none',
                                        animation: 'tooltipFadeIn 0.15s ease',
                                    }}>
                                        {descJa ? '이미 편집되어 있습니다' : 'AI 작성을 먼저 해주세요'}
                                    </div>
                                )}
                            </div>
                    </div>
                </div>

                {(isWritingDesc || isTranslatingDesc) ? (
                    <div style={{
                        ...inputBase,
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                        background: colors.primaryLight,
                        borderColor: colors.primaryBorder,
                        minHeight: '280px',
                        cursor: 'default', userSelect: 'none', caretColor: 'transparent',
                    }}>
                        <Loader2 size={14} color={colors.primary} className="spin" style={{ flexShrink: 0 }} />
                        <span className="ai-processing" style={{ fontWeight: font.weight.medium }}>
                            {isWritingDesc ? 'AI가 상품 정보를 분석해 초안을 작성하고 있어요...' : 'AI가 일본어로 번역하고 있어요...'}
                        </span>
                    </div>
                ) : !hasDescContent && !showDescManual ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: `${spacing['6']} ${spacing['6']}`,
                        background: colors.bg.faint,
                        border: `1.5px solid ${colors.border.default}`,
                        borderRadius: radius.lg,
                        textAlign: 'center',
                        minHeight: '280px',
                    }}>
                        <p style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: spacing['1'] }}>
                            AI가 상세 설명을 작성해 드려요
                        </p>
                        <p style={{ margin: 0, fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: spacing['4'] }}>
                            수집 사이트의 상품명, 카테고리, 성분 등을 분석해서 작성해요
                        </p>
                        <button
                            onClick={() => setShowDescManual(true)}
                            style={{
                                ...ghostButtonBase,
                                fontSize: font.size.sm, fontWeight: font.weight.medium,
                                color: colors.text.muted, textDecoration: 'underline',
                            }}
                        >
                            직접 작성하기
                        </button>
                    </div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <textarea
                            key={descMode}
                            className={(descMode === 'ja' && descJa) || (descMode === 'ko' && descKo) ? 'content-fade-in' : undefined}
                            value={descMode === 'ko' ? descKo : descJa}
                            onChange={e => {
                                if (descMode === 'ko') {
                                    setDescKo(e.target.value);
                                } else {
                                    if (e.target.value.length <= MAX_DESC) { setDescJa(e.target.value); if (!composingRef.current) triggerSave('desc'); }
                                }
                            }}
                            onCompositionStart={() => { composingRef.current = true; }}
                            onCompositionEnd={e => { composingRef.current = false; if (descMode === 'ja') { setDescJa((e.target as HTMLTextAreaElement).value); triggerSave('desc'); } }}
                            placeholder={
                                descMode === 'ko' ? '수정 후 AI 번역 버튼을 눌러 일본어로 변환하세요' :
                                product.translationStatus === 'completed' ? '일본어 상세설명을 수정하세요' :
                                'AI 작성 버튼으로 한국어 초안을 만들거나 직접 입력하세요'
                            }
                            rows={10}
                            style={{
                                ...inputBase,
                                resize: 'vertical', lineHeight: font.lineHeight.relaxed, paddingBottom: '32px',
                                ...(!isDescDone ? warningBorderStyle : {}),
                            }}
                            onFocus={handleWarningFocus}
                            onBlur={createWarningBlur(isDescDone)}
                        />
                        <div style={{
                            position: 'absolute', bottom: spacing['2'], right: spacing['3'],
                            fontSize: font.size.xs, color: descCountColor,
                            pointerEvents: 'none', transition: 'color 0.3s',
                        }}>
                            {descCount.toLocaleString()} / {MAX_DESC.toLocaleString()}
                        </div>
                    </div>
                )}
                {hasDescContent && !isDescDone && !isWritingDesc && !isTranslatingDesc && (
                    <p style={{ margin: `${spacing['1']} 0 0`, display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: font.size.xs, color: colors.warningIcon }}>
                        <Info size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
                        {descJaHasKorean && product.translationStatus === 'completed'
                            ? '한국어가 포함되어 있어요. 한국어를 지우거나 AI 번역 버튼을 눌러 번역해 주세요.'
                            : '한국어 초안이에요. AI 번역 버튼을 눌러 일본어로 변환하세요.'}
                    </p>
                )}
            </div>

            <Divider />

            {/* ── 카테고리 ── */}
            <div>
                <div style={{ marginBottom: spacing['2'] }}>
                    <span style={sectionLabelStyle}>카테고리</span>
                    <span style={{ color: colors.primary, marginLeft: '2px', fontWeight: font.weight.bold }}>*</span>
                </div>
                <div style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.medium, marginBottom: spacing['1'] }}>원본 카테고리</div>
                <div style={{
                    ...inputBase,
                    background: colors.bg.faint,
                    color: colors.text.tertiary,
                    cursor: 'default',
                    marginBottom: spacing['3'],
                }}>
                    {product.sourceCategoryPath}
                </div>
                <div style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.medium, marginBottom: spacing['1'] }}>Qoo10 카테고리</div>
                <div
                    onClick={() => setShowCategoryModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: `11px ${spacing['3']}`,
                        border: `1.5px solid ${isAiCategory ? colors.primaryBorder : colors.border.default}`,
                        borderRadius: radius.md,
                        background: colors.bg.surface,
                        cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = isAiCategory ? colors.primaryBorder : colors.border.default; }}
                >
                    {isAiCategory && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: colors.primary,
                            borderRadius: radius.xs,
                            padding: '3px 5px',
                            marginRight: spacing['2'],
                            flexShrink: 0,
                            lineHeight: 1,
                        }}>
                            <AIIcon size={12} color={colors.white} />
                        </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: font.size.base, color: colors.text.primary }}>
                            {product.qoo10CategoryPath}
                        </div>
                    </div>
                    <ChevronRight size={15} color={colors.text.muted} style={{ flexShrink: 0 }} />
                </div>
            </div>

            <Divider />

            {/* ── 발송가능일 ── */}
            <ShippingSelect
                shippingType={product.shippingType ?? 'standard'}
                shippingDays={product.shippingDays ?? 3}
                onChange={(type, days) => updateProduct(product.id, { shippingType: type, shippingDays: days })}
            />

            <Divider />

            {/* ── 제조사 / 원산지 ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
                {([
                    { label: '제조사', field: 'manufacturer' as const, placeholder: '제조사를 입력하세요' },
                    { label: '원산지', field: 'productionPlace' as const, placeholder: '원산지를 입력하세요 (예: 대한민국)' },
                ] as const).map(({ label, field, placeholder }) => (
                    <div key={field}>
                        <div style={{ marginBottom: spacing['2'] }}>
                            <span style={sectionLabelStyle}>{label}</span>
                        </div>
                        <input
                            type="text"
                            value={product[field]}
                            onChange={e => updateProduct(product.id, { [field]: e.target.value })}
                            placeholder={placeholder}
                            style={inputBase}
                            onFocus={e => { e.target.style.borderColor = colors.primary; }}
                            onBlur={e => { e.target.style.borderColor = colors.border.default; }}
                        />
                    </div>
                ))}
            </div>


            <ConfirmModal
                isOpen={showWriteConfirm}
                onClose={() => setShowWriteConfirm(false)}
                onConfirm={() => { setShowWriteConfirm(false); doWriteDesc(); }}
                title="현재 내용을 지우고 다시 작성할까요?"
                description="AI 작성을 다시 실행하면 현재 작성된 내용이 모두 지워집니다."
                confirmText="다시 작성"
                cancelText="취소"
                type="info"
            />

            {showCategoryModal && (
                <CategorySelectModal
                    currentCode={product.qoo10CategoryId}
                    currentPath={product.qoo10CategoryPath}
                    aiRecommendedCode={product.aiRecommendedCategoryId || undefined}
                    onSelect={(item) => updateProduct(product.id, {
                        qoo10CategoryPath: item.path,
                        qoo10CategoryId: item.smallCode,
                    })}
                    onClose={() => setShowCategoryModal(false)}
                />
            )}
        </div>
    );
};
