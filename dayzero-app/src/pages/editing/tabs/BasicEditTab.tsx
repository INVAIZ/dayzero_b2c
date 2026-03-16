import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Search, Check, X, Loader2, PenLine, Languages, CheckCircle2, Info, Sparkles } from 'lucide-react';
import type { ProductDetail, ProductOption } from '../../../types/editing';
import { useEditingStore } from '../../../store/useEditingStore';
import { QOO10_CATEGORY_KO, toKoCategory } from '../../../mock/categoryMap';
import { PENDING_JA_TITLES } from '../../../mock/editingMock';
import { colors, font, radius, shadow, spacing, zIndex } from '../../../design/tokens';
import { stripPrefix, toJaTitle, mockTranslateOption as mockTranslateOpt, hasKorean } from '../../../utils/editing';
import { handleImgError } from '../../../utils/image';
import { ConfirmModal } from '../../../components/common/ConfirmModal';

interface Props {
    product: ProductDetail;
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
    fontSize: font.size.sm, fontWeight: 600, color: colors.text.secondary,
};

const ghostButtonBase: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
};

// ── 한국어 원문 hover 툴팁 ────────────────────────────────────────────────────
const KoTooltip: React.FC<{ pos: { x: number; y: number }; text: string }> = ({ pos, text }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [adjusted, setAdjusted] = useState(pos);

    useEffect(() => {
        if (!ref.current) return;
        const { width, height } = ref.current.getBoundingClientRect();
        const vw = window.innerWidth;
        let x = pos.x + 12;
        let y = pos.y - height - 10;
        if (x + width > vw - 16) x = vw - width - 16;
        if (y < 8) y = pos.y + 16;
        setAdjusted({ x, y });
    }, [pos.x, pos.y]);

    return (
        <div ref={ref} style={{
            position: 'fixed', left: adjusted.x, top: adjusted.y,
            zIndex: zIndex.toast,
            background: colors.text.primary, color: '#fff',
            borderRadius: radius.lg, padding: `${spacing['3']} ${spacing['4']}`,
            fontSize: font.size.base, pointerEvents: 'none',
            boxShadow: shadow.lg,
            maxWidth: '400px', wordBreak: 'keep-all',
            animation: 'koIn 0.12s ease',
        }}>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: font.size.xs, marginBottom: '4px', fontWeight: 500 }}>한국어 원문</div>
            <div style={{ whiteSpace: 'normal', lineHeight: 1.4, fontWeight: 600 }}>{text}</div>
        </div>
    );
};

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
                fontSize: font.size.sm, fontWeight: 600,
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

