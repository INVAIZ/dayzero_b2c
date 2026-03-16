import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, LayoutList, PackageOpen, ChevronRight } from 'lucide-react';
import { useSourcingStore } from '../../store/useSourcingStore';

type NavItem = '수집하기' | '수집된 상품' | '판매 중인 상품';

export const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showToast] = useState(false);
    const [badgeAnimating, setBadgeAnimating] = useState(false);

    const { unprocessedProductCount } = useSourcingStore();
    const prevCountRef = useRef(unprocessedProductCount);

    const isSourcingActive = location.pathname.startsWith('/sourcing');
    const isEditingActive = location.pathname.startsWith('/editing');
    const isRegistrationActive = location.pathname.startsWith('/registration');

    useEffect(() => {
        if (unprocessedProductCount > prevCountRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBadgeAnimating(true);
            setTimeout(() => setBadgeAnimating(false), 600);
        }
        prevCountRef.current = unprocessedProductCount;
    }, [unprocessedProductCount]);

    const handleNav = (item: NavItem) => {
        if (item === '수집하기') {
            navigate('/sourcing');
        } else if (item === '수집된 상품') {
            navigate('/editing');
        } else if (item === '판매 중인 상품') {
            navigate('/registration');
        }
    };

    return (
        <aside style={{
            width: '280px',
            height: '100vh',
            background: '#F9FAFB',
            borderRight: '1px solid #E5E8EB',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '40px 24px',
            fontFamily: 'Pretendard, -apple-system, sans-serif',
            zIndex: 1000,
        }}>
            {/* Logo */}
            <div style={{ padding: '0 12px', marginBottom: '48px', cursor: 'pointer' }} onClick={() => navigate('/sourcing')}>
                <img src="/DayZero Logo.png" alt="DayZero" style={{ height: '28px', width: 'auto' }} />
            </div>

            {/* Menu Items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#8B95A1', padding: '0 12px', marginBottom: '8px', marginTop: '16px' }}>PRODUCTS</div>

                <button
                    onClick={() => handleNav('수집하기')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px 12px',
                        background: isSourcingActive ? '#FFFFFF' : 'transparent',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: isSourcingActive ? '#191F28' : '#6B7684',
                        fontWeight: isSourcingActive ? 700 : 500,
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        boxShadow: isSourcingActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                    }}
                    onMouseOver={(e) => {
                        if (!isSourcingActive) e.currentTarget.style.background = '#F2F4F6';
                    }}
                    onMouseOut={(e) => {
                        if (!isSourcingActive) e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <Search size={20} color={isSourcingActive ? '#191F28' : '#8B95A1'} />
                    수집하기
                    {isSourcingActive && <ChevronRight size={16} color="#B0B8C1" style={{ marginLeft: 'auto' }} />}
                </button>

                <button
                    onClick={() => handleNav('수집된 상품')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px 12px',
                        background: isEditingActive ? '#FFFFFF' : 'transparent',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: isEditingActive ? '#191F28' : '#6B7684',
                        fontWeight: isEditingActive ? 700 : 500,
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        boxShadow: isEditingActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                    }}
                    onMouseOver={(e) => { if (!isEditingActive) e.currentTarget.style.background = '#F2F4F6'; }}
                    onMouseOut={(e) => { if (!isEditingActive) e.currentTarget.style.background = 'transparent'; }}
                >
                    <LayoutList size={20} color={isEditingActive ? '#191F28' : '#8B95A1'} />
                    수집된 상품
                    {isEditingActive && <ChevronRight size={16} color="#B0B8C1" style={{ marginLeft: 'auto' }} />}
                    {!isEditingActive && unprocessedProductCount > 0 && (
                        <div
                            id="sidebar-badge"
                            className={badgeAnimating ? 'badge-bounce' : ''}
                            style={{
                                marginLeft: 'auto',
                                background: '#3182F6',
                                color: '#FFFFFF',
                                borderRadius: '10px',
                                padding: '2px 8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                fontFamily: 'Pretendard, sans-serif',
                                minWidth: '20px',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(49,130,246,0.2)'
                            }}
                        >
                            {unprocessedProductCount}
                        </div>
                    )}
                </button>

                <button
                    onClick={() => handleNav('판매 중인 상품')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px 12px',
                        background: isRegistrationActive ? '#FFFFFF' : 'transparent',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: isRegistrationActive ? '#191F28' : '#6B7684',
                        fontWeight: isRegistrationActive ? 700 : 500,
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        boxShadow: isRegistrationActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                    }}
                    onMouseOver={(e) => { if (!isRegistrationActive) e.currentTarget.style.background = '#F2F4F6'; }}
                    onMouseOut={(e) => { if (!isRegistrationActive) e.currentTarget.style.background = 'transparent'; }}
                >
                    <PackageOpen size={20} color={isRegistrationActive ? '#191F28' : '#8B95A1'} />
                    판매 중인 상품
                    {isRegistrationActive && <ChevronRight size={16} color="#B0B8C1" style={{ marginLeft: 'auto' }} />}
                </button>
            </nav>

            {/* Preparation Toast */}
            {showToast && (
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'max-content',
                    background: 'rgba(25, 31, 40, 0.9)',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    zIndex: 2000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    준비 중이에요
                </div>
            )}
        </aside>
    );
};
