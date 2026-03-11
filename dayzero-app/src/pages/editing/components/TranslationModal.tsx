import { X, Languages, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { colors, font, radius, shadow, spacing, zIndex } from '../../../design/tokens';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onStart: (targets: ('title' | 'description' | 'options')[]) => void;
    selectedCount: number;
    alreadyTranslatedCount: number;
}

export const TranslationModal: React.FC<Props> = ({ isOpen, onClose, onStart, selectedCount, alreadyTranslatedCount }) => {
    const [targets, setTargets] = useState<('title' | 'description' | 'options')[]>(['title', 'description', 'options']);

    if (!isOpen) return null;

    const toggleTarget = (t: 'title' | 'description' | 'options') => {
        setTargets(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: zIndex.modal, animation: 'fadeIn 0.2s ease',
        }}>
            <div style={{
                width: '400px', background: colors.bg.surface, borderRadius: radius.xl,
                boxShadow: shadow.lg, padding: spacing['6'], position: 'relative',
                animation: 'scaleIn 0.2s ease',
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: spacing['4'], right: spacing['4'], background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} color={colors.text.muted} />
                </button>

                <div style={{ marginBottom: spacing['5'] }}>
                    <h2 style={{ fontSize: font.size.lg, fontWeight: 700, marginBottom: spacing['1'] }}>AI 번역 설정</h2>
                    <p style={{ fontSize: font.size.sm, color: colors.text.tertiary }}>시작 버튼을 누르면 번역이 시작됩니다. ({selectedCount}건)</p>
                </div>

                {alreadyTranslatedCount > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: spacing['2'],
                        padding: spacing['3'], borderRadius: radius.md,
                        background: '#FFFBEB', border: '1px solid #FDE68A',
                        marginBottom: spacing['4'],
                    }}>
                        <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <p style={{ fontSize: font.size.sm, color: '#92400E', lineHeight: '1.5' }}>
                            선택된 상품 중 <strong>{alreadyTranslatedCount}건</strong>은 이미 번역된 상품입니다.<br />계속하면 재번역됩니다.
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'], marginBottom: spacing['6'] }}>
                    {(['title', 'description', 'options'] as const).map(t => (
                        <div
                            key={t}
                            onClick={() => toggleTarget(t)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: spacing['3'],
                                padding: spacing['4'], borderRadius: radius.lg,
                                border: `1px solid ${targets.includes(t) ? colors.primary : colors.border.default}`,
                                background: targets.includes(t) ? colors.bg.faint : colors.bg.surface,
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            <div style={{
                                width: '20px', height: '20px', borderRadius: radius.xs,
                                border: `1px solid ${targets.includes(t) ? colors.primary : colors.border.light}`,
                                background: targets.includes(t) ? colors.primary : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {targets.includes(t) && <Check size={14} color="#fff" />}
                            </div>
                            <span style={{ fontSize: font.size.md, fontWeight: 600 }}>
                                {t === 'title' ? '상품명 번역' : t === 'description' ? '상세설명 번역' : '옵션 번역'}
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => onStart(targets)}
                    disabled={targets.length === 0}
                    style={{
                        width: '100%', height: '48px', background: colors.primary, color: '#fff',
                        border: 'none', borderRadius: radius.lg, fontSize: font.size.md, fontWeight: 600,
                        cursor: targets.length > 0 ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing['2'],
                        opacity: targets.length > 0 ? 1 : 0.5,
                    }}
                >
                    <Languages size={18} />
                    AI 번역 시작
                </button>
            </div>
        </div>
    );
};
