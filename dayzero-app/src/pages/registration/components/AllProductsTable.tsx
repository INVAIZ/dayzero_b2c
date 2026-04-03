import { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Check, Shield, AlertTriangle, PackageX, ShoppingBag, ChevronUp, ChevronDown } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import { ANIM } from '../../../design/animations';
import { getProviderLogo } from '../../../types/sourcing';
import { stripPrefix } from '../../../utils/editing';
import { handleImgError } from '../../../utils/image';
import type { RegistrationResult } from '../../../types/registration';
import { FloatingTooltip, type TooltipData } from '../../../components/common/FloatingTooltip';
import { calcMarginPercent } from '../../../utils/margin';
import { formatShortDate } from '../../../utils/formatDate';
import { EXCHANGE_RATE } from '../../../mock/categoryMap';

interface Props {
    results: RegistrationResult[];
    selectedIds?: string[];
    onToggleSelect?: (id: string) => void;
    onSelectAll?: (pageIds: string[]) => void;
    onRowClick?: (resultId: string) => void;
    showMonitoring?: boolean;
    onToggleMonitoring?: (resultId: string, enable: boolean) => void;
    emptyMessage?: string;
}

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



export const AllProductsTable: React.FC<Props> = ({
    results,
    selectedIds = [],
    onToggleSelect,
    onSelectAll,
    onRowClick,
    showMonitoring = false,
    onToggleMonitoring,
    emptyMessage = '등록된 상품이 없어요',
}) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [dateSortDir, setDateSortDir] = useState<'asc' | 'desc' | null>('desc');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;
    const hasSelection = !!onToggleSelect;

    const sortedResults = useMemo(() => {
        if (!dateSortDir) return results;
        return [...results].sort((a, b) => {
            const diff = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
            return dateSortDir === 'asc' ? diff : -diff;
        });
    }, [results, dateSortDir]);

    const totalPages = Math.max(1, Math.ceil(sortedResults.length / PAGE_SIZE));
    const pagedResults = sortedResults.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const allSelected = pagedResults.length > 0 && pagedResults.every(r => selectedIds.includes(r.id));

    // 결과가 바뀌면 첫 페이지로
    useEffect(() => { setPage(0); }, [results]);

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
                {hasSelection && <Checkbox checked={allSelected} onClick={() => onSelectAll?.(pagedResults.map(r => r.id))} />}
                <div style={{ width: '48px', flexShrink: 0, ...colHeader }}>이미지</div>
                <div style={{ width: '64px', flexShrink: 0, ...colHeader }}>상태</div>
                <div style={{ flex: 3, minWidth: 0, ...colHeader }}>
                    {hasSelection && selectedIds.length > 0 ? `${selectedIds.length}건 선택` : '상품명'}
                </div>
                <div style={{ width: '72px', flexShrink: 0, ...colHeader }}>판매가</div>
                <div style={{ width: '56px', flexShrink: 0, ...colHeader }}>마진율</div>
                {showMonitoring && (
                    <div style={{ width: '100px', flexShrink: 0, ...colHeader }}>가격·품절 확인</div>
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
                <div style={{ width: '70px', flexShrink: 0, ...colHeader, textAlign: 'center' }}>국내 쇼핑몰</div>
            </div>

            {/* 상품 목록 */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: spacing['2'],
                animation: 'listFadeIn 0.4s ease',
            }}>
                {pagedResults.map((r, i) => {
                    const isSelected = selectedIds.includes(r.id);
                    // 판매가 자동 조정이므로 마진율은 항상 원래 원가 기준
                    const margin = calcMarginPercent(r.product.originalPriceKrw, r.product.salePriceJpy);
                    const isTranslated = !!r.product.titleJa;
                    const displayTitle = r.product.titleJa
                        ? stripPrefix(r.product.titleJa)
                        : stripPrefix(r.product.titleKo);
                    const isMonitored = r.monitoring?.status === 'active';
                    const monitoringResult = r.monitoring?.lastCheckResult;
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
                                        일시 중지
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
                            <div
                                style={{ width: '72px', flexShrink: 0, cursor: 'default' }}
                                onMouseMove={(e) => {
                                    const krw = Math.round(r.product.salePriceJpy * EXCHANGE_RATE);
                                    setTooltip({
                                        x: e.clientX, y: e.clientY,
                                        content: (
                                            <div>
                                                <div style={{ fontSize: font.size.xs, color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
                                                    한화 환산 (¥1 = ₩{EXCHANGE_RATE})
                                                </div>
                                                <div style={{ fontSize: font.size.lg, fontWeight: 700 }}>
                                                    약 ₩{krw.toLocaleString()}
                                                </div>
                                            </div>
                                        ),
                                    });
                                }}
                                onMouseLeave={() => setTooltip(null)}
                            >
                                <span style={{
                                    fontSize: font.size.base, fontWeight: 700, color: colors.text.primary,
                                    textDecoration: 'underline', textDecorationStyle: 'dotted',
                                    textUnderlineOffset: '3px', textDecorationColor: colors.text.muted,
                                }}>
                                    ¥{r.product.salePriceJpy.toLocaleString()}
                                </span>
                            </div>

                            {/* 마진율 */}
                            {(() => {
                                const salePriceKrw = Math.round(r.product.salePriceJpy * EXCHANGE_RATE);
                                const profit = salePriceKrw - r.product.originalPriceKrw;
                                return (
                                    <div
                                        style={{
                                            width: '56px', flexShrink: 0,
                                            fontSize: font.size.base, fontWeight: 600,
                                            color: margin <= 5 ? colors.danger : colors.success,
                                            cursor: 'default',
                                        }}
                                        onMouseMove={(e) => {
                                            setTooltip({
                                                x: e.clientX, y: e.clientY,
                                                content: (
                                                    <div>
                                                        <div style={{ fontSize: font.size.xs, color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
                                                            1건 판매 시 예상 수익
                                                        </div>
                                                        <div style={{ fontSize: font.size.lg, fontWeight: 700, color: profit >= 0 ? colors.success : colors.danger }}>
                                                            {profit >= 0 ? '+' : ''}₩{profit.toLocaleString()}
                                                        </div>
                                                    </div>
                                                ),
                                            });
                                        }}
                                        onMouseLeave={() => setTooltip(null)}
                                    >
                                        {margin.toFixed(1)}%
                                    </div>
                                );
                            })()}

                            {/* 가격·품절 확인 토글 */}
                            {showMonitoring && (
                                <div
                                    style={{ width: '100px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {(() => {
                                        const isOos = isMonitored && monitoringResult === 'out_of_stock';
                                        const isError = isMonitored && monitoringResult === 'negative_margin'; // 소싱처 오류로 간주
                                        const oosOrange = '#FF9500';
                                        const toggleBg = !isMonitored
                                            ? colors.border.light
                                            : isError
                                                ? colors.danger
                                                : isOos
                                                    ? oosOrange
                                                    : colors.primary;
                                        const KnobIcon = isOos ? PackageX : isError ? AlertTriangle : Shield;
                                        const tooltipNode = isOos ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <PackageX size={14} color={oosOrange} />
                                                    <span style={{ fontWeight: 700, fontSize: font.size.sm }}>품절 감지 — 판매 자동 일시중지</span>
                                                </div>
                                                <div style={{ fontSize: font.size.xs, color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                                                    재입고되면 자동으로 판매를 재개해요.
                                                </div>
                                            </div>
                                        ) : isError ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <AlertTriangle size={14} color={colors.danger} />
                                                    <span style={{ fontWeight: 700, fontSize: font.size.sm }}>쇼핑몰 접근 불가</span>
                                                </div>
                                                <div style={{ fontSize: font.size.xs, color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                                                    상품 페이지가 삭제되었거나 접근할 수 없어요.<br />
                                                    쇼핑몰에서 상품 상태를 확인해주세요.
                                                </div>
                                            </div>
                                        ) : null;

                                        return (
                                            <button
                                                onClick={() => onToggleMonitoring?.(r.id, !isMonitored)}
                                                onMouseMove={tooltipNode ? (e) => setTooltip({
                                                    x: e.clientX, y: e.clientY,
                                                    content: tooltipNode,
                                                }) : undefined}
                                                onMouseLeave={tooltipNode ? () => setTooltip(null) : undefined}
                                                style={{
                                                    width: '48px', height: '26px',
                                                    borderRadius: radius.full,
                                                    border: 'none',
                                                    background: toggleBg,
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    transition: 'background 0.2s',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <div style={{
                                                    width: '20px', height: '20px',
                                                    borderRadius: '50%',
                                                    background: colors.bg.surface,
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                                    position: 'absolute',
                                                    top: '3px',
                                                    left: isMonitored ? '25px' : '3px',
                                                    transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <KnobIcon size={11} color={isMonitored ? toggleBg : colors.text.muted} />
                                                </div>
                                            </button>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* 등록일 */}
                            <div style={{ width: '64px', flexShrink: 0, fontSize: font.size.sm, color: colors.text.muted, whiteSpace: 'nowrap' }}>
                                {formatShortDate(r.registeredAt)}
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

                            {/* 국내 쇼핑몰 링크 */}
                            <div style={{ width: '70px', flexShrink: 0, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                {r.product.sourceUrl ? (
                                    <a
                                        href={r.product.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="국내 쇼핑몰에서 보기"
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

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: spacing['1'],
                    padding: `${spacing['5']} 0`,
                }}>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i)}
                            style={{
                                width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: page === i ? colors.primary : 'none',
                                color: page === i ? colors.bg.surface : colors.text.muted,
                                border: page === i ? 'none' : `1px solid ${colors.border.default}`,
                                borderRadius: radius.sm,
                                fontSize: font.size.sm,
                                fontWeight: page === i ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

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
