import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ExternalLink, Shield, AlertTriangle, PackageX, AlertCircle,
    TrendingDown, TrendingUp, ChevronLeft, ChevronRight, PenLine, Trash2,
    PackageCheck, PauseCircle, Play,
} from 'lucide-react';
import { colors, font, spacing, radius, shadow } from '../../design/tokens';
import { ANIM } from '../../design/animations';
import { MainLayout } from '../../components/layout/MainLayout';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { getProviderLogo } from '../../types/sourcing';
import { stripPrefix } from '../../utils/editing';
import { handleImgError } from '../../utils/image';
import { formatFullDate } from '../../utils/formatDate';
import { calcMarginPercent } from '../../utils/margin';
import { useRegistrationStore } from '../../store/useRegistrationStore';
import { PriceHistorySection } from './components/PriceHistorySection';
import { NavButton, MonitoringToggle, InfoCard, InfoRow, AlertCard, StatusHelper } from './components/ProductDetailWidgets';
import { MonitoringEnableDescription, MonitoringDisableDescription } from './components/MonitoringModalDescriptions';
import type { MonitoringActivityLog } from '../../types/registration';

export const ProductDetailPage: React.FC = () => {
    const { resultId } = useParams<{ resultId: string }>();
    const navigate = useNavigate();
    const { jobs, enableMonitoring, disableMonitoring, pauseSales, resumeSales, deleteResults } = useRegistrationStore();

    const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);
    const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);


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
    const isOutOfStock = checkResult === 'out_of_stock';

    const displayTitle = product.titleJa
        ? stripPrefix(product.titleJa)
        : stripPrefix(product.titleKo);

    // 마진 계산
    const currentSourcePrice = monitoring?.currentSourcePriceKrw ?? product.originalPriceKrw;
    const currentMargin = calcMarginPercent(currentSourcePrice, product.salePriceJpy);
    const originalMargin = calcMarginPercent(product.originalPriceKrw, product.salePriceJpy);
    const priceChanged = currentSourcePrice !== product.originalPriceKrw;
    const priceDiff = currentSourcePrice - product.originalPriceKrw;

    // 역마진 판단: 실제 마진 기준 (모니터링 상태 + 현재 마진 5% 이하)
    const isNegativeMargin = checkResult === 'negative_margin' && currentMargin <= 5;
    const hasIssue = isNegativeMargin || isOutOfStock;

    const isPaused = result.salesStatus === 'paused';

    // 이전/다음
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allResults.length - 1;

    const handleDelete = () => {
        const job = jobs.find(j => j.results.some(r => r.id === result.id));
        if (job) {
            deleteResults(job.id, [result.id]);
        }
        setIsDeleteModalOpen(false);
        navigate('/registration');
    };

    const handlePause = () => {
        pauseSales([result.id], 'manual');
        setIsPauseModalOpen(false);
    };

    const handleResume = () => {
        resumeSales([result.id]);
        setIsResumeModalOpen(false);
    };

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

                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
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
                        <div style={{ width: '1px', height: '20px', background: colors.border.default, margin: `0 ${spacing['1']}` }} />
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            title="상품 삭제"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '32px', height: '32px',
                                background: 'none', border: 'none',
                                borderRadius: radius.md,
                                cursor: 'pointer',
                                color: colors.text.muted,
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = colors.danger}
                            onMouseLeave={e => e.currentTarget.style.color = colors.text.muted}
                        >
                            <Trash2 size={16} />
                        </button>
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

                    {/* 판매 상태 세그먼트 */}
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        background: colors.bg.subtle,
                        borderRadius: radius.full,
                        padding: '3px',
                        flexShrink: 0,
                    }}>
                        {/* 슬라이딩 배경 */}
                        <div style={{
                            position: 'absolute',
                            top: '3px',
                            left: isPaused ? '50%' : '3px',
                            width: 'calc(50% - 3px)',
                            height: 'calc(100% - 6px)',
                            borderRadius: radius.full,
                            background: colors.bg.surface,
                            boxShadow: shadow.sm,
                            transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        }} />
                        <button
                            onClick={() => { if (isPaused) setIsResumeModalOpen(true); }}
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: `${spacing['1']} ${spacing['3']}`,
                                borderRadius: radius.full,
                                border: 'none',
                                background: 'transparent',
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                cursor: isPaused ? 'pointer' : 'default',
                                color: !isPaused ? colors.primary : colors.text.muted,
                                transition: 'color 0.25s',
                            }}
                        >
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: !isPaused ? colors.primary : 'transparent',
                                transition: 'background 0.25s',
                            }} />
                            판매 중
                        </button>
                        <button
                            onClick={() => { if (!isPaused) setIsPauseModalOpen(true); }}
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: `${spacing['1']} ${spacing['3']}`,
                                borderRadius: radius.full,
                                border: 'none',
                                background: 'transparent',
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                cursor: !isPaused ? 'pointer' : 'default',
                                color: isPaused ? colors.warningIcon : colors.text.muted,
                                transition: 'color 0.25s',
                            }}
                        >
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: isPaused ? colors.warningIcon : 'transparent',
                                transition: 'background 0.25s',
                            }} />
                            일시중지
                        </button>
                    </div>
                </div>

                {/* 가격·등록 정보 2컬럼 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: spacing['4'],
                    marginBottom: spacing['5'],
                }}>
                    {/* Qoo10 등록 정보 */}
                    <InfoCard
                        title={
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacing['2'] }}>
                                Qoo10 JP 등록 정보
                                {result.qoo10ProductUrl && (
                                    <a
                                        href={result.qoo10ProductUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Qoo10에서 확인"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            color: colors.text.muted,
                                            transition: 'color 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = colors.primary; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = colors.text.muted; }}
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </span>
                        }
                        headerRight={
                            <button
                                onClick={() => navigate(`/registration/${resultId}/edit`)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    padding: 0,
                                    background: 'none',
                                    border: 'none',
                                    fontSize: font.size.xs, fontWeight: 600,
                                    color: colors.text.muted,
                                    cursor: 'pointer',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = colors.primary; }}
                                onMouseLeave={e => { e.currentTarget.style.color = colors.text.muted; }}
                            >
                                <PenLine size={11} />
                                수정하기
                            </button>
                        }
                    >
                        <InfoRow label="판매가" value={`¥${product.salePriceJpy.toLocaleString()}`} highlight />
                        <InfoRow
                            label="마진율"
                            value={`${currentMargin.toFixed(1)}%`}
                            valueColor={currentMargin < 0 ? colors.danger : currentMargin < 10 ? colors.warningIcon : colors.success}
                            highlight
                        />
                        <InfoRow
                            label="카테고리"
                            value={product.qoo10CategoryPath}
                        />
                        <InfoRow label="상품번호" value={result.qoo10ItemCode ?? '—'} mono />
                        <InfoRow label="등록일" value={formatFullDate(result.registeredAt)} />
                    </InfoCard>

                    {/* 국내 쇼핑몰 정보 */}
                    <InfoCard
                        title={
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacing['2'] }}>
                                국내 쇼핑몰 정보
                                <a
                                    href={product.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="쇼핑몰에서 확인"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        color: colors.text.muted,
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = colors.primary; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = colors.text.muted; }}
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </span>
                        }
                    >
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
                            highlight
                        />
                        {isMonitored && (
                            <InfoRow
                                label="최근 확인 원가"
                                value={`₩${currentSourcePrice.toLocaleString()}`}
                                highlight
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
                            highlight
                        />
                    </InfoCard>
                </div>

                {/* 가격 변동 이력 + 모니터링 토글 통합 섹션 */}
                {/* 가격·품절 확인 — 토글 + 상태 안내 + 활동 기록 */}
                <div style={{
                    background: colors.bg.surface,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.lg,
                    padding: spacing['5'],
                    marginBottom: spacing['5'],
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* 헤더: 제목 + 토글 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: spacing['3'],
                    }}>
                        <span style={{
                            fontSize: font.size.base,
                            fontWeight: 700,
                            color: colors.text.primary,
                        }}>
                            가격·품절 확인
                        </span>
                        <MonitoringToggle
                            checked={isMonitored}
                            hasIssue={isMonitored && hasIssue}
                            onClick={handleToggleMonitoring}
                        />
                    </div>

                    {/* ON 상태: 콜아웃 */}
                    {isMonitored && (
                        isOutOfStock && !isPaused ? (
                            <AlertCard
                                type="out_of_stock"
                                description={monitoring?.issueDescription ?? ''}
                                isPaused={isPaused}
                                isMonitored={isMonitored}
                                onPause={() => setIsPauseModalOpen(true)}
                            />
                        ) : isPaused ? (
                            <StatusHelper
                                type={isOutOfStock ? 'warning' : 'paused'}
                                title={isOutOfStock ? '재입고를 기다리고 있어요' : '판매 일시중지 중'}
                                description={
                                    <div>
                                        <div>{isOutOfStock
                                            ? '현재 쇼핑몰에서 품절된 상태예요. 매일 쇼핑몰을 확인하고 있고, 재입고되면 자동으로 판매를 재개해드릴게요.'
                                            : '현재 판매가 일시중지된 상태예요. 가격·품절 변동은 계속 확인하고 있으니, 판매를 재개하고 싶을 때 언제든 다시 시작하실 수 있어요.'
                                        }</div>
                                        {monitoring?.lastCheckAt && (
                                            <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: spacing['2'] }}>
                                                마지막 확인: {formatFullDate(monitoring.lastCheckAt)}
                                            </div>
                                        )}
                                    </div>
                                }
                            />
                        ) : (
                            <StatusHelper
                                type="watching"
                                title="매일 가격·품절을 확인하고 있어요"
                                description={
                                    <div>
                                        <div>품절되면 자동으로 판매를 일시중지하고, 원가가 변동되면 판매가를 자동으로 조정해드릴게요.</div>
                                        {monitoring?.lastCheckAt && (
                                            <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: spacing['2'] }}>
                                                마지막 확인: {formatFullDate(monitoring.lastCheckAt)}
                                            </div>
                                        )}
                                    </div>
                                }
                            />
                        )
                    )}

                    {/* OFF 상태 안내 */}
                    {!isMonitored && (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                        }}>
                            <Shield size={24} color={colors.text.muted} style={{ marginBottom: spacing['2'] }} />
                            <div style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.text.secondary, marginBottom: spacing['1'] }}>
                                가격·품절 확인이 꺼져 있어요
                            </div>
                            <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>
                                토글을 켜면 매일 가격과 재고를 확인하고, 변동 시 자동으로 처리해요.
                            </div>
                        </div>
                    )}

                    {/* ON 상태: 활동 기록 (페이지네이션) */}
                    {isMonitored && monitoring?.activityLog && (
                        <div style={{ flex: 1 }}>
                            <ActivityLog logs={monitoring.activityLog} />
                        </div>
                    )}
                </div>

                {/* 가격 변동 이력 차트 (ON일 때만) */}
                {isMonitored && monitoring?.priceHistory && monitoring.priceHistory.length > 0 && (
                    <div style={{
                        background: colors.bg.surface,
                        border: `1px solid ${colors.border.default}`,
                        borderRadius: radius.lg,
                        padding: spacing['5'],
                        marginBottom: spacing['5'],
                    }}>
                        <div style={{
                            fontSize: font.size.xs,
                            fontWeight: 600,
                            color: colors.text.muted,
                            marginBottom: spacing['2'],
                        }}>
                            가격 변동 이력 (최근 14일)
                        </div>
                        <PriceHistorySection
                            history={monitoring.priceHistory}
                            hideHeader
                        />
                    </div>
                )}
            </div>

            {/* 모달 */}
            <ConfirmModal
                isOpen={isEnableModalOpen}
                onClose={() => setIsEnableModalOpen(false)}
                onConfirm={handleEnable}
                title="가격·품절 확인을 켤까요?"
                description={MonitoringEnableDescription}
                confirmText="켜기"
                cancelText="취소"
                type="info"
            />
            <ConfirmModal
                isOpen={isDisableModalOpen}
                onClose={() => setIsDisableModalOpen(false)}
                onConfirm={handleDisable}
                title="가격·품절 확인을 끌까요?"
                description={MonitoringDisableDescription}
                confirmText="끄기"
                cancelText="취소"
            />
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="이 상품을 삭제할까요?"
                description="Qoo10에서 상품이 삭제되고, DayZero에서도 제거돼요. 이 작업은 되돌릴 수 없어요."
                confirmText="삭제"
                cancelText="취소"
            />
            <ConfirmModal
                isOpen={isPauseModalOpen}
                onClose={() => setIsPauseModalOpen(false)}
                onConfirm={handlePause}
                title="이 상품의 판매를 일시중지할까요?"
                description="Qoo10에서 이 상품이 노출되지 않아요. 언제든 다시 판매 중으로 변경할 수 있어요."
                confirmText="판매 일시중지"
                cancelText="취소"
            />
            <ConfirmModal
                isOpen={isResumeModalOpen}
                onClose={() => setIsResumeModalOpen(false)}
                onConfirm={handleResume}
                title="이 상품의 판매를 재개할까요?"
                description="Qoo10에서 다시 노출되고 구매할 수 있게 돼요."
                confirmText="판매 재개"
                cancelText="취소"
                type="info"
            />

            <style>{ANIM.pageIn + ANIM.summaryFadeIn}</style>

        </MainLayout>
    );
};

