import { MinusCircle, X } from 'lucide-react';
import { colors, font, spacing, radius, shadow, zIndex } from '../../../design/tokens';

interface Props {
    selectedCount: number;
    onUnregister: () => void;
    onClear: () => void;
}

export const BulkActionBar: React.FC<Props> = ({ selectedCount, onUnregister, onClear }) => {
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

                {/* 등록 해제 */}
                <button
                    onClick={onUnregister}
                    style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: 'none',
                        borderRadius: radius.md,
                        padding: `${spacing['2']} ${spacing['4']}`,
                        color: colors.warningIcon,
                        fontSize: font.size.sm,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing['1'],
                    }}
                >
                    <MinusCircle size={14} /> 등록 해제
                </button>
            </div>
        </div>
    );
};
