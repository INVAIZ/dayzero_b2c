import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { colors, font, radius, shadow, zIndex } from '../../design/tokens';
import { ANIM } from '../../design/animations';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = '삭제하기',
    cancelText = '취소',
    type = 'danger'
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: zIndex.modal,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease',
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* Modal Content */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '440px',
                background: colors.bg.surface,
                borderRadius: radius.xl,
                boxShadow: shadow.lg,
                padding: '32px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: colors.text.muted,
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%',
                        display: 'flex',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.subtle}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <X size={20} />
                </button>

                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: type === 'danger' ? colors.dangerBg : colors.primaryLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    color: type === 'danger' ? colors.danger : colors.primary,
                }}>
                    <AlertCircle size={28} />
                </div>

                <h3 style={{
                    fontSize: font.size.xl,
                    fontWeight: font.weight.bold,
                    color: colors.text.primary,
                    marginBottom: '12px',
                    wordBreak: 'keep-all',
                }}>
                    {title}
                </h3>

                <div style={{
                    fontSize: font.size.base,
                    color: colors.text.tertiary,
                    lineHeight: '1.6',
                    marginBottom: '32px',
                    whiteSpace: typeof description === 'string' ? 'pre-wrap' : undefined,
                    wordBreak: 'keep-all',
                    width: '100%',
                }}>
                    {description}
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    width: '100%',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: radius.md,
                            background: colors.bg.subtle,
                            border: 'none',
                            fontSize: font.size.md,
                            fontWeight: font.weight.semibold,
                            color: colors.text.secondary,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = colors.border.default}
                        onMouseLeave={(e) => e.currentTarget.style.background = colors.bg.subtle}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: radius.md,
                            background: type === 'danger' ? colors.danger : colors.primary,
                            border: 'none',
                            fontSize: font.size.md,
                            fontWeight: font.weight.bold,
                            color: colors.white,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>

            <style>{ANIM.fadeIn + ANIM.slideUp}</style>
        </div>
    );
};
