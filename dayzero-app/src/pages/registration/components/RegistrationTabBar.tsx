import { Check } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import { SOURCING_PROVIDERS } from '../../../types/sourcing';

interface Props {
    activeFilter: string;
    onChange: (filter: string) => void;
    providers: string[];
}

export const RegistrationProviderFilter: React.FC<Props> = ({
    activeFilter, onChange, providers,
}) => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: spacing['4'], overflowX: 'auto', paddingBottom: '4px' }}>
        {['전체', ...providers].map((filter) => {
            const isActive = activeFilter === filter;
            const logo = SOURCING_PROVIDERS.find((p) => p.name === filter)?.logo;
            return (
                <button
                    key={filter}
                    onClick={() => onChange(filter)}
                    style={{
                        padding: filter === '전체' ? '8px 16px' : (isActive ? '8px 16px' : '8px'),
                        borderRadius: radius.full,
                        fontSize: font.size.md,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? colors.primary : colors.text.tertiary,
                        background: isActive ? colors.primaryLight : colors.bg.surface,
                        border: isActive ? `1px solid ${colors.primaryLight}` : `1px solid ${colors.border.default}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: filter === '전체' ? '6px' : (isActive ? '6px' : '0px'),
                    }}
                >
                    <div style={{
                        width: isActive ? '14px' : '0px',
                        opacity: isActive ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Check size={14} strokeWidth={3} style={{ flexShrink: 0 }} />
                    </div>

                    {filter !== '전체' && logo && (
                        <img src={logo} alt={filter} style={{ width: '16px', height: '16px', borderRadius: '4px', objectFit: 'cover' }} />
                    )}

                    <div style={{
                        maxWidth: filter === '전체' || isActive ? '100px' : '0px',
                        opacity: filter === '전체' || isActive ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        display: 'flex', alignItems: 'center',
                    }}>
                        {filter}
                    </div>
                </button>
            );
        })}
    </div>
);
