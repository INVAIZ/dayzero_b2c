import { X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
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
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* 패널 — 고정 높이, 테이블 형태 */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '580px',
                height: '520px',
                background: colors.bg.surface,
                borderRadius: radius.xl,
                boxShadow: shadow.lg,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {/* 헤더 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${spacing['4']} ${spacing['5']}`,
                    borderBottom: `1px solid ${colors.border.default}`,
                    flexShrink: 0,
                }}>
                    <h3 style={{
                        fontSize: font.size.lg,
                        fontWeight: 700,
                        color: colors.text.primary,
                        margin: 0,
                    }}>
                        등록 기록
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: colors.text.muted,
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '50%',
                            display: 'flex',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = colors.bg.subtle; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 테이블 헤더 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: `${spacing['2']} ${spacing['5']}`,
                    background: colors.bg.faint,
                    borderBottom: `1px solid ${colors.border.default}`,
                    gap: spacing['3'],
                    flexShrink: 0,
                }}>
                    <span style={{ ...colHeader, flex: 1, minWidth: 0 }}>상품</span>
                    <span style={{ ...colHeader, flex: '0 0 80px', textAlign: 'center' }}>결과</span>
                    <span style={{ ...colHeader, flex: '0 0 100px', textAlign: 'right' }}>등록일시</span>
                </div>

                {/* 테이블 바디 — 스크롤 */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                }}>
                    {sortedJobs.length === 0 ? (
                        <div style={{
                            padding: spacing['10'],
                            textAlign: 'center',
                            color: colors.text.muted,
                            fontSize: font.size.sm,
                        }}>
                            아직 등록 이력이 없습니다
                        </div>
                    ) : (
                        sortedJobs.map((job, i) => {
                            const isActive = job.id === activeJobId;
                            const isProcessing = job.status === 'processing';
                            const isLast = i === sortedJobs.length - 1;
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
                                        alignItems: 'center',
                                        padding: `${spacing['3']} ${spacing['5']}`,
                                        borderBottom: isLast ? 'none' : `1px solid ${colors.border.default}`,
                                        background: isActive ? '#F8FAFF' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background 0.1s',
                                        gap: spacing['3'],
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) e.currentTarget.style.background = colors.bg.faint;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = isActive ? '#F8FAFF' : 'transparent';
                                    }}
                                >
                                    {/* 상품 (썸네일 + 라벨) */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: spacing['3'], minWidth: 0 }}>
                                        {thumbnail ? (
                                            <img
                                                src={thumbnail}
                                                alt=""
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: radius.md,
                                                    objectFit: 'cover',
                                                    border: `1px solid ${colors.border.default}`,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: radius.md,
                                                background: colors.bg.info,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <Loader2 size={14} color={colors.primary} className="spin" />
                                            </div>
                                        )}
                                        <span style={{
                                            fontSize: font.size.sm,
                                            fontWeight: 500,
                                            color: colors.text.primary,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            minWidth: 0,
                                        }}>
                                            {label.name}
                                        </span>
                                        {label.suffix && (
                                            <span style={{
                                                fontSize: font.size.sm,
                                                fontWeight: 500,
                                                color: colors.text.muted,
                                                flexShrink: 0,
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {label.suffix}
                                            </span>
                                        )}
                                    </div>

                                    {/* 결과 */}
                                    <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
                                        {isProcessing ? (
                                            <div>
                                                <div style={{
                                                    fontSize: font.size.xs,
                                                    color: colors.primary,
                                                    fontWeight: 600,
                                                    marginBottom: '3px',
                                                }}>
                                                    {job.currentCount}/{job.totalCount}
                                                </div>
                                                <ProgressBar value={job.currentCount} max={job.totalCount} />
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: spacing['2'],
                                                fontSize: font.size.xs,
                                                fontWeight: 600,
                                            }}>
                                                {job.successCount > 0 && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: colors.success }}>
                                                        <CheckCircle2 size={12} />{job.successCount}
                                                    </span>
                                                )}
                                                {job.failedCount > 0 && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: colors.danger }}>
                                                        <XCircle size={12} />{job.failedCount}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 등록일시 */}
                                    <div style={{
                                        flex: '0 0 100px',
                                        fontSize: font.size.xs,
                                        color: colors.text.muted,
                                        textAlign: 'right',
                                    }}>
                                        {formatDate(job.createdAt)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

const colHeader: React.CSSProperties = {
    fontSize: font.size.xs,
    fontWeight: 600,
    color: colors.text.muted,
    whiteSpace: 'nowrap',
};
