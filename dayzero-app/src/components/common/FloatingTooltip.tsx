import { useState, useRef, useEffect } from 'react';
import { colors, font, radius, shadow, spacing, zIndex } from '../../design/tokens';

export interface TooltipData {
    x: number;
    y: number;
    content: React.ReactNode;
}

/** 화면 고정 위치 툴팁 — 뷰포트 경계 자동 보정 */
export const FloatingTooltip: React.FC<{ data: TooltipData }> = ({ data }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ x: data.x, y: data.y });

    useEffect(() => {
        if (!ref.current) return;
        const { width, height } = ref.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let x = data.x;
        let y = data.y + 12;
        if (x + width > vw - 16) x = vw - width - 16;
        if (y + height > vh - 16) y = data.y - height - 12;
        setPos({ x, y });
    }, [data.x, data.y]);

    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                left: pos.x,
                top: pos.y,
                zIndex: zIndex.toast,
                background: colors.text.primary,
                color: colors.bg.surface,
                borderRadius: radius.lg,
                padding: `${spacing['3']} ${spacing['4']}`,
                boxShadow: shadow.lg,
                pointerEvents: 'none',
                maxWidth: '400px',
                width: 'max-content',
                fontSize: font.size.base,
                wordBreak: 'keep-all',
                lineHeight: font.lineHeight.normal,
                animation: 'tooltipFadeIn 0.12s ease',
            }}
        >
            {data.content}
        </div>
    );
};
