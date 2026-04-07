import React, { useState } from 'react';
import { Bell, User } from 'lucide-react';
import { useSourcingStore } from '../../store/useSourcingStore';
import { colors, font, radius } from '../../design/tokens';

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
                background: colors.bg.surface,
                borderBottom: `1px solid ${colors.border.default}`,
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
                                        fontSize: font.size.base,
                                        fontWeight: isActive ? font.weight.bold : font.weight.medium,
                                        color: isActive ? colors.text.primary : colors.text.muted,
                                        transition: 'color 0.2s ease'
                                    }}
                                >
                                    {item}

                                    {/* Badge */}
                                    {count > 0 && (
                                        <div style={{
                                            marginLeft: '6px',
                                            background: colors.bg.subtle,
                                            color: colors.text.secondary,
                                            fontSize: font.size['2xs+'],
                                            fontWeight: font.weight.bold,
                                            padding: '2px 6px',
                                            borderRadius: radius.img,
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
                                            background: colors.text.primary,
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
                        color: colors.text.secondary
                    }}>
                        <Bell size={22} strokeWidth={1.5} />
                        {/* Unread Badge - Mock 3 notifications */}
                        <div style={{
                            position: 'absolute',
                            top: '2px',
                            right: '0px',
                            background: colors.danger,
                            color: 'white',
                            fontSize: font.size['2xs'],
                            fontWeight: font.weight.bold,
                            padding: '2px 5px',
                            borderRadius: radius.img,
                            border: `1.5px solid ${colors.bg.surface}`
                        }}>
                            3
                        </div>
                    </button>

                    {/* Profile */}
                    <button style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: colors.border.default,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.text.muted,
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
                    color: colors.white,
                    padding: '12px 24px',
                    borderRadius: radius.md,
                    fontSize: font.size.md,
                    fontWeight: font.weight.medium,
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
