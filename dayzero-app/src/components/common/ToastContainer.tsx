import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { colors, font, radius } from '../../design/tokens';

export const ToastContainer: React.FC = () => {
    const { toasts } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '96px', // Positioned above the bell icon (24px bottom + 56px height + 16px gap)
            right: '24px',  // Aligned with the bell icon
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'flex-end',
            pointerEvents: 'none',
        }}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    style={{
                        background: colors.bg.surface,
                        color: colors.text.primary,
                        padding: '16px 20px',
                        borderRadius: `${radius.xl} ${radius.xl} ${radius.xs} ${radius.xl}`, // Tail pointing down-right
                        fontSize: font.size.base,
                        fontWeight: font.weight.semibold,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                        border: `1px solid ${colors.border.default}`,
                        display: 'flex',
                        alignItems: 'flex-start', // Align items to top since we have two lines
                        gap: '12px',
                        pointerEvents: 'auto',
                        animation: 'toastBubbleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        maxWidth: '400px',
                        position: 'relative',
                    }}
                >
                    {/* Tail element */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '12px',
                        width: '12px',
                        height: '12px',
                        background: colors.bg.surface,
                        borderBottom: `1px solid ${colors.border.default}`,
                        borderRight: `1px solid ${colors.border.default}`,
                        transform: 'rotate(45deg)',
                        zIndex: -1,
                    }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.4' }}>
                        <span>{toast.message}</span>
                        {toast.details && (
                            <span style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.text.secondary }}>
                                {toast.details}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            <style>{`
            @keyframes toastBubbleUp {
                0% {
                    opacity: 0;
                    transform: translateY(16px) scale(0.9);
                    transform-origin: bottom right;
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    transform-origin: bottom right;
                }
            }
            `}</style>
        </div>
    );
};
