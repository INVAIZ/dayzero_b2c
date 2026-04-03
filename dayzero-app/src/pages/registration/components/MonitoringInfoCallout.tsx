/**
 * 변동 확인 중 콜아웃 — 카운트 + 안내 문구만 표시 (간소화)
 */
import { Shield, Clock } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import { ANIM } from '../../../design/animations';

interface Props {
    monitoringCount: number;
    limit: number;
}

export const MonitoringInfoCallout: React.FC<Props> = ({
    monitoringCount, limit,
}) => {
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
                    가격·품절 확인
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

                {/* 안내 문구 */}
                <div style={{
                    fontSize: font.size.sm,
                    color: colors.text.tertiary,
                    lineHeight: '1.5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['1'],
                }}>
                    <Clock size={12} color={colors.primary} style={{ flexShrink: 0 }} />
                    매일 7시부터 가격과 재고를 확인하고, 변동 시 자동으로 처리해요
                </div>
            </div>

            <style>{ANIM.calloutIn + ANIM.fadeInUp}</style>
        </div>
    );
};
