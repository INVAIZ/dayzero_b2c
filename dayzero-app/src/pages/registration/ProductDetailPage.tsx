import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ExternalLink, Shield, AlertTriangle, PackageX,
    TrendingDown, TrendingUp, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { colors, font, spacing, radius, shadow } from '../../design/tokens';
import { MainLayout } from '../../components/layout/MainLayout';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { getProviderLogo } from '../../types/sourcing';
import { stripPrefix } from '../../utils/editing';
import { handleImgError } from '../../utils/image';
import { useRegistrationStore } from '../../store/useRegistrationStore';
import type { RegistrationResult } from '../../types/registration';

export const ProductDetailPage: React.FC = () => {
    const { resultId } = useParams<{ resultId: string }>();
    const navigate = useNavigate();
    const { jobs, enableMonitoring, disableMonitoring } = useRegistrationStore();


    const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);
    const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);

    // 모든 성공 결과 통합 + 현재 상품 찾기
    const allResults = useMemo(
        () => jobs.flatMap(j => j.results.filter(r => r.status === 'success')),
        [jobs]
    );
    const currentIndex = allResults.findIndex(r => r.id === resultId);
    const result = currentIndex >= 0 ? allResults[currentIndex] : null;

    if (!result) {
        return (
            <MainLayout>
                <div style={{ textAlign: 'center', padding: spacing['12'], color: colors.text.muted }}>
                    <p style={{ fontSize: font.size.lg, marginBottom: spacing['4'] }}>상품을 찾을 수 없어요</p>
                    <button
                        onClick={() => navigate('/registration')}
                        style={{
                            padding: `${spacing['2']} ${spacing['4']}`,
                            background: colors.primary,
                            color: colors.bg.surface,
                            border: 'none',
                            borderRadius: radius.md,
                            fontSize: font.size.base,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        목록으로 돌아가기
                    </button>
                </div>
            </MainLayout>
        );
    }

    const { product, monitoring } = result;
    const isMonitored = monitoring?.status === 'active';
    const checkResult = monitoring?.lastCheckResult;
    const isNegativeMargin = checkResult === 'negative_margin';
    const isOutOfStock = checkResult === 'out_of_stock';
    const hasIssue = isNegativeMargin || isOutOfStock;

    const displayTitle = product.titleJa
        ? stripPrefix(product.titleJa)
        : stripPrefix(product.titleKo);

    // 마진 계산
    const currentSourcePrice = monitoring?.currentSourcePriceKrw ?? product.originalPriceKrw;
    const saleInKrw = product.salePriceJpy / 0.11;
    const currentMargin = saleInKrw > 0 ? ((saleInKrw - currentSourcePrice) / saleInKrw * 100) : 0;
    const originalMargin = saleInKrw > 0 ? ((saleInKrw - product.originalPriceKrw) / saleInKrw * 100) : 0;
    const priceChanged = currentSourcePrice !== product.originalPriceKrw;
    const priceDiff = currentSourcePrice - product.originalPriceKrw;

    // 이전/다음
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allResults.length - 1;

    const handleToggleMonitoring = () => {
        if (isMonitored) {
            setIsDisableModalOpen(true);
        } else {
            setIsEnableModalOpen(true);
        }
    };

    const handleEnable = () => {
        enableMonitoring([result.id]);
        setIsEnableModalOpen(false);
        // toast removed
    };

    const handleDisable = () => {
        disableMonitoring([result.id]);
        setIsDisableModalOpen(false);
        // toast removed
    };

    return (
        <MainLayout>
            <div style={{ maxWidth: '900px', animation: 'pageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                {/* 상단 네비게이션 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: spacing['6'],
                }}>
                    <button
                        onClick={() => navigate('/registration')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: spacing['2'],
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: font.size.base, fontWeight: 500, color: colors.text.tertiary,
                        }}
                    >
                        <ArrowLeft size={18} />
                        목록으로
                    </button>

                    <div style={{ display: 'flex', gap: spacing['2'] }}>
                        <NavButton
                            icon={<ChevronLeft size={16} />}
                            disabled={!hasPrev}
                            onClick={() => hasPrev && navigate(`/registration/${allResults[currentIndex - 1].id}`)}
                        />
                        <span style={{
                            fontSize: font.size.sm,
                            color: colors.text.muted,
                            display: 'flex',
                            alignItems: 'center',
                            padding: `0 ${spacing['2']}`,
                        }}>
                            {currentIndex + 1} / {allResults.length}
                        </span>
                        <NavButton
                            icon={<ChevronRight size={16} />}
                            disabled={!hasNext}
                            onClick={() => hasNext && navigate(`/registration/${allResults[currentIndex + 1].id}`)}
                        />
                    </div>
                </div>

                {/* 상단 헤더: 썸네일 + 상품명 + 상태 + 변동 확인 토글 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['5'],
                    padding: spacing['6'],
                    background: colors.bg.surface,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.xl,
                    marginBottom: spacing['5'],
                    boxShadow: shadow.sm,
                }}>
                    <img
                        src={product.thumbnailUrl}
                        alt=""
                        onError={handleImgError}
                        style={{
                            width: '72px', height: '72px',
                            borderRadius: radius.img,
                            objectFit: 'cover',
                            border: `1px solid ${colors.border.default}`,
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing['2'],
                            marginBottom: spacing['1'],
                        }}>
                            <img
                                src={getProviderLogo(product.provider)}
                                alt={product.provider}
                                style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                            <span style={{
                                fontSize: font.size.xs,
                                color: colors.text.muted,
                                fontWeight: 500,
                            }}>
                                {product.provider}
                            </span>
                            {hasIssue && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 8px',
                                    borderRadius: radius.full,
                                    fontSize: font.size.xs,
                                    fontWeight: 700,
                                    color: colors.danger,
                                    background: colors.dangerLight,
                                }}>
                                    <AlertTriangle size={11} />
                                    {isNegativeMargin ? '역마진' : '품절'}
                                </span>
                            )}
                        </div>
                        <div style={{
                            fontSize: font.size.lg,
                            fontWeight: 700,
                            color: colors.text.primary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: spacing['1'],
                        }}>
                            {displayTitle}
                        </div>
                        {product.titleJa && (
                            <div style={{
                                fontSize: font.size.sm,
                                color: colors.text.muted,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {stripPrefix(product.titleKo)}
                            </div>
                        )}
                    </div>

                    {/* 변동 확인 토글 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: spacing['1'],
                        flexShrink: 0,
                    }}>
                        <MonitoringToggle
                            checked={isMonitored}
                            onClick={handleToggleMonitoring}
                        />
                        <span style={{
                            fontSize: font.size.xs,
                            color: isMonitored ? colors.primary : colors.text.muted,
                            fontWeight: 500,
                        }}>
                            {isMonitored ? '변동 알림 ON' : '변동 알림'}
                        </span>
                    </div>
                </div>

                {/* 역마진/품절 경고 카드 */}
                {isMonitored && isNegativeMargin && (
                    <AlertCard
                        type="negative_margin"
                        description={monitoring?.issueDescription ?? ''}
                        sourceUrl={product.sourceUrl}
                        qoo10Url={result.qoo10ProductUrl}
                    />
                )}
                {isMonitored && isOutOfStock && (
                    <AlertCard
                        type="out_of_stock"
                        description={monitoring?.issueDescription ?? ''}
                        sourceUrl={product.sourceUrl}
                        qoo10Url={result.qoo10ProductUrl}
                    />
                )}

                {/* 가격·등록 정보 2컬럼 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: spacing['4'],
                    marginBottom: spacing['5'],
                }}>
                    {/* Qoo10 등록 정보 */}
                    <InfoCard title="Qoo10 JP 등록 정보">
                        <InfoRow label="판매가" value={`¥${product.salePriceJpy.toLocaleString()}`} highlight />
                        <InfoRow
                            label="마진율"
                            value={`${currentMargin.toFixed(1)}%`}
                            valueColor={currentMargin < 0 ? colors.danger : currentMargin < 10 ? colors.warningIcon : colors.success}
                        />
                        <InfoRow label="카테고리" value={product.qoo10CategoryPath} />
                        <InfoRow label="상품번호" value={result.qoo10ItemCode ?? '—'} mono />
                        <InfoRow label="등록일" value={formatFullDate(result.registeredAt)} />
                        {result.qoo10ProductUrl && (
                            <div style={{ marginTop: spacing['3'] }}>
                                <a
                                    href={result.qoo10ProductUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: font.size.sm,
                                        color: colors.primary,
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                    }}
                                >
                                    Qoo10에서 확인 <ExternalLink size={12} />
                                </a>
                            </div>
                        )}
                    </InfoCard>

                    {/* 원본 쇼핑몰 정보 */}
                    <InfoCard title="원본 쇼핑몰 정보">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing['2'],
                            marginBottom: spacing['3'],
                        }}>
                            <img
                                src={getProviderLogo(product.provider)}
                                alt={product.provider}
                                style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                            />
                            <span style={{
                                fontSize: font.size.base,
                                fontWeight: 600,
                                color: colors.text.primary,
                            }}>
                                {product.provider}
                            </span>
                        </div>
                        <InfoRow
                            label="최초 수집 원가"
                            value={`₩${product.originalPriceKrw.toLocaleString()}`}
                        />
                        {isMonitored && (
                            <InfoRow
                                label="최근 확인 원가"
                                value={`₩${currentSourcePrice.toLocaleString()}`}
                                suffix={priceChanged ? (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        fontSize: font.size.xs,
                                        fontWeight: 600,
                                        color: priceDiff > 0 ? colors.danger : colors.success,
                                        marginLeft: spacing['2'],
                                    }}>
                                        {priceDiff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {priceDiff > 0 ? '+' : ''}₩{priceDiff.toLocaleString()}
                                    </span>
                                ) : undefined}
                            />
                        )}
                        <InfoRow
                            label="최초 마진율"
                            value={`${originalMargin.toFixed(1)}%`}
                            valueColor={originalMargin < 10 ? colors.warningIcon : colors.text.primary}
                        />
                        <div style={{ marginTop: spacing['3'] }}>
                            <a
                                href={product.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: font.size.sm,
                                    color: colors.primary,
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                }}
                            >
                                쇼핑몰에서 확인 <ExternalLink size={12} />
                            </a>
                        </div>
                    </InfoCard>
                </div>

                {/* 가격 변동 이력 (모니터링 등록된 상품만) */}
                {isMonitored && monitoring?.priceHistory && monitoring.priceHistory.length > 0 && (
                    <PriceHistorySection
                        history={monitoring.priceHistory}
                    />
                )}

                {/* 변동 확인 미등록 안내 */}
                {!isMonitored && (
                    <div style={{
                        background: colors.bg.info,
                        border: `1px solid ${colors.primaryLightBorder}`,
                        borderRadius: radius.lg,
                        padding: spacing['5'],
                        textAlign: 'center',
                    }}>
                        <Shield size={24} color={colors.primary} style={{ marginBottom: spacing['2'] }} />
                        <div style={{
                            fontSize: font.size.base,
                            fontWeight: 600,
                            color: colors.text.primary,
                            marginBottom: spacing['1'],
                        }}>
                            변동 알림을 등록하면 매일 가격·재고 변동 이력을 확인할 수 있어요
                        </div>
                        <div style={{
                            fontSize: font.size.sm,
                            color: colors.text.tertiary,
                            marginBottom: spacing['4'],
                        }}>
                            쇼핑몰 가격이 올라 역마진이 생기거나, 품절되면 바로 알려드려요.
                        </div>
                        <button
                            onClick={() => setIsEnableModalOpen(true)}
                            style={{
                                padding: `${spacing['2']} ${spacing['5']}`,
                                background: colors.primary,
                                color: colors.bg.surface,
                                border: 'none',
                                borderRadius: radius.md,
                                fontSize: font.size.base,
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            변동 알림 받기
                        </button>
                    </div>
                )}
            </div>

            {/* 모달 */}
            <ConfirmModal
                isOpen={isEnableModalOpen}
                onClose={() => setIsEnableModalOpen(false)}
                onConfirm={handleEnable}
                title="이 상품에 변동 알림을 등록할까요?"
                description="매일 쇼핑몰의 가격과 재고를 자동으로 확인해서, 역마진이나 품절이 생기면 알려드려요."
                confirmText="변동 알림 받기"
                cancelText="취소"
                type="info"
            />
            <ConfirmModal
                isOpen={isDisableModalOpen}
                onClose={() => setIsDisableModalOpen(false)}
                onConfirm={handleDisable}
                title="변동 알림을 해제할까요?"
                description="해제하면 쇼핑몰 가격·재고 변동이 더 이상 확인되지 않아요."
                confirmText="변동 알림 해제"
                cancelText="취소"
            />

            <style>{`
                @keyframes pageIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </MainLayout>
    );
};

// ── 하위 컴포넌트 ─────────────────────────────────────────────────────────

const NavButton: React.FC<{
    icon: React.ReactNode;
    disabled: boolean;
    onClick: () => void;
}> = ({ icon, disabled, onClick }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: colors.bg.surface,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.md,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'border-color 0.15s',
        }}
    >
        {icon}
    </button>
);

const MonitoringToggle: React.FC<{
    checked: boolean;
    onClick: () => void;
}> = ({ checked, onClick }) => (
    <button
        onClick={onClick}
        style={{
            width: '48px', height: '28px',
            borderRadius: radius.full,
            border: 'none',
            background: checked ? colors.primary : colors.bg.subtle,
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
        }}
    >
        <div style={{
            width: '22px', height: '22px',
            borderRadius: '50%',
            background: colors.bg.surface,
            boxShadow: shadow.sm,
            position: 'absolute',
            top: '3px',
            left: checked ? '23px' : '3px',
            transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Shield size={12} color={checked ? colors.primary : colors.text.muted} />
        </div>
    </button>
);

const InfoCard: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => (
    <div style={{
        background: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.lg,
        padding: spacing['5'],
    }}>
        <div style={{
            fontSize: font.size.sm,
            fontWeight: 700,
            color: colors.text.tertiary,
            marginBottom: spacing['4'],
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
        }}>
            {title}
        </div>
        {children}
    </div>
);

const InfoRow: React.FC<{
    label: string;
    value: string;
    highlight?: boolean;
    mono?: boolean;
    valueColor?: string;
    suffix?: React.ReactNode;
}> = ({ label, value, highlight, mono, valueColor, suffix }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${spacing['2']} 0`,
        borderBottom: `1px solid ${colors.bg.subtle}`,
    }}>
        <span style={{
            fontSize: font.size.sm,
            color: colors.text.tertiary,
            fontWeight: 500,
        }}>
            {label}
        </span>
        <span style={{
            fontSize: highlight ? font.size.base : font.size.sm,
            fontWeight: highlight ? 700 : 600,
            color: valueColor ?? colors.text.primary,
            fontFamily: mono ? font.family.mono : undefined,
            display: 'flex',
            alignItems: 'center',
        }}>
            {value}
            {suffix}
        </span>
    </div>
);

