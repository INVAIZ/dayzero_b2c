import { useMemo, useState } from 'react';
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
import { formatFullDate } from '../../utils/formatDate';
import { useRegistrationStore } from '../../store/useRegistrationStore';
import { PriceHistorySection } from './components/PriceHistorySection';

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

