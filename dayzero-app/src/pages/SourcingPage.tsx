import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSourcingStore } from '../store/useSourcingStore';
import { MainLayout } from '../components/layout/MainLayout';
import { getProviderLogo } from '../types/sourcing';
import { Link2, Zap, Clock, LayoutGrid, Package, Check, Trash2, GripVertical } from 'lucide-react';
import { UrlSourcingContent } from './sourcing/components/UrlSourcingContent';
import { colors, font, radius, spacing } from '../design/tokens';
import { ConfirmModal } from '../components/common/ConfirmModal';

const formatLastRun = (dateString?: string) => {
    if (!dateString) return '아직 실행되지 않음';
    const date = new Date(dateString);
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
};


export default function SourcingPage() {
    const navigate = useNavigate();
    const {
        schedules, toggleSchedule, deleteSchedule, reorderSchedules,
        selectedAutoFilter: selectedFilter,
        setSelectedAutoFilter: setSelectedFilter,
    } = useSourcingStore();
    const [activeTab, setActiveTab] = useState<'auto' | 'url'>('auto');
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; scheduleId: string | null }>({
        isOpen: false,
        scheduleId: null
    });


    const handleDrop = (targetId: string) => {
        if (!draggedId || draggedId === targetId) { setDraggedId(null); return; }
        const newSchedules = [...schedules];
        const fromIdx = newSchedules.findIndex(s => s.id === draggedId);
        const toIdx = newSchedules.findIndex(s => s.id === targetId);
        const [removed] = newSchedules.splice(fromIdx, 1);
        newSchedules.splice(toIdx, 0, removed);
        reorderSchedules(newSchedules);
        setDraggedId(null);
    };

    const tabStyle = (isActive: boolean): React.CSSProperties => ({
        padding: `${spacing['3']} ${spacing['6']}`,
        fontSize: font.size.base,
        fontWeight: isActive ? font.weight.bold : font.weight.medium,
        color: isActive ? colors.text.primary : colors.text.muted,
        background: isActive ? colors.bg.surface : 'transparent',
        borderRadius: radius.md,
        border: 'none',
        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: spacing['2'],
    });

    const renderTabs = () => (
        <div style={{
            display: 'inline-flex',
            background: colors.bg.subtle,
            borderRadius: radius.lg,
            padding: spacing['1'],
            marginBottom: spacing['5']
        }}>
            <button onClick={() => setActiveTab('auto')} style={tabStyle(activeTab === 'auto')}>
                <Zap size={16} fill={activeTab === 'auto' ? colors.text.primary : 'none'} color={activeTab === 'auto' ? colors.text.primary : colors.text.muted} />
                자동 수집
            </button>
            <button onClick={() => setActiveTab('url')} style={tabStyle(activeTab === 'url')}>
                <Link2 size={16} />
                직접 수집
            </button>
        </div>
    );

    const availableProviders = useMemo(
        () => Array.from(new Set(schedules.map(s => s.provider))),
        [schedules]
    );
    const filteredSchedules = useMemo(
        () => selectedFilter === '전체' ? schedules : schedules.filter(s => s.provider === selectedFilter),
        [schedules, selectedFilter]
    );

    const renderSchedules = () => {
        const filters = ['전체', ...availableProviders];

        return (
            <div style={{ marginBottom: spacing['12'] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['5'] }}>
                    <h2 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary }}>등록된 자동 수집 목록</h2>
                    {schedules.length > 0 && (
                        <button onClick={() => navigate('/sourcing/auto')} style={{ background: 'none', color: colors.primary, border: 'none', fontSize: font.size.md, fontWeight: font.weight.semibold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: spacing['1'] }}>
                            + 자동 수집 추가
                        </button>
                    )}
                </div>

                {schedules.length > 0 && (
                    <div style={{ display: 'flex', gap: spacing['2'], marginBottom: spacing['5'], overflowX: 'auto', paddingBottom: spacing['1'] }}>
                        {filters.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setSelectedFilter(filter)}
                                style={{
                                    padding: filter === '전체' ? `${spacing['2']} ${spacing['4']}` : (selectedFilter === filter ? `${spacing['2']} ${spacing['4']}` : spacing['2']),
                                    borderRadius: radius.full,
                                    fontSize: font.size.md,
                                    fontWeight: selectedFilter === filter ? font.weight.semibold : font.weight.medium,
                                    color: selectedFilter === filter ? colors.primary : colors.text.tertiary,
                                    background: selectedFilter === filter ? colors.primaryLight : colors.bg.surface,
                                    border: selectedFilter === filter ? `1px solid ${colors.primaryLight}` : `1px solid ${colors.border.default}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: filter === '전체' ? '6px' : (selectedFilter === filter ? '6px' : '0px')
                                }}
                            >
                                <div style={{
                                    width: selectedFilter === filter ? '14px' : '0px',
                                    opacity: selectedFilter === filter ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Check size={14} strokeWidth={3} style={{ flexShrink: 0 }} />
                                </div>

                                {filter !== '전체' && (
                                    <img src={getProviderLogo(filter)} alt={filter} style={{ width: '16px', height: '16px', borderRadius: radius.xs, objectFit: 'cover' }} />
                                )}

                                <div style={{
                                    maxWidth: filter === '전체' || selectedFilter === filter ? '200px' : '0px',
                                    opacity: filter === '전체' || selectedFilter === filter ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {filter}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {schedules.length === 0 ? (
                    <div style={{
                        background: colors.bg.surface,
                        borderRadius: '24px',
                        border: `1px solid ${colors.border.default}`,
                        padding: '60px 40px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ position: 'relative', marginBottom: spacing['4'] }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: radius.xl,
                                background: colors.bg.info,
                                border: `1px solid ${colors.primaryLightBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Zap size={24} color={colors.primary} />
                            </div>
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                right: '-4px',
                                width: '22px',
                                height: '22px',
                                borderRadius: radius.full,
                                background: colors.bg.surface,
                                border: `1.5px solid ${colors.primaryLightBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Clock size={12} color={colors.primary} />
                            </div>
                        </div>
                        <h3 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, marginBottom: spacing['2'] }}>
                            자동 수집을 시작해보세요
                        </h3>
                        <p style={{ fontSize: font.size.base, color: colors.text.tertiary, marginBottom: spacing['8'], lineHeight: '1.5' }}>
                            매일 아침 바쁜 당신을 위해,<br />
                            AI가 알아서 상품을 찾아오는 자동 수집을 시작해보세요.
                        </p>
                        <button
                            onClick={() => navigate('/sourcing/auto')}
                            className="btn-primary"
                            style={{
                                width: '200px',
                                height: '52px',
                                borderRadius: radius.lg,
                                background: colors.primary,
                                color: colors.bg.surface,
                                fontSize: font.size.base,
                                fontWeight: font.weight.bold,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            추가하기
                        </button>
                    </div>
                ) : filteredSchedules.length === 0 ? (
                    <div style={{ padding: spacing['10'], textAlign: 'center', color: colors.text.tertiary, fontSize: font.size.base, background: colors.bg.surface, borderRadius: radius.xl, border: `1px solid ${colors.border.default}`, animation: 'fadeIn 0.2s ease' }}>
                        해당 쇼핑몰의 자동 수집이 없어요.
                    </div>
                ) : (
                    <div key={selectedFilter} style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'], animation: 'fadeInUp 0.3s ease' }}>
                        {filteredSchedules.map(schedule => {
                            const isHovered = hoveredId === schedule.id;
                            return (
                                <div
                                    key={schedule.id}
                                    draggable
                                    onDragStart={() => setDraggedId(schedule.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(schedule.id)}
                                    onDragEnd={() => setDraggedId(null)}
                                    onMouseEnter={() => setHoveredId(schedule.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    style={{
                                        position: 'relative',
                                        background: colors.bg.surface,
                                        borderRadius: radius.xl,
                                        padding: '20px 20px 20px 36px',
                                        border: `1px solid ${draggedId === schedule.id ? colors.primary : colors.border.default}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing['3'],
                                        opacity: draggedId === schedule.id ? 0.5 : 1,
                                        transition: 'opacity 0.15s, border-color 0.15s',
                                        cursor: 'default',
                                    }}
                                >
                                    {/* Drag Handle — hover only */}
                                    <div style={{ position: 'absolute', left: '10px', color: colors.text.muted, cursor: 'grab', display: 'flex', alignItems: 'center', opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                                        <GripVertical size={18} />
                                    </div>

                                    <div
                                        onClick={() => navigate(`/sourcing/auto?edit=${schedule.id}`)}
                                        style={{ display: 'flex', alignItems: 'center', gap: spacing['4'], flex: 1, cursor: 'pointer', minWidth: 0 }}
                                    >
                                        <img src={getProviderLogo(schedule.provider)} alt={schedule.provider} style={{ width: '40px', height: '40px', borderRadius: radius.img, border: `1px solid ${colors.border.default}`, flexShrink: 0 }} />
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: spacing['2'], display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing['1'] }}>
                                                {schedule.provider}에서
                                                <span style={{ padding: `${spacing['1']} ${spacing['2']}`, background: colors.primaryLight, color: colors.primary, borderRadius: radius.sm, fontSize: font.size.sm, display: 'flex', alignItems: 'center', gap: spacing['1'] }}>
                                                    <LayoutGrid size={12} />
                                                    {schedule.categoryPath}
                                                </span>
                                                카테고리의
                                                <span style={{ padding: `${spacing['1']} ${spacing['2']}`, background: colors.primaryLight, color: colors.primary, borderRadius: radius.sm, fontSize: font.size.sm, display: 'flex', alignItems: 'center', gap: spacing['1'] }}>
                                                    <Package size={12} />
                                                    {schedule.criteria}
                                                </span>
                                                을
                                                <span style={{ padding: `${spacing['1']} ${spacing['2']}`, background: colors.primaryLight, color: colors.primary, borderRadius: radius.sm, fontSize: font.size.sm, display: 'flex', alignItems: 'center', gap: spacing['1'] }}>
                                                    <Clock size={12} />
                                                    매일 {schedule.timeString}
                                                </span>
                                                에 수집해요.
                                            </div>
                                            <div style={{ fontSize: font.size.sm, color: colors.text.tertiary }}>
                                                마지막 실행: {formatLastRun(schedule.lastRunAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Button — hover only */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteModal({ isOpen: true, scheduleId: schedule.id });
                                        }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: spacing['1'], display: 'flex', alignItems: 'center', color: colors.text.muted, flexShrink: 0, borderRadius: radius.sm, opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s, color 0.15s', pointerEvents: isHovered ? 'auto' : 'none' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = colors.danger)}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = colors.text.muted)}
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleSchedule(schedule.id); }}
                                        style={{ width: '44px', height: '24px', borderRadius: radius.full, background: schedule.isActive ? colors.primary : colors.border.default, border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', padding: 0, flexShrink: 0 }}
                                    >
                                        <div style={{ width: '20px', height: '20px', borderRadius: radius.full, background: colors.bg.surface, position: 'absolute', top: '2px', left: schedule.isActive ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <MainLayout>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
            <div style={{ paddingBottom: '100px' }}>
                <div style={{ animation: 'fadeInUp 0.6s ease' }}>
                <h1 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary, marginBottom: spacing['2'] }}>
                    상품 수집
                </h1>
                <p style={{ fontSize: font.size.base, color: colors.text.tertiary, marginBottom: spacing['8'] }}>
                    수집 방식을 선택하고 인기 상품을 빠르게 수집해보세요.
                </p>
                </div>

                {renderTabs()}

                {activeTab === 'auto' ? (
                    <div key="auto" style={{ animation: 'fadeInUp 0.4s ease' }}>
                        {schedules.length === 0 ? (
                            <div style={{ background: colors.bg.faint, borderRadius: radius.lg, padding: spacing['4'], marginBottom: spacing['8'], display: 'flex', gap: spacing['3'], alignItems: 'flex-start' }}>
                                <Zap size={16} color={colors.primary} style={{ marginTop: '3px', flexShrink: 0 }} />
                                <div>
                                    <h3 style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: spacing['1'] }}>자동 수집이란?</h3>
                                    <p style={{ fontSize: font.size.md, color: colors.text.secondary, lineHeight: '1.5' }}>
                                        원하는 쇼핑몰의 카테고리를 설정해두면 매일 오전 07시에 조건에 맞는 상품을 알아서 찾아옵니다.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                background: colors.bg.info,
                                border: `1px solid ${colors.primaryLightBorder}`,
                                borderRadius: radius.lg,
                                padding: `${spacing['4']} ${spacing['5']}`,
                                marginBottom: spacing['6'],
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: spacing['4'],
                            }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    borderRadius: radius.md,
                                    background: colors.bg.surface,
                                    border: `1px solid ${colors.primaryLightBorder}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Zap size={20} color={colors.primary} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.text.tertiary, marginBottom: spacing['1'] }}>
                                        자동 수집
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], marginBottom: spacing['2'], flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.primary }}>
                                            {schedules.length}건
                                            <span style={{ fontWeight: font.weight.medium, color: colors.text.muted, fontSize: font.size.sm }}> / 최대 10건</span>
                                        </span>
                                    </div>
                                    <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, lineHeight: '1.5', display: 'flex', alignItems: 'center', gap: spacing['1'] }}>
                                        <Clock size={12} color={colors.primary} style={{ flexShrink: 0 }} />
                                        설정한 시간에 매일 자동으로 상품을 수집해요.
                                    </div>
                                </div>
                            </div>
                        )}

                        {renderSchedules()}
                    </div>
                ) : (
                    <div key="url">
                        <UrlSourcingContent />
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, scheduleId: null })}
                onConfirm={() => {
                    if (deleteModal.scheduleId) {
                        deleteSchedule(deleteModal.scheduleId);
                    }
                }}
                title="자동 수집을 삭제할까요?"
                description="삭제된 설정은 복구할 수 없으며, 더 이상 매일 자동으로 상품을 수집하지 않게 됩니다."
                confirmText="삭제하기"
                cancelText="취소"
            />

        </MainLayout>
    );
}
