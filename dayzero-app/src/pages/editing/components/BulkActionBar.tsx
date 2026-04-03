import { Trash2, Upload, X } from 'lucide-react';
import { AIIcon } from '../../../components/common/AIIcon';
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

            <div
                style={{ position: 'relative' }}
                onMouseEnter={e => { if (translateCount === 0 && selectedCount > 0) (e.currentTarget.querySelector('[data-bulk-tip]') as HTMLElement)?.style.setProperty('display', 'block'); }}
                onMouseLeave={e => { (e.currentTarget.querySelector('[data-bulk-tip]') as HTMLElement)?.style.setProperty('display', 'none'); }}
            >
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
                    <AIIcon size={16} color="#fff" />
                    AI로 편집하기 ({translateCount})
                </button>
                {translateCount === 0 && selectedCount > 0 && (
                    <div data-bulk-tip="" style={{
                        display: 'none',
                        position: 'absolute', bottom: 'calc(100% + 14px)',
                        left: '50%',
                        pointerEvents: 'none', zIndex: zIndex.dropdown,
                    }}>
                        <div style={{
                            position: 'relative', left: '-50%',
                            background: colors.text.primary, color: '#fff',
                            fontSize: font.size.xs, fontWeight: 500,
                            padding: '5px 10px',
                            borderRadius: radius.md, whiteSpace: 'nowrap',
                            animation: 'tooltipFadeIn 0.15s ease',
                        }}>
                            선택한 상품은 이미 편집이 완료됐어요
                            <div style={{
                                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                                border: '5px solid transparent', borderTopColor: colors.text.primary,
                            }} />
                        </div>
                    </div>
                )}
            </div>

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
                Qoo10에 등록하기 ({registerCount})
            </button>

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
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                <Trash2 size={16} />
                삭제하기
            </button>
        </div>
        </div>
    );
};
