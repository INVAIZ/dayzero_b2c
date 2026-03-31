/**
 * 변동 확인 중 콜아웃 — 정보 표시 + 설정 버튼
 */
import { Shield, Clock, RefreshCw, TrendingUp, Settings2 } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import { ANIM } from '../../../design/animations';

interface Props {
    monitoringCount: number;
    limit: number;
    autoPauseOnOutOfStock: boolean;
    autoPauseOnNegativeMargin: boolean;
    onSettingsClick: () => void;
}

export const MonitoringInfoCallout: React.FC<Props> = ({
    monitoringCount, limit,
    autoPauseOnOutOfStock, autoPauseOnNegativeMargin,
    onSettingsClick,
}) => {
    const infoLineStyle: React.CSSProperties = {
        fontSize: font.size.sm,
        color: colors.text.tertiary,
        lineHeight: '1.5',
        display: 'flex',
        alignItems: 'center',
        gap: spacing['1'],
    };

    return (
        <div
            style={{
                background: colors.bg.info,
                border: `1px solid ${colors.primaryLightBorder}`,
                borderRadius: radius.lg,
                padding: `${spacing['4']} ${spacing['5']}`,
                marginBottom: spacing['4'],
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing['4'],
            }}
        >
            <div style={{
                width: '40px', height: '40px',
                borderRadius: radius.md,
                background: colors.bg.surface,
                border: `1px solid ${colors.primaryLightBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Shield size={20} color={colors.primary} />
            </div>

            <div style={{ flex: 1 }}>
                {/* 라벨 */}
                <div style={{
                    fontSize: font.size.xs,
                    fontWeight: font.weight.semibold,
                    color: colors.text.tertiary,
                    marginBottom: spacing['1'],
                }}>
                    가격·재고 자동 확인
                </div>

                {/* 카운트 + 태그 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['2'],
                    marginBottom: spacing['2'],
                    flexWrap: 'wrap',
                }}>
                    <span style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.primary }}>
                        {monitoringCount}건
                        <span style={{ fontWeight: font.weight.medium, color: colors.text.muted, fontSize: font.size.sm }}>
                            {' '}/ 최대 {limit}건
                        </span>
                    </span>
                    <span style={{
                        fontSize: font.size['2xs'], fontWeight: font.weight.semibold, color: colors.primary,
                        background: colors.bg.surface, border: `1px solid ${colors.primaryLightBorder}`,
                        padding: '2px 8px', borderRadius: radius.full,
                    }}>
                        무료 플랜
                    </span>
                </div>

                {/* 정보 라인들 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: spacing['3'] }}>
                    <div style={infoLineStyle}>
                        <Clock size={12} color={colors.primary} style={{ flexShrink: 0 }} />
                        매일 7시에 가격과 재고를 확인하고, 변동 시 알려드려요
                    </div>
                    {autoPauseOnOutOfStock && (
                        <div style={infoLineStyle}>
                            <RefreshCw size={12} color={colors.primary} style={{ flexShrink: 0 }} />
                            품절 자동 관리 중
                        </div>
                    )}
                    {autoPauseOnNegativeMargin && (
                        <div style={infoLineStyle}>
                            <TrendingUp size={12} color={colors.primary} style={{ flexShrink: 0 }} />
                            판매가 자동 최적화 중
                        </div>
                    )}
                </div>

                {/* 설정 버튼 */}
                <button
                    onClick={onSettingsClick}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: `${spacing['2']} ${spacing['3']}`,
                        background: colors.bg.surface,
                        border: `1px solid ${colors.primaryLightBorder}`,
                        borderRadius: radius.md,
                        fontSize: font.size.sm,
                        fontWeight: font.weight.semibold,
                        color: colors.primary,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = colors.primary;
                        e.currentTarget.style.color = colors.bg.surface;
                        e.currentTarget.style.borderColor = colors.primary;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = colors.bg.surface;
                        e.currentTarget.style.color = colors.primary;
                        e.currentTarget.style.borderColor = colors.primaryLightBorder;
                    }}
                >
                    <Settings2 size={13} />
                    설정 관리
                </button>
            </div>

            <style>{ANIM.calloutIn + ANIM.fadeInUp}</style>
        </div>
    );
};