// ── 활동 기록 타임라인 ──────────────────────────────────────────────────────

const EVENT_STYLE: Record<MonitoringEventType, { color: string; bg: string; icon: React.ReactNode }> = {
    monitoring_started: { color: colors.primary, bg: colors.primaryLight, icon: <Play size={14} /> },
    price_changed: { color: colors.primary, bg: colors.primaryLight, icon: <TrendingUp size={14} /> },
    out_of_stock: { color: '#FF9500', bg: '#FFF4E0', icon: <PauseCircle size={14} /> },
    restocked: { color: colors.success, bg: colors.successLight, icon: <PackageCheck size={14} /> },
    negative_margin: { color: colors.danger, bg: colors.dangerLight, icon: <AlertTriangle size={14} /> },
    error: { color: colors.danger, bg: colors.dangerLight, icon: <AlertCircle size={14} /> },
};

function formatLogDate(iso: string): string {
    const d = new Date(iso);
    const yy = String(d.getFullYear()).slice(2);
    return `${yy}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const ITEMS_PER_PAGE = 10;

const ActivityLog: React.FC<{ logs: MonitoringActivityLog[] }> = ({ logs }) => {
    const [page, setPage] = useState(0);
    const totalPages = Math.max(1, Math.ceil(logs.length / ITEMS_PER_PAGE));
    const pageLogs = logs.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    if (logs.length === 0) {
        return (
            <div style={{
                padding: `${spacing['4']} 0`,
                textAlign: 'center',
                fontSize: font.size.sm,
                color: colors.text.muted,
            }}>
                아직 활동 기록이 없어요
            </div>
        );
    }

    return (
        <div>
            {/* 칼럼 헤더 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['3'],
                padding: `${spacing['2']} 0`,
                borderBottom: `1px solid ${colors.border.default}`,
                marginBottom: spacing['1'],
            }}>
                <span style={{ width: '32px', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: font.size.xs, fontWeight: 600, color: colors.text.muted }}>활동 내역</span>
                <span style={{ width: '80px', flexShrink: 0, fontSize: font.size.xs, fontWeight: 600, color: colors.text.muted, paddingLeft: '8px' }}>날짜</span>
            </div>
            {/* 로그 항목 */}
            <div>
                {pageLogs.map((log, i) => {
                    const evStyle = EVENT_STYLE[log.type];
                    return (
                        <div key={`${page}-${i}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing['3'],
                            padding: `${spacing['3']} 0`,
                            borderBottom: i < pageLogs.length - 1 ? `1px solid ${colors.bg.subtle}` : 'none',
                        }}>
                            <div style={{
                                width: '32px', height: '32px',
                                borderRadius: radius.full,
                                background: evStyle.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: evStyle.color,
                            }}>
                                {evStyle.icon}
                            </div>
                            <div style={{
                                flex: 1,
                                fontSize: font.size.base,
                                fontWeight: 500,
                                color: colors.text.primary,
                                lineHeight: '1.5',
                                wordBreak: 'keep-all',
                            }}>
                                {log.description}
                            </div>
                            <span style={{
                                fontSize: font.size.sm,
                                color: colors.text.muted,
                                width: '80px',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                textAlign: 'left',
                                paddingLeft: '8px',
                            }}>
                                {formatLogDate(log.date)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* 페이지 번호 */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: spacing['1'],
                    paddingTop: spacing['3'],
                }}>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i)}
                            style={{
                                width: '28px', height: '28px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: page === i ? colors.primary : 'none',
                                color: page === i ? colors.bg.surface : colors.text.muted,
                                border: page === i ? 'none' : `1px solid ${colors.border.default}`,
                                borderRadius: radius.sm,
                                fontSize: font.size.xs,
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
        </div>
    );
};

