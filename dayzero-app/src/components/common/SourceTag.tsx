import { Globe } from 'lucide-react';
import { colors, radius } from '../../design/tokens';
import { AIIcon } from './AIIcon';

export const SOURCE_TAG_STYLES: Record<string, { bg: string; color: string }> = {
    ai: { bg: colors.primary, color: colors.white },
    crawled: { bg: colors.border.light, color: colors.text.secondary },
};

export type SourceType = 'crawled' | 'ai' | 'manual';

export const SourceTag: React.FC<{ source: SourceType; size?: number }> = ({ source, size = 10 }) => {
    const tag = SOURCE_TAG_STYLES[source];
    if (!tag) return null;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: tag.bg, color: tag.color,
            padding: '3px 5px', borderRadius: radius.xs,
            lineHeight: 1, flexShrink: 0,
        }}>
            {source === 'ai' ? <AIIcon size={size} color={tag.color} /> : <Globe size={size} />}
        </span>
    );
};
