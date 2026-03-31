/**
 * 가격·재고 자동 확인 설정 모달 + 토글 행
 */
import { Shield } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import { ANIM } from '../../../design/animations';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    autoPauseOnOutOfStock: boolean;
    onToggleOutOfStock: (enabled: boolean) => void;
    autoPauseOnNegativeMargin: boolean;
    onToggleNegativeMargin: (enabled: boolean) => void;
}

export const MonitoringSettingsModal: React.FC<Props> = ({
    isOpen, onClose,
    autoPauseOnOutOfStock, onToggleOutOfStock,
    autoPauseOnNegativeMargin, onToggleNegativeMargin,
}) => {
    if (!isOpen) return null;
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
                animation: 'overlayIn 0.2s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: colors.bg.surface,
                    borderRadius: radius.xl,
                    width: '420px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                <div style={{
                    padding: `${spacing['5']} ${spacing['6']}`,
                    borderBottom: `1px solid ${colors.border.default}`,
                    display: 'flex', alignItems: 'center', gap: spacing['2'],
                }}>
                    <Shield size={18} color={colors.primary} />
                    <span style={{ fontSize: font.size.lg, fontWeight: 700, color: colors.text.primary }}>
                        가격·재고 자동 확인 설정
                    </span>
                </div>

                <div style={{ padding: `${spacing['5']} ${spacing['6']}`, display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>
                    <SettingsToggleRow
                        label="품절 자동 관리"
                        description="품절 시 Qoo10 판매를 자동 일시중지하고, 재입고되면 자동으로 판매를 재개해요"
                        enabled={autoPauseOnOutOfStock}
                        onToggle={() => onToggleOutOfStock(!autoPauseOnOutOfStock)}
                    />
                    <div style={{ height: '1px', background: colors.border.default }} />
                    <SettingsToggleRow
                        label="판매가 자동 최적화"
                        description="원가가 바뀌면 설정한 마진율에 맞춰 Qoo10 판매가를 자동으로 조정해요"
                        enabled={autoPauseOnNegativeMargin}
                        onToggle={() => onToggleNegativeMargin(!autoPauseOnNegativeMargin)}
                    />
                </div>

                <div style={{
                    padding: `${spacing['4']} ${spacing['6']}`,
                    borderTop: `1px solid ${colors.border.default}`,
                    display: 'flex', justifyContent: 'flex-end',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: `${spacing['2']} ${spacing['5']}`,
                            background: colors.primary,
                            color: colors.bg.surface,
                            border: 'none',
                            borderRadius: radius.md,
                            fontSize: font.size.base,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        확인
                    </button>
                </div>
            </div>

            <style>{ANIM.overlayIn + ANIM.modalSlideUp}</style>
        </div>
    );
};

// ── SettingsToggleRow ────────────────────────────────────────────────────────

const SettingsToggleRow: React.FC<{
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}> = ({ label, description, enabled, onToggle }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['4'] }}>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: font.size.base, fontWeight: 600, color: colors.text.primary, marginBottom: spacing['1'] }}>
                {label}
            </div>
            <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, lineHeight: '1.5', wordBreak: 'keep-all' }}>
                {description}
            </div>
        </div>
        <button
            onClick={onToggle}
            style={{
                width: '48px', height: '28px',
                borderRadius: radius.full, border: 'none',
                background: enabled ? colors.primary : colors.bg.subtle,
                cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s', flexShrink: 0,
            }}
        >
            <div style={{
                width: '22px', height: '22px',
                borderRadius: '50%', background: colors.bg.surface,
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                position: 'absolute', top: '3px',
                left: enabled ? '23px' : '3px',
                transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
        </button>
    </div>
);
