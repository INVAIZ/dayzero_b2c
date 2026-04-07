import React from 'react';
import { Check } from 'lucide-react';
import { colors, font } from '../../design/tokens';

interface OnboardingProgressProps {
    currentStep: number;
    totalSteps?: number;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ currentStep, totalSteps = 3 }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '32px',
            width: '100%'
        }}>
            {Array.from({ length: totalSteps }).map((_, index) => {
                const step = index + 1;
                const isCompleted = step < currentStep;
                const isCurrent = step === currentStep;

                return (
                    <React.Fragment key={step}>
                        {/* Step Circle */}
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: font.size.md,
                            fontWeight: font.weight.semibold,
                            transition: 'all 0.3s ease',
                            ...(isCompleted ? {
                                background: colors.primary,
                                color: colors.white,
                            } : isCurrent ? {
                                background: colors.bg.surface,
                                color: colors.primary,
                                border: `2px solid ${colors.primary}`,
                            } : {
                                background: colors.bg.subtle,
                                color: colors.text.muted,
                                border: '2px solid transparent',
                            })
                        }}>
                            {isCompleted ? <Check size={18} strokeWidth={3} /> : step}
                        </div>

                        {/* Connector Line */}
                        {step < totalSteps && (
                            <div style={{
                                width: '40px',
                                height: '2px',
                                borderRadius: '1px',
                                transition: 'background 0.3s ease',
                                background: isCompleted ? colors.primary : colors.border.default,
                            }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
