import { useState, useRef, useEffect, useMemo } from 'react';
import { ExternalLink, Check, Shield, AlertTriangle, PackageX, TrendingDown, Minus, ShoppingBag, ChevronUp, ChevronDown } from 'lucide-react';
import { colors, font, spacing, radius, shadow, zIndex } from '../../../design/tokens';
import { ANIM } from '../../../design/animations';
import { getProviderLogo } from '../../../types/sourcing';
import { stripPrefix } from '../../../utils/editing';
import { handleImgError } from '../../../utils/image';
import type { RegistrationResult, MonitoringCheckResult } from '../../../types/registration';
import { calcMarginPercent } from '../../../utils/margin';

interface Props {
    results: RegistrationResult[];
    selectedIds?: string[];
    onToggleSelect?: (id: string) => void;
    onSelectAll?: () => void;
    onRowClick?: (resultId: string) => void;
    showMonitoring?: boolean;
    emptyMessage?: string;
}

// --- 툴팁 (편집 목록과 동일) ---
interface TooltipData { x: number; y: number; content: React.ReactNode; }

const FloatingTooltip: React.FC<{ data: TooltipData }> = ({ data }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ x: data.x, y: data.y });

    useEffect(() => {
        if (!ref.current) return;
        const { width, height } = ref.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let x = data.x;
        let y = data.y + 12;
        if (x + width > vw - 16) x = vw - width - 16;
        if (y + height > vh - 16) y = data.y - height - 12;
        setPos({ x, y });
    }, [data.x, data.y]);

    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                left: pos.x,
                top: pos.y,
                zIndex: zIndex.toast,
                background: colors.text.primary,
                color: '#fff',
                borderRadius: radius.lg,
                padding: `${spacing['3']} ${spacing['4']}`,
                boxShadow: shadow.lg,
                pointerEvents: 'none',
                maxWidth: '400px',
                width: 'max-content',
                fontSize: font.size.base,
                wordBreak: 'keep-all',
                lineHeight: font.lineHeight.normal,
                animation: 'tooltipFadeIn 0.12s ease',
            }}
        >
            {data.content}
        </div>
    );
};

const Checkbox = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
    <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
            width: '20px', height: '20px',
            borderRadius: radius.sm,
            border: checked ? 'none' : `2px solid ${colors.border.light}`,
            background: checked ? colors.primary : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
        }}
    >
        {checked && <Check size={14} color={colors.bg.surface} strokeWidth={2.5} />}
    </div>
);

function calcMargin(product: { originalPriceKrw: number; salePriceJpy: number }): number {
    return calcMarginPercent(product.originalPriceKrw, product.salePriceJpy);
}

