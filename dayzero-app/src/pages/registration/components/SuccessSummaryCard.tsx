import { Package, TrendingUp, Coins } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import type { RegistrationResult } from '../../../types/registration';

interface Props {
    results: RegistrationResult[];
}

export const SuccessSummaryCard: React.FC<Props> = ({ results }) => {
    const totalRevenue = results.reduce((sum, r) => sum + r.product.salePriceJpy, 0);
    const avgMargin = results.length > 0
        ? results.reduce((sum, r) => {
            const cost = r.product.originalPriceKrw;
            const sale = r.product.salePriceJpy / 0.11;
            const margin = cost > 0 ? ((sale - cost) / sale) * 100 : 0;
            return sum + margin;
        }, 0) / results.length
        : 0;

    // 더미: 지난 달 대비 변동 (프로토타입용)
    const prevProductCount = Math.max(1, Math.round(results.length * 0.75));
    const prevMargin = Math.max(5, avgMargin - 3.2);
    const prevRevenue = Math.round(totalRevenue * 0.8);

    const productDiff = results.length - prevProductCount;
    const marginDiff = avgMargin - prevMargin;
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
                label="등록된 상품 수"
                icon={<Package size={18} color={colors.text.muted} />}
                value={results.length.toLocaleString()}
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
    label, icon, value, subValue, diffText, diffPositive,
}: {
    label: string;
    icon: React.ReactNode;
    value: string;
    subValue?: string;
    diffText: string;
    diffPositive: boolean;
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
            color: colors.text.primary,
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

        {/* 하단: 지난 달 대비 */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: font.size.xs,
        }}>
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
        </div>
    </div>
);
