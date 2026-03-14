import { useMemo } from 'react';
import { Package, TrendingUp, Coins, AlertTriangle } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import type { RegistrationResult } from '../../../types/registration';

interface Props {
    results: RegistrationResult[];
}

export const SuccessSummaryCard: React.FC<Props> = ({ results }) => {
    const stats = useMemo(() => {
        const acc = results.reduce(
            (a, r) => {
                if (r.salesStatus === 'paused') return a;
                const sale = r.product.salePriceJpy / 0.11;
                const cost = r.product.originalPriceKrw;
                const margin = cost > 0 ? ((sale - cost) / sale) * 100 : 0;
                const cr = r.monitoring?.status === 'active' ? r.monitoring.lastCheckResult : undefined;
                return {
                    count: a.count + 1,
                    totalRevenue: a.totalRevenue + r.product.salePriceJpy,
                    marginSum: a.marginSum + margin,
                    negativeMarginCount: a.negativeMarginCount + (cr === 'negative_margin' ? 1 : 0),
                    outOfStockCount: a.outOfStockCount + (cr === 'out_of_stock' ? 1 : 0),
                };
            },
            { count: 0, totalRevenue: 0, marginSum: 0, negativeMarginCount: 0, outOfStockCount: 0 }
        );
        const avgMargin = acc.count > 0 ? acc.marginSum / acc.count : 0;
        return { ...acc, avgMargin };
    }, [results]);

    const { count, totalRevenue, avgMargin, negativeMarginCount, outOfStockCount } = stats;

    // 더미: 지난 달 대비 변동 (프로토타입용)
    const prevProductCount = Math.max(1, Math.round(count * 0.75));
    const prevMargin = Math.max(5, avgMargin - 3.2);
    const prevRevenue = Math.round(totalRevenue * 0.8);

    const productDiff = count - prevProductCount;
    const marginDiff = avgMargin - prevMargin;
    const revenuePct = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: spacing['4'],
            marginBottom: spacing['6'],
            animation: 'summaryFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <StatCard
                label="등록된 상품 수"
                icon={<Package size={18} color={colors.text.muted} />}
                value={count.toLocaleString()}
                diffText={`+${productDiff}건`}
                diffPositive={productDiff >= 0}
            />
            <StatCard
                label="평균 마진율"
                icon={<TrendingUp size={18} color={colors.text.muted} />}
                value={`${avgMargin.toFixed(1)}%`}
                diffText={`${marginDiff >= 0 ? '+' : ''}${marginDiff.toFixed(1)}%p`}
                diffPositive={marginDiff >= 0}
            />
            <StatCard
                label="총 예상 월 매출"
                icon={<Coins size={18} color={colors.text.muted} />}
                value={`¥${totalRevenue.toLocaleString()}`}
                subValue={`₩${Math.round(totalRevenue / 0.11).toLocaleString()}`}
                diffText={`${revenuePct >= 0 ? '+' : ''}${revenuePct}%`}
                diffPositive={revenuePct >= 0}
            />
            <IssueStatCard
                negativeMarginCount={negativeMarginCount}
                outOfStockCount={outOfStockCount}
            />
            <style>{`
                @keyframes summaryFadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const StatCard = ({
    label, icon, value, subValue, diffText, diffPositive, valueColor, statusText, statusPositive,
}: {
    label: string;
    icon: React.ReactNode;
    value: string;
    subValue?: string;
    diffText?: string;
    diffPositive?: boolean;
    valueColor?: string;
    statusText?: string;
    statusPositive?: boolean;
}) => (
    <div style={{
        background: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.lg,
        padding: spacing['5'],
    }}>
        {/* 상단: 라벨 + 아이콘 */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing['4'],
        }}>
            <span style={{
                fontSize: font.size.sm,
                fontWeight: 500,
                color: colors.text.tertiary,
            }}>
                {label}
            </span>
            {icon}
        </div>

        {/* 숫자 */}
        <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: valueColor ?? colors.text.primary,
            lineHeight: 1,
            letterSpacing: '-0.5px',
            marginBottom: spacing['3'],
        }}>
            {value}
            {subValue && (
                <span style={{
                    fontSize: font.size.sm,
                    fontWeight: 500,
                    color: colors.text.muted,
                    marginLeft: spacing['2'],
                }}>
                    {subValue}
                </span>
            )}
        </div>

        {/* 하단: 상태 또는 지난 달 대비 */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: font.size.xs,
        }}>
            {statusText ? (
                <span style={{
                    fontWeight: 600,
                    color: statusPositive ? colors.success : colors.danger,
                }}>
                    {statusText}
                </span>
            ) : diffText !== undefined && (
                <>
                    <span style={{
                        fontWeight: 600,
                        color: diffPositive ? colors.success : colors.danger,
                    }}>
                        {diffText}
                    </span>
                    <span style={{
                        color: colors.text.muted,
                        fontWeight: 400,
                    }}>
                        지난 달 대비
                    </span>
                </>
            )}
        </div>
    </div>
);

const IssueStatCard: React.FC<{
    negativeMarginCount: number;
    outOfStockCount: number;
}> = ({ negativeMarginCount, outOfStockCount }) => {
    const total = negativeMarginCount + outOfStockCount;
    return (
        <div style={{
            background: colors.bg.surface,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.lg,
            padding: spacing['5'],
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing['4'],
            }}>
                <span style={{ fontSize: font.size.sm, fontWeight: 500, color: colors.text.tertiary }}>
                    품절·역마진 상품
                </span>
                <AlertTriangle size={18} color={total > 0 ? colors.warningIcon : colors.text.muted} />
            </div>

            <div style={{
                fontSize: '32px',
                fontWeight: 700,
                color: colors.text.primary,
                lineHeight: 1,
                letterSpacing: '-0.5px',
                marginBottom: spacing['3'],
            }}>
                {total}
                <span style={{ fontSize: font.size.base, fontWeight: 500, color: colors.text.muted, marginLeft: '4px' }}>건</span>
            </div>

            <div style={{ display: 'flex', gap: spacing['2'], flexWrap: 'wrap' }}>
                {total === 0 ? (
                    <span style={{ fontSize: font.size.xs, color: colors.success, fontWeight: 600 }}>
                        모든 상품 정상
                    </span>
                ) : (
                    <>
                        {outOfStockCount > 0 && (
                            <span style={{
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                color: colors.danger,
                                background: colors.dangerLight,
                                borderRadius: radius.full,
                                padding: '2px 8px',
                            }}>
                                품절 {outOfStockCount}
                            </span>
                        )}
                        {negativeMarginCount > 0 && (
                            <span style={{
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                color: colors.danger,
                                background: colors.dangerLight,
                                borderRadius: radius.full,
                                padding: '2px 8px',
                            }}>
                                역마진 {negativeMarginCount}
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
