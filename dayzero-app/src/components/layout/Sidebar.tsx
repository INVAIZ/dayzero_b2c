import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, LayoutList, PackageOpen, ChevronDown, Settings } from 'lucide-react';
import { useSourcingStore } from '../../store/useSourcingStore';
import { colors, spacing, radius, font, zIndex as z } from '../../design/tokens';

type NavItem = '수집하기' | '수집된 상품' | '판매 중인 상품';

export const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [badgeAnimating, setBadgeAnimating] = useState(false);

    const { unprocessedProductCount } = useSourcingStore();
    const prevCountRef = useRef(unprocessedProductCount);

    const isSourcingActive = location.pathname.startsWith('/sourcing');
    const isEditingActive = location.pathname.startsWith('/editing');
    const isRegistrationActive = location.pathname.startsWith('/registration');
    const isSettingsActive = location.pathname.startsWith('/settings');
    const settingsTab = isSettingsActive ? location.pathname.split('/settings/')[1] || '' : '';
    const [settingsExpanded, setSettingsExpanded] = useState(isSettingsActive);

    useEffect(() => {
        if (isSettingsActive) setSettingsExpanded(true);
    }, [isSettingsActive]);

    const SETTINGS_ITEMS = [
        { key: 'sales', label: '판매 설정' },
        { key: 'qoo10', label: 'Qoo10 연동' },
        { key: 'account', label: '계정' },
    ];

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
            background: colors.bg.page,
            borderRight: `1px solid ${colors.border.default}`,
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: `${spacing['10']} ${spacing['6']}`,
            fontFamily: font.family.sans,
            zIndex: z.nav,
        }}>
            {/* Logo */}
            <div style={{ padding: '0 12px', marginBottom: '48px', cursor: 'pointer' }} onClick={() => navigate('/sourcing')}>
                <img src="/DayZero Logo.png" alt="DayZero" style={{ height: '28px', width: 'auto' }} />
            </div>

            {/* Menu Items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                <button
                    onClick={() => handleNav('수집하기')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: spacing['3'], width: '100%',
                        padding: `${spacing['3']} ${spacing['3']}`,
                        background: isSourcingActive ? colors.border.default : 'transparent',
                        border: 'none', borderRadius: radius.lg, cursor: 'pointer',
                        color: isSourcingActive ? colors.text.primary : colors.text.tertiary,
                        fontWeight: 500, fontSize: font.size.base,
                        transition: 'all 0.2s',
                        boxShadow: isSourcingActive ? 'none' : 'none',
                    }}
                    onMouseOver={e => { if (!isSourcingActive) e.currentTarget.style.background = colors.bg.subtle; }}
                    onMouseOut={e => { if (!isSourcingActive) e.currentTarget.style.background = 'transparent'; }}
                >
                    <Search size={20} color={isSourcingActive ? colors.text.primary : colors.text.muted} />
                    수집하기
                </button>

                <button
                    onClick={() => handleNav('수집된 상품')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: spacing['3'], width: '100%',
                        padding: `${spacing['3']} ${spacing['3']}`,
                        background: isEditingActive ? colors.border.default : 'transparent',
                        border: 'none', borderRadius: radius.lg, cursor: 'pointer',
                        color: isEditingActive ? colors.text.primary : colors.text.tertiary,
                        fontWeight: 500, fontSize: font.size.base,
                        transition: 'all 0.2s',
                        boxShadow: isEditingActive ? 'none' : 'none',
                    }}
                    onMouseOver={e => { if (!isEditingActive) e.currentTarget.style.background = colors.bg.subtle; }}
                    onMouseOut={e => { if (!isEditingActive) e.currentTarget.style.background = 'transparent'; }}
                >
                    <LayoutList size={20} color={isEditingActive ? colors.text.primary : colors.text.muted} />
                    수집된 상품
                    {!isEditingActive && unprocessedProductCount > 0 && (
                        <div
                            id="sidebar-badge"
                            className={badgeAnimating ? 'badge-bounce' : ''}
                            style={{
                                marginLeft: 'auto', background: colors.primary, color: colors.bg.surface,
                                borderRadius: radius.img, padding: `2px ${spacing['2']}`, fontSize: font.size.xs,
                                fontWeight: 700, fontFamily: font.family.sans,
                                minWidth: '20px', textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(49,130,246,0.2)',
                            }}
                        >
                            {unprocessedProductCount}
                        </div>
                    )}
                </button>

                <button
                    onClick={() => handleNav('판매 중인 상품')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: spacing['3'], width: '100%',
                        padding: `${spacing['3']} ${spacing['3']}`,
                        background: isRegistrationActive ? colors.border.default : 'transparent',
                        border: 'none', borderRadius: radius.lg, cursor: 'pointer',
                        color: isRegistrationActive ? colors.text.primary : colors.text.tertiary,
                        fontWeight: 500, fontSize: font.size.base,
                        transition: 'all 0.2s',
                        boxShadow: isRegistrationActive ? 'none' : 'none',
                    }}
                    onMouseOver={e => { if (!isRegistrationActive) e.currentTarget.style.background = colors.bg.subtle; }}
                    onMouseOut={e => { if (!isRegistrationActive) e.currentTarget.style.background = 'transparent'; }}
                >
                    <PackageOpen size={20} color={isRegistrationActive ? colors.text.primary : colors.text.muted} />
                    판매 중인 상품
                </button>

                {/* 구분선 */}
                <div style={{ height: '1px', background: colors.border.default, margin: `${spacing['3']} ${spacing['3']}` }} />

                {/* 설정 확장 메뉴 */}
                <button
                    onClick={() => setSettingsExpanded(!settingsExpanded)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: spacing['3'], width: '100%',
                        padding: `${spacing['3']} ${spacing['3']}`,
                        background: 'transparent',
                        border: 'none', borderRadius: radius.lg, cursor: 'pointer',
                        color: colors.text.tertiary,
                        fontWeight: 500, fontSize: font.size.base,
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = colors.bg.subtle}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                    <Settings size={20} color={colors.text.muted} />
                    설정
                    <ChevronDown size={16} color={colors.text.muted} style={{ marginLeft: 'auto', transform: settingsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {/* 설정 하위 메뉴 (트리 라인 커넥터) */}
                {settingsExpanded && (
                    <div style={{ position: 'relative', paddingLeft: '32px', marginTop: '2px' }}>
                        {/* 세로 트리 라인 */}
                        <div style={{
                            position: 'absolute', left: '22px', top: 0,
                            bottom: '20px', width: '1px',
                            background: colors.border.default,
                        }} />

                        {SETTINGS_ITEMS.map((item, idx) => {
                            const active = settingsTab === item.key;
                            return (
                                <div key={item.key} style={{ position: 'relative', marginBottom: idx < SETTINGS_ITEMS.length - 1 ? '2px' : 0 }}>
                                    {/* 가로 브랜치 라인 */}
                                    <div style={{
                                        position: 'absolute', left: '-10px', top: '50%',
                                        width: '10px', height: '1px',
                                        background: colors.border.default,
                                    }} />
                                    <button
                                        onClick={() => navigate(`/settings/${item.key}`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', width: '100%',
                                            padding: `10px ${spacing['3']}`,
                                            background: active ? colors.border.default : 'transparent',
                                            border: 'none', borderRadius: radius.md, cursor: 'pointer',
                                            color: active ? colors.text.primary : colors.text.tertiary,
                                            fontWeight: 500,
                                            fontSize: font.size.base, transition: 'all 0.15s', textAlign: 'left',
                                            boxShadow: active ? 'none' : 'none',
                                        }}
                                        onMouseOver={e => { if (!active) e.currentTarget.style.background = colors.bg.subtle; }}
                                        onMouseOut={e => { if (!active) e.currentTarget.style.background = active ? colors.border.default : 'transparent'; }}
                                    >
                                        {item.label}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </nav>

            {/* Spacer */}
            <div style={{ flex: 1 }} />
        </aside>
    );
};
