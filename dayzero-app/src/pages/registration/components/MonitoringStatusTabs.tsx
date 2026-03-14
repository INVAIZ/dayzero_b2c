import { colors, font, spacing, radius } from '../../../design/tokens';

export type MonitoringTabFilter = '판매 중' | '변동 확인 중' | '판매 중지';

interface Props {
    activeTab: MonitoringTabFilter;
    onChange: (tab: MonitoringTabFilter) => void;
    counts: {
        active: number;
        monitoring: number;
        issues: number;
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
            {/* 판매 중 */}
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

            {/* 변동 확인 중 */}
            <TabButton
                label="변동 확인 중"
                isActive={activeTab === '변동 확인 중'}
                onClick={() => onChange('변동 확인 중')}
            >
                {counts.monitoring > 0 && (
                    <CountBadge
                        count={counts.monitoring}
                        isActive={activeTab === '변동 확인 중'}
                        variant="blue"
                    />
                )}
                {counts.issues > 0 && (
                    <CountBadge
                        count={counts.issues}
                        isActive={activeTab === '변동 확인 중'}
                        variant="red"
                    />
                )}
            </TabButton>

            {/* 판매 중지 */}
            <TabButton
                label="판매 중지"
                isActive={activeTab === '판매 중지'}
                onClick={() => onChange('판매 중지')}
            >
                {counts.paused > 0 && (
                    <CountBadge
                        count={counts.paused}
                        isActive={activeTab === '판매 중지'}
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
            fontWeight: 700,
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
