import { useMemo } from 'react';
import { Package, TrendingUp, Coins } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import { useOnboarding } from '../../../components/onboarding/OnboardingContext';
import { EXCHANGE_RATE } from '../../../mock/categoryMap';
import { calcExpectedProfit, getMarginRate } from '../../../utils/margin';
import type { RegistrationResult } from '../../../types/registration';

interface Props {
    results: RegistrationResult[];
}

export const SuccessSummaryCard: React.FC<Props> = ({ results }) => {
    const { state: onboarding } = useOnboarding();
    const marginRate = getMarginRate(onboarding);

    const stats = useMemo(() => {
        const acc = results.reduce(
            (a, r) => {
                if (r.salesStatus === 'paused') return a;
                const profit = calcExpectedProfit(r.product.salePriceJpy, marginRate);
                const cr = r.monitoring?.status === 'active' ? r.monitoring.lastCheckResult : undefined;
                return {
                    count: a.count + 1,
                    totalRevenue: a.totalRevenue + r.product.salePriceJpy,
                    profitSum: a.profitSum + profit,
                    negativeMarginCount: a.negativeMarginCount + (cr === 'negative_margin' ? 1 : 0),
                    outOfStockCount: a.outOfStockCount + (cr === 'out_of_stock' ? 1 : 0),
                };
            },
            { count: 0, totalRevenue: 0, profitSum: 0, negativeMarginCount: 0, outOfStockCount: 0 }
        );
        const avgProfit = acc.count > 0 ? Math.round(acc.profitSum / acc.count) : 0;
        return { ...acc, avgProfit };
    }, [results, marginRate]);

    const { count, totalRevenue, avgProfit } = stats;

    // 더미: 지난 달 대비 변동 (프로토타입용, 상품 없을 때는 표시 안 함)
    const hasDiff = count > 0;
    const prevProductCount = Math.max(1, Math.round(count * 0.75));
    const prevProfit = Math.max(500, avgProfit - 1200);
    const prevRevenue = Math.round(totalRevenue * 0.8);

    const productDiff = count - prevProductCount;
    const profitDiff = avgProfit - prevProfit;
    const revenuePct = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: spacing['4'],
            marginBottom: spacing['6'],
            animation: 'summaryFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <StatCard
                label="판매 중인 상품 수"
                icon={<Package size={18} color={colors.text.muted} />}
                value={count.toLocaleString()}
                diffText={hasDiff ? `+${productDiff}건` : undefined}
                diffPositive={productDiff >= 0}
            />
            <StatCard
                label="평균 예상 수익"
                icon={<TrendingUp size={18} color={colors.text.muted} />}
                value={`₩${avgProfit.toLocaleString()}`}
                diffText={hasDiff ? `${profitDiff >= 0 ? '+' : ''}₩${profitDiff.toLocaleString()}` : undefined}
                diffPositive={profitDiff >= 0}
            />
            <StatCard
                label="총 예상 월 매출"
                icon={<Coins size={18} color={colors.text.muted} />}
                value={`¥${totalRevenue.toLocaleString()}`}
                subValue={`₩${Math.round(totalRevenue * EXCHANGE_RATE).toLocaleString()}`}
                diffText={hasDiff ? `${revenuePct >= 0 ? '+' : ''}${revenuePct}%` : undefined}
                diffPositive={revenuePct >= 0}
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

