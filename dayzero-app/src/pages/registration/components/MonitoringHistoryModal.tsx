import { X, Shield, AlertTriangle, PackageX, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { colors, font, spacing, radius, shadow, zIndex } from '../../../design/tokens';
import type { RegistrationResult } from '../../../types/registration';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    results: RegistrationResult[];
    onSimulate: () => void;
    onForceIssue: () => void;
}

/** 변동 기록 모달 — 매일 오전 7시 자동 확인 이력 */
export const MonitoringHistoryModal: React.FC<Props> = ({ isOpen, onClose, results, onSimulate, onForceIssue }) => {
    if (!isOpen) return null;

    const monitored = results.filter(r => r.monitoring?.status === 'active');
    const normal = monitored.filter(r => r.monitoring?.lastCheckResult === 'normal').length;
    const priceChanged = monitored.filter(r => r.monitoring?.lastCheckResult === 'price_changed').length;
    const negativeMargin = monitored.filter(r => r.monitoring?.lastCheckResult === 'negative_margin').length;
    const outOfStock = monitored.filter(r => r.monitoring?.lastCheckResult === 'out_of_stock').length;

    // 더미 과거 기록 생성 (최근 7일)
    const checkHistory = generateCheckHistory(monitored.length);

    // 마지막 확인 시간
    const lastCheckTime = monitored
        .map(r => r.monitoring?.lastCheckAt)
        .filter(Boolean)
        .sort()
        .pop();

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
                animation: 'overlayIn 0.2s ease',
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
                    animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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
                        <Shield size={18} color={colors.primary} />
                        <span style={{
                            fontSize: font.size.lg,
                            fontWeight: 700,
                            color: colors.text.primary,
                        }}>
                            변동 기록
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
                    >
                        <X size={20} color={colors.text.muted} />
                    </button>
                </div>

                {/* 현재 상태 요약 */}
                {monitored.length > 0 && (
                    <div style={{
                        padding: `${spacing['4']} ${spacing['6']}`,
                        background: colors.bg.faint,
                        borderBottom: `1px solid ${colors.border.default}`,
                    }}>
                        <div style={{
                            fontSize: font.size.sm,
                            fontWeight: 600,
                            color: colors.text.tertiary,
                            marginBottom: spacing['2'],
                        }}>
                            최근 확인 결과
                            {lastCheckTime && (
                                <span style={{ fontWeight: 400, marginLeft: spacing['2'] }}>
                                    ({formatCheckTime(lastCheckTime)})
                                </span>
                            )}
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: spacing['3'],
                            flexWrap: 'wrap',
                        }}>
                            <ResultBadge icon={<Shield size={12} />} label="정상" count={normal} color={colors.success} />
                            {priceChanged > 0 && <ResultBadge icon={<TrendingDown size={12} />} label="가격 변동" count={priceChanged} color={colors.warningIcon} />}
                            {negativeMargin > 0 && <ResultBadge icon={<AlertTriangle size={12} />} label="역마진" count={negativeMargin} color={colors.danger} />}
                            {outOfStock > 0 && <ResultBadge icon={<PackageX size={12} />} label="품절" count={outOfStock} color={colors.text.primary} />}
                        </div>
                    </div>
                )}

                {/* 일별 확인 기록 */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: `${spacing['4']} ${spacing['6']}`,
                }}>
                    <div style={{
                        fontSize: font.size.sm,
                        fontWeight: 600,
                        color: colors.text.tertiary,
                        marginBottom: spacing['3'],
                    }}>
                        일별 확인 기록
                    </div>

                    {monitored.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: `${spacing['8']} 0`,
                            color: colors.text.muted,
                            fontSize: font.size.base,
                        }}>
                            변동 알림이 등록된 상품이 없어요
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                            {/* 오늘 (실제 현재 데이터) */}
                            <DailyCheckRow
                                date="오늘"
                                time="07:00"
                                totalCount={monitored.length}
                                normalCount={normal}
                                issueCount={priceChanged + negativeMargin + outOfStock}
                                isLatest
                            />

                            {/* 과거 더미 기록 */}
                            {checkHistory.map((record, i) => (
                                <DailyCheckRow
                                    key={i}
                                    date={record.dateLabel}
                                    time="07:00"
                                    totalCount={record.totalCount}
                                    normalCount={record.normalCount}
                                    issueCount={record.issueCount}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* 하단 */}
                <div style={{
                    padding: `${spacing['4']} ${spacing['6']}`,
                    borderTop: `1px solid ${colors.border.default}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span style={{
                        fontSize: font.size.xs,
                        color: colors.text.muted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing['1'],
                    }}>
                        <Clock size={12} />
                        매일 오전 7시에 자동으로 확인돼요
                    </span>
                    {monitored.length > 0 && (
                        <div style={{ display: 'flex', gap: spacing['2'] }}>
                            <button
                                onClick={onForceIssue}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing['1'],
                                    padding: `${spacing['1']} ${spacing['3']}`,
                                    background: colors.dangerLight,
                                    border: 'none',
                                    borderRadius: radius.md,
                                    fontSize: font.size.xs,
                                    fontWeight: 500,
                                    color: colors.danger,
                                    cursor: 'pointer',
                                    transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                title="UT 테스트용: 1건에 이슈 강제 설정"
                            >
                                <RefreshCw size={11} />
                                1건 이슈
                            </button>
                            <button
                                onClick={onSimulate}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing['1'],
                                    padding: `${spacing['1']} ${spacing['3']}`,
                                    background: colors.bg.subtle,
                                    border: 'none',
                                    borderRadius: radius.md,
                                    fontSize: font.size.xs,
                                    fontWeight: 500,
                                    color: colors.text.muted,
                                    cursor: 'pointer',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = colors.text.secondary; }}
                                onMouseLeave={e => { e.currentTarget.style.color = colors.text.muted; }}
                                title="UT 테스트용: 하루 경과 시뮬레이션"
                            >
                                <RefreshCw size={11} />
                                전체 시뮬레이션
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes overlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

// ── 하위 컴포넌트 ─────────────────────────────────────────────────────────

const ResultBadge: React.FC<{
    icon: React.ReactNode;
    label: string;
    count: number;
    color: string;
}> = ({ icon, label, count, color }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: font.size.sm,
        fontWeight: 600,
        color,
    }}>
        {icon} {label} {count}건
    </span>
);

const DailyCheckRow: React.FC<{
    date: string;
    time: string;
    totalCount: number;
    normalCount: number;
    issueCount: number;
    isLatest?: boolean;
}> = ({ date, time, totalCount, normalCount, issueCount, isLatest }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing['3'],
        padding: `${spacing['3']} ${spacing['3']}`,
        background: isLatest ? colors.bg.info : 'transparent',
        borderRadius: radius.md,
        border: isLatest ? `1px solid ${colors.primaryLightBorder}` : `1px solid transparent`,
    }}>
        {/* 날짜 */}
        <div style={{
            width: '56px',
            fontSize: font.size.sm,
            fontWeight: isLatest ? 700 : 500,
            color: isLatest ? colors.primary : colors.text.secondary,
            flexShrink: 0,
        }}>
            {date}
        </div>

        {/* 시간 */}
        <div style={{
            width: '40px',
            fontSize: font.size.sm,
            color: colors.text.muted,
            flexShrink: 0,
        }}>
            {time}
        </div>

        {/* 확인 수 */}
        <div style={{
            fontSize: font.size.sm,
            color: colors.text.tertiary,
            flex: 1,
        }}>
            {totalCount}건 확인
        </div>

        {/* 결과 */}
        <div style={{ display: 'flex', gap: spacing['2'], alignItems: 'center' }}>
            <span style={{
                fontSize: font.size.xs,
                fontWeight: 600,
                color: colors.success,
            }}>
                정상 {normalCount}
            </span>
            {issueCount > 0 && (
                <span style={{
                    fontSize: font.size.xs,
                    fontWeight: 700,
                    color: colors.danger,
                    background: colors.dangerLight,
                    padding: '1px 6px',
                    borderRadius: radius.xs,
                }}>
                    문제 {issueCount}
                </span>
            )}
        </div>
    </div>
);

// ── 유틸 ──────────────────────────────────────────────────────────────────

function formatCheckTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (isToday) return `오늘 ${hh}:${mm}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

/** 과거 7일간 더미 확인 기록 생성 */
function generateCheckHistory(totalCount: number): Array<{
    dateLabel: string;
    totalCount: number;
    normalCount: number;
    issueCount: number;
}> {
    const records = [];
    const now = new Date();

    for (let i = 1; i <= 6; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const dayName = i === 1 ? '어제' : `${date.getMonth() + 1}/${date.getDate()}`;

        // 과거에는 문제가 적었던 것으로 설정
        const issueCount = Math.floor(Math.random() * Math.min(2, Math.ceil(totalCount * 0.1)));
        const normalCount = totalCount - issueCount;

        records.push({
            dateLabel: dayName,
            totalCount,
            normalCount,
            issueCount,
        });
    }
    return records;
}
