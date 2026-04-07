import { X, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { colors, font, radius, shadow, spacing, zIndex } from '../../../design/tokens';

type Target = 'title' | 'description' | 'options' | 'thumbnail' | 'detailPage';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onStart: (targets: Target[]) => void;
    selectedCount: number;
    alreadyTranslatedCount: number;
    completedTargets?: Target[];
}

export const TranslationModal: React.FC<Props> = ({ isOpen, onClose, onStart, selectedCount, alreadyTranslatedCount, completedTargets = [] }) => {
    const [targets, setTargets] = useState<Target[]>([]);

    useEffect(() => {
        if (isOpen) {
            const defaults: Target[] = ['title', 'options', 'description'];
            setTargets(defaults.filter(t => !completedTargets.includes(t)));
        }
    }, [isOpen, completedTargets]);

    if (!isOpen) return null;

    const toggleTarget = (t: Target) => {
        if (completedTargets.includes(t)) return;
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
                    <h2 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, marginBottom: 0 }}>AI 편집 설정</h2>
                </div>

                {alreadyTranslatedCount > 0 && selectedCount > 1 && (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: spacing['2'],
                        padding: spacing['3'], borderRadius: radius.md,
                        background: colors.warningLight, border: `1px solid ${colors.warningBorder}`,
                        marginBottom: spacing['4'],
                    }}>
                        <AlertCircle size={16} color={colors.warningIcon} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <p style={{ fontSize: font.size.sm, color: colors.warningTextDark, lineHeight: '1.5' }}>
                            선택된 상품 중 <strong>{alreadyTranslatedCount}건</strong>은 이미 편집된 상품입니다.<br />계속하면 재편집됩니다.
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'], marginBottom: spacing['6'] }}>
                    {(['title', 'options', 'description', 'thumbnail', 'detailPage'] as const).map(t => {
                        const isCompleted = completedTargets.includes(t);
                        const isSelected = targets.includes(t);
                        return (
                            <div
                                key={t}
                                onClick={() => toggleTarget(t)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: spacing['3'],
                                    padding: spacing['4'], borderRadius: radius.lg,
                                    border: `1px solid ${isCompleted ? colors.border.default : isSelected ? colors.primary : colors.border.default}`,
                                    background: isCompleted ? colors.bg.subtle : isSelected ? colors.bg.faint : colors.bg.surface,
                                    cursor: isCompleted ? 'default' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: isCompleted ? 0.6 : 1,
                                }}
                            >
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: radius.xs,
                                    border: `1px solid ${isCompleted ? colors.primary : isSelected ? colors.primary : colors.border.light}`,
                                    background: isCompleted ? colors.primary : isSelected ? colors.primary : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {(isCompleted || isSelected) && <Check size={14} color={colors.white} />}
                                </div>
                                <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: isCompleted ? colors.text.tertiary : colors.text.primary, display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                                    {(t === 'title' || t === 'options' || t === 'description') && (
                                        <span style={{
                                            fontSize: font.size.xs, fontWeight: font.weight.bold,
                                            color: colors.primary, background: colors.primaryLight,
                                            padding: '2px 6px', borderRadius: radius.xs,
                                        }}>필수</span>
                                    )}
                                    {t === 'title' ? '상품명 번역' : t === 'description' ? '상세설명 작성 및 번역' : t === 'options' ? '옵션 번역' : t === 'thumbnail' ? '썸네일 번역' : '상세페이지 번역'}
                                    {isCompleted && <span style={{ fontSize: font.size.sm, fontWeight: font.weight.regular, marginLeft: spacing['2'] }}>이미 완료되었어요</span>}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => onStart(targets)}
                    disabled={targets.length === 0}
                    style={{
                        width: '100%', height: '48px', background: colors.primary, color: colors.white,
                        border: 'none', borderRadius: radius.lg, fontSize: font.size.md, fontWeight: font.weight.semibold,
                        cursor: targets.length > 0 ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing['2'],
                        opacity: targets.length > 0 ? 1 : 0.5,
                    }}
                >
                    {selectedCount}건 AI 편집 시작
                </button>
            </div>
        </div>
    );
};
