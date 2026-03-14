import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { colors, font, radius, spacing, shadow, zIndex } from '../../../design/tokens';
import { getProviderLogo, SOURCING_PROVIDERS } from '../../../types/sourcing';
import type { ProductDetail } from '../../../types/editing';
import { stripPrefix, isFullyTranslated } from '../../../utils/editing';

interface Props {
    product: ProductDetail;
    hasPrev: boolean;
    hasNext: boolean;
    currentIndex: number;
    totalCount: number;
    onBack: () => void;
    onPrev: () => void;
    onNext: () => void;
    onRegister: () => void;
}


export const EditingHeader: React.FC<Props> = ({
    product, hasPrev, hasNext, currentIndex, totalCount, onBack, onPrev, onNext, onRegister,
}) => {
    const [showRegTooltip, setShowRegTooltip] = useState(false);

    const isTranslated = isFullyTranslated(product);
    const providerUrl = product.sourceUrl || SOURCING_PROVIDERS.find(p => p.name === product.provider)?.url || 'https://www.coupang.com';

    return (
        <div style={{
            position: 'sticky',
            top: 0,
            zIndex: zIndex.sticky,
            background: colors.bg.surface,
            borderBottom: `1px solid ${colors.border.default}`,
            boxShadow: shadow.sm,
            padding: `${spacing['4']} 64px`,
        }}>
            <style>{`@keyframes tooltipFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing['4'] }}>

                {/* 목록으로 버튼 */}
                <button
                    onClick={onBack}
                    style={{
                        display: 'flex', alignItems: 'center', gap: spacing['1'],
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: font.size.sm, color: colors.text.tertiary,
                        padding: `${spacing['1']} ${spacing['2']}`,
                        borderRadius: radius.md,
                        whiteSpace: 'nowrap', flexShrink: 0,
                        transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = colors.text.primary)}
                    onMouseLeave={e => (e.currentTarget.style.color = colors.text.tertiary)}
                >
                    <ArrowLeft size={14} />
                    목록으로
                </button>

                {/* 세로 구분선 */}
                <div style={{ width: '1px', height: '32px', background: colors.border.default, flexShrink: 0 }} />

                {/* 썸네일 + 상품 정보 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], flex: 1, minWidth: 0 }}>
                    <img
                        src={product.thumbnailUrl}
                        alt=""
                        onError={e => { const t = e.currentTarget; t.style.background = '#F2F4F6'; t.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; }}
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: radius.md,
                            objectFit: 'cover', flexShrink: 0,
                            border: `1px solid ${colors.border.default}`,
                        }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], minWidth: 0 }}>
                        {/* 소싱처 아이콘 */}
                        <img
                            src={getProviderLogo(product.provider)}
                            alt={product.provider}
                            style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                        />
                        {/* 상품명 — 항상 한국어 원문, 클릭 시 소싱처 사이트 이동 */}
                        <a
                            href={providerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="product-title-link"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                minWidth: 0,
                                fontSize: font.size.base, fontWeight: 700,
                                color: colors.text.primary,
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = colors.primary; }}
                            onMouseLeave={e => { e.currentTarget.style.color = colors.text.primary; }}
                        >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                                {stripPrefix(product.titleKo)}
                            </span>
                            <ExternalLink size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
                        </a>
                    </div>
                </div>

                {/* 오른쪽 액션 영역 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], flexShrink: 0 }}>

                    {/* 이전 / 다음 */}
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        style={{
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: colors.bg.surface,
                            border: `1px solid ${colors.border.default}`,
                            borderRadius: radius.md,
                            cursor: hasPrev ? 'pointer' : 'default',
                            opacity: hasPrev ? 1 : 0.4,
                            transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { if (hasPrev) e.currentTarget.style.borderColor = colors.text.muted; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border.default; }}
                    >
                        <ChevronLeft size={16} color={colors.text.secondary} />
                    </button>

                    <span style={{
                        fontSize: font.size.sm,
                        color: colors.text.muted,
                        padding: `0 ${spacing['1']}`,
                        whiteSpace: 'nowrap',
                    }}>
                        {currentIndex + 1} / {totalCount}
                    </span>

                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        style={{
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: colors.bg.surface,
                            border: `1px solid ${colors.border.default}`,
                            borderRadius: radius.md,
                            cursor: hasNext ? 'pointer' : 'default',
                            opacity: hasNext ? 1 : 0.4,
                            transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { if (hasNext) e.currentTarget.style.borderColor = colors.text.muted; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border.default; }}
                    >
                        <ChevronRight size={16} color={colors.text.secondary} />
                    </button>

                    {/* 세로 구분선 */}
                    <div style={{ width: '1px', height: '28px', background: colors.border.default }} />

                    {/* Qoo10 등록 (툴팁 포함) */}
                    <div
                        style={{ position: 'relative' }}
                        onMouseEnter={() => !isTranslated && setShowRegTooltip(true)}
                        onMouseLeave={() => setShowRegTooltip(false)}
                    >
                        <button
                            onClick={isTranslated ? onRegister : undefined}
                            disabled={!isTranslated}
                            style={{
                                background: isTranslated ? colors.primary : colors.bg.subtle,
                                border: 'none',
                                borderRadius: radius.md,
                                padding: `${spacing['2']} ${spacing['4']}`,
                                fontSize: font.size.sm, fontWeight: 600,
                                color: isTranslated ? colors.bg.surface : colors.text.disabled,
                                cursor: isTranslated ? 'pointer' : 'not-allowed',
                                transition: 'background 0.2s',
                            }}
                        >
                            Qoo10에 등록하기
                        </button>

                        {showRegTooltip && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: 0,
                                background: colors.text.primary,
                                color: '#fff',
                                fontSize: font.size.xs,
                                padding: '6px 10px',
                                borderRadius: radius.md,
                                whiteSpace: 'nowrap',
                                zIndex: zIndex.dropdown,
                                pointerEvents: 'none',
                                boxShadow: shadow.md,
                                animation: 'tooltipFadeIn 0.15s ease',
                            }}>
                                편집을 먼저 완료해주세요
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%', right: '16px',
                                    border: '5px solid transparent',
                                    borderBottomColor: colors.text.primary,
                                }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};
