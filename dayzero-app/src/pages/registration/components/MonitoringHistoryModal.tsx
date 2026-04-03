import { X, Shield, AlertTriangle, PackageX, TrendingDown, TrendingUp, Clock, Play, CheckCircle } from 'lucide-react';
import { colors, font, spacing, radius, shadow, zIndex } from '../../../design/tokens';
import { ANIM } from '../../../design/animations';
import { formatCheckTime } from '../../../utils/formatDate';
import type { RegistrationResult } from '../../../types/registration';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    results: RegistrationResult[];
    onSimulate: () => void;
    onForceIssue: () => void;
    onSeedDemoIssues?: () => void;
}

/** 변동 기록 모달 — 매일 오전 7시 자동 확인 이력 */
export const MonitoringHistoryModal: React.FC<Props> = ({ isOpen, onClose, results, onSimulate, onForceIssue, onSeedDemoIssues }) => {
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
            onWheel={e => e.preventDefault()}
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
                    maxHeight: '70vh',
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['1'] }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                            <Shield size={18} color={colors.primary} />
                            <span style={{
                                fontSize: font.size.lg,
                                fontWeight: 700,
                                color: colors.text.primary,
                            }}>
                                가격·품절 확인 기록
                            </span>
                        </div>
                        <span style={{
                            fontSize: font.size.xs,
                            color: colors.text.muted,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing['1'],
                            paddingLeft: '26px',
                        }}>
                            <Clock size={12} />
                            매일 오전 7시부터 자동으로 확인돼요
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

                <div
                    onWheel={e => e.stopPropagation()}
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: `${spacing['4']} ${spacing['6']}`,
                    }}
                >
                    {monitored.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: `${spacing['8']} 0`,
                            color: colors.text.muted,
                            fontSize: font.size.base,
                        }}>
                            가격·품절 확인이 켜진 상품이 없어요
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                            {/* 오늘 (실제 현재 데이터) */}
                            <DailyCheckRow
                                date="오늘"
                                time="07:12"
                                totalCount={monitored.length}
                                normalCount={normal}
                                issueCount={negativeMargin}
                                outOfStockCount={outOfStock}
                                priceUpCount={priceChanged}
                                priceDownCount={0}
                            />

                            {/* 과거 더미 기록 */}
                            {checkHistory.map((record, i) => (
                                <DailyCheckRow
                                    key={i}
                                    date={record.dateLabel}
                                    time={record.time}
                                    totalCount={record.totalCount}
                                    normalCount={record.normalCount}
                                    issueCount={record.issueCount}
                                    outOfStockCount={record.outOfStockCount}
                                    priceUpCount={record.priceUpCount}
                                    priceDownCount={record.priceDownCount}
                                    resumeCount={record.resumeCount}
                                    isLast={i === checkHistory.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </div>


            </div>

            <style>{ANIM.overlayIn + ANIM.modalSlideUp}</style>
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
    outOfStockCount?: number;
    priceUpCount?: number;
    priceDownCount?: number;
    resumeCount?: number;
    isLast?: boolean;
}> = ({ date, time, totalCount, normalCount, issueCount, outOfStockCount = 0, priceUpCount = 0, priceDownCount = 0, resumeCount = 0, isLast = false }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing['3'],
        padding: `${spacing['3']} 0`,
        borderBottom: isLast ? 'none' : `1px solid ${colors.border.default}`,
    }}>
        {/* 날짜 */}
        <div style={{
            width: '72px',
            fontSize: font.size.sm,
            fontWeight: 500,
            color: colors.text.secondary,
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

        {/* 결과 태그 */}
        <div style={{ display: 'flex', gap: spacing['1'], alignItems: 'center', flexWrap: 'wrap' }}>
            {normalCount > 0 && (
                <StatusTag icon={<CheckCircle size={10} />} label={`정상 ${normalCount}`} color={colors.primary} bg={colors.bg.info} />
            )}
            {priceUpCount > 0 && (
                <StatusTag icon={<TrendingUp size={10} />} label={`가격 상승 ${priceUpCount}`} color="#E67E22" bg="#FFF3E0" />
            )}
            {priceDownCount > 0 && (
                <StatusTag icon={<TrendingDown size={10} />} label={`가격 하락 ${priceDownCount}`} color="#E67E22" bg="#FFF3E0" />
            )}
            {outOfStockCount > 0 && (
                <StatusTag icon={<PackageX size={10} />} label={`품절 ${outOfStockCount}`} color="#FF9500" bg="#FEF0E0" />
            )}
            {issueCount > 0 && (
                <StatusTag icon={<AlertTriangle size={10} />} label={`문제 ${issueCount}`} color={colors.danger} bg={colors.dangerLight} />
            )}
            {resumeCount > 0 && (
                <StatusTag icon={<Play size={10} />} label={`판매 재개 ${resumeCount}`} color={colors.success} bg="#E8F5E9" />
            )}
        </div>
    </div>
);

const StatusTag: React.FC<{
    icon: React.ReactNode;
    label: string;
    color: string;
    bg: string;
}> = ({ icon, label, color, bg }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: font.size.xs,
        fontWeight: 700,
        color,
        background: bg,
        padding: '3px 8px',
        borderRadius: radius.xs,
    }}>
        {icon} {label}
    </span>
);

// ── 유틸 ──────────────────────────────────────────────────────────────────

/** 과거 14일간 더미 확인 기록 생성 */
function generateCheckHistory(totalCount: number): Array<{
    dateLabel: string;
    totalCount: number;
    normalCount: number;
    issueCount: number;
    outOfStockCount: number;
    priceUpCount: number;
    priceDownCount: number;
    resumeCount: number;
    time: string;
}> {
    const records = [];
    const now = new Date();

    for (let i = 1; i <= 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const dayName = i === 1 ? '어제' : `${String(date.getFullYear()).slice(2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

        const outOfStockCount = Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 1 : 0;
        const priceUpCount = Math.random() < 0.2 ? Math.floor(Math.random() * 2) + 1 : 0;
        const priceDownCount = Math.random() < 0.2 ? Math.floor(Math.random() * 2) + 1 : 0;
        const issueCount = Math.random() < 0.15 ? 1 : 0;
        const resumeCount = i > 1 && Math.random() < 0.15 ? 1 : 0;
        const normalCount = Math.max(0, totalCount - issueCount - outOfStockCount - priceUpCount - priceDownCount);
        const minutes = Math.floor(Math.random() * 50);
        const timeStr = `07:${String(minutes).padStart(2, '0')}`;

        records.push({
            dateLabel: dayName,
            totalCount,
            normalCount,
            issueCount,
            outOfStockCount,
            priceUpCount,
            priceDownCount,
            resumeCount,
            time: timeStr,
        });
    }
    return records;
}
