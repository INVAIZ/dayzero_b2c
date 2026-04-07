import { CheckCircle2, Loader2, X, PackageOpen, Zap } from 'lucide-react';
import { colors, font, radius } from '../../design/tokens';

export const StatusIcon: React.FC<{ status: 'running' | 'completed' | 'failed' | 'processing' | 'queued' | 'scheduled' }> = ({ status }) => (
    <div style={{
        width: '36px',
        height: '36px',
        borderRadius: radius.img,
        background: status === 'completed' ? colors.successBg : status === 'failed' ? colors.dangerBg : (status === 'scheduled' ? colors.scheduledBg : colors.primaryLight),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    }}>
        {status === 'completed'
            ? <CheckCircle2 size={18} color={colors.success} />
            : status === 'failed'
                ? <X size={18} color={colors.danger} />
                : (status === 'scheduled'
                    ? <Zap size={18} color={colors.scheduledIcon} fill={colors.scheduledIcon} />
                    : <Loader2 size={18} color={colors.primary} className="spin" />
                )
        }
    </div>
);

export const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => (
    <div style={{ height: '4px', background: colors.bg.subtle, borderRadius: radius['2xs'], overflow: 'hidden' }}>
        <div style={{
            height: '100%',
            width: `${max > 0 ? (value / max) * 100 : 0}%`,
            background: colors.primary,
            borderRadius: radius['2xs'],
            transition: 'width 0.4s ease',
        }} />
    </div>
);

export const EmptyState: React.FC<{ label: string }> = ({ label }) => (
    <div style={{ padding: '56px 24px', textAlign: 'center' }}>
        <PackageOpen size={36} color={colors.border.default} style={{ marginBottom: '12px' }} />
        <p style={{ fontSize: font.size.sm, color: colors.text.muted, margin: 0 }}>{label}</p>
    </div>
);