/** yy.mm.dd 형식 등록일 */
function formatShortRegisteredDate(iso: string): string {
    const d = new Date(iso);
    const yy = String(d.getFullYear()).slice(2);
    return `${yy}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const MONITORING_LABELS: Record<MonitoringCheckResult, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    normal: { label: '정상', color: colors.success, bg: colors.successLight, icon: <Shield size={12} /> },
    price_changed: { label: '가격 변동', color: colors.warningIcon, bg: colors.warningLight, icon: <TrendingDown size={12} /> },
    negative_margin: { label: '역마진', color: colors.danger, bg: colors.dangerLight, icon: <AlertTriangle size={12} /> },
    out_of_stock: { label: '품절', color: colors.danger, bg: colors.dangerLight, icon: <PackageX size={12} /> },
};

export const AllProductsTable: React.FC<Props> = ({
    results,
    selectedIds = [],
    onToggleSelect,
    onSelectAll,
    onRowClick,
    showMonitoring = false,
    emptyMessage = '등록된 상품이 없어요',
}) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [dateSortDir, setDateSortDir] = useState<'asc' | 'desc' | null>(null);
    const hasSelection = !!onToggleSelect;
    const allSelected = results.length > 0 && selectedIds.length === results.length;

    const sortedResults = useMemo(() => {
        if (!dateSortDir) return results;
        return [...results].sort((a, b) => {
            const diff = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
            return dateSortDir === 'asc' ? diff : -diff;
        });
    }, [results, dateSortDir]);

    const toggleDateSort = () => {
        setDateSortDir(prev => prev === null ? 'desc' : prev === 'desc' ? 'asc' : null);
    };

    if (results.length === 0) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: `${spacing['12']} 0`, gap: spacing['3'],
            }}>
                <div style={{
                    width: '52px', height: '52px',
                    borderRadius: radius.xl,
                    background: colors.bg.subtle,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <ShoppingBag size={24} color={colors.text.muted} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: font.size.base, fontWeight: 600, color: colors.text.secondary, marginBottom: spacing['1'] }}>
                        {emptyMessage}
                    </div>
                    <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                        수집 목록에서 상품을 편집하고 Qoo10에 등록해 보세요.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* 컬럼 헤더 */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: spacing['3'],
                padding: `0 ${spacing['5']}`, marginBottom: spacing['2'],
            }}>
                {hasSelection && <Checkbox checked={allSelected} onClick={() => onSelectAll?.()} />}
                <div style={{ width: '48px', flexShrink: 0, ...colHeader }}>이미지</div>
                <div style={{ width: '64px', flexShrink: 0, ...colHeader }}>상태</div>
                <div style={{ flex: 3, minWidth: 0, ...colHeader }}>
                    {hasSelection && selectedIds.length > 0 ? `${selectedIds.length}건 선택` : '상품명'}
                </div>
                <div style={{ width: '72px', flexShrink: 0, ...colHeader }}>판매가</div>
                <div style={{ width: '56px', flexShrink: 0, ...colHeader }}>마진율</div>
                {showMonitoring && (
                    <div style={{ width: '100px', flexShrink: 0, ...colHeader }}>가격·재고 확인</div>
                )}
                <div
                    onClick={toggleDateSort}
                    style={{
                        width: '64px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: '3px',
                        fontSize: font.size.xs, fontWeight: 600,
                        color: colors.text.muted,
                        cursor: 'pointer', userSelect: 'none',
                    }}
                >
                    등록일
                    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                        <ChevronUp size={10} style={{ opacity: dateSortDir === 'asc' ? 1 : 0.25 }} />
                        <ChevronDown size={10} style={{ opacity: dateSortDir === 'desc' ? 1 : 0.25 }} />
                    </span>
                </div>
                <div style={{ width: '36px', flexShrink: 0, ...colHeader, textAlign: 'center' }}>판매처</div>
                <div style={{ width: '36px', flexShrink: 0, ...colHeader, textAlign: 'center' }}>수집처</div>
            </div>

            {/* 상품 목록 */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: spacing['2'], paddingBottom: '100px',
                animation: 'listFadeIn 0.4s ease',
            }}>
                {sortedResults.map((r, i) => {
                    const isSelected = selectedIds.includes(r.id);
                    const actualCost = r.monitoring?.currentSourcePriceKrw ?? r.product.originalPriceKrw;
                    const margin = calcMargin({ originalPriceKrw: actualCost, salePriceJpy: r.product.salePriceJpy });
                    const isTranslated = !!r.product.titleJa;
                    const displayTitle = r.product.titleJa
                        ? stripPrefix(r.product.titleJa)
                        : stripPrefix(r.product.titleKo);
                    const isMonitored = r.monitoring?.status === 'active';
                    const rawMonitoringResult = r.monitoring?.lastCheckResult;
                    // 역마진은 실제 마진 기준으로 판단
                    const monitoringResult = (rawMonitoringResult === 'negative_margin' && margin > 5)
                        ? 'normal' as const
                        : rawMonitoringResult;
                    const isIssueRow = isMonitored && (monitoringResult === 'negative_margin' || monitoringResult === 'out_of_stock') && r.salesStatus !== 'paused';

                    return (
                        <div
                            key={r.id}
                            onClick={() => onRowClick?.(r.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: spacing['3'],
                                padding: `14px ${spacing['5']}`,
                                background: isSelected
                                    ? colors.primaryLight
                                    : isIssueRow ? colors.dangerBg : colors.bg.surface,
                                borderRadius: radius.lg,
                                borderBottom: `1px solid ${colors.border.default}`,
                                cursor: 'pointer',
                                transition: 'background 0.15s, box-shadow 0.15s',
                                animation: `rowSlideIn 0.3s ease ${Math.min(i * 0.04, 0.4)}s both`,
                            }}
                            onMouseEnter={e => {
                                if (!isSelected) e.currentTarget.style.background = isIssueRow ? '#FDE8EA' : colors.bg.faint;
                            }}
                            onMouseLeave={e => {
                                if (!isSelected) e.currentTarget.style.background = isIssueRow ? colors.dangerBg : colors.bg.surface;
                            }}
                        >
                            {/* 체크박스 */}
                            {hasSelection && (
                                <Checkbox
                                    checked={isSelected}
                                    onClick={() => onToggleSelect?.(r.id)}
                                />
                            )}

                            {/* 썸네일 */}
                            <img
                                src={r.product.thumbnailUrl}
                                alt=""
                                onError={handleImgError}
                                style={{
                                    width: '48px', height: '48px', flexShrink: 0,
                                    borderRadius: radius.img ?? radius.md,
                                    objectFit: 'cover',
                                    border: `1px solid ${colors.border.default}`,
                                }}
                            />

                            {/* 상태 */}
                            <div style={{ width: '64px', flexShrink: 0 }}>
                                {r.salesStatus === 'paused' ? (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: font.size.xs,
                                        fontWeight: 600,
                                        color: colors.warningIcon,
                                        background: colors.warningLight,
                                        padding: '3px 8px',
                                        borderRadius: radius.full,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.warningIcon, flexShrink: 0 }} />
                                        {r.pauseReason === 'auto' ? '자동 중지' : '일시 중지'}
                                    </span>
                                ) : (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: font.size.xs,
                                        fontWeight: 600,
                                        color: colors.primary,
                                        background: colors.primaryLight,
                                        padding: '3px 8px',
                                        borderRadius: radius.full,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.primary, flexShrink: 0 }} />
                                        판매 중
                                    </span>
                                )}
                            </div>

                            {/* 상품명 (소싱 로고 + 이름 + 호버 툴팁) */}
                            <div
                                style={{ flex: 3, minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing['2'] }}
                                onMouseMove={isTranslated ? (e) => setTooltip({
                                    x: e.clientX, y: e.clientY,
                                    content: (
                                        <div>
                                            <div style={{ fontSize: font.size.xs, color: 'rgba(255,255,255,0.55)', marginBottom: '4px', fontWeight: 500 }}>
                                                한국어 원문
                                            </div>
                                            <div style={{ fontSize: font.size.md, fontWeight: 600, lineHeight: '1.4' }}>
                                                {stripPrefix(r.product.titleKo)}
                                            </div>
                                        </div>
                                    ),
                                }) : undefined}
                                onMouseLeave={isTranslated ? () => setTooltip(null) : undefined}
                            >
                                <img
                                    src={getProviderLogo(r.product.provider)}
                                    alt={r.product.provider}
                                    style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                                />
                                <span style={{
                                    fontSize: font.size.base,
                                    fontWeight: 600,
                                    color: colors.text.primary,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    textDecoration: isTranslated ? 'underline' : 'none',
                                    textDecorationStyle: 'dotted',
                                    textUnderlineOffset: '3px',
                                    textDecorationColor: colors.text.muted,
                                    cursor: isTranslated ? 'default' : undefined,
                                }}>
                                    {displayTitle}
                                </span>
                            </div>

                            {/* 판매가 */}
                            <div style={{ width: '72px', flexShrink: 0 }}>
                                <span style={{
                                    fontSize: font.size.base, fontWeight: 700, color: colors.text.primary,
                                }}>
                                    ¥{r.product.salePriceJpy.toLocaleString()}
                                </span>
                            </div>

                            {/* 마진율 */}
                            <div style={{
                                width: '56px', flexShrink: 0,
                                fontSize: font.size.base, fontWeight: 600,
                                color: margin <= 5 ? colors.danger : colors.success,
                            }}>
                                {margin.toFixed(1)}%
                            </div>

                            {/* 가격·재고 확인 상태 */}
                            {showMonitoring && (
                                <div style={{ width: '100px', flexShrink: 0 }}>
                                    {isMonitored && monitoringResult ? (
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '3px 10px',
                                            borderRadius: radius.full,
                                            fontSize: font.size.xs,
                                            fontWeight: 600,
                                            color: MONITORING_LABELS[monitoringResult].color,
                                            background: MONITORING_LABELS[monitoringResult].bg,
                                        }}>
                                            {MONITORING_LABELS[monitoringResult].icon}
                                            {MONITORING_LABELS[monitoringResult].label}
                                        </span>
                                    ) : (
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: font.size.xs,
                                            fontWeight: 500,
                                            color: colors.text.muted,
                                        }}>
                                            <Minus size={12} />
                                            미등록
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* 등록일 */}
                            <div style={{ width: '64px', flexShrink: 0, fontSize: font.size.xs, color: colors.text.muted, whiteSpace: 'nowrap' }}>
                                {formatShortRegisteredDate(r.registeredAt)}
                            </div>

                            {/* 판매처 링크 */}
                            <div style={{ width: '36px', flexShrink: 0, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                {r.qoo10ProductUrl ? (
                                    <a
                                        href={r.qoo10ProductUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Qoo10에서 보기"
                                        style={{ color: colors.primary, display: 'inline-flex', alignItems: 'center' }}
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                ) : (
                                    <span style={{ color: colors.text.disabled }}>—</span>
                                )}
                            </div>

                            {/* 수집처 링크 */}
                            <div style={{ width: '36px', flexShrink: 0, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                {r.product.sourceUrl ? (
                                    <a
                                        href={r.product.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="수집처에서 보기"
                                        style={{ color: colors.primary, display: 'inline-flex', alignItems: 'center' }}
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                ) : (
                                    <span style={{ color: colors.text.disabled }}>—</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 플로팅 툴팁 */}
            {tooltip && <FloatingTooltip data={tooltip} />}

            <style>{ANIM.listFadeIn + ANIM.rowSlideIn + ANIM.tooltipFadeIn}</style>
        </>
    );
};

const colHeader: React.CSSProperties = {
    fontSize: font.size.xs,
    fontWeight: 600,
    color: colors.text.muted,
    whiteSpace: 'nowrap',
};
