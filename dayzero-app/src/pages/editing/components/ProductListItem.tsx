import { useState } from 'react';
import { Loader2, Check, Globe, Info, AlertCircle } from 'lucide-react';
import { AIIcon } from '../../../components/common/AIIcon';
import type { ProductDetail } from '../../../types/editing';
import { getProviderLogo } from '../../../types/sourcing';
import { Checkbox } from '../../../components/common/Checkbox';
import { SOURCE_TAG_STYLES } from '../../../components/common/SourceTag';
import { toKoCategory, shortKoCategory, EXCHANGE_RATE } from '../../../mock/categoryMap';
import { colors, font, radius, shadow, spacing } from '../../../design/tokens';
import { stripPrefix, hasKorean } from '../../../utils/editing';
import { FloatingTooltip, type TooltipData } from '../../../components/common/FloatingTooltip';
import { formatShortDate } from '../../../utils/formatDate';

interface Props {
    product: ProductDetail;
    selected: boolean;
    onToggle: () => void;
    onClick: () => void;
    'data-job-id'?: string;
}


const SOURCE_TOOLTIPS: Record<string, string> = {
    ai: '상품 무게 정보가 없어 AI가 예측한 무게입니다.',
    crawled: '실제 상품 페이지에서 수집한 무게 정보입니다.',
    manual: '직접 입력한 무게입니다.',
};

const WeightSection: React.FC<{
    product: ProductDetail,
    onUpdateTooltip: (data: TooltipData | null) => void
}> = ({ product, onUpdateTooltip }) => {
    const hasWeight = product.weightKg > 0;
    const source = product.weightSource ?? (product.isWeightEstimated ? 'ai' : 'crawled');
    const tag = SOURCE_TAG_STYLES[source];

    const tooltipContent = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {tag && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: tag.bg, color: tag.color,
                    padding: '3px 5px', borderRadius: '4px', lineHeight: 1, flexShrink: 0,
                }}>{source === 'ai' ? <AIIcon size={10} color="#fff" /> : <Globe size={10} />}</div>
            )}
            <span>{SOURCE_TOOLTIPS[source] ?? ''}</span>
        </div>
    );

    return (
        <div
            style={{ width: '70px', flexShrink: 0, position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontSize: font.size.base,
                    fontWeight: 700,
                    color: hasWeight ? colors.text.primary : colors.danger,
                    cursor: 'default',
                    padding: '4px 0',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    textUnderlineOffset: '3px',
                    textDecorationColor: colors.text.muted,
                }}
                onMouseMove={(e) => onUpdateTooltip({
                    x: e.clientX, y: e.clientY,
                    content: tooltipContent
                })}
                onMouseLeave={() => onUpdateTooltip(null)}
            >
                {tag && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: tag.bg, color: tag.color,
                        padding: '2px 4px', borderRadius: '3px',
                        lineHeight: 1,
                    }}>{source === 'ai' ? <AIIcon size={9} color="#fff" /> : <Globe size={9} />}</div>
                )}

                {hasWeight ? (
                    <span>{product.weightKg}<span style={{ fontSize: font.size['2xs+'], marginLeft: '2px', opacity: 0.6, fontWeight: 500 }}>kg</span></span>
                ) : (
                    <span style={{ fontSize: font.size.xs, fontWeight: 600 }}>무게 설정 필요</span>
                )}
            </div>
        </div>
    );
};

