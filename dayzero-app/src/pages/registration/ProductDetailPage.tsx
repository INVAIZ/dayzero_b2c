import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ExternalLink, Shield, AlertTriangle,
    TrendingDown, TrendingUp, ChevronLeft, ChevronRight, PenLine, Trash2,
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

export const ProductDetailPage: React.FC = () => {
    const { resultId } = useParams<{ resultId: string }>();
    const navigate = useNavigate();
    const { jobs, enableMonitoring, disableMonitoring, updateRegisteredProduct, pauseSales, resumeSales, deleteResults, autoPauseOnOutOfStock, autoPauseOnNegativeMargin } = useRegistrationStore();

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

                {/* 상태 도우미 콜아웃 — 모니터링 활성 시 상태에 따라 하나 표시 */}
                {isMonitored && (
                    isNegativeMargin && currentMargin <= 5 ? (
                        <AlertCard
                            type="negative_margin"
                            description={monitoring?.issueDescription ?? ''}
                            resultId={result.id}
                            onNavigate={navigate}
                        />
                    ) : isOutOfStock && !isPaused ? (
                        <AlertCard
                            type="out_of_stock"
                            description={monitoring?.issueDescription ?? ''}
                            isPaused={isPaused}
                            isMonitored={isMonitored}
                            onPause={() => setIsPauseModalOpen(true)}
                        />
                    ) : isPaused ? (
                        <StatusHelper
                            type="paused"
                            title={isOutOfStock ? '재입고를 기다리고 있어요' : '판매 일시중지 중'}
                            description={
                                isOutOfStock && autoPauseOnOutOfStock
                                    ? '현재 쇼핑몰에서 품절된 상태예요. 매일 쇼핑몰을 확인하고 있고, 재입고되면 자동으로 판매를 재개해드릴게요.'
                                : isOutOfStock
                                    ? '현재 쇼핑몰에서 품절된 상태예요. 매일 쇼핑몰을 확인하고 있고, 재입고되면 바로 알려드릴게요.'
                                    : '현재 판매가 일시중지된 상태예요. 가격·재고 변동은 계속 확인하고 있으니, 판매를 재개하고 싶을 때 언제든 다시 시작하실 수 있어요.'
                            }
                        />
                    ) : (
                        <StatusHelper
                            type="watching"
                            title="매일 확인하고 있어요"
                            description={autoPauseOnOutOfStock && autoPauseOnNegativeMargin
                                ? '매일 쇼핑몰의 가격과 재고를 확인하고 있어요. 품절되면 자동으로 판매를 일시중지하고, 원가가 변동되면 판매가를 자동으로 조정해드릴게요.'
                            : autoPauseOnOutOfStock
                                ? '매일 쇼핑몰의 가격과 재고를 확인하고 있어요. 품절되면 자동으로 판매를 일시중지해드릴게요. 가격이 변동되면 바로 알려드릴게요.'
                            : autoPauseOnNegativeMargin
                                ? '매일 쇼핑몰의 가격과 재고를 확인하고 있어요. 원가가 변동되면 판매가를 자동으로 조정해드릴게요. 품절되면 바로 알려드릴게요.'
                                : '매일 쇼핑몰의 가격과 재고를 확인하고 있어요. 가격이 변동되거나 품절이 발생하면 바로 알려드릴게요.'
                            }
                        />
                    )
                )}

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

                    {/* 원본 쇼핑몰 정보 */}
                    <InfoCard
                        title={
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacing['2'] }}>
                                원본 쇼핑몰 정보
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
                {isMonitored && monitoring?.priceHistory && monitoring.priceHistory.length > 0 ? (
                    <div style={{
                        background: colors.bg.surface,
                        border: `1px solid ${colors.border.default}`,
                        borderRadius: radius.lg,
                        padding: spacing['5'],
                        marginBottom: spacing['5'],
                    }}>
                        {/* 헤더: 제목 + 토글 */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: spacing['4'],
                        }}>
                            <span style={{
                                fontSize: font.size.sm,
                                fontWeight: 700,
                                color: colors.text.tertiary,
                                letterSpacing: '0.3px',
                            }}>
                                가격 변동 이력 (최근 14일)
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                                {isPaused && (
                                    <span style={{ fontSize: font.size.xs, color: colors.text.tertiary }}>
                                        재입고 시 알려드려요
                                    </span>
                                )}
                                <MonitoringToggle checked onClick={handleToggleMonitoring} />
                            </div>
                        </div>
                        <PriceHistorySection
                            history={monitoring.priceHistory}
                            hideHeader
                        />
                    </div>
                ) : (
                    <div style={{
                        position: 'relative',
                        background: colors.bg.surface,
                        border: `1px solid ${colors.border.default}`,
                        borderRadius: radius.lg,
                        overflow: 'hidden',
                        marginBottom: spacing['5'],
                        minHeight: '520px',
                    }}>
                        {/* 블러 처리된 더미 차트 배경 (실제 차트와 동일한 구조) */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            padding: spacing['5'],
                            filter: 'blur(5px)',
                            opacity: 0.3,
                            pointerEvents: 'none',
                        }}>
                            <div style={{ fontSize: font.size.sm, fontWeight: 700, color: colors.text.tertiary, marginBottom: spacing['4'] }}>
                                가격 변동 이력 (최근 14일)
                            </div>
                            <svg viewBox="0 0 620 200" style={{ width: '100%', height: 'auto', display: 'block', marginBottom: spacing['4'] }}>
                                <defs>
                                    <linearGradient id="dummyGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
                                        <stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
                                    </linearGradient>
                                </defs>
                                {/* Y축 그리드 + 라벨 */}
                                {[0, 1, 2, 3, 4, 5].map(i => {
                                    const y = 16 + (156 / 5) * (5 - i);
                                    return (
                                        <g key={i}>
                                            <line x1="52" y1={y} x2="600" y2={y} stroke={colors.border.default} strokeWidth="0.7" strokeDasharray={i === 0 ? 'none' : '3 2'} />
                                            <text x="44" y={y + 3.5} textAnchor="end" fontSize="10" fill={colors.text.muted} fontFamily={font.family.mono}>
                                                {`${2 + i * 0.5}만`}
                                            </text>
                                        </g>
                                    );
                                })}
                                {/* 라인 + 영역 */}
                                <path d="M52,130 L100,128 L160,134 L220,132 L280,130 L340,126 L400,128 L460,80 L520,70 L580,68 L600,68 L600,172 L52,172 Z" fill="url(#dummyGrad)" />
                                <path d="M52,130 L100,128 L160,134 L220,132 L280,130 L340,126 L400,128 L460,80 L520,70 L580,68 L600,68" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                                {/* X축 라벨 */}
                                {['3/18', '3/21', '3/25', '3/28', '3/31'].map((l, i) => (
                                    <text key={i} x={52 + i * 137} y={194} textAnchor="middle" fontSize="10.5" fill={colors.text.muted}>{l}</text>
                                ))}
                            </svg>
                            {/* 더미 타임라인 행 */}
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: spacing['3'],
                                    padding: `${spacing['3']} 0`,
                                    borderBottom: i < 5 ? `1px solid ${colors.bg.subtle}` : 'none',
                                }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i <= 2 ? colors.danger : colors.success }} />
                                    <span style={{ fontSize: font.size.sm, color: colors.text.muted, width: '56px' }}>3/{31 - i + 1}</span>
                                    <span style={{ fontSize: font.size.base, fontWeight: 700, color: colors.text.primary, flex: 1 }}>
                                        ₩{(25000 + i * 3000).toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: font.size.base, fontWeight: 700, color: i <= 2 ? colors.danger : colors.primary, width: '100px' }}>
                                        ₩{(500 + i * 200).toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: font.size.base, fontWeight: 700, color: i <= 2 ? colors.danger : colors.success, width: '56px' }}>
                                        {i <= 2 ? `-${(5 + i)}%` : `${25 + i}%`}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* 오버레이 안내 */}
                        <div style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '520px',
                            padding: spacing['5'],
                            textAlign: 'center',
                        }}>
                            <Shield size={28} color={colors.primary} style={{ marginBottom: spacing['3'] }} />
                            <div style={{
                                fontSize: font.size.base,
                                fontWeight: 600,
                                color: colors.text.primary,
                                marginBottom: spacing['1'],
                            }}>
                                가격·재고 자동 확인을 등록하면 매일 변동 이력을 확인할 수 있어요
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
                                가격·재고 자동 확인 받기
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 모달 */}
            <ConfirmModal
                isOpen={isEnableModalOpen}
                onClose={() => setIsEnableModalOpen(false)}
                onConfirm={handleEnable}
                title="이 상품에 가격·재고 자동 확인을 등록할까요?"
                description="매일 쇼핑몰의 가격과 재고를 자동으로 확인해서, 역마진이나 품절이 생기면 알려드려요."
                confirmText="가격·재고 자동 확인 받기"
                cancelText="취소"
                type="info"
            />
            <ConfirmModal
                isOpen={isDisableModalOpen}
                onClose={() => setIsDisableModalOpen(false)}
                onConfirm={handleDisable}
                title="가격·재고 자동 확인을 해제할까요?"
                description="해제하면 쇼핑몰 가격·재고 변동이 더 이상 확인되지 않아요."
                confirmText="가격·재고 자동 확인 해제"
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


