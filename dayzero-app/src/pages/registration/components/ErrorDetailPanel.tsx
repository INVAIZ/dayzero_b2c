import { AlertTriangle, ArrowRight } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import type { RegistrationError } from '../../../types/registration';

const ERROR_TYPE_LABELS: Record<string, string> = {
    api_error: 'API 오류',
    missing_required: '필수값 누락',
    category_mismatch: '카테고리 불일치',
    image_spec: '이미지 규격 미달',
    policy_violation: '정책 위반',
    server_timeout: '서버 타임아웃',
};

interface Props {
    error: RegistrationError;
    productId: string;
    onGoToEdit: (productId: string) => void;
}

export const ErrorDetailPanel: React.FC<Props> = ({ error, productId, onGoToEdit }) => (
    <div style={{
        background: colors.warningLight,
        border: `1px solid ${colors.warningBorder}`,
        borderRadius: radius.lg,
        padding: spacing['5'],
    }}>
        {/* 에러 타입 + 메시지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], marginBottom: spacing['3'] }}>
            <AlertTriangle size={16} color={colors.warningIcon} />
            <span style={{ fontSize: font.size.sm, fontWeight: 700, color: colors.warningTextDark }}>
                {ERROR_TYPE_LABELS[error.type] ?? error.type}
            </span>
            <span style={{ fontSize: font.size.sm, color: colors.warningTextDark }}>
                — {error.message}
            </span>
        </div>

        {/* API 응답 원문 */}
        <div style={{
            background: colors.bg.faint,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.md,
            padding: spacing['3'],
            fontSize: font.size.xs,
            fontFamily: font.family.mono,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            marginBottom: spacing['3'],
            maxHeight: '120px',
            overflowY: 'auto',
            color: colors.text.secondary,
            lineHeight: font.lineHeight.relaxed,
        }}>
            <span style={{ color: colors.text.muted }}>Error Code: </span>
            <span style={{ color: colors.danger, fontWeight: 600 }}>{error.code}</span>
            {'\n\n'}
            {error.detail}
        </div>

        {/* 해결 방법 */}
        <div style={{
            background: colors.bg.surface,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.md,
            padding: spacing['3'],
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing['3'],
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: font.size.xs, fontWeight: 600, color: colors.text.muted, marginBottom: '2px' }}>
                    해결 방법
                </div>
                <div style={{ fontSize: font.size.sm, color: colors.text.primary, lineHeight: font.lineHeight.normal }}>
                    {error.resolution}
                </div>
            </div>
            {error.type !== 'server_timeout' && error.type !== 'api_error' && (
                <button
                    onClick={() => onGoToEdit(productId)}
                    style={{
                        background: colors.bg.surface,
                        border: `1px solid ${colors.primary}`,
                        borderRadius: radius.md,
                        padding: `${spacing['2']} ${spacing['3']}`,
                        color: colors.primary,
                        fontSize: font.size.sm,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing['1'],
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = colors.primaryHover; }}
                    onMouseLeave={e => { e.currentTarget.style.background = colors.bg.surface; }}
                >
                    편집으로 이동 <ArrowRight size={14} />
                </button>
            )}
        </div>
    </div>
);

export { ERROR_TYPE_LABELS };
