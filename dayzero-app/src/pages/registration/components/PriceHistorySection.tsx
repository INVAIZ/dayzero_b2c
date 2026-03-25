import { useState, useCallback } from 'react';
import { colors, font, spacing, radius, shadow } from '../../../design/tokens';
import { formatShortDate, formatTooltipDate } from '../../../utils/formatDate';
import type { RegistrationResult } from '../../../types/registration';

interface Props {
    history: NonNullable<RegistrationResult['monitoring']>['priceHistory'];
}

export const PriceHistorySection: React.FC<Props> = ({ history }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!history) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const svgX = (mouseX / rect.width) * 620;
        const ratio = (svgX - 52) / 548;
        const idx = Math.round(ratio * (history.length - 1));
        if (idx >= 0 && idx < history.length) {
            setHoveredIndex(idx);
        }
    }, [history]);

    if (!history || history.length === 0) return null;

    const prices = history.map(h => h.sourcePriceKrw);
    const dataMin = Math.min(...prices);
    const dataMax = Math.max(...prices);

    const rawRange = dataMax - dataMin || 1000;
    const step = (() => {
        const raw = rawRange / 4;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        return Math.ceil(raw / mag) * mag;
    })();
    const yMin = Math.floor(dataMin / step) * step;
    const yMax = yMin + step * 5;
    const yRange = yMax - yMin;

    const svgW = 620;
    const svgH = 200;
    const padL = 52;
    const padR = 20;
    const padTop = 16;
    const padBot = 28;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padTop - padBot;

    const toX = (i: number) => padL + (i / (history.length - 1)) * plotW;
    const toY = (price: number) => padTop + plotH - ((price - yMin) / yRange) * plotH;

    const points = history.map((h, i) => ({ x: toX(i), y: toY(h.sourcePriceKrw) }));

    const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaD = `${lineD} L${points[points.length - 1].x},${padTop + plotH} L${points[0].x},${padTop + plotH} Z`;

    const yTicks = Array.from({ length: 6 }, (_, i) => yMin + step * i).filter(v => v <= yMax);

    const xLabelCount = Math.min(5, history.length);
    const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
        const idx = Math.round((i / (xLabelCount - 1)) * (history.length - 1));
        return { x: toX(idx), label: formatShortDate(history[idx].date) };
    });

    const hEntry = hoveredIndex !== null ? history[hoveredIndex] : null;
    const hPoint = hoveredIndex !== null ? points[hoveredIndex] : null;
    const bandW = plotW / history.length;

    const fmtY = (v: number) => {
        if (v >= 10000) return `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}만`;
        if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}천`;
        return v.toLocaleString();
    };

    return (
        <div style={{
            background: colors.bg.surface,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.lg,
            padding: spacing['5'],
            marginBottom: spacing['5'],
        }}>
            <div style={{
                fontSize: font.size.sm,
                fontWeight: 700,
                color: colors.text.tertiary,
                marginBottom: spacing['4'],
                letterSpacing: '0.3px',
            }}>
                가격 변동 이력 (최근 14일)
            </div>

            <div style={{ position: 'relative', marginBottom: spacing['4'] }}>
                <svg
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <defs>
                        <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
                            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {yTicks.map(v => {
                        const y = toY(v);
                        return (
                            <g key={v}>
                                <line
                                    x1={padL} y1={y} x2={svgW - padR} y2={y}
                                    stroke={colors.border.default}
                                    strokeWidth="0.7"
                                    strokeDasharray={v === yTicks[0] ? 'none' : '3 2'}
                                />
                                <text
                                    x={padL - 8} y={y + 3.5}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill={colors.text.muted}
                                    fontFamily={font.family.mono}
                                >
                                    {fmtY(v)}
                                </text>
                            </g>
                        );
                    })}

                    {hPoint && (
                        <rect
                            x={hPoint.x - bandW / 2}
                            y={padTop}
                            width={bandW}
                            height={plotH}
                            fill={colors.primary}
                            opacity="0.06"
                            rx="2"
                        />
                    )}

                    <path d={areaD} fill="url(#chartAreaGrad)" />
                    <path
                        d={lineD}
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {hPoint && hEntry && (
                        <circle cx={hPoint.x} cy={hPoint.y} r="6"
                            fill={colors.bg.surface}
                            stroke={hEntry.marginPercent < 0 || hEntry.stockStatus === 'out_of_stock'
                                ? colors.danger : colors.primary}
                            strokeWidth="2.5"
                        />
                    )}

                    {xLabels.map((l, i) => (
                        <text key={i}
                            x={l.x}
                            y={svgH - 6}
                            textAnchor="middle"
                            fontSize="10.5"
                            fill={colors.text.muted}
                        >
                            {l.label}
                        </text>
                    ))}
                </svg>

                {hPoint && hEntry && (
                    <div style={{
                        position: 'absolute',
                        left: `${(hPoint.x / svgW) * 100}%`,
                        top: `${(hPoint.y / svgH) * 100 - 14}%`,
                        transform: 'translate(-50%, -100%)',
                        background: colors.bg.surface,
                        border: `1px solid ${colors.border.default}`,
                        borderRadius: radius.md,
                        padding: `${spacing['2']} ${spacing['3']}`,
                        boxShadow: shadow.md,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        animation: 'tooltipPop 0.12s ease',
                        zIndex: 10,
                    }}>
                        <div style={{
                            fontSize: font.size.xs,
                            fontWeight: 600,
                            color: colors.text.secondary,
                            marginBottom: '2px',
                        }}>
                            {formatTooltipDate(hEntry.date)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing['2'] }}>
                            <span style={{
                                fontSize: font.size.base,
                                fontWeight: 700,
                                color: colors.primary,
                            }}>
                                ₩{hEntry.sourcePriceKrw.toLocaleString()}
                            </span>
                            <span style={{
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                color: hEntry.marginPercent < 0 ? colors.danger
                                    : hEntry.marginPercent < 10 ? colors.warningIcon
                                        : colors.success,
                            }}>
                                마진 {hEntry.marginPercent.toFixed(1)}%
                            </span>
                        </div>
                        {hEntry.stockStatus === 'out_of_stock' && (
                            <div style={{
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                color: colors.danger,
                                marginTop: '2px',
                            }}>
                                품절
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 타임라인 리스트 (최근 5일) */}
            <div>
                {history.slice(-5).reverse().map((entry, i) => {
                    const isIssue = entry.marginPercent < 0 || entry.stockStatus === 'out_of_stock';
                    const priceChangeFromBase = entry.sourcePriceKrw - history[0].sourcePriceKrw;
                    const changeColor = priceChangeFromBase > 0 ? colors.danger : colors.primary;
                    return (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing['3'],
                                padding: `${spacing['3']} 0`,
                                borderBottom: i < 4 ? `1px solid ${colors.bg.subtle}` : 'none',
                            }}
                        >
                            <div style={{
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                background: entry.stockStatus === 'out_of_stock'
                                    ? colors.text.primary
                                    : isIssue ? colors.danger : colors.success,
                                flexShrink: 0,
                            }} />
                            <span style={{
                                fontSize: font.size.sm,
                                color: colors.text.muted,
                                width: '56px',
                                flexShrink: 0,
                            }}>
                                {formatShortDate(entry.date)}
                            </span>
                            <span style={{
                                fontSize: font.size.base,
                                fontWeight: 700,
                                color: colors.text.primary,
                                flex: 1,
                            }}>
                                ₩{entry.sourcePriceKrw.toLocaleString()}
                            </span>
                            <span style={{
                                fontSize: font.size.base,
                                fontWeight: 700,
                                color: priceChangeFromBase !== 0 ? changeColor : colors.text.muted,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                width: '100px',
                                flexShrink: 0,
                            }}>
                                {priceChangeFromBase !== 0 ? (
                                    <>
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill={changeColor} style={{ flexShrink: 0 }}>
                                            {priceChangeFromBase > 0
                                                ? <path d="M5 1L9.5 8H0.5L5 1Z" />
                                                : <path d="M5 9L0.5 2H9.5L5 9Z" />
                                            }
                                        </svg>
                                        ₩{Math.abs(priceChangeFromBase).toLocaleString()}
                                    </>
                                ) : (
                                    <span style={{ fontSize: font.size.sm, fontWeight: 500 }}>—</span>
                                )}
                            </span>
                            <span style={{
                                fontSize: font.size.base,
                                fontWeight: 700,
                                color: entry.marginPercent < 0 ? colors.danger
                                    : entry.marginPercent < 10 ? colors.warningIcon
                                        : colors.success,
                                width: '56px',
                                textAlign: 'left',
                                flexShrink: 0,
                            }}>
                                {entry.marginPercent.toFixed(1)}%
                            </span>
                            {entry.stockStatus === 'out_of_stock' && (
                                <span style={{
                                    fontSize: font.size.xs,
                                    fontWeight: 600,
                                    color: colors.text.primary,
                                    background: colors.bg.subtle,
                                    padding: '1px 6px',
                                    borderRadius: radius.xs,
                                }}>
                                    품절
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes tooltipPop {
                    from { opacity: 0; transform: translate(-50%, -100%) scale(0.95); }
                    to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
                }
            `}</style>
        </div>
    );
};
