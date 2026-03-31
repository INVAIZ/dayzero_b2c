/**
 * ProductDetailPage에서 사용하는 하위 UI 컴포넌트들
 * - NavButton: 이전/다음 네비게이션 버튼
 * - MonitoringToggle: 가격·재고 확인 토글 스위치
 * - InfoCard: 정보 카드 컨테이너
 * - InfoRow: 카드 내 key-value 행
 * - AlertCard: 경고 콜아웃 (역마진/품절)
 * - StatusHelper: 상태 안내 콜아웃 (일시중지/모니터링 정상)
 */
import { AlertTriangle, PackageX, Bell, Shield } from 'lucide-react';
import { colors, font, spacing, radius, shadow } from '../../../design/tokens';

// ── NavButton ────────────────────────────────────────────────────────────────

export const NavButton: React.FC<{
    icon: React.ReactNode;
    disabled: boolean;
    onClick: () => void;
}> = ({ icon, disabled, onClick }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: colors.bg.surface,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.md,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'border-color 0.15s',
        }}
    >
        {icon}
    </button>
);

// ── MonitoringToggle ─────────────────────────────────────────────────────────

export const MonitoringToggle: React.FC<{
    checked: boolean;
    onClick: () => void;
}> = ({ checked, onClick }) => (
    <button
        onClick={onClick}
        style={{
            width: '48px', height: '28px',
            borderRadius: radius.full,
            border: 'none',
            background: checked ? colors.primary : colors.bg.subtle,
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
        }}
    >
        <div style={{
            width: '22px', height: '22px',
            borderRadius: '50%',
            background: colors.bg.surface,
            boxShadow: shadow.sm,
            position: 'absolute',
            top: '3px',
            left: checked ? '23px' : '3px',
            transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Shield size={12} color={checked ? colors.primary : colors.text.muted} />
        </div>
    </button>
);

// ── InfoCard ─────────────────────────────────────────────────────────────────

export const InfoCard: React.FC<{
    title: React.ReactNode;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, headerRight, children }) => (
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
            <span style={{
                fontSize: font.size.sm,
                fontWeight: 700,
                color: colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
            }}>
                {title}
            </span>
            {headerRight}
        </div>
        {children}
    </div>
);

// ── InfoRow ──────────────────────────────────────────────────────────────────

export const InfoRow: React.FC<{
    label: string;
    value: string;
    highlight?: boolean;
    mono?: boolean;
    valueColor?: string;
    suffix?: React.ReactNode;
    action?: React.ReactNode;
}> = ({ label, value, highlight, mono, valueColor, suffix, action }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${spacing['2']} 0`,
        borderBottom: `1px solid ${colors.bg.subtle}`,
    }}>
        <span style={{
            fontSize: font.size.sm,
            color: colors.text.tertiary,
            fontWeight: 500,
        }}>
            {label}
        </span>
        <span style={{
            fontSize: highlight ? font.size.base : font.size.sm,
            fontWeight: highlight ? 700 : 600,
            color: valueColor ?? colors.text.primary,
            fontFamily: mono ? font.family.mono : undefined,
            display: 'flex',
            alignItems: 'center',
            gap: spacing['2'],
        }}>
            {value}
            {action}
            {suffix}
        </span>
    </div>
);

// ── AlertCard ────────────────────────────────────────────────────────────────

export const AlertCard: React.FC<{
    type: 'negative_margin' | 'out_of_stock';
    description: string;
    isPaused?: boolean;
    isMonitored?: boolean;
    resultId?: string;
    onNavigate?: (path: string) => void;
    onPause?: () => void;
}> = ({ type, description, isPaused, isMonitored, resultId, onNavigate, onPause }) => {
    const isMargin = type === 'negative_margin';
    const isOutOfStock = type === 'out_of_stock';

    const getDescription = () => {
        if (isOutOfStock && isPaused && isMonitored) {
            return '현재 판매가 일시 중지된 상태예요. 쇼핑몰에서 재입고되면 가격·재고 자동 확인으로 알려드릴게요.';
        }
        if (isOutOfStock && isPaused && !isMonitored) {
            return '현재 판매가 일시 중지된 상태예요. 가격·재고 자동 확인을 켜면 재입고 시 바로 알려드릴게요.';
        }
        return description;
    };

    const getTitle = () => {
        if (isOutOfStock && isPaused) return '쇼핑몰 품절 — 판매 일시 중지 중';
        if (isMargin) return '역마진이 발생했어요';
        return '쇼핑몰에서 품절됐어요';
    };

    const cardBg = (isOutOfStock && isPaused) ? colors.bg.info : colors.dangerBg;
    const cardBorder = (isOutOfStock && isPaused) ? colors.primaryLightBorder : colors.dangerLight;

    return (
        <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: radius.lg,
            padding: spacing['5'],
            marginBottom: spacing['5'],
            animation: 'summaryFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['2'],
                marginBottom: spacing['3'],
            }}>
                {isMargin
                    ? <AlertTriangle size={18} color={colors.danger} />
                    : <PackageX size={18} color={(isOutOfStock && isPaused) ? colors.primary : colors.text.primary} />
                }
                <span style={{
                    fontSize: font.size.base,
                    fontWeight: 700,
                    color: colors.text.primary,
                }}>
                    {getTitle()}
                </span>
            </div>
            <p style={{
                fontSize: font.size.sm,
                color: colors.text.secondary,
                lineHeight: font.lineHeight.normal,
                margin: 0,
                marginBottom: spacing['4'],
            }}>
                {getDescription()}
            </p>
            {isMargin && resultId && onNavigate && (
                <span
                    onClick={() => onNavigate(`/registration/${resultId}/edit?tab=price`)}
                    style={{
                        fontSize: font.size.sm,
                        color: colors.primary,
                        fontWeight: 600,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        cursor: 'pointer',
                    }}
                >
                    가격 수정하러 가기
                </span>
            )}
            {isOutOfStock && !isPaused && onPause && (
                <span
                    onClick={onPause}
                    style={{
                        fontSize: font.size.sm,
                        color: colors.primary,
                        fontWeight: 600,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        cursor: 'pointer',
                    }}
                >
                    판매 일시중지하기
                </span>
            )}
        </div>
    );
};

// ── StatusHelper ─────────────────────────────────────────────────────────────

export const StatusHelper: React.FC<{
    type: 'paused' | 'watching';
    title: string;
    description: string;
}> = ({ type, title, description }) => {
    const isPaused = type === 'paused';
    return (
        <div style={{
            background: colors.bg.info,
            border: `1px solid ${colors.primaryLightBorder}`,
            borderRadius: radius.lg,
            padding: spacing['5'],
            marginBottom: spacing['5'],
            animation: 'summaryFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['2'],
                marginBottom: spacing['3'],
            }}>
                {isPaused
                    ? <Bell size={18} color={colors.primary} />
                    : <Shield size={18} color={colors.primary} />
                }
                <span style={{
                    fontSize: font.size.base,
                    fontWeight: 700,
                    color: colors.text.primary,
                }}>
                    {title}
                </span>
            </div>
            <p style={{
                fontSize: font.size.sm,
                color: colors.text.secondary,
                lineHeight: font.lineHeight.normal,
                margin: 0,
            }}>
                {description}
            </p>
        </div>
    );
};
