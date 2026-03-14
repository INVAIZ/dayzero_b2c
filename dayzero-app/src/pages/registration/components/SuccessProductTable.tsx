import { ExternalLink } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import { EmptyState } from '../../../components/common/StatusComponents';
import type { RegistrationResult } from '../../../types/registration';

interface Props {
    results: RegistrationResult[];
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
}

export const SuccessProductTable: React.FC<Props> = ({ results }) => {
    if (results.length === 0) {
        return <EmptyState label="등록 성공한 상품이 없습니다" />;
    }

    return (
        <div style={{
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.lg,
            overflow: 'hidden',
        }}>
            {/* 헤더 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: `${spacing['3']} ${spacing['4']}`,
                background: colors.bg.faint,
                borderBottom: `1px solid ${colors.border.default}`,
                gap: spacing['3'],
            }}>
                <span style={{ ...headerStyle, flex: 1, minWidth: 0 }}>상품</span>
                <span style={{ ...headerStyle, flex: '0 0 90px' }}>판매가</span>
                <span style={{ ...headerStyle, flex: '0 0 130px' }}>Qoo10 ID</span>
                <span style={{ ...headerStyle, flex: '0 0 110px' }}>등록일시</span>
                <span style={{ ...headerStyle, flex: '0 0 50px', textAlign: 'center' }}>링크</span>
            </div>

            {/* 행 */}
            {results.map((r, i) => {
                const isLast = i === results.length - 1;
                return (
                    <div
                        key={r.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: `${spacing['3']} ${spacing['4']}`,
                            borderBottom: isLast ? 'none' : `1px solid ${colors.border.default}`,
                            gap: spacing['3'],
                            transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = colors.bg.faint; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        {/* 상품 */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: spacing['3'], minWidth: 0 }}>
                            <img
                                src={r.product.thumbnailUrl}
                                alt=""
                                onError={e => { const t = e.currentTarget; t.style.background = '#F2F4F6'; t.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; }}
                                style={{
                                    width: '36px', height: '36px',
                                    borderRadius: radius.md,
                                    objectFit: 'cover',
                                    border: `1px solid ${colors.border.default}`,
                                    flexShrink: 0,
                                }}
                            />
                            <span style={{
                                fontSize: font.size.sm,
                                fontWeight: 500,
                                color: colors.text.primary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {r.product.titleJa ?? r.product.titleKo}
                            </span>
                        </div>

                        {/* 판매가 */}
                        <div style={{
                            flex: '0 0 90px',
                            fontSize: font.size.sm,
                            fontWeight: 600,
                            color: colors.text.primary,
                        }}>
                            ¥{r.product.salePriceJpy.toLocaleString()}
                        </div>

                        {/* Qoo10 ID */}
                        <div style={{
                            flex: '0 0 130px',
                            fontSize: font.size.xs,
                            fontFamily: font.family.mono,
                            color: colors.text.tertiary,
                        }}>
                            {r.qoo10ItemCode}
                        </div>

                        {/* 등록일시 */}
                        <div style={{
                            flex: '0 0 110px',
                            fontSize: font.size.sm,
                            color: colors.text.muted,
                        }}>
                            {formatDate(r.registeredAt)}
                        </div>

                        {/* 링크 */}
                        <div style={{ flex: '0 0 50px', textAlign: 'center' }}>
                            <a
                                href={r.qoo10ProductUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: colors.primary,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: spacing['1'],
                                    fontSize: font.size.sm,
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                }}
                            >
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const headerStyle: React.CSSProperties = {
    fontSize: font.size.xs,
    fontWeight: 600,
    color: colors.text.muted,
    whiteSpace: 'nowrap',
};
