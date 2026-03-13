import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import { EmptyState } from '../../../components/common/StatusComponents';
import type { RegistrationJob } from '../../../types/registration';

interface Props {
    jobs: RegistrationJob[];
    onSelectJob: (jobId: string) => void;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
}

function formatElapsed(ms: number): string {
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}초`;
    const min = Math.floor(sec / 60);
    return `${min}분 ${sec % 60}초`;
}

export const BatchHistoryList: React.FC<Props> = ({ jobs, onSelectJob }) => {
    const completedJobs = jobs.filter(j => j.status === 'completed');

    if (completedJobs.length === 0) {
        return <EmptyState label="아직 등록 이력이 없습니다" />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
            {completedJobs.map(job => (
                <div
                    key={job.id}
                    onClick={() => onSelectJob(job.id)}
                    style={{
                        background: colors.bg.surface,
                        border: `1px solid ${colors.border.default}`,
                        borderRadius: radius.lg,
                        padding: `${spacing['4']} ${spacing['5']}`,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing['4'],
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = colors.primary;
                        e.currentTarget.style.background = colors.bg.faint;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = colors.border.default;
                        e.currentTarget.style.background = colors.bg.surface;
                    }}
                >
                    {/* 좌측 내용 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing['2'],
                            marginBottom: spacing['2'],
                        }}>
                            <span style={{ fontSize: font.size.base, fontWeight: 600, color: colors.text.primary }}>
                                Qoo10 상품 등록
                            </span>
                            <span style={{
                                fontSize: font.size.xs,
                                color: colors.text.muted,
                            }}>
                                {formatDate(job.createdAt)}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: spacing['3'], fontSize: font.size.sm, alignItems: 'center' }}>
                            <span style={{ color: colors.text.tertiary }}>
                                총 {job.totalCount}건
                            </span>
                            {job.successCount > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: spacing['1'], color: colors.success, fontWeight: 600 }}>
                                    <CheckCircle2 size={13} /> {job.successCount}건 성공
                                </span>
                            )}
                            {job.failedCount > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: spacing['1'], color: colors.danger, fontWeight: 600 }}>
                                    <XCircle size={13} /> {job.failedCount}건 실패
                                </span>
                            )}
                            {job.elapsedTime && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: spacing['1'], color: colors.text.muted }}>
                                    <Clock size={13} /> {formatElapsed(job.elapsedTime)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 우측 화살표 */}
                    <ChevronRight size={16} color={colors.text.disabled} />
                </div>
            ))}
        </div>
    );
};
