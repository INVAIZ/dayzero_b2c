import { Languages, Trash2, Upload, X } from 'lucide-react';
import { colors, font, radius, shadow, spacing, zIndex } from '../../../design/tokens';

interface Props {
    selectedCount: number;
    translateCount: number;
    registerCount: number;
    onTranslate: () => void;
    onRegister: () => void;
    onDelete: () => void;
    onClear: () => void;
}

export const BulkActionBar: React.FC<Props> = ({
    selectedCount, translateCount, registerCount,
    onTranslate, onRegister, onDelete, onClear,
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
            animation: 'fadeInUp 0.2s ease',
        }}>
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

            <span style={{
                fontSize: font.size.md,
                color: 'rgba(255,255,255,0.7)',
                paddingRight: spacing['3'],
                borderRight: '1px solid rgba(255,255,255,0.15)',
            }}>
                {selectedCount}개 선택됨
            </span>

            <button
                onClick={onTranslate}
                disabled={translateCount === 0}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['2'],
                    padding: `${spacing['2']} ${spacing['4']}`,
                    background: translateCount > 0 ? colors.primary : 'rgba(255,255,255,0.1)',
                    color: translateCount > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                    border: 'none',
                    borderRadius: radius.md,
                    fontSize: font.size.md,
                    fontWeight: 600,
                    cursor: translateCount > 0 ? 'pointer' : 'default',
                }}
            >
                <Languages size={16} />
                AI 번역 ({translateCount})
            </button>

            <button
                onClick={onRegister}
                disabled={registerCount === 0}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['2'],
                    padding: `${spacing['2']} ${spacing['4']}`,
                    background: registerCount > 0 ? colors.primary : 'rgba(255,255,255,0.1)',
                    color: registerCount > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                    border: 'none',
                    borderRadius: radius.md,
                    fontSize: font.size.md,
                    fontWeight: 600,
                    cursor: registerCount > 0 ? 'pointer' : 'default',
                    opacity: registerCount > 0 ? 1 : 0.5,
                }}
            >
                <Upload size={16} />
                Qoo10 등록 ({registerCount})
            </button>

            <button
                onClick={onDelete}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['2'],
                    padding: `${spacing['2']} ${spacing['4']}`,
                    background: 'rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: radius.md,
                    fontSize: font.size.md,
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                <Trash2 size={16} />
                삭제
            </button>
        </div>
        </div>
    );
};
