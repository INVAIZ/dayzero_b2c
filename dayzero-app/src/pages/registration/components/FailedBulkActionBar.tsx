import { Pause, Play, Trash2, X, Bell, BellOff } from 'lucide-react';
import { colors, font, spacing, radius, shadow, zIndex } from '../../../design/tokens';

interface Props {
    selectedCount: number;
    onPause: () => void;
    onResume: () => void;
    onDelete: () => void;
    onClear: () => void;
    // 변동 알림
    onEnableMonitoring?: () => void;
    onDisableMonitoring?: () => void;
    hasMonitoredSelected?: boolean;
    hasUnmonitoredSelected?: boolean;
    hasPausedSelected?: boolean;
    hasActiveSelected?: boolean;
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
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: radius.full,
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <X size={16} color={colors.bg.surface} />
                </button>

                {/* 선택 수 */}
                <span style={{
                    color: colors.bg.surface,
                    fontSize: font.size.sm,
                    fontWeight: 600,
                    minWidth: '60px',
                }}>
                    {selectedCount}건 선택됨
                </span>

                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />

                {/* 변동 알림 받기 */}
                {hasUnmonitoredSelected && onEnableMonitoring && (
                    <ActionButton
                        onClick={onEnableMonitoring}
                        icon={<Bell size={14} />}
                        label="변동 알림 받기"
                        color={colors.primary}
                    />
                )}

                {/* 변동 알림 해제 */}
                {hasMonitoredSelected && onDisableMonitoring && (
                    <ActionButton
                        onClick={onDisableMonitoring}
                        icon={<BellOff size={14} />}
                        label="변동 알림 해제"
                        color="rgba(255,255,255,0.75)"
                    />
                )}

                {/* 판매 재개 (중지된 상품 선택 시) */}
                {hasPausedSelected && (
                    <ActionButton
                        onClick={onResume}
                        icon={<Play size={14} />}
                        label="판매 재개"
                        color={colors.success}
                    />
                )}

                {/* 판매 일시 중지 (판매 중인 상품 선택 시) */}
                {hasActiveSelected && (
                    <ActionButton
                        onClick={onPause}
                        icon={<Pause size={14} />}
                        label="판매 일시 중지"
                        color={colors.warningIcon}
                    />
                )}

                {/* 판매 종료 */}
                <ActionButton
                    onClick={onDelete}
                    icon={<Trash2 size={14} />}
                    label="판매 종료"
                    color={colors.danger}
                />
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const ActionButton = ({
    onClick, icon, label, color,
}: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    color: string;
}) => (
    <button
        onClick={onClick}
        style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: radius.md,
            padding: `${spacing['2']} ${spacing['4']}`,
            color,
            fontSize: font.size.sm,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing['1'],
            transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
    >
        {icon} {label}
    </button>
);
