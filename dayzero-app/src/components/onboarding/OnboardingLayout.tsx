import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { colors, font, spacing, radius } from '../../design/tokens';

interface StepItem {
    id: number;
    label: string;
}

interface OnboardingLayoutProps {
    children: ReactNode;
    currentStep: number;
    onStepClick?: (stepId: number) => void;
    exiting?: boolean;
}

const STEPS: StepItem[] = [
    { id: 1, label: '계정 연동' },
    { id: 2, label: '기본 정보' },
    { id: 3, label: '마진/배송비' },
];

const MAX_STEP_KEY = 'onboarding_max_step';
const PREV_STEP_KEY = 'onboarding_prev_step';

function getMaxVisitedStep(): number {
    const val = sessionStorage.getItem(MAX_STEP_KEY);
    return val ? Number(val) : 1;
}

function getPrevStep(): number {
    const val = sessionStorage.getItem(PREV_STEP_KEY);
    return val ? Number(val) : 1;
}

export default function OnboardingLayout({ children, currentStep, onStepClick, exiting }: OnboardingLayoutProps) {
    const prevStepRef = useRef(getPrevStep());
    const [visualStep, setVisualStep] = useState(prevStepRef.current);
    const [contentVisible, setContentVisible] = useState(false);
    const [maxVisited, setMaxVisited] = useState(() => Math.max(getMaxVisitedStep(), currentStep));

    useEffect(() => {
        if (currentStep > maxVisited) {
            setMaxVisited(currentStep);
            sessionStorage.setItem(MAX_STEP_KEY, String(currentStep));
        }
    }, [currentStep, maxVisited]);

    useEffect(() => {
        const needsTransition = prevStepRef.current !== currentStep;
        // 프로그레스 바 먼저 전환
        const stepTimer = setTimeout(() => {
            setVisualStep(currentStep);
            sessionStorage.setItem(PREV_STEP_KEY, String(currentStep));
            prevStepRef.current = currentStep;
        }, 100);
        // 프로그레스 바 애니메이션 완료 후 콘텐츠 표시
        const contentTimer = setTimeout(() => {
            setContentVisible(true);
        }, needsTransition ? 650 : 50);
        return () => {
            clearTimeout(stepTimer);
            clearTimeout(contentTimer);
        };
    }, [currentStep]);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: colors.bg.page,
                fontFamily: font.family.sans,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: `${spacing['10']} ${spacing['6']}`,
                overflowY: 'auto',
            }}
        >
            {/* Logo */}
            <div style={{ marginBottom: spacing['8'] }}>
                <img
                    src="/DayZero Logo.png"
                    alt="DayZero"
                    style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
                />
            </div>

            {/* Progress Stepper */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '580px',
                    marginBottom: spacing['12'],
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                    }}
                >
                    {STEPS.map((step, idx) => {
                        const isCompleted = step.id < visualStep;
                        const isCurrent = step.id === visualStep;
                        const isVisited = step.id <= maxVisited;
                        const canClick = onStepClick && step.id !== currentStep && isVisited;

                        return (
                            <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start' }}>
                                {/* Step column */}
                                <div
                                    className={canClick ? 'step-clickable' : undefined}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        cursor: canClick ? 'pointer' : 'default',
                                        padding: `0 ${spacing['1']}`,
                                    }}
                                    onClick={() => canClick && onStepClick(step.id)}
                                >
                                    {/* Circle */}
                                    <div
                                        className={isCurrent ? 'step-current' : undefined}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: radius.full,
                                            background: isCompleted
                                                ? colors.primary
                                                : isCurrent
                                                  ? colors.bg.surface
                                                  : colors.bg.subtle,
                                            border: isCurrent
                                                ? `2.5px solid ${colors.primary}`
                                                : isCompleted
                                                  ? 'none'
                                                  : `2px solid ${colors.border.default}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isCompleted
                                                ? colors.bg.surface
                                                : isCurrent
                                                  ? colors.primary
                                                  : colors.text.muted,
                                            fontSize: font.size.sm,
                                            fontWeight: font.weight.bold,
                                            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                            flexShrink: 0,
                                            boxShadow: isCurrent
                                                ? `0 0 0 4px ${colors.primaryHover}`
                                                : 'none',
                                        }}
                                    >
                                        {isCompleted ? <Check size={16} strokeWidth={3} /> : step.id}
                                    </div>

                                    {/* Label */}
                                    <span
                                        style={{
                                            fontSize: font.size.sm,
                                            fontWeight: isCurrent
                                                ? font.weight.semibold
                                                : font.weight.medium,
                                            color: isCurrent || isCompleted
                                                ? colors.text.primary
                                                : colors.text.muted,
                                            whiteSpace: 'nowrap',
                                            marginTop: spacing['2'],
                                            transition: 'color 0.5s ease',
                                        }}
                                    >
                                        {step.label}
                                    </span>
                                </div>

                                {/* Connector */}
                                {idx < STEPS.length - 1 && (
                                    <div
                                        style={{
                                            width: '80px',
                                            height: '3px',
                                            borderRadius: radius.full,
                                            background: colors.border.default,
                                            margin: `16px ${spacing['3']} 0`,
                                            flexShrink: 0,
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                height: '100%',
                                                width: isCompleted ? '100%' : '0%',
                                                background: colors.primary,
                                                borderRadius: radius.full,
                                                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '580px',
                    opacity: exiting || !contentVisible ? 0 : 1,
                    transform: exiting
                        ? 'translateY(-12px)'
                        : contentVisible
                          ? 'translateY(0)'
                          : 'translateY(16px)',
                    transition: exiting
                        ? 'opacity 0.3s cubic-bezier(0.4, 0, 1, 1), transform 0.3s cubic-bezier(0.4, 0, 1, 1)'
                        : 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {children}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOutUp {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-12px); }
                }
                @keyframes subtlePulse {
                    0%, 100% { box-shadow: 0 0 0 4px ${colors.primaryHover}; }
                    50% { box-shadow: 0 0 0 6px ${colors.primaryHover}; }
                }
                .step-current {
                    animation: subtlePulse 2.5s ease-in-out infinite;
                }
                .step-clickable:hover > div:first-child {
                    transform: scale(1.1);
                    box-shadow: 0 0 0 3px ${colors.primaryHover} !important;
                }
                .step-clickable:hover span {
                    color: ${colors.primary} !important;
                }
                .step-clickable:active > div:first-child {
                    transform: scale(0.95);
                }
            `}</style>
        </div>
    );
}
