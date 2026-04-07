import { colors, font, spacing, radius } from '../../../design/tokens';

export type MonitoringTabFilter = '전체' | '판매 중' | '가격·품절 확인 중' | '품절' | '문제 발생' | '일시 중지';

interface Props {
    activeTab: MonitoringTabFilter;
    onChange: (tab: MonitoringTabFilter) => void;
    counts: {
        total: number;
        active: number;
        monitoring: number;
        outOfStock: number;
        negativeMargin: number;
        paused: number;
    };
}

export const MonitoringStatusTabs: React.FC<Props> = ({ activeTab, onChange, counts }) => {
    return (
        <div style={{
            display: 'flex',
            gap: spacing['1'],
            marginBottom: spacing['4'],
            borderBottom: `1px solid ${colors.border.default}`,
            paddingBottom: '0',
        }}>
            <TabButton
                label="전체"
                isActive={activeTab === '전체'}
                onClick={() => onChange('전체')}
            >
                {counts.total > 0 && (
                    <CountBadge
                        count={counts.total}
                        isActive={activeTab === '전체'}
                        variant="blue"
                    />
                )}
            </TabButton>

            <TabButton
                label="판매 중"
                isActive={activeTab === '판매 중'}
                onClick={() => onChange('판매 중')}
            >
                {counts.active > 0 && (
                    <CountBadge
                        count={counts.active}
                        isActive={activeTab === '판매 중'}
                        variant="blue"
                    />
                )}
            </TabButton>

            <TabButton
                label="가격·품절 확인 중"
                isActive={activeTab === '가격·품절 확인 중'}
                onClick={() => onChange('가격·품절 확인 중')}
            >
                {counts.monitoring > 0 && (
                    <CountBadge
                        count={counts.monitoring}
                        isActive={activeTab === '가격·품절 확인 중'}
                        variant="blue"
                    />
                )}
            </TabButton>

            <TabButton
                label="품절"
                isActive={activeTab === '품절'}
                onClick={() => onChange('품절')}
            >
                {counts.outOfStock > 0 && (
                    <CountBadge
                        count={counts.outOfStock}
                        isActive={activeTab === '품절'}
                        variant="blue"
                    />
                )}
            </TabButton>

            <TabButton
                label="문제 발생"
                isActive={activeTab === '문제 발생'}
                onClick={() => onChange('문제 발생')}
            >
                {counts.negativeMargin > 0 && (
                    <CountBadge
                        count={counts.negativeMargin}
                        isActive={activeTab === '문제 발생'}
                        variant="red"
                    />
                )}
            </TabButton>

            <TabButton
                label="일시 중지"
                isActive={activeTab === '일시 중지'}
                onClick={() => onChange('일시 중지')}
            >
                {counts.paused > 0 && (
                    <CountBadge
                        count={counts.paused}
                        isActive={activeTab === '일시 중지'}
                        variant="gray"
                    />
                )}
            </TabButton>
        </div>
    );
};

const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    children?: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => (
    <button
        onClick={onClick}
        style={{
            padding: `${spacing['2']} ${spacing['4']}`,
            paddingBottom: spacing['3'],
            background: 'transparent',
            border: 'none',
            borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing['2'],
            transition: 'all 0.15s',
            marginBottom: '-1px',
        }}
    >
        <span style={{
            fontSize: font.size.base,
            fontWeight: isActive ? 700 : 500,
            color: isActive ? colors.text.primary : colors.text.tertiary,
            transition: 'color 0.15s',
        }}>
            {label}
        </span>
        {children}
    </button>
);

const CountBadge: React.FC<{
    count: number;
    isActive: boolean;
    variant: 'blue' | 'red' | 'gray';
}> = ({ count, isActive, variant }) => {
    const styles = {
        blue: {
            color: isActive ? colors.primary : colors.text.muted,
            background: isActive ? colors.primaryLight : colors.bg.subtle,
        },
        red: {
            color: colors.danger,
            background: colors.dangerLight,
        },
        gray: {
            color: colors.text.muted,
            background: colors.bg.subtle,
        },
    }[variant];

    return (
        <span style={{
            fontSize: font.size.xs,
            fontWeight: font.weight.bold,
            ...styles,
            borderRadius: radius.full,
            padding: '2px 7px',
            minWidth: '20px',
            textAlign: 'center',
            lineHeight: '1.4',
            transition: 'all 0.15s',
        }}>
            {count}
        </span>
    );
};
