import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { colors, font, spacing, radius, shadow } from '../../../design/tokens';
import type { RegistrationJob } from '../../../types/registration';

interface Props {
    job: RegistrationJob;
    onDismiss?: () => void;
}

export const RegistrationProgressSection: React.FC<Props> = ({ job, onDismiss }) => {
    const percent = job.totalCount > 0 ? Math.round((job.currentCount / job.totalCount) * 100) : 0;
    // 마운트 시 0%에서 시작 → 실제 percent로 애니메이션
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const t = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(t);
    }, []);
    const barPercent = mounted ? percent : 0;

    const prevCount = useRef(job.currentCount);
    const [justCompleted, setJustCompleted] = useState<string | null>(null);
    const [phase, setPhase] = useState<'in' | 'done' | 'out'>('in');

    useEffect(() => {
        if (job.currentCount > prevCount.current && job.results.length > 0) {
            const latest = job.results[job.results.length - 1];
            setJustCompleted(latest.product.titleKo);
            const timer = setTimeout(() => setJustCompleted(null), 2500);
            prevCount.current = job.currentCount;
            return () => clearTimeout(timer);
        }
        prevCount.current = job.currentCount;
    }, [job.currentCount, job.results]);

    const dismissRef = useRef(onDismiss);
    dismissRef.current = onDismiss;

    useEffect(() => {
        if (job.status !== 'completed') return;
        if (phase !== 'in') return;
        // 100% 프로그레스 바가 채워지는 애니메이션(0.8s)을 기다린 후 done 전환
        const t0 = setTimeout(() => setPhase('done'), 800);
        const t1 = setTimeout(() => setPhase('out'), 2200);
        const t2 = setTimeout(() => dismissRef.current?.(), 2700);
        return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [job.status]);

    const isDone = phase === 'done' || phase === 'out';

    return (
        <div style={{
            background: isDone
                ? `linear-gradient(135deg, ${colors.successBg} 0%, ${colors.bg.surface} 100%)`
                : `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.bg.surface} 100%)`,
            border: `1px solid ${isDone ? colors.successBorder : colors.primaryBorder}`,
            borderRadius: radius.xl,
            padding: spacing['6'],
            marginBottom: spacing['6'],
            boxShadow: shadow.sm,
            position: 'relative',
            overflow: 'hidden',
            animation: phase === 'in'
                ? 'progressCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                : phase === 'out'
                    ? 'progressCardOut 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    : 'none',
            transition: 'background 0.4s, border-color 0.4s',
        }}>
            {/* 배경 장식 원 */}
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: isDone ? colors.success : colors.primary,
                opacity: 0.04,
                pointerEvents: 'none',
            }} />

            {/* 상단: 로고 + 텍스트 + 퍼센트 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['3'],
                marginBottom: spacing['4'],
                position: 'relative',
            }}>
                {/* 로고 아이콘 */}
                <div style={{
                    width: '44px', height: '44px',
                    borderRadius: radius.lg,
                    background: colors.bg.surface,
                    border: `1px solid ${isDone ? colors.successBorder : colors.primaryBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'border-color 0.4s',
                    position: 'relative',
                }}>
                    {isDone
                        ? <CheckCircle2 size={22} color={colors.success} />
                        : <>
                            <img src="/logos/큐텐.png" alt="Qoo10" style={{ height: '18px', objectFit: 'contain' }} />
                            <Loader2
                                size={14}
                                color={colors.primary}
                                className="spin"
                                style={{ position: 'absolute', bottom: '-2px', right: '-2px' }}
                            />
                        </>
                    }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: font.size.base,
                        fontWeight: 700,
                        color: colors.text.primary,
                        marginBottom: '3px',
                    }}>
                        {isDone ? '등록이 완료되었어요!' : 'Qoo10 JP에 등록하고 있어요'}
                    </div>
                    <div style={{
                        fontSize: font.size.sm,
                        color: colors.text.tertiary,
                        fontWeight: 500,
                    }}>
                        {isDone ? (
                            <span>{job.totalCount}건 모두 등록 완료</span>
                        ) : (
                            <>
                                <span style={{ color: colors.primary, fontWeight: 700 }}>{job.currentCount}</span>
                                <span>/{job.totalCount}건 완료</span>
                            </>
                        )}
                    </div>
                </div>

                {/* 퍼센트 */}
                <div style={{
                    fontSize: font.size.lg,
                    fontWeight: 700,
                    color: isDone ? colors.success : colors.primary,
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                    lineHeight: 1,
                    transition: 'color 0.4s',
                    minWidth: '42px',
                    textAlign: 'right',
                }}>
                    {percent}
                    <span style={{ fontSize: font.size.xs, fontWeight: 600, marginLeft: '1px' }}>%</span>
                </div>
            </div>

            {/* 프로그레스 바 — 전체 너비 */}
            <div style={{
                height: '6px',
                background: 'rgba(0,0,0,0.04)',
                borderRadius: radius.full,
                overflow: 'hidden',
                marginBottom: justCompleted && !isDone ? spacing['3'] : '0',
            }}>
                <div style={{
                    height: '100%',
                    width: `${barPercent}%`,
                    background: isDone
                        ? `linear-gradient(90deg, ${colors.success}, ${colors.successAlt})`
                        : `linear-gradient(90deg, ${colors.primary}, #60A5FA)`,
                    borderRadius: radius.full,
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {!isDone && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                            animation: 'shimmer 1.5s ease-in-out infinite',
                        }} />
                    )}
                </div>
            </div>

            {/* 방금 완료된 상품 */}
            {justCompleted && !isDone && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['2'],
                    animation: 'itemSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    <CheckCircle2 size={14} color={colors.success} style={{ flexShrink: 0 }} />
                    <span style={{
                        fontSize: font.size.sm,
                        color: colors.text.muted,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {justCompleted}
                    </span>
                </div>
            )}

            <style>{`
                @keyframes progressCardIn {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes progressCardOut {
                    from { opacity: 1; transform: translateY(0) scale(1); }
                    to { opacity: 0; transform: translateY(-12px) scale(0.97); }
                }
                @keyframes itemSlideIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
};
