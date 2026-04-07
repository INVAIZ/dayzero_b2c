import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import { useSourcingStore } from '../../../store/useSourcingStore';
import { colors, font, radius, spacing } from '../../../design/tokens';

interface JobDisplay {
    id: string;
    provider: string;
    categorySummary: string;
    displayCount: number;
    totalCount: number;
    completed: boolean;
}

export const CollectionProgressBanner: React.FC = () => {
    const { jobs } = useSourcingStore();
    const [dismissed, setDismissed] = useState<string[]>([]);
    const [jobDisplays, setJobDisplays] = useState<Record<string, JobDisplay>>({});

    // running job이 추가될 때 초기화
    useEffect(() => {
        jobs.filter((j) => j.status === 'running').forEach((job) => {
            setJobDisplays((prev) => {
                if (prev[job.id]) return prev;
                return {
                    ...prev,
                    [job.id]: {
                        id: job.id,
                        provider: job.provider,
                        categorySummary: job.categorySummary,
                        displayCount: job.currentCount,
                        totalCount: job.totalCount,
                        completed: false,
                    },
                };
            });
        });
    }, [jobs]);

    // 카운트 애니메이션
    useEffect(() => {
        const intervals: ReturnType<typeof setInterval>[] = [];

        Object.values(jobDisplays).forEach((jd) => {
            if (jd.completed || dismissed.includes(jd.id)) return;

            const interval = setInterval(() => {
                setJobDisplays((prev) => {
                    const current = prev[jd.id];
                    if (!current || current.completed) {
                        clearInterval(interval);
                        return prev;
                    }
                    const next = current.displayCount + 1;
                    if (next >= current.totalCount) {
                        clearInterval(interval);
                        // 완료 → 4초 후 자동 dismiss
                        setTimeout(() => setDismissed((d) => [...d, jd.id]), 4000);
                        return { ...prev, [jd.id]: { ...current, displayCount: current.totalCount, completed: true } };
                    }
                    return { ...prev, [jd.id]: { ...current, displayCount: next } };
                });
            }, 400);

            intervals.push(interval);
        });

        return () => intervals.forEach(clearInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Object.keys(jobDisplays).join(',')]);

    const visible = Object.values(jobDisplays).filter((jd) => !dismissed.includes(jd.id));
    if (visible.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'], marginBottom: spacing['6'] }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {visible.map((jd) => {
                const pct = jd.totalCount > 0 ? Math.round((jd.displayCount / jd.totalCount) * 100) : 0;

                return (
                    <div
                        key={jd.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing['3'],
                            padding: `14px ${spacing['5']}`,
                            background: colors.bg.surface,
                            border: `1px solid ${colors.border.default}`,
                            borderRadius: radius.lg,
                        }}
                    >
                        {jd.completed ? (
                            <CheckCircle2 size={18} color={colors.success} style={{ flexShrink: 0 }} />
                        ) : (
                            <Loader2 size={18} color={colors.primary} style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                            {jd.completed ? (
                                <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>
                                    수집 완료 — {jd.displayCount}건이 목록에 추가되었습니다
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: '6px' }}>
                                        {jd.provider} · {jd.categorySummary} 수집 중
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'] }}>
                                        <div style={{ flex: 1, height: '4px', background: colors.bg.subtle, borderRadius: radius.full, overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${pct}%`,
                                                height: '100%',
                                                background: colors.primary,
                                                borderRadius: radius.full,
                                                transition: 'width 0.35s ease',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: font.size.sm, color: colors.text.tertiary, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {jd.displayCount}/{jd.totalCount}건
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setDismissed((prev) => [...prev, jd.id])}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: colors.text.muted, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
