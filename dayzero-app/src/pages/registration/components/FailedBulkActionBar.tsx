import { Pause, Play, Trash2, X, Bell, BellOff } from 'lucide-react';
import { colors, font, spacing, radius, shadow, zIndex } from '../../../design/tokens';
import { ANIM } from '../../../design/animations';

interface Props {
    selectedCount: number;
    onPause: () => void;
    onResume: () => void;
    onDelete: () => void;
    onClear: () => void;
    // 가격·재고 자동 확인
    onEnableMonitoring?: () => void;
    onDisableMonitoring?: () => void;
    hasMonitoredSelected?: boolean;
    hasUnmonitoredSelected?: boolean;
    hasPausedSelected?: boolean;
    hasActiveSelected?: boolean;
    // 각 액션 대상 카운트
    monitoredCount?: number;
    unmonitoredCount?: number;
    pausedCount?: number;
    activeCount?: number;
}

export const BulkActionBar: React.FC<Props> = ({
    selectedCount,
    onPause,
    onResume,
    onDelete,
    onClear,
    onEnableMonitoring,
    onDisableMonitoring,
    hasMonitoredSelected = false,
    hasUnmonitoredSelected = false,
    hasPausedSelected = false,
    hasActiveSelected = false,
    monitoredCount = 0,
    unmonitoredCount = 0,
    pausedCount = 0,
    activeCount = 0,
}) => {
    if (selectedCount === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: spacing['8'],
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: zIndex.sticky,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['3'],
                padding: `${spacing['3']} ${spacing['5']}`,
                background: colors.text.primary,
                borderRadius: radius.xl,
                boxShadow: shadow.lg,
                pointerEvents: 'auto',
                animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {/* 닫기 */}
                <button
                    onClick={onClear}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: radius.md,
                        color: 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        flexShrink: 0,
                    }}
                >
                    <X size={14} />
                </button>

                {/* 선택 수 */}
                <span style={{
                    fontSize: font.size.md,
                    color: 'rgba(255,255,255,0.7)',
                    paddingRight: spacing['3'],
                    borderRight: '1px solid rgba(255,255,255,0.15)',
                }}>
                    {selectedCount}건 선택됨
                </span>

                {/* 가격·품절 확인 켜기 */}
                {hasUnmonitoredSelected && onEnableMonitoring && (
                    <ActionButton
                        onClick={onEnableMonitoring}
                        icon={<Bell size={16} />}
                        label={`가격·품절 확인 켜기 (${unmonitoredCount})`}
                        color={colors.white}
                        bg={colors.primary}
                    />
                )}

                {/* 가격·품절 확인 끄기 */}
                {hasMonitoredSelected && onDisableMonitoring && (
                    <ActionButton
                        onClick={onDisableMonitoring}
                        icon={<BellOff size={16} />}
                        label={`가격·품절 확인 끄기 (${monitoredCount})`}
                        color="rgba(255,255,255,0.75)"
                    />
                )}

                {/* 판매 재개 (중지된 상품 선택 시) */}
                {hasPausedSelected && (
                    <ActionButton
                        onClick={onResume}
                        icon={<Play size={16} />}
                        label={`판매 재개 (${pausedCount})`}
                        color={colors.success}
                    />
                )}

                {/* 판매 일시 중지 (판매 중인 상품 선택 시) */}
                {hasActiveSelected && (
                    <ActionButton
                        onClick={onPause}
                        icon={<Pause size={16} />}
                        label={`판매 일시 중지 (${activeCount})`}
                        color={colors.warningIcon}
                    />
                )}

                {/* 삭제하기 */}
                <button
                    onClick={onDelete}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing['2'],
                        padding: `${spacing['2']} ${spacing['4']}`,
                        background: 'rgba(255,255,255,0.1)',
                        color: colors.danger,
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: radius.md,
                        fontSize: font.size.md,
                        fontWeight: font.weight.semibold,
                        cursor: 'pointer',
                    }}
                >
                    <Trash2 size={16} />
                    삭제하기
                </button>
            </div>

            <style>{ANIM.fadeInUp}</style>
        </div>
    );
};

const ActionButton = ({
    onClick, icon, label, color, bg,
}: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    color: string;
    bg?: string;
}) => {
    const defaultBg = bg ?? 'rgba(255,255,255,0.15)';
    const hoverBg = bg ? bg : 'rgba(255,255,255,0.25)';
    return (
        <button
            onClick={onClick}
            style={{
                background: defaultBg,
                border: 'none',
                borderRadius: radius.md,
                padding: `${spacing['2']} ${spacing['4']}`,
                color,
                fontSize: font.size.md,
                fontWeight: font.weight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing['2'],
                transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!bg) e.currentTarget.style.background = hoverBg; }}
            onMouseLeave={e => { if (!bg) e.currentTarget.style.background = defaultBg; }}
        >
            {icon} {label}
        </button>
    );
};