const AlertCard: React.FC<{
    type: 'negative_margin' | 'out_of_stock';
    description: string;
    sourceUrl: string;
    qoo10Url?: string;
}> = ({ type, description, sourceUrl, qoo10Url }) => {
    const isMargin = type === 'negative_margin';

    return (
        <div style={{
            background: colors.dangerBg,
            border: `1px solid ${colors.dangerLight}`,
            borderRadius: radius.lg,
            padding: spacing['5'],
            marginBottom: spacing['5'],
            animation: 'summaryFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['2'],
                marginBottom: spacing['3'],
            }}>
                {isMargin
                    ? <AlertTriangle size={18} color={colors.danger} />
                    : <PackageX size={18} color={colors.text.primary} />
                }
                <span style={{
                    fontSize: font.size.base,
                    fontWeight: 700,
                    color: colors.text.primary,
                }}>
                    {isMargin ? '역마진이 발생했어요' : '쇼핑몰에서 품절됐어요'}
                </span>
            </div>
            <p style={{
                fontSize: font.size.sm,
                color: colors.text.secondary,
                lineHeight: font.lineHeight.normal,
                margin: 0,
                marginBottom: spacing['4'],
            }}>
                {description}
            </p>
            <div style={{ display: 'flex', gap: spacing['3'] }}>
                {qoo10Url && (
                    <a
                        href={qoo10Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: font.size.sm,
                            color: colors.primary,
                            fontWeight: 600,
                            textDecoration: 'none',
                        }}
                    >
                        Qoo10에서 확인 <ExternalLink size={12} />
                    </a>
                )}
                <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: font.size.sm,
                        color: colors.text.tertiary,
                        fontWeight: 500,
                        textDecoration: 'none',
                    }}
                >
                    쇼핑몰에서 확인 <ExternalLink size={12} />
                </a>
            </div>
        </div>
    );
};

