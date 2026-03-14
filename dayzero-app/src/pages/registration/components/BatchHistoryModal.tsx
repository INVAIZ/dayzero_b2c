import { X, CheckCircle2, XCircle, Loader2, History } from 'lucide-react';
import { colors, font, spacing, radius, shadow, zIndex } from '../../../design/tokens';
import { ProgressBar } from '../../../components/common/StatusComponents';
import type { RegistrationJob } from '../../../types/registration';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    jobs: RegistrationJob[];
    activeJobId: string | null;
    onSelectJob: (jobId: string) => void;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();

    if (d.toDateString() === now.toDateString()) {
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `오늘 ${hh}:${min}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `어제 ${hh}:${min}`;
    }

    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
}

function getJobLabel(job: RegistrationJob): { name: string; suffix: string | null } {
    const results = job.results;
    if (results.length === 0) return { name: `${job.totalCount}건 등록`, suffix: null };

    const firstName = results[0].product.titleKo;

    if (job.totalCount === 1) return { name: firstName, suffix: null };
    return { name: firstName, suffix: `외 ${job.totalCount - 1}건` };
}

export const BatchHistoryModal: React.FC<Props> = ({ isOpen, onClose, jobs, activeJobId, onSelectJob }) => {
    if (!isOpen) return null;

    const sortedJobs = [...jobs].sort((a, b) => {
        if (a.status === 'processing' && b.status !== 'processing') return -1;
        if (a.status !== 'processing' && b.status === 'processing') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const totalRegistered = jobs.reduce((sum, j) => sum + j.successCount, 0);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: zIndex.modal,
                animation: 'batchOverlayIn 0.2s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: colors.bg.surface,
                    borderRadius: radius.xl,
                    width: '580px',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    boxShadow: shadow.lg,
                    animation: 'batchModalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* 헤더 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${spacing['5']} ${spacing['6']}`,
                    borderBottom: `1px solid ${colors.border.default}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        <History size={18} color={colors.primary} />
                        <span style={{
                            fontSize: font.size.lg,
                            fontWeight: 700,
                            color: colors.text.primary,
                        }}>
                            등록 기록
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: spacing['1'],
                            borderRadius: radius.md,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = colors.bg.subtle; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                        <X size={20} color={colors.text.muted} />
                    </button>
                </div>

                {/* 요약 */}
                {sortedJobs.length > 0 && (
                    <div style={{
                        padding: `${spacing['4']} ${spacing['6']}`,
                        background: colors.bg.faint,
                        borderBottom: `1px solid ${colors.border.default}`,
                        display: 'flex',
                        gap: spacing['4'],
                    }}>
                        <SummaryBadge label="총 등록 횟수" value={`${sortedJobs.length}회`} />
                        <SummaryBadge label="등록된 상품" value={`${totalRegistered}건`} color={colors.success} />
                    </div>
                )}

                {/* 등록 목록 */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: `${spacing['4']} ${spacing['6']}`,
                }}>
                    {sortedJobs.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: `${spacing['8']} 0`,
                            color: colors.text.muted,
                            fontSize: font.size.base,
                        }}>
                            아직 등록 기록이 없어요
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                            {sortedJobs.map((job) => {
                                const isActive = job.id === activeJobId;
                                const isProcessing = job.status === 'processing';
                                const label = getJobLabel(job);
                                const thumbnail = job.results.length > 0
                                    ? job.results[0].product.thumbnailUrl
                                    : null;

                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => { onSelectJob(job.id); onClose(); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: spacing['3'],
                                            padding: spacing['3'],
                                            background: isActive ? colors.bg.info : 'transparent',
                                            borderRadius: radius.md,
                                            border: isActive
                                                ? `1px solid ${colors.primaryLightBorder}`
                                                : '1px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) e.currentTarget.style.background = colors.bg.faint;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = isActive ? colors.bg.info : 'transparent';
                                        }}
                                    >
                                        {/* 썸네일 */}
                                        {thumbnail ? (
                                            <img
                                                src={thumbnail}
                                                alt=""
                                                style={{
                                                    width: '36px', height: '36px',
                                                    borderRadius: radius.md,
                                                    objectFit: 'cover',
                                                    border: `1px solid ${colors.border.default}`,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '36px', height: '36px',
                                                borderRadius: radius.md,
                                                background: colors.bg.info,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <Loader2 size={14} color={colors.primary} />
                                            </div>
                                        )}

                                        {/* 상품명 */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: font.size.sm,
                                                fontWeight: 600,
                                                color: colors.text.primary,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {label.name}
                                                {label.suffix && (
                                                    <span style={{
                                                        fontWeight: 500,
                                                        color: colors.text.muted,
                                                        marginLeft: spacing['1'],
                                                    }}>
                                                        {label.suffix}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontSize: font.size.xs,
                                                color: colors.text.muted,
                                                marginTop: '1px',
                                            }}>
                                                {formatDate(job.createdAt)}
                                            </div>
                                        </div>

                                        {/* 결과 */}
                                        <div style={{ flexShrink: 0, paddingTop: '1px' }}>
                                            {isProcessing ? (
                                                <div style={{ width: '64px' }}>
                                                    <div style={{
                                                        fontSize: font.size.xs,
                                                        color: colors.primary,
                                                        fontWeight: 600,
                                                        marginBottom: '3px',
                                                        textAlign: 'center',
                                                    }}>
                                                        {job.currentCount}/{job.totalCount}
                                                    </div>
                                                    <ProgressBar value={job.currentCount} max={job.totalCount} />
                                                </div>
                                            ) : (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: spacing['2'],
                                                    fontSize: font.size.xs,
                                                    fontWeight: 600,
                                                }}>
                                                    {job.successCount > 0 && (
                                                        <span style={{
                                                            display: 'flex', alignItems: 'center', gap: '3px',
                                                            color: colors.success,
                                                        }}>
                                                            <CheckCircle2 size={13} />{job.successCount}건
                                                        </span>
                                                    )}
                                                    {job.failedCount > 0 && (
                                                        <span style={{
                                                            display: 'flex', alignItems: 'center', gap: '3px',
                                                            color: colors.danger,
                                                        }}>
                                                            <XCircle size={13} />{job.failedCount}건
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 하단 */}
                <div style={{
                    padding: `${spacing['4']} ${spacing['6']}`,
                    borderTop: `1px solid ${colors.border.default}`,
                }}>
                    <span style={{
                        fontSize: font.size.xs,
                        color: colors.text.muted,
                    }}>
                        등록 기록을 클릭하면 해당 상품이 선택돼요
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes batchOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes batchModalSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

// ── 하위 컴포넌트 ─────────────────────────────────────────────────────────

const SummaryBadge: React.FC<{
    label: string;
    value: string;
    color?: string;
}> = ({ label, value, color }) => (
    <div>
        <div style={{
            fontSize: font.size.xs,
            fontWeight: 500,
            color: colors.text.muted,
            marginBottom: '2px',
        }}>
            {label}
        </div>
        <div style={{
            fontSize: font.size.base,
            fontWeight: 700,
            color: color ?? colors.text.primary,
        }}>
            {value}
        </div>
    </div>
);