export const ProductListItem: React.FC<Props> = ({
    product, selected, onToggle, onClick, 'data-job-id': jobId
}) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [imgError, setImgError] = useState(false);

    const isProcessing = product.translationStatus === 'processing' || !!product.isReTranslating;
    const isTranslated = !!product.titleJa;
    const titleDone = !!product.titleJa && !hasKorean(product.titleJa);
    const optionsDone = product.options.length === 0 || product.options.every(o => !!o.nameJa || !hasKorean(o.nameKo));
    const descDone = !!product.descriptionJa;
    const allDone = titleDone && optionsDone && descDone;
    const displayTitle = product.titleJa
        ? stripPrefix(product.titleJa)
        : stripPrefix(product.titleKo);

    // 한화 환산 계산
    const krwEquivalent = Math.round(product.salePriceJpy * EXCHANGE_RATE);

    const showTooltip = (e: React.MouseEvent, content: React.ReactNode) => {
        setTooltip({ x: e.clientX, y: e.clientY, content });
    };
    const hideTooltip = () => setTooltip(null);

    return (
        <div
            onClick={isProcessing ? undefined : onClick}
            data-job-id={jobId}
            style={{
                display: 'flex', alignItems: 'center', gap: spacing['5'],
                padding: `14px ${spacing['5']}`,
                background: isProcessing
                    ? colors.bg.info
                    : selected ? colors.primaryLight : colors.bg.surface,
                borderRadius: radius.lg,
                cursor: isProcessing ? 'default' : 'pointer',
                transition: 'background 0.15s',
                position: 'relative',
                borderBottom: `1px solid ${colors.border.default}`,
            }}
        >
            {isProcessing && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(200,220,255,0.35) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.8s infinite',
                    pointerEvents: 'none',
                    borderRadius: radius.lg,
                }} />
            )}

            {/* 번역 중에는 체크박스 비활성화 */}
            <div style={{ pointerEvents: isProcessing ? 'none' : 'auto', opacity: isProcessing ? 0.3 : 1 }}>
                <Checkbox checked={selected} onClick={() => onToggle()} />
            </div>

            {/* 썸네일 */}
            {imgError || !product.thumbnailUrl ? (
                <div style={{
                    width: '48px', height: '48px', flexShrink: 0,
                    borderRadius: radius.img,
                    background: colors.bg.subtle,
                    border: `1px solid ${colors.border.default}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                </div>
            ) : (
                <img
                    src={product.thumbnailUrl}
                    alt=""
                    onError={() => setImgError(true)}
                    style={{
                        width: '48px', height: '48px', flexShrink: 0,
                        borderRadius: radius.img, objectFit: 'cover',
                        border: `1px solid ${colors.border.default}`,
                    }}
                />
            )}

            {/* 상품명 + 상태 태그 */}
            <div style={{ flex: 3, minWidth: 0 }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}
                    onMouseMove={isTranslated ? (e) => showTooltip(e, (
                        <div>
                            <div style={{ fontSize: font.size.xs, color: 'rgba(255,255,255,0.55)', marginBottom: '4px', fontWeight: 500 }}>
                                한국어 원문
                            </div>
                            <div style={{ fontSize: font.size.md, fontWeight: 600, lineHeight: '1.4' }}>
                                {stripPrefix(product.titleKo)}
                            </div>
                        </div>
                    )) : undefined}
                    onMouseLeave={isTranslated ? hideTooltip : undefined}
                >
                    <img
                        src={getProviderLogo(product.provider)} alt={product.provider}
                        style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    {isProcessing ? (
                        <span style={{
                            fontSize: font.size.base, fontWeight: 600,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            background: `linear-gradient(90deg, ${colors.text.muted} 0%, ${colors.text.primary} 40%, ${colors.text.muted} 80%)`,
                            backgroundSize: '200% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            animation: 'shimmer 1.6s infinite',
                        }}>
                            {displayTitle}
                        </span>
                    ) : (
                        <span
                            key={product.translationStatus}
                            style={{
                                fontSize: font.size.base, fontWeight: 600, color: colors.text.primary,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                textDecoration: isTranslated ? 'underline' : 'none',
                                textDecorationStyle: 'dotted',
                                textUnderlineOffset: '3px',
                                textDecorationColor: colors.text.muted,
                                animation: product.translationStatus === 'completed' && isTranslated ? 'fadeInUp 0.5s ease' : 'none',
                            }}
                        >
                            {displayTitle}
                        </span>
                    )}
                    {isProcessing && (
                        <span style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '3px 8px', borderRadius: radius.xs,
                            fontSize: font.size.xs, fontWeight: 600,
                            background: colors.primaryLight, color: colors.primary,
                            whiteSpace: 'nowrap',
                        }}>
                            <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            AI 편집 중
                        </span>
                    )}
                    {product.translationStatus === 'failed' && (
                        <span style={{
                            flexShrink: 0, padding: '2px 7px', borderRadius: radius.xs,
                            fontSize: font.size.xs, fontWeight: 600,
                            background: colors.dangerLight, color: colors.danger,
                        }}>
                            번역 실패
                        </span>
                    )}
                </div>
                {/* 남은 할 일 칩 (미완료 항목만 표시) */}
                {!isProcessing && (() => {
                    if (allDone) {
                        return (
                            <div style={{ display: 'flex', marginTop: '5px', paddingLeft: '26px' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                                    padding: '2px 8px', borderRadius: radius.full,
                                    fontSize: font.size.xs, fontWeight: 600,
                                    background: colors.successLight, color: colors.success,
                                }}>
                                    <Check size={10} strokeWidth={3} />
                                    등록 준비 완료
                                </span>
                            </div>
                        );
                    }
                    const allItems = [
                        { label: '상품명 번역', done: titleDone },
                        { label: '옵션 번역', done: optionsDone },
                        { label: '상세설명 작성 및 번역', done: descDone },
                    ];
                    const tooltipContent = (
                        <div style={{ minWidth: '210px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: font.size.sm, fontWeight: 700, marginBottom: '10px' }}>
                                <Info size={13} style={{ flexShrink: 0 }} />
                                등록하기 전에 편집이 필요해요.
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {allItems.map(item => (
                                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                        <span style={{ fontSize: font.size.xs, fontWeight: 500, color: item.done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
                                            {item.label}
                                        </span>
                                        {item.done
                                            ? <Check size={12} strokeWidth={2.5} color={colors.success} style={{ flexShrink: 0 }} />
                                            : <AlertCircle size={12} strokeWidth={2} color={colors.warningIcon} style={{ flexShrink: 0 }} />
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                    return (
                        <div style={{ display: 'flex', marginTop: '5px', paddingLeft: '26px' }}>
                            <span
                                onMouseMove={(e) => showTooltip(e, tooltipContent)}
                                onMouseLeave={hideTooltip}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    padding: '2px 8px', borderRadius: radius.full,
                                    fontSize: font.size.xs, fontWeight: 500,
                                    background: colors.warningLight, color: colors.warningIcon,
                                    cursor: 'default',
                                    whiteSpace: 'nowrap',
                                }}>
                                <Info size={10} style={{ flexShrink: 0 }} />
                                {[
                                    !titleDone && '상품명',
                                    !optionsDone && '옵션',
                                    !descDone && '상세설명',
                                ].filter(Boolean).join(' / ')}
                            </span>
                        </div>
                    );
                })()}
            </div>

            {/* 카테고리 */}
            <div
                style={{ flex: 1.3, minWidth: 0 }}
                onMouseMove={(e) => showTooltip(e, (
                    <div>
                        <div style={{ fontSize: font.size.xs, color: 'rgba(255,255,255,0.55)', marginBottom: '4px', fontWeight: 500 }}>
                            원본 카테고리
                        </div>
                        <div style={{ fontSize: font.size.sm, fontWeight: 500, marginBottom: '8px' }}>
                            {product.sourceCategoryPath}
                        </div>
                        <div style={{ fontSize: font.size.xs, color: 'rgba(255,255,255,0.55)', marginBottom: '4px', fontWeight: 500 }}>
                            Qoo10 카테고리
                        </div>
                        <span style={{ fontSize: font.size.sm, fontWeight: 500 }}>
                            {toKoCategory(product.qoo10CategoryPath)}
                        </span>
                    </div>
                ))}
                onMouseLeave={hideTooltip}
            >
                <span style={{
                    fontSize: font.size.sm, color: colors.text.tertiary,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'block', cursor: 'default',
                }}>
                    {shortKoCategory(product.qoo10CategoryPath)}
                </span>
            </div>

            {/* 무게 (kg) */}
            <WeightSection product={product} onUpdateTooltip={setTooltip} />

            {/* 판매가 */}
            <div
                style={{ width: '90px', flexShrink: 0 }}
                onMouseMove={(e) => showTooltip(e, (
                    <div>
                        <div style={{ fontSize: font.size.xs, color: 'rgba(255,255,255,0.55)', marginBottom: '4px', fontWeight: 500 }}>
                            한화 환산 (¥1 = ₩{EXCHANGE_RATE})
                        </div>
                        <div style={{ fontSize: font.size.lg, fontWeight: 700 }}>
                            약 ₩{krwEquivalent.toLocaleString()}
                        </div>
                    </div>
                ))}
                onMouseLeave={hideTooltip}
            >
                <span style={{
                    fontSize: font.size.base, fontWeight: 700, color: colors.text.primary,
                    textDecoration: 'underline', textDecorationStyle: 'dotted',
                    textUnderlineOffset: '3px', textDecorationColor: colors.text.muted,
                    cursor: 'default',
                }}>
                    ¥{product.salePriceJpy.toLocaleString()}
                </span>
            </div>

            {/* 원가 */}
            <div style={{ width: '80px', flexShrink: 0, fontSize: font.size.sm, color: colors.text.tertiary }}>
                ₩{product.originalPriceKrw.toLocaleString()}
            </div>

            {/* 최근 수집일 */}
            <div style={{ width: '90px', flexShrink: 0, fontSize: font.size.sm, color: colors.text.tertiary }}>
                {formatShortDate(product.createdAt)}
            </div>

            {tooltip && <FloatingTooltip data={tooltip} />}
        </div>
    );
};
