import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Loader2, X, ArrowRight } from 'lucide-react';
import { useSourcingStore } from '../../store/useSourcingStore';

interface Particle {
    id: number;
    originX: number;
    originY: number;
    dx: number;
    dy: number;
}

export const NotificationPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeParticles, setActiveParticles] = useState<Particle[]>([]);
    const [showToast, setShowToast] = useState(false);
    const bellRef = useRef<HTMLButtonElement>(null);

    const { notifications, unreadCount, particleOrigin, markAllRead, triggerParticle } = useSourcingStore();

    useEffect(() => {
        if (!particleOrigin || !bellRef.current) return;

        const bellRect = bellRef.current.getBoundingClientRect();
        const bellCenterX = bellRect.left + bellRect.width / 2;
        const bellCenterY = bellRect.top + bellRect.height / 2;

        setActiveParticles(
            Array.from({ length: 7 }, (_, i) => ({
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
        if (next) markAllRead();
    };

    const handleNotificationClick = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

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
                        background: '#3182F6',
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
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1200 }}>
                {/* Bell Button */}
                <button
                    ref={bellRef}
                    onClick={handleBellClick}
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#191F28',
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
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#191F28')}
                >
                    <Bell size={22} color="#FFFFFF" />
                    {unreadCount > 0 && !isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            background: '#F04452',
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
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    )}
                </button>

                {/* Notification Panel */}
                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 12px)',
                        right: 0,
                        width: '360px',
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
                        border: '1px solid #E5E8EB',
                        overflow: 'hidden',
                        animation: 'panelSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        fontFamily: 'Pretendard, sans-serif',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #F2F4F6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#191F28' }}>알림</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                            >
                                <X size={18} color="#8B95A1" />
                            </button>
                        </div>

                        {/* Notification List */}
                        <div style={{ overflowY: 'auto', maxHeight: '360px' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                                    <Bell size={32} color="#D1D6DB" style={{ marginBottom: '12px' }} />
                                    <p style={{ fontSize: '14px', color: '#8B95A1', margin: 0 }}>알림이 없어요</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={handleNotificationClick}
                                        style={{
                                            padding: '16px 20px',
                                            borderBottom: '1px solid #F9FAFB',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: n.status === 'completed' ? '#F0FFF8' : '#EFF6FF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {n.status === 'completed'
                                                    ? <CheckCircle2 size={18} color="#3ED4A4" />
                                                    : <Loader2 size={18} color="#3182F6" className="spin" />
                                                }
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#191F28', marginBottom: '6px' }}>
                                                    {n.title}
                                                </div>

                                                {n.status === 'running' ? (
                                                    <>
                                                        <div style={{ fontSize: '12px', color: '#6B7684', marginBottom: '8px' }}>
                                                            수집 중... {n.currentCount}/{n.totalCount}건
                                                        </div>
                                                        <div style={{ height: '4px', background: '#F2F4F6', borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                height: '100%',
                                                                width: `${n.totalCount > 0 ? (n.currentCount / n.totalCount) * 100 : 0}%`,
                                                                background: '#3182F6',
                                                                borderRadius: '2px',
                                                                transition: 'width 0.4s ease',
                                                            }} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '12px', color: '#3ED4A4', fontWeight: 600 }}>
                                                            {n.currentCount}건 수집 완료
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3182F6', fontWeight: 600 }}>
                                                            편집하러 가기 <ArrowRight size={12} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 준비 중이에요 Toast */}
            {showToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '24px',
                    background: 'rgba(25, 31, 40, 0.9)',
                    color: '#FFFFFF',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    zIndex: 9999,
                    animation: 'fadeInUp 0.25s ease',
                    fontFamily: 'Pretendard, sans-serif',
                }}>
                    준비 중이에요
                </div>
            )}
        </>
    );
};
