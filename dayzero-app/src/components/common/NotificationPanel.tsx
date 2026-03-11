import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSourcingStore } from '../../store/useSourcingStore';
import { useEditingStore } from '../../store/useEditingStore';
import { colors, font, radius, shadow, spacing, zIndex } from '../../design/tokens';
import { ProgressBar, StatusIcon, EmptyState } from './StatusComponents';

type PanelTab = '소싱' | '번역' | '등록';

interface Particle {
    id: number;
    originX: number;
    originY: number;
    dx: number;
    dy: number;
}

const formatNotificationTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();

    // Today
    if (d.toDateString() === now.toDateString()) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        return '어제';
    }

    // 2 days ago or more
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
};

export const NotificationPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<PanelTab>('소싱');
    const [activeParticles, setActiveParticles] = useState<Particle[]>([]);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const bellRef = useRef<HTMLButtonElement>(null);
    const navigate = useNavigate();

    const { notifications, unreadCount, particleOrigin, markAllRead: markSourcingRead, triggerParticle, removeNotification } = useSourcingStore();
    const { translationBatches, registrationBatches, markTranslationsRead, markRegistrationsRead, removeTranslationBatch, removeRegistrationBatch, selectAll, setActiveTab: setEditingActiveTab } = useEditingStore();

    const sortedNotifications = [...notifications].sort((a, b) => {
        // 우선순위: running 은 항상 위로
        if (a.status === 'running' && b.status !== 'running') return -1;
        if (a.status !== 'running' && b.status === 'running') return 1;

        // 나머지는 최신순
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const totalBadge =
        unreadCount +
        translationBatches.filter(b => !b.isRead).length +
        registrationBatches.filter(b => !b.isRead).length;

    useEffect(() => {
        // ... (particle effect logic remains the same)
        if (!particleOrigin || !bellRef.current) return;

        const bellRect = bellRef.current.getBoundingClientRect();
        const bellCenterX = bellRect.left + bellRect.width / 2;
        const bellCenterY = bellRect.top + bellRect.height / 2;

        setActiveParticles(
            Array.from({ length: 7 }, (_, i: number) => ({
                id: Date.now() + i,
                originX: particleOrigin.x,
                originY: particleOrigin.y,
                dx: bellCenterX - particleOrigin.x,
                dy: bellCenterY - particleOrigin.y,
            }))
        );

        const timer = setTimeout(() => {
            setActiveParticles([]);
            triggerParticle(null);
        }, 1200);

        return () => clearTimeout(timer);
    }, [particleOrigin, triggerParticle]);

    const handleBellClick = () => {
        const next = !isOpen;
        setIsOpen(next);
        if (!next) {
            markSourcingRead();
            markTranslationsRead();
            markRegistrationsRead();
        }
    };

    const handleTabChange = (tab: PanelTab) => {
        // Mark previous tab as read before switching
        if (activeTab === '소싱') markSourcingRead();
        if (activeTab === '번역') markTranslationsRead();
        if (activeTab === '등록') markRegistrationsRead();

        setActiveTab(tab);
    };

    const TABS: PanelTab[] = ['소싱', '번역', '등록'];

    return (
        <>
            {/* Particles */}
            {activeParticles.map((p, i) => (
                <div
                    key={p.id}
                    style={{
                        position: 'fixed',
                        left: `${p.originX}px`,
                        top: `${p.originY}px`,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: colors.primary,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        animationName: 'particleFly',
                        animationDuration: '0.75s',
                        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        animationDelay: `${i * 0.055}s`,
                        animationFillMode: 'forwards',
                        '--dx': `${p.dx}px`,
                        '--dy': `${p.dy}px`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Bell + Panel container */}
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: zIndex.modal }}>
                {/* Bell Button */}
                <button
                    ref={bellRef}
                    onClick={handleBellClick}
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: colors.text.primary,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                        position: 'relative',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2D3540')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = colors.text.primary)}
                >
                    <Bell size={22} color="#FFFFFF" />
                    {totalBadge > 0 && !isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            background: colors.danger,
                            color: '#FFFFFF',
                            borderRadius: '10px',
                            minWidth: '20px',
                            height: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 5px',
                            fontFamily: 'Pretendard, sans-serif',
                            boxShadow: '0 0 0 2px #FFFFFF',
                        }}>
                            {totalBadge > 9 ? '9+' : totalBadge}
                        </div>
                    )}
                </button>

                {/* Notification Panel */}
                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 12px)',
                        right: 0,
                        width: '460px',
                        background: '#FFFFFF',
                        borderRadius: radius.xl,
                        boxShadow: shadow.lg,
                        border: `1px solid ${colors.border.default}`,
                        overflow: 'hidden',
                        animation: 'panelSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        fontFamily: 'Pretendard, sans-serif',
                    }}>
                        {/* Panel Header */}
                        <div style={{
                            padding: `${spacing['5']} ${spacing['6']}`,
                            borderBottom: `1px solid ${colors.border.default}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: font.size.lg, fontWeight: 700, color: colors.text.primary }}>작업 현황</span>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    markSourcingRead();
                                    markTranslationsRead();
                                    markRegistrationsRead();
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                            >
                                <X size={18} color={colors.text.muted} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{
                            display: 'flex',
                            borderBottom: `1px solid ${colors.border.default}`,
                            padding: `0 ${spacing['6']}`,
                        }}>
                            {TABS.map((tab) => {
                                let badgeCount = 0;
                                if (tab === '소싱') badgeCount = unreadCount;
                                if (tab === '번역') badgeCount = translationBatches.filter(b => !b.isRead).length;
                                if (tab === '등록') badgeCount = registrationBatches.filter(b => !b.isRead).length;

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => handleTabChange(tab)}
                                        style={{
                                            padding: `${spacing['3']} ${spacing['4']}`,
                                            background: 'none',
                                            border: 'none',
                                            borderBottom: `2px solid ${activeTab === tab ? colors.primary : 'transparent'}`,
                                            marginBottom: '-1px',
                                            fontSize: font.size.base,
                                            fontWeight: activeTab === tab ? 700 : 500,
                                            color: activeTab === tab ? colors.primary : colors.text.tertiary,
                                            cursor: 'pointer',
                                            transition: 'color 0.15s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {tab}
                                        {badgeCount > 0 && (
                                            <div style={{
                                                background: colors.danger,
                                                color: '#FFFFFF',
                                                borderRadius: '10px',
                                                minWidth: '18px',
                                                height: '18px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0 4px',
                                            }}>
                                                {badgeCount}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div style={{ overflowY: 'auto', height: '480px' }}>
                            {activeTab === '소싱' && (
                                sortedNotifications.length === 0 ? (
                                    <EmptyState label="수집 기록이 없어요" />
                                ) : (
                                    sortedNotifications.map((n: any) => {
                                        const isDismissible = n.status === 'completed' || n.status === 'scheduled';
                                        const isHovered = hoveredId === n.id;
                                        return (
                                            <div key={n.id}
                                                onMouseEnter={() => setHoveredId(n.id)}
                                                onMouseLeave={() => setHoveredId(null)}
                                                onClick={() => {
                                                    if (n.status === 'completed') {
                                                        markSourcingRead();
                                                        markTranslationsRead();
                                                        markRegistrationsRead();
                                                        setIsOpen(false);
                                                        navigate(`/editing?focusJobId=${n.id}`);
                                                    }
                                                }}
                                                style={{
                                                    padding: `${spacing['5']} ${spacing['6']}`,
                                                    borderBottom: `1px solid ${colors.bg.page}`,
                                                    background: !n.isRead ? '#F8FAFF' : 'transparent',
                                                    transition: 'background 0.2s',
                                                    cursor: n.status === 'completed' ? 'pointer' : 'default',
                                                }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing['4'] }}>
                                                    <StatusIcon status={n.status} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['1'] }}>
                                                            <div style={{ fontSize: font.size.base, fontWeight: 600, color: colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {n.title}
                                                            </div>
                                                            {isDismissible && isHovered ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: colors.text.muted, flexShrink: 0, marginLeft: spacing['2'] }}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: font.size.sm, color: colors.text.muted, flexShrink: 0, marginLeft: spacing['2'] }}>
                                                                    {formatNotificationTime(n.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {n.status === 'running' ? (
                                                            <>
                                                                <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: spacing['2'] }}>
                                                                    수집 중... {n.currentCount}/{n.totalCount}건
                                                                </div>
                                                                <ProgressBar value={n.currentCount} max={n.totalCount} />
                                                            </>
                                                        ) : n.status === 'completed' ? (
                                                            <div style={{ fontSize: font.size.sm, color: colors.success, fontWeight: 600 }}>
                                                                {n.totalCount}건 중 {n.currentCount}건 수집 완료
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: font.size.sm, color: colors.text.tertiary }}>
                                                                내일 오전 {('timeString' in n ? n.timeString : '07:00')}에 실행돼요.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === '번역' && (
                                translationBatches.length === 0 ? (
                                    <EmptyState label="번역 기록이 없어요" />
                                ) : (
                                    [...translationBatches].sort((a, b) => {
                                        const isARunning = a.status === 'processing';
                                        const isBRunning = b.status === 'processing';
                                        if (isARunning && !isBRunning) return -1;
                                        if (!isARunning && isBRunning) return 1;
                                        return 0;
                                    }).map((batch) => {
                                        const isRunning = batch.status === 'processing';
                                        const isHovered = hoveredId === `t-${batch.id}`;
                                        return (
                                            <div key={batch.id}
                                                onMouseEnter={() => setHoveredId(`t-${batch.id}`)}
                                                onMouseLeave={() => setHoveredId(null)}
                                                onClick={() => {
                                                    if (batch.status === 'completed') {
                                                        setEditingActiveTab('translated');
                                                        if (batch.productIds?.length > 0) {
                                                            selectAll(batch.productIds);
                                                        }
                                                        markTranslationsRead();
                                                        setIsOpen(false);
                                                        navigate('/editing');
                                                    }
                                                }}
                                                style={{
                                                    padding: `${spacing['5']} ${spacing['6']}`,
                                                    borderBottom: `1px solid ${colors.bg.page}`,
                                                    background: !batch.isRead ? '#F8FAFF' : 'transparent',
                                                    transition: 'background 0.2s',
                                                    cursor: batch.status === 'completed' ? 'pointer' : 'default',
                                                }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing['4'] }}>
                                                    <StatusIcon status={isRunning ? 'running' : batch.status} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['1'] }}>
                                                            <div style={{ fontSize: font.size.base, fontWeight: 600, color: colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                상품 번역
                                                            </div>
                                                            {!isRunning && isHovered ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); removeTranslationBatch(batch.id); }}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: colors.text.muted, flexShrink: 0, marginLeft: spacing['2'] }}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: font.size.sm, color: colors.text.muted, flexShrink: 0, marginLeft: spacing['2'] }}>
                                                                    {formatNotificationTime(batch.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isRunning ? (
                                                            <>
                                                                <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: spacing['2'] }}>
                                                                    번역 중... {batch.currentCount}/{batch.totalCount}건
                                                                </div>
                                                                <ProgressBar value={batch.currentCount} max={batch.totalCount} />
                                                            </>
                                                        ) : batch.status === 'completed' ? (
                                                            <div style={{ fontSize: font.size.sm, color: colors.success, fontWeight: 600 }}>
                                                                {batch.totalCount}건 중 {batch.currentCount}건 번역 완료
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: font.size.sm, color: colors.danger, fontWeight: 600 }}>
                                                                번역 실패
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === '등록' && (
                                registrationBatches.length === 0 ? (
                                    <EmptyState label="등록 기록이 없어요" />
                                ) : (
                                    [...registrationBatches].sort((a, b) => {
                                        if (a.status === 'processing' && b.status !== 'processing') return -1;
                                        if (b.status === 'processing' && a.status !== 'processing') return 1;
                                        return 0;
                                    }).map((batch) => {
                                        const isRunning = batch.status === 'processing';
                                        const isHovered = hoveredId === `r-${batch.id}`;
                                        return (
                                            <div key={batch.id}
                                                onMouseEnter={() => setHoveredId(`r-${batch.id}`)}
                                                onMouseLeave={() => setHoveredId(null)}
                                                style={{
                                                    padding: `${spacing['5']} ${spacing['6']}`,
                                                    borderBottom: `1px solid ${colors.bg.page}`,
                                                    background: !batch.isRead ? '#F8FAFF' : 'transparent',
                                                    transition: 'background 0.2s',
                                                }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing['4'] }}>
                                                    <StatusIcon status={batch.status === 'completed' ? 'completed' : batch.status === 'failed' ? 'failed' : 'running'} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['1'] }}>
                                                            <div style={{ fontSize: font.size.base, fontWeight: 600, color: colors.text.primary }}>
                                                                Qoo10 상품 등록
                                                            </div>
                                                            {!isRunning && isHovered ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); removeRegistrationBatch(batch.id); }}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: colors.text.muted, flexShrink: 0, marginLeft: spacing['2'] }}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: font.size.sm, color: colors.text.muted, flexShrink: 0, marginLeft: spacing['2'] }}>
                                                                    {formatNotificationTime(batch.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isRunning ? (
                                                            <>
                                                                <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: spacing['2'] }}>
                                                                    등록 중... {batch.currentCount}/{batch.totalCount}건
                                                                </div>
                                                                <ProgressBar value={batch.currentCount} max={batch.totalCount} />
                                                            </>
                                                        ) : batch.status === 'completed' ? (
                                                            <div style={{ fontSize: font.size.sm, color: colors.success, fontWeight: 600 }}>
                                                                {batch.totalCount}건 중 {batch.currentCount}건 등록 완료
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: font.size.sm, color: colors.danger, fontWeight: 600 }}>
                                                                등록 실패
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

// CSS 주입을 위해 수정
const style = document.createElement('style');
style.textContent = `
    .notification-item .delete-btn {
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    .notification-item:hover .delete-btn {
        opacity: 1;
    }
`;
document.head.appendChild(style);
