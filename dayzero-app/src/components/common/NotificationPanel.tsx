import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, AlertTriangle, PackageX, TrendingUp, PauseCircle, PackageCheck } from 'lucide-react';
import { useRegistrationStore } from '../../store/useRegistrationStore';
import { useToastStore } from '../../store/useToastStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { colors, font, radius, spacing, shadow, zIndex } from '../../design/tokens';
import { ANIM } from '../../design/animations';

type AlertType = 'negative_margin' | 'out_of_stock' | 'restocked';
type FilterTab = 'all' | 'negative_margin' | 'out_of_stock' | 'restocked';

interface AlertItem {
    resultId: string;
    type: AlertType;
    productNameJa: string;
    provider: string;
    description: string;
    detectedAt: string;
    isAutoPaused: boolean;
    marginPercent?: string;
    originalPrice?: number;
    currentPrice?: number;
    recommendedJpy?: number;
}

const TAB_CONFIG: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'negative_margin', label: '가격 변동' },
    { key: 'out_of_stock', label: '품절' },
    { key: 'restocked', label: '재입고' },
];

const UNREAD_BG = '#F8FAFF';
const FAB_HOVER_BG = '#2D3540';

const formatTimeAgo = (dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return '어제';

    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}.${dd}`;
};

const extractAlerts = (jobs: ReturnType<typeof useRegistrationStore.getState>['jobs']): AlertItem[] => {
    const alerts: AlertItem[] = [];

    for (const job of jobs) {
        for (const r of job.results) {
            if (r.monitoring?.status !== 'active') continue;
            const result = r.monitoring.lastCheckResult;
            if (result !== 'negative_margin' && result !== 'out_of_stock' && result !== 'restocked') continue;

            const item: AlertItem = {
                resultId: r.id,
                type: result,
                productNameJa: r.product.titleJa || r.product.titleKo,
                provider: r.product.provider,
                description: r.monitoring.issueDescription ?? '',
                detectedAt: r.monitoring.lastCheckAt ?? new Date().toISOString(),
                isAutoPaused: r.salesStatus === 'paused' && r.pauseReason === 'auto',
            };

            if (result === 'negative_margin' && r.monitoring.currentSourcePriceKrw) {
                const cost = r.monitoring.currentSourcePriceKrw;
                const saleInKrw = r.product.salePriceJpy / 0.11;
                const margin = saleInKrw > 0 ? ((saleInKrw - cost) / saleInKrw * 100) : 0;
                item.marginPercent = margin.toFixed(1);
                item.originalPrice = r.product.originalPriceKrw;
                item.currentPrice = cost;
                item.recommendedJpy = Math.ceil((cost * 1.2) * 0.11);
            }

            alerts.push(item);
        }
    }

    return alerts.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
};

function getAlertIcon(alert: AlertItem) {
    let iconBg: string;
    let iconColor: string;
    let IconComp: typeof AlertTriangle;

    if (alert.type === 'restocked') {
        iconBg = colors.successLight;
        iconColor = colors.success;
        IconComp = PackageCheck;
    } else if (alert.type === 'negative_margin') {
        iconBg = alert.isAutoPaused ? colors.primaryLight : colors.dangerLight;
        iconColor = alert.isAutoPaused ? colors.primary : colors.danger;
        IconComp = alert.isAutoPaused ? TrendingUp : AlertTriangle;
    } else {
        iconBg = alert.isAutoPaused ? colors.primaryLight : colors.dangerLight;
        iconColor = alert.isAutoPaused ? colors.primary : colors.danger;
        IconComp = alert.isAutoPaused ? PauseCircle : PackageX;
    }

    return (
        <div style={{
            width: '36px',
            height: '36px',
            borderRadius: radius.full,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
        }}>
            <IconComp size={18} color={iconColor} />
        </div>
    );
}

function getAlertDescription(alert: AlertItem): string {
    if (alert.type === 'restocked') {
        return `${alert.provider}에서 재입고가 확인돼 자동으로 판매가 재개됐어요.`;
    }
    if (alert.type === 'negative_margin') {
        return alert.isAutoPaused
            ? `원가가 ₩${(alert.originalPrice ?? 0).toLocaleString()} → ₩${(alert.currentPrice ?? 0).toLocaleString()}로 올라 판매가가 자동으로 ¥${(alert.recommendedJpy ?? 0).toLocaleString()}로 조정됐어요.`
            : `원가가 ₩${(alert.originalPrice ?? 0).toLocaleString()} → ₩${(alert.currentPrice ?? 0).toLocaleString()}로 올라 역마진이 발생했어요. 판매가 조정이 필요해요.`;
    }
    return alert.isAutoPaused
        ? `${alert.provider}에서 품절이 감지돼 자동으로 판매가 중지됐어요.`
        : `${alert.provider}에서 품절이 감지됐어요. 판매 일시중지가 필요해요.`;
}

export const NotificationPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const { readIds, dismissedIds, markRead, markAllRead, dismiss } = useNotificationStore();
    const navigate = useNavigate();

    const jobs = useRegistrationStore(s => s.jobs);
    const seedDemoIssues = useRegistrationStore(s => s.seedDemoIssues);

    const allAlerts = useMemo(() => extractAlerts(jobs), [jobs]);
    const alerts = useMemo(() => allAlerts.filter(a => !dismissedIds.has(a.resultId)), [allAlerts, dismissedIds]);

    const tabCounts = useMemo(() => {
        const counts: Record<FilterTab, number> = { all: 0, negative_margin: 0, out_of_stock: 0, restocked: 0 };
        for (const a of alerts) {
            if (!readIds.has(a.resultId)) {
                counts.all++;
                counts[a.type]++;
            }
        }
        return counts;
    }, [alerts, readIds]);

    const unreadCount = tabCounts.all;

    const filteredAlerts = activeTab === 'all'
        ? alerts
        : alerts.filter(a => a.type === activeTab);

    const handleDismiss = (e: React.MouseEvent, resultId: string) => {
        e.stopPropagation();
        dismiss(resultId);
    };

    const handleGoToProduct = (resultId: string) => {
        const exists = jobs.some(j => j.results.some(r => r.id === resultId));
        if (!exists) {
            useToastStore.getState().addToast('이미 삭제된 상품이에요.');
            dismiss(resultId);
            return;
        }
        markRead(resultId);
        setIsOpen(false);
        navigate(`/registration/${resultId}`);
    };

    return (
        <>
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: zIndex.modal - 1 }}
                />
            )}

            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: zIndex.modal,
            }}>
                {/* FAB */}
                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: radius.full,
                        background: colors.text.primary,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: shadow.lg,
                        position: 'relative',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = FAB_HOVER_BG)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = colors.text.primary)}
                >
                    <Bell size={22} color={colors.bg.surface} />
                    {unreadCount > 0 && !isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            background: colors.danger,
                            color: colors.bg.surface,
                            borderRadius: radius.full,
                            minWidth: '20px',
                            height: '20px',
                            fontSize: font.size['2xs+'],
                            fontWeight: font.weight.bold,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 5px',
                            fontFamily: 'Pretendard, sans-serif',
                            boxShadow: `0 0 0 2px ${colors.bg.surface}`,
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    )}
                </button>

                {/* Panel */}
                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 12px)',
                        right: 0,
                        width: '460px',
                        background: colors.bg.surface,
                        borderRadius: radius.xl,
                        boxShadow: shadow.lg,
                        border: `1px solid ${colors.border.default}`,
                        overflow: 'hidden',
                        animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        fontFamily: 'Pretendard, sans-serif',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: `${spacing['5']} ${spacing['6']}`,
                            borderBottom: `1px solid ${colors.border.default}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{
                                fontSize: font.size.lg,
                                fontWeight: font.weight.bold,
                                color: colors.text.primary,
                            }}>
                                상품 알림
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'] }}>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllRead(alerts.map(a => a.resultId))}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: font.size.sm,
                                            fontWeight: font.weight.medium,
                                            color: colors.primary,
                                            padding: '4px',
                                        }}
                                    >
                                        모두 읽음으로 표시
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: colors.text.muted,
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{
                            display: 'flex',
                            borderBottom: `1px solid ${colors.border.default}`,
                            padding: `0 ${spacing['6']}`,
                        }}>
                            {TAB_CONFIG.map(({ key, label }) => {
                                const count = tabCounts[key];
                                const isActive = activeTab === key;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        style={{
                                            padding: `${spacing['3']} ${spacing['4']}`,
                                            background: 'none',
                                            border: 'none',
                                            borderBottom: `2px solid ${isActive ? colors.primary : 'transparent'}`,
                                            marginBottom: '-1px',
                                            fontSize: font.size.base,
                                            fontWeight: isActive ? font.weight.bold : font.weight.medium,
                                            color: isActive ? colors.primary : colors.text.tertiary,
                                            cursor: 'pointer',
                                            transition: 'color 0.15s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        {label}
                                        {count > 0 && (
                                            <div style={{
                                                background: isActive ? colors.primaryLight : colors.bg.subtle,
                                                color: isActive ? colors.primary : colors.text.muted,
                                                borderRadius: radius.full,
                                                minWidth: '18px',
                                                height: '18px',
                                                fontSize: font.size['2xs'],
                                                fontWeight: font.weight.bold,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0 5px',
                                                transition: 'all 0.15s',
                                            }}>
                                                {count}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div style={{ overflowY: 'auto', height: '520px' }}>
                            {filteredAlerts.length === 0 ? (
                                <div style={{
                                    padding: `${spacing['12']} ${spacing['6']}`,
                                    textAlign: 'center',
                                    color: colors.text.muted,
                                    fontSize: font.size.base,
                                    lineHeight: font.lineHeight.relaxed,
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: radius.full,
                                        background: colors.bg.subtle,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                        marginBottom: spacing['3'],
                                    }}>
                                        <Bell size={20} color={colors.text.muted} />
                                    </div>
                                    가격·재고 확인 중인 상품에서<br />
                                    변동 사항이 없어요

                                    <button
                                        onClick={(e) => { e.stopPropagation(); seedDemoIssues(); }}
                                        style={{
                                            marginTop: spacing['4'],
                                            padding: `${spacing['2']} ${spacing['4']}`,
                                            fontSize: font.size.sm,
                                            fontWeight: font.weight.medium,
                                            color: colors.primary,
                                            background: colors.primaryLight,
                                            border: `1px solid ${colors.primaryBorder}`,
                                            borderRadius: radius.md,
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = colors.primaryHover)}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = colors.primaryLight)}
                                    >
                                        변동 시뮬레이션
                                    </button>
                                </div>
                            ) : (
                                filteredAlerts.map((alert, index) => {
                                    const isHovered = hoveredId === alert.resultId;
                                    const isUnread = !readIds.has(alert.resultId);

                                    return (
                                        <div
                                            key={alert.resultId}
                                            onMouseEnter={() => setHoveredId(alert.resultId)}
                                            onMouseLeave={() => setHoveredId(null)}
                                            onClick={() => handleGoToProduct(alert.resultId)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: spacing['3'],
                                                padding: `${spacing['4']} ${spacing['6']}`,
                                                borderBottom: index < filteredAlerts.length - 1
                                                    ? `1px solid ${colors.bg.subtle}`
                                                    : 'none',
                                                background: isHovered ? colors.bg.faint : isUnread ? UNREAD_BG : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s',
                                                animation: `fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.04}s both`,
                                            }}
                                        >
                                            {getAlertIcon(alert)}

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: spacing['1'],
                                                }}>
                                                    <div style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        fontSize: font.size.base,
                                                        fontWeight: font.weight.semibold,
                                                        color: colors.text.primary,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {alert.productNameJa}
                                                    </div>
                                                    {isHovered ? (
                                                        <button
                                                            onClick={(e) => handleDismiss(e, alert.resultId)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '2px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                color: colors.text.muted,
                                                                flexShrink: 0,
                                                                marginLeft: spacing['2'],
                                                            }}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: font.size['2xs'],
                                                            color: colors.text.placeholder,
                                                            flexShrink: 0,
                                                            marginLeft: spacing['2'],
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {formatTimeAgo(alert.detectedAt)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{
                                                    fontSize: font.size.sm,
                                                    color: colors.text.secondary,
                                                    lineHeight: font.lineHeight.relaxed,
                                                    wordBreak: 'keep-all',
                                                }}>
                                                    {getAlertDescription(alert)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{ANIM.fadeInUp + ANIM.modalSlideUp}</style>
        </>
    );
};