/** 가격 변동 이력 섹션 — Google Analytics 스타일 인터랙티브 차트 */
const PriceHistorySection: React.FC<{
    history: NonNullable<RegistrationResult['monitoring']>['priceHistory'];
}> = ({ history }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!history) return;
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const svgX = (mouseX / rect.width) * 620;

        // padL = 52, padR = 20, plotW = 620 - 52 - 20 = 548
        const padL = 52;
        const plotW = 548;
        const ratio = (svgX - padL) / plotW;
        const idx = Math.round(ratio * (history.length - 1));
        if (idx >= 0 && idx < history.length) {
            setHoveredIndex(idx);
        }
    }, [history]);

    if (!history || history.length === 0) return null;

    const prices = history.map(h => h.sourcePriceKrw);
    const dataMin = Math.min(...prices);
    const dataMax = Math.max(...prices);

    // Y축 범위: 데이터 범위에 여유를 두고 깔끔한 숫자로 맞춤
    const rawRange = dataMax - dataMin || 1000;
    const step = (() => {
        const raw = rawRange / 4;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        return Math.ceil(raw / mag) * mag;
    })();
    const yMin = Math.floor(dataMin / step) * step;
    const yMax = yMin + step * 5;
    const yRange = yMax - yMin;

    // 차트 레이아웃
    const svgW = 620;
    const svgH = 200;
    const padL = 52;   // Y축 라벨 공간
    const padR = 20;
    const padTop = 16;
    const padBot = 28;  // X축 라벨 공간
    const plotW = svgW - padL - padR;
    const plotH = svgH - padTop - padBot;

    const toX = (i: number) => padL + (i / (history.length - 1)) * plotW;
    const toY = (price: number) => padTop + plotH - ((price - yMin) / yRange) * plotH;

    const points = history.map((h, i) => ({ x: toX(i), y: toY(h.sourcePriceKrw) }));

    // 직선 path
    const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaD = `${lineD} L${points[points.length - 1].x},${padTop + plotH} L${points[0].x},${padTop + plotH} Z`;

    // Y축 그리드 + 라벨 (5단계)
    const yTicks = Array.from({ length: 6 }, (_, i) => yMin + step * i).filter(v => v <= yMax);

    // X축 라벨 (4~5개 균등)
    const xLabelCount = Math.min(5, history.length);
    const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
        const idx = Math.round((i / (xLabelCount - 1)) * (history.length - 1));
        return { x: toX(idx), label: formatShortDate(history[idx].date) };
    });

    // 호버 데이터
    const hEntry = hoveredIndex !== null ? history[hoveredIndex] : null;
    const hPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

    // 호버 밴드 폭
    const bandW = plotW / history.length;

    // Y축 라벨 포맷
    const fmtY = (v: number) => {
        if (v >= 10000) return `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}만`;
        if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}천`;
        return v.toLocaleString();
    };

    return (
        <div style={{
            background: colors.bg.surface,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.lg,
            padding: spacing['5'],
            marginBottom: spacing['5'],
        }}>
            <div style={{
                fontSize: font.size.sm,
                fontWeight: 700,
                color: colors.text.tertiary,
                marginBottom: spacing['4'],
                letterSpacing: '0.3px',
            }}>
                가격 변동 이력 (최근 14일)
            </div>

            {/* 차트 */}
            <div style={{ position: 'relative', marginBottom: spacing['4'] }}>
                <svg
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <defs>
                        <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
                            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* 가로 그리드 + Y축 라벨 */}
                    {yTicks.map(v => {
                        const y = toY(v);
                        return (
                            <g key={v}>
                                <line
                                    x1={padL} y1={y} x2={svgW - padR} y2={y}
                                    stroke={colors.border.default}
                                    strokeWidth="0.7"
                                    strokeDasharray={v === yTicks[0] ? 'none' : '3 2'}
                                />
                                <text
                                    x={padL - 8} y={y + 3.5}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill={colors.text.muted}
                                    fontFamily={font.family.mono}
                                >
                                    {fmtY(v)}
                                </text>
                            </g>
                        );
                    })}

                    {/* 호버 밴드 (세로 하이라이트) */}
                    {hPoint && (
                        <rect
                            x={hPoint.x - bandW / 2}
                            y={padTop}
                            width={bandW}
                            height={plotH}
                            fill={colors.primary}
                            opacity="0.06"
                            rx="2"
                        />
                    )}

                    {/* 영역 채우기 */}
                    <path d={areaD} fill="url(#chartAreaGrad)" />

                    {/* 라인 */}
                    <path
                        d={lineD}
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* 호버 포인트 */}
                    {hPoint && hEntry && (
                        <>
                            <circle cx={hPoint.x} cy={hPoint.y} r="6"
                                fill={colors.bg.surface}
                                stroke={hEntry.marginPercent < 0 || hEntry.stockStatus === 'out_of_stock'
                                    ? colors.danger : colors.primary}
                                strokeWidth="2.5"
                            />
                        </>
                    )}

                    {/* X축 라벨 */}
                    {xLabels.map((l, i) => (
                        <text key={i}
                            x={l.x}
                            y={svgH - 6}
                            textAnchor="middle"
                            fontSize="10.5"
                            fill={colors.text.muted}
                        >
                            {l.label}
                        </text>
                    ))}
                </svg>

                {/* 플로팅 툴팁 (HTML — SVG 밖) */}
                {hPoint && hEntry && (
                    <div style={{
                        position: 'absolute',
                        left: `${(hPoint.x / svgW) * 100}%`,
                        top: `${(hPoint.y / svgH) * 100 - 14}%`,
                        transform: 'translate(-50%, -100%)',
                        background: colors.bg.surface,
                        border: `1px solid ${colors.border.default}`,
                        borderRadius: radius.md,
                        padding: `${spacing['2']} ${spacing['3']}`,
                        boxShadow: shadow.md,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        animation: 'tooltipPop 0.12s ease',
                        zIndex: 10,
                    }}>
                        <div style={{
                            fontSize: font.size.xs,
                            fontWeight: 600,
                            color: colors.text.secondary,
                            marginBottom: '2px',
                        }}>
                            {formatTooltipDate(hEntry.date)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing['2'] }}>
                            <span style={{
                                fontSize: font.size.base,
                                fontWeight: 700,
                                color: colors.primary,
                            }}>
                                ₩{hEntry.sourcePriceKrw.toLocaleString()}
                            </span>
                            <span style={{
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                color: hEntry.marginPercent < 0 ? colors.danger
                                    : hEntry.marginPercent < 10 ? colors.warningIcon
                                        : colors.success,
                            }}>
                                마진 {hEntry.marginPercent.toFixed(1)}%
                            </span>
                        </div>
                        {hEntry.stockStatus === 'out_of_stock' && (
                            <div style={{
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                color: colors.danger,
                                marginTop: '2px',
                            }}>
                                품절
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 타임라인 리스트 (최근 5일) */}
            <div>
                {history.slice(-5).reverse().map((entry, i) => {
                    const isIssue = entry.marginPercent < 0 || entry.stockStatus === 'out_of_stock';
                    const priceChangeFromBase = entry.sourcePriceKrw - history[0].sourcePriceKrw;
                    return (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing['3'],
                                padding: `${spacing['2']} 0`,
                                borderBottom: i < 4 ? `1px solid ${colors.bg.subtle}` : 'none',
                            }}
                        >
                            <div style={{
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                background: entry.stockStatus === 'out_of_stock'
                                    ? colors.text.primary
                                    : isIssue ? colors.danger : colors.success,
                                flexShrink: 0,
                            }} />
                            <span style={{
                                fontSize: font.size.sm,
                                color: colors.text.muted,
                                width: '56px',
                                flexShrink: 0,
                            }}>
                                {formatShortDate(entry.date)}
                            </span>
                            <span style={{
                                fontSize: font.size.sm,
                                fontWeight: 600,
                                color: colors.text.primary,
                                flex: 1,
                            }}>
                                ₩{entry.sourcePriceKrw.toLocaleString()}
                            </span>
                            {priceChangeFromBase !== 0 && (
                                <span style={{
                                    fontSize: font.size.xs,
                                    fontWeight: 600,
                                    color: priceChangeFromBase > 0 ? colors.danger : colors.success,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                }}>
                                    {priceChangeFromBase > 0 ? '+' : ''}₩{priceChangeFromBase.toLocaleString()}
                                </span>
                            )}
                            <span style={{
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                color: entry.marginPercent < 0 ? colors.danger
                                    : entry.marginPercent < 10 ? colors.warningIcon
                                        : colors.success,
                                width: '48px',
                                textAlign: 'right',
                                flexShrink: 0,
                            }}>
                                {entry.marginPercent.toFixed(1)}%
                            </span>
                            {entry.stockStatus === 'out_of_stock' && (
                                <span style={{
                                    fontSize: font.size.xs,
                                    fontWeight: 600,
                                    color: colors.text.primary,
                                    background: colors.bg.subtle,
                                    padding: '1px 6px',
                                    borderRadius: radius.xs,
                                }}>
                                    품절
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes tooltipPop {
                    from { opacity: 0; transform: translate(-50%, -100%) scale(0.95); }
                    to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
                }
            `}</style>
        </div>
    );
};

// ── 유틸 ──────────────────────────────────────────────────────────────────

function formatFullDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatShortDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatTooltipDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
