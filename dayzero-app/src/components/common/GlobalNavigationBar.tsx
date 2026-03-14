import React, { useState } from 'react';
import { Bell, User } from 'lucide-react';
import { useSourcingStore } from '../../store/useSourcingStore';

type NavItem = '수집' | '편집' | '등록' | '내 상품' | '설정';

const NAV_ITEMS: NavItem[] = ['수집', '편집', '등록', '내 상품', '설정'];

export const GlobalNavigationBar: React.FC = () => {
    const [activeTab, setActiveTab] = useState<NavItem>('수집');
    const [showToast, setShowToast] = useState(false);

    // Mock counts
    const unprocessedCount = useSourcingStore(state => state.unprocessedProductCount);
    const mockCounts: Record<string, number> = {
        '수집': unprocessedCount,
        '편집': 0,
        '등록': 0,
        '내 상품': 0,
    };

    const handleTabClick = (item: NavItem) => {
        if (item === '수집') {
            setActiveTab(item);
        } else {
            // Show prepare toast
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        }
    };

    return (
        <>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '60px',
                background: '#FFFFFF',
                borderBottom: '1px solid #E5E8EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 40px',
                zIndex: 1000,
                fontFamily: 'Pretendard, -apple-system, sans-serif'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    {/* Logo */}
                    <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: '48px' }}>
                        <img src="/DayZero Logo.png" alt="DayZero" style={{ height: '24px', width: 'auto' }} />
                    </div>

                    {/* Nav Tabs */}
                    <div style={{ display: 'flex', gap: '32px', height: '100%' }}>
                        {NAV_ITEMS.map((item) => {
                            const isActive = activeTab === item;
                            const count = mockCounts[item] || 0;

                            return (
                                <button
                                    key={item}
                                    onClick={() => handleTabClick(item)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '0',
                                        cursor: 'pointer',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        position: 'relative',
                                        fontSize: '15px',
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? '#191F28' : '#8B95A1',
                                        transition: 'color 0.2s ease'
                                    }}
                                >
                                    {item}

                                    {/* Badge */}
                                    {count > 0 && (
                                        <div style={{
                                            marginLeft: '6px',
                                            background: '#F2F4F6',
                                            color: '#4E5968',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {count > 99 ? '99+' : count}
                                        </div>
                                    )}

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: '#191F28',
                                            borderTopLeftRadius: '3px',
                                            borderTopRightRadius: '3px'
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Utilities */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {/* Notification */}
                    <button style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4E5968'
                    }}>
                        <Bell size={22} strokeWidth={1.5} />
                        {/* Unread Badge - Mock 3 notifications */}
                        <div style={{
                            position: 'absolute',
                            top: '2px',
                            right: '0px',
                            background: '#F04452',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: '10px',
                            border: '1.5px solid #FFFFFF'
                        }}>
                            3
                        </div>
                    </button>

                    {/* Profile */}
                    <button style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#E5E8EB',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8B95A1',
                        padding: 0
                    }}>
                        <User size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Preparation Toast */}
            {showToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(25, 31, 40, 0.9)',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    zIndex: 2000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    준비 중이에요 🚧
                </div>
            )}

            {/* Spacer for fixed header */}
            <div style={{ height: '60px' }} />
        </>
    );
};