// ── 카테고리 모달 ──────────────────────────────────────────────────────────────
const CategoryModal: React.FC<{
    current: string;
    onSelect: (jaPath: string) => void;
    onClose: () => void;
}> = ({ current, onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const results = Object.entries(QOO10_CATEGORY_KO).filter(([ja, ko]) =>
        !query || ko.includes(query) || ja.includes(query)
    );

    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                zIndex: zIndex.modal,
            }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: zIndex.modal + 1,
                background: colors.bg.surface, borderRadius: radius.xl,
                width: '480px', maxHeight: '580px',
                display: 'flex', flexDirection: 'column',
                boxShadow: shadow.lg, overflow: 'hidden',
                animation: 'modalIn 0.18s ease',
            }}>
                <div style={{
                    ...flexBetween,
                    padding: `${spacing['5']} ${spacing['6']}`,
                    borderBottom: `1px solid ${colors.border.default}`,
                }}>
                    <span style={{ fontSize: font.size.lg, fontWeight: 700, color: colors.text.primary }}>
                        Qoo10 카테고리 변경
                    </span>
                    <button onClick={onClose} style={{
                        ...ghostButtonBase,
                        color: colors.text.muted, display: 'flex', padding: '4px', borderRadius: radius.sm,
                    }}>
                        <X size={20} />
                    </button>
                </div>
                <div style={{ padding: spacing['4'], borderBottom: `1px solid ${colors.border.default}` }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: spacing['2'],
                        padding: `10px ${spacing['3']}`,
                        border: `1.5px solid ${colors.border.default}`,
                        borderRadius: radius.md, background: colors.bg.faint,
                    }}>
                        <Search size={15} color={colors.text.muted} style={{ flexShrink: 0 }} />
                        <input
                            ref={inputRef} value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="카테고리 검색 (예: 스킨케어, 주방)"
                            style={{
                                flex: 1, border: 'none', outline: 'none',
                                background: 'transparent',
                                fontSize: font.size.base, color: colors.text.primary,
                            }}
                        />
                        {query && (
                            <button onClick={() => setQuery('')} style={{
                                ...ghostButtonBase, display: 'flex', color: colors.text.muted,
                            }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {query && (
                        <div style={{ marginTop: spacing['2'], fontSize: font.size.xs, color: colors.text.muted }}>
                            {results.length}개 결과
                        </div>
                    )}
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {results.length === 0 ? (
                        <div style={{ padding: `${spacing['8']} ${spacing['6']}`, textAlign: 'center', color: colors.text.muted, fontSize: font.size.sm }}>
                            검색 결과가 없습니다
                        </div>
                    ) : results.map(([ja, ko]) => {
                        const isSelected = ja === current;
                        return (
                            <button key={ja}
                                onClick={() => { onSelect(ja); onClose(); }}
                                style={{
                                    ...flexBetween,
                                    width: '100%', padding: `14px ${spacing['6']}`,
                                    background: isSelected ? colors.primaryLight : 'transparent',
                                    border: 'none', cursor: 'pointer', textAlign: 'left',
                                    borderBottom: `1px solid ${colors.border.default}`,
                                    transition: 'background 0.12s', gap: spacing['3'],
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = colors.bg.faint; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontSize: font.size.sm, fontWeight: isSelected ? 700 : 500,
                                        color: isSelected ? colors.primary : colors.text.primary, marginBottom: '3px',
                                    }}>
                                        {ko}
                                    </div>
                                    <div style={{ fontSize: font.size.xs, color: colors.text.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {ja}
                                    </div>
                                </div>
                                {isSelected && <Check size={16} color={colors.primary} style={{ flexShrink: 0 }} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

// ── 옵션 행 ───────────────────────────────────────────────────────────────────
const OptionRow: React.FC<{
    option: ProductOption;
    imageUrl: string;
    isTranslating: boolean;
    onChange: (field: keyof ProductOption, value: string | number) => void;
    onDelete: () => void;
}> = ({ option, imageUrl, isTranslating, onChange, onDelete }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const hasNameJa = !isTranslating && !!option.nameJa;

    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '44px 1fr 90px 36px',
            alignItems: 'start', gap: spacing['3'],
            paddingBottom: spacing['3'],
            marginBottom: spacing['3'],
            borderBottom: `1px solid ${colors.border.default}`,
        }}>
            <img src={imageUrl} alt=""
                onError={handleImgError}
                style={{
                    width: '44px', height: '44px',
                    borderRadius: radius.md, objectFit: 'cover',
                    border: `1px solid ${colors.border.default}`, flexShrink: 0,
                    marginTop: '2px',
                }} />

            {/* 옵션명 입력 (hover → 한국어 원문 툴팁) */}
            <div
                style={{ minWidth: 0, position: 'relative' }}
                onMouseMove={(option.nameJa && option.nameJa !== option.nameKo) ? e => setTooltip({ x: e.clientX, y: e.clientY }) : undefined}
                onMouseLeave={(option.nameJa && option.nameJa !== option.nameKo) ? () => setTooltip(null) : undefined}
            >
                {isTranslating ? (
                    <div style={{
                        ...inputBase,
                        display: 'flex', alignItems: 'center', gap: '6px',
                        color: colors.primary, background: colors.primaryLight,
                        borderColor: colors.primary,
                    }}>
                        <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                        번역 중...
                    </div>
                ) : (
                    <input
                        key={option.nameJa ? 'ja' : 'empty'}
                        className={option.nameJa ? 'content-fade-in' : undefined}
                        value={option.nameJa ?? ''}
                        onChange={e => onChange('nameJa', e.target.value)}
                        placeholder={option.nameKo || '옵션명 입력'}
                        style={inputBase}
                        onFocus={e => (e.target.style.borderColor = colors.primary)}
                        onBlur={e => (e.target.style.borderColor = colors.border.default)}
                    />
                )}
                {!hasNameJa && (
                    <p style={{ margin: `${spacing['1']} 0 0`, display: 'flex', alignItems: 'center', gap: '4px', fontSize: font.size.xs, color: colors.warningIcon }}>
                        <Info size={12} style={{ flexShrink: 0 }} />
                        큐텐에 표시될 일본어 옵션 이름이 필요해요. AI 번역 버튼으로 빠르게 완성할 수 있어요.
                    </p>
                )}
                {tooltip && option.nameKo && (
                    <KoTooltip pos={tooltip} text={option.nameKo} />
                )}
            </div>

            <input
                type="number" min={0}
                value={option.stock}
                onChange={e => onChange('stock', Number(e.target.value))}
                className="stock-input"
                style={{ ...inputBase, textAlign: 'left', marginTop: '2px' }}
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
                    marginTop: '2px',
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
    );
};

// ── 메인 탭 ────────────────────────────────────────────────────────────────────
export const BasicEditTab: React.FC<Props> = ({ product }) => {
    const { updateProduct } = useEditingStore();

    const [titleJa, setTitleJa] = useState(product.titleJa ? stripPrefix(product.titleJa) : stripPrefix(product.titleKo));
    const [descJa, setDescJa] = useState(product.descriptionJa ?? '');
    const [options, setOptions] = useState<ProductOption[]>([...product.options]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [titleTooltip, setTitleTooltip] = useState<{ x: number; y: number } | null>(null);

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
    const [showTranslateTooltip, setShowTranslateTooltip] = useState(false);
    const [translatingOptionIds, setTranslatingOptionIds] = useState<Set<string>>(new Set());

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        setShowTranslateTooltip(false);
        setTranslatingOptionIds(new Set());
        setTitleTooltip(null);
        setTitleKoEdited(false);
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
        setTitleJa(product.titleJa ? stripPrefix(product.titleJa) : stripPrefix(product.titleKo));
    }, [product.titleJa]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setOptions([...product.options]);
    }, [product.options]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (product.descriptionJa) {
            setDescJa(product.descriptionJa);
            setDescMode('ja');
        }
    }, [product.descriptionJa]);

    const triggerSave = useCallback(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        setSaveStatus('saving');
        saveTimer.current = setTimeout(() => {
            updateProduct(product.id, {
                titleJa: titleRef.current || null,
                descriptionJa: descRef.current || null,
                options: optionsRef.current,
            });
            setSaveStatus('saved');
            savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
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
        if (isTranslatingDesc || !descKo.trim()) return;
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
        const ids = new Set(options.map(o => o.id));
        setTranslatingOptionIds(ids);
        const snapshot = [...options];
        let cumulativeDelay = 0;
        snapshot.forEach((opt, i) => {
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
                // 마지막 옵션 완료 시 즉시 저장 (ref 동기화 지연 우회)
                if (i === snapshot.length - 1) {
                    const translatedOptions = snapshot.map(o => ({
                        ...o,
                        nameJa: mockTranslateOpt(o.nameKo),
                    }));
                    updateProduct(product.id, { options: translatedOptions });
                }
            }, delay);
        });
    };

    const updateOption = (id: string, field: keyof ProductOption, value: string | number) => {
        setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
        triggerSave();
    };

    const addOption = () => {
        setOptions(prev => [...prev, { id: `opt-${Date.now()}`, nameKo: '', nameJa: '', stock: 0 }]);
        triggerSave();
    };

    const deleteOption = (id: string) => {
        setOptions(prev => prev.filter(o => o.id !== id));
        triggerSave();
    };

    const descCount = (descMode === 'ko' ? descKo : descJa).length;
    const descCountColor =
        descCount > MAX_DESC * 0.95 ? colors.danger :
        descCount > MAX_DESC * 0.8 ? colors.warningIcon :
        colors.text.muted;

    const getOptionImage = (idx: number) =>
        product.thumbnails[idx]?.url ?? product.thumbnailUrl;

    const isTranslatingAnyOption = translatingOptionIds.size > 0;
    const allOptionsDone = options.length > 0 && options.every(o => !!o.nameJa);
    const titleJaHasKorean = hasKorean(titleJa);
    const descJaHasKorean = hasKorean(descJa);
    const hasJaTitle = !!titleJa && titleJa !== stripPrefix(product.titleKo) && !titleJaHasKorean;
    const isDescDone = !!descJa && !descJaHasKorean;
    // titleJa가 null이거나 titleKoEdited가 true이면 AI 번역 버튼 활성화
    const titleTranslateDisabled = hasJaTitle && !titleKoEdited;

    return (
        <div style={{ maxWidth: '760px' }}>
            <style>{`
                @keyframes koIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
                @keyframes modalIn { from { opacity:0; transform:translate(-50%,-48%); } to { opacity:1; transform:translate(-50%,-50%); } }
                @keyframes savedIn { from { opacity:0; } to { opacity:1; } }
                @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
                @keyframes contentFadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
                .content-fade-in { animation: contentFadeIn 0.4s ease; }
                .stock-input::-webkit-outer-spin-button,
                .stock-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .stock-input { -moz-appearance: textfield; }
            `}</style>

            {/* ── 상품명 ── */}
            <div>
                <div style={{ ...flexBetween, marginBottom: spacing['2'] }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={sectionLabelStyle}>상품명</span>
                        {hasJaTitle
                            ? <CheckCircle2 size={14} color={colors.success} style={{ marginLeft: '4px' }} />
                            : <span style={{ fontSize: font.size.base, color: colors.warningIcon, fontWeight: 700, marginLeft: '4px', lineHeight: 1 }}>*</span>
                        }
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        {saveStatus === 'saving' && (
                            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>저장 중...</span>
                        )}
                        {saveStatus === 'saved' && (
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
                                        background: colors.text.primary, color: '#fff',
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
                {/* hover 시 한국어 원문 툴팁 */}
                <div
                    style={{ position: 'relative' }}
                    onMouseMove={(!isTranslatingTitle && hasJaTitle) ? e => setTitleTooltip({ x: e.clientX, y: e.clientY }) : undefined}
                    onMouseLeave={(!isTranslatingTitle && hasJaTitle) ? () => setTitleTooltip(null) : undefined}
                >
                    {isTranslatingTitle ? (
                        <div style={{
                            ...inputBase,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            color: colors.primary, background: colors.primaryLight,
                            borderColor: colors.primary,
                        }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                            번역 중...
                        </div>
                    ) : (
                        <input
                            key={hasJaTitle ? 'ja' : 'empty'}
                            className={hasJaTitle ? 'content-fade-in' : undefined}
                            type="text"
                            value={titleJa}
                            onChange={e => { setTitleJa(e.target.value); triggerSave(); }}
                            placeholder={titleJa ? '일본어 상품명을 수정하세요' : 'AI 번역 버튼을 눌러 자동 번역하거나 직접 입력하세요'}
                            style={inputBase}
                            onFocus={e => { e.target.style.borderColor = colors.primary; setTitleTooltip(null); }}
                            onBlur={e => (e.target.style.borderColor = colors.border.default)}
                        />
                    )}
                    {titleTooltip && hasJaTitle && (
                        <KoTooltip pos={titleTooltip} text={stripPrefix(product.titleKo)} />
                    )}
                    {!hasJaTitle && (
                        <p style={{ margin: `${spacing['1']} 0 0`, display: 'flex', alignItems: 'center', gap: '4px', fontSize: font.size.xs, color: colors.warningIcon }}>
                            <Info size={12} style={{ flexShrink: 0 }} />
                            일본어 상품명을 번역해 주세요. 우측 AI 번역 버튼을 누르면 자동으로 번역해 드려요.
                        </p>
                    )}
                </div>
            </div>

            <Divider />

            {/* ── 카테고리 ── */}
            <div>
                <div style={{ marginBottom: spacing['2'] }}>
                    <span style={sectionLabelStyle}>카테고리</span>
                </div>
                <div
                    onClick={() => setShowCategoryModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: `11px ${spacing['3']}`,
                        border: `1.5px solid ${colors.border.default}`,
                        borderRadius: radius.md,
                        fontSize: font.size.base, color: colors.text.primary,
                        background: colors.bg.surface,
                        cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = colors.primary)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = colors.border.default)}
                >
                    {toKoCategory(product.qoo10CategoryPath)}
                    <ChevronDown size={15} color={colors.text.muted} style={{ flexShrink: 0 }} />
                </div>
                <div style={{ marginTop: spacing['2'], display: 'flex', alignItems: 'center', gap: '4px', fontSize: font.size.xs, color: colors.text.muted }}>
                    <Sparkles size={11} />
                    AI가 쇼핑몰 카테고리를 분석해 자동 매칭했어요.
                </div>
            </div>

            <Divider />

            {/* ── 옵션 ── */}
            <div>
                <div style={{ ...flexBetween, marginBottom: spacing['3'] }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={sectionLabelStyle}>옵션</span>
                        {allOptionsDone
                            ? <CheckCircle2 size={14} color={colors.success} style={{ marginLeft: '4px' }} />
                            : <span style={{ fontSize: font.size.base, color: colors.warningIcon, fontWeight: 700, marginLeft: '4px', lineHeight: 1 }}>*</span>
                        }
                        <span style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: 500, marginLeft: spacing['2'] }}>
                            {options.length}개
                        </span>
                    </div>
                    {(() => {
                        return (
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
                                        background: colors.text.primary, color: '#fff',
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
                        );
                    })()}
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: '44px 1fr 90px 36px',
                    paddingBottom: spacing['2'],
                    gap: spacing['3'],
                }}>
                    {['사진', '옵션명', '재고', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: font.size.xs, fontWeight: 600, color: colors.text.muted }}>{h}</div>
                    ))}
                </div>

                {options.length === 0 ? (
                    <div style={{ padding: `${spacing['5']} 0`, fontSize: font.size.sm, color: colors.text.muted }}>
                        옵션이 없습니다
                    </div>
                ) : options.map((opt, idx) => (
                    <OptionRow
                        key={opt.id}
                        option={opt}
                        imageUrl={getOptionImage(idx)}
                        isTranslating={translatingOptionIds.has(opt.id)}
                        onChange={(field, value) => updateOption(opt.id, field, value)}
                        onDelete={() => deleteOption(opt.id)}
                    />
                ))}

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
            </div>

            <Divider />

            {/* ── 상세설명 ── */}
            <div>
                <div style={{ ...flexBetween, marginBottom: spacing['2'] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        <span style={sectionLabelStyle}>상세설명</span>
                        {isDescDone ? (
                            <CheckCircle2 size={14} color={colors.success} />
                        ) : (
                            <span style={{ fontSize: font.size.sm, color: colors.warningIcon, fontWeight: 700, lineHeight: 1 }}>*</span>
                        )}
                        {descMode === 'ko' && (
                            <span style={{ fontSize: font.size.xs, color: colors.text.muted, background: colors.bg.subtle, padding: '2px 7px', borderRadius: radius.full }}>
                                한국어 초안
                            </span>
                        )}
                        {descMode === 'ja' && descJa && (
                            <span style={{ fontSize: font.size.xs, color: colors.primary, background: colors.primaryLight, padding: '2px 7px', borderRadius: radius.full }}>
                                일본어
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        <AIButton loading={isWritingDesc} onClick={handleWriteDesc} label="AI 작성" loadingLabel="작성 중..." icon={<PenLine size={13} />} />
                        <div
                            style={{ position: 'relative' }}
                            onMouseEnter={() => { if (!descKo.trim() || !!descJa) setShowTranslateTooltip(true); }}
                            onMouseLeave={() => setShowTranslateTooltip(false)}
                        >
                            <AIButton loading={isTranslatingDesc} onClick={handleTranslateDesc} label="AI 번역" loadingLabel="번역 중..." disabled={!descKo.trim() || !!descJa} icon={<Languages size={13} />} />
                            {showTranslateTooltip && (!descKo.trim() || !!descJa) && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                                    background: colors.text.primary, color: '#fff',
                                    borderRadius: radius.md, padding: '6px 10px',
                                    fontSize: font.size.xs, fontWeight: 500,
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

                <div style={{ position: 'relative' }}>
                    {(isWritingDesc || isTranslatingDesc) ? (
                        <div style={{
                            ...inputBase,
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                            color: colors.primary, background: colors.primaryLight,
                            borderColor: colors.primary,
                            minHeight: '280px',
                        }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                            {isWritingDesc ? '한국어 초안 작성 중...' : '일본어로 번역 중...'}
                        </div>
                    ) : (
                        <>
                            <textarea
                                key={descMode === 'ja' && descJa ? 'ja-filled' : descMode === 'ko' && descKo ? 'ko-filled' : 'empty'}
                                className={(descMode === 'ja' && descJa) || (descMode === 'ko' && descKo) ? 'content-fade-in' : undefined}
                                value={descMode === 'ko' ? descKo : descJa}
                                onChange={e => {
                                    if (descMode === 'ko') {
                                        setDescKo(e.target.value);
                                    } else {
                                        if (e.target.value.length <= MAX_DESC) { setDescJa(e.target.value); triggerSave(); }
                                    }
                                }}
                                placeholder={
                                    descMode === 'ko' ? '수정 후 AI 번역 버튼을 눌러 일본어로 변환하세요' :
                                    product.translationStatus === 'completed' ? '일본어 상세설명을 수정하세요' :
                                    'AI 작성 버튼으로 한국어 초안을 만들거나 직접 입력하세요'
                                }
                                rows={10}
                                style={{
                                    ...inputBase,
                                    resize: 'vertical', lineHeight: font.lineHeight.relaxed, paddingBottom: '32px',
                                }}
                                onFocus={e => (e.target.style.borderColor = colors.primary)}
                                onBlur={e => (e.target.style.borderColor = colors.border.default)}
                            />
                            <div style={{
                                position: 'absolute', bottom: spacing['2'], right: spacing['3'],
                                fontSize: font.size.xs, color: descCountColor,
                                pointerEvents: 'none', transition: 'color 0.3s',
                            }}>
                                {descCount.toLocaleString()} / {MAX_DESC.toLocaleString()}
                            </div>
                        </>
                    )}
                </div>
                {(!descJa || descJaHasKorean) && !isWritingDesc && !isTranslatingDesc && (
                    <p style={{ margin: `${spacing['1']} 0 0`, display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: font.size.xs, color: colors.warningIcon }}>
                        <Info size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
                        일본어 상세설명을 작성해 주세요. 어렵다면 AI 작성 버튼을 활용해 보세요.
                    </p>
                )}
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
                <CategoryModal
                    current={product.qoo10CategoryPath}
                    onSelect={(jaPath) => updateProduct(product.id, {
                        qoo10CategoryPath: jaPath,
                        qoo10CategoryId: `cat-${jaPath.replace(/[^\w]/g, '-')}`,
                    })}
                    onClose={() => setShowCategoryModal(false)}
                />
            )}
        </div>
    );
};
