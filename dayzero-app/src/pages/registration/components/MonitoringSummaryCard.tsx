import { Shield, AlertTriangle, PackageX, TrendingDown } from 'lucide-react';
import { colors, font, spacing, radius, shadow } from '../../../design/tokens';
import type { RegistrationResult } from '../../../types/registration';

interface Props {
    results: RegistrationResult[];
}

export const MonitoringSummaryCard: React.FC<Props> = ({ results }) => {
    const monitored = results.filter(r => r.monitoring?.status === 'active');
    if (monitored.length === 0) return null;

    const normal = monitored.filter(r => r.monitoring?.lastCheckResult === 'normal').length;
    const priceChanged = monitored.filter(r => r.monitoring?.lastCheckResult === 'price_changed').length;
    const negativeMargin = monitored.filter(r => r.monitoring?.lastCheckResult === 'negative_margin').length;
    const outOfStock = monitored.filter(r => r.monitoring?.lastCheckResult === 'out_of_stock').length;
    const hasIssues = negativeMargin > 0 || outOfStock > 0;

    // 마지막 확인 시간
    const lastCheck = monitored
        .map(r => r.monitoring?.lastCheckAt)
        .filter(Boolean)
        .sort()
        .pop();
    const lastCheckStr = lastCheck
        ? formatCheckTime(lastCheck)
        : '확인 기록 없음';

    // 다음 확인 시간
    const nextCheck = monitored
        .map(r => r.monitoring?.nextCheckAt)
        .filter(Boolean)
        .sort()
        .shift();
    const nextCheckStr = nextCheck
        ? formatCheckTime(nextCheck)
        : '';

    return (
        <div style={{
            background: hasIssues
                ? `linear-gradient(135deg, ${colors.warningLight} 0%, ${colors.bg.surface} 100%)`
                : `linear-gradient(135deg, ${colors.successBg} 0%, ${colors.bg.surface} 100%)`,
            border: `1px solid ${hasIssues ? colors.warningBorder : colors.successBorder}`,
            borderRadius: radius.xl,
            padding: spacing['5'],
            marginBottom: spacing['5'],
            boxShadow: shadow.sm,
            animation: 'summaryFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* 배경 장식 */}
            <div style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: hasIssues ? colors.warning : colors.success,
                opacity: 0.06,
                pointerEvents: 'none',
            }} />

            {/* 상단: 아이콘 + 메인 텍스트 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['3'],
                marginBottom: spacing['4'],
            }}>
                <div style={{
                    width: '36px', height: '36px',
                    borderRadius: radius.md,
                    background: colors.bg.surface,
                    border: `1px solid ${hasIssues ? colors.warningBorder : colors.successBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Shield
                        size={18}
                        color={hasIssues ? colors.warningIcon : colors.success}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: font.size.base,
                        fontWeight: 700,
                        color: colors.text.primary,
                        marginBottom: '2px',
                    }}>
                        {lastCheckStr} 확인 완료
                    </div>
                    {nextCheckStr && (
                        <div style={{
                            fontSize: font.size.sm,
                            color: colors.text.tertiary,
                            fontWeight: 500,
                        }}>
                            다음 확인: {nextCheckStr}
                        </div>
                    )}
                </div>
            </div>

            {/* 결과 요약 칩들 */}
            <div style={{
                display: 'flex',
                gap: spacing['2'],
                flexWrap: 'wrap',
            }}>
                <ResultChip
                    icon={<Shield size={13} />}
                    label="정상"
                    count={normal}
                    color={colors.success}
                    bgColor={colors.successLight}
                />
                {priceChanged > 0 && (
                    <ResultChip
                        icon={<TrendingDown size={13} />}
                        label="가격 변동"
                        count={priceChanged}
                        color={colors.warningIcon}
                        bgColor={colors.warningLight}
                    />
                )}
                {negativeMargin > 0 && (
                    <ResultChip
                        icon={<AlertTriangle size={13} />}
                        label="역마진"
                        count={negativeMargin}
                        color={colors.danger}
                        bgColor={colors.dangerLight}
                    />
                )}
                {outOfStock > 0 && (
                    <ResultChip
                        icon={<PackageX size={13} />}
                        label="품절"
                        count={outOfStock}
                        color={colors.text.primary}
                        bgColor={colors.bg.subtle}
                    />
                )}
            </div>

            <style>{`
                @keyframes summaryFadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const ResultChip = ({
    icon, label, count, color, bgColor,
}: {
    icon: React.ReactNode;
    label: string;
    count: number;
    color: string;
    bgColor: string;
}) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: `${spacing['1']} ${spacing['3']}`,
        background: bgColor,
        borderRadius: radius.full,
        fontSize: font.size.sm,
        fontWeight: 600,
        color,
    }}>
        {icon}
        <span>{label}</span>
        <span style={{ fontWeight: 700 }}>{count}건</span>
    </div>
);

function formatCheckTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    if (isToday) return `오늘 ${hh}:${mm}`;
    if (isTomorrow) return `내일 ${hh}:${mm}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}
