import { X, CheckCircle2, Loader2, Package } from 'lucide-react';
import { colors, font, spacing, radius, shadow, zIndex } from '../../../design/tokens';
import type { CollectionNotification } from '../../../store/useSourcingStore';
import type { SourcedProduct } from '../../../types/sourcing';
import type { ProductDetail } from '../../../types/editing';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    notifications: CollectionNotification[];
    sourcingProducts: SourcedProduct[];
    editingProducts: ProductDetail[];
    onSelectJob: (notifId: string) => void;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();

    if (d.toDateString() === now.toDateString()) {
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `오늘 ${hh}:${min}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `어제 ${hh}:${min}`;
    }

    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
}

function getNotifLabel(
    notif: CollectionNotification,
    sourcingProducts: SourcedProduct[],
    editingProducts: ProductDetail[],
): { name: string; suffix: string | null } {
    const fromSourcing = sourcingProducts.filter(p => p.jobId === notif.id);
    const firstName = fromSourcing.length > 0
        ? fromSourcing[0].title
        : editingProducts.find(p => p.jobId === notif.id)?.titleKo ?? null;

    if (!firstName) return { name: `${notif.totalCount}건 수집`, suffix: null };
    if (notif.totalCount === 1) return { name: firstName, suffix: null };
    return { name: firstName, suffix: `외 ${notif.totalCount - 1}건` };
}

export const SourcingHistoryModal: React.FC<Props> = ({
    isOpen, onClose, notifications, sourcingProducts, editingProducts, onSelectJob,
}) => {
    if (!isOpen) return null;

    const filtered = notifications.filter(n => n.status === 'completed' || n.status === 'running');
    const sorted = [...filtered].sort((a, b) => {
        if (a.status === 'running' && b.status !== 'running') return -1;
        if (a.status !== 'running' && b.status === 'running') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const totalCollected = filtered.reduce((sum, n) => sum + n.currentCount, 0);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: zIndex.modal,
                animation: 'sourcingOverlayIn 0.2s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: colors.bg.surface,
                    borderRadius: radius.xl,
                    width: '580px',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    boxShadow: shadow.lg,
                    animation: 'sourcingModalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* 헤더 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${spacing['5']} ${spacing['6']}`,
                    borderBottom: `1px solid ${colors.border.default}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                        <Package size={18} color={colors.primary} />
                        <span style={{
                            fontSize: font.size.lg,
                            fontWeight: font.weight.bold,
                            color: colors.text.primary,
                        }}>
                            수집 기록
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: spacing['1'],
                            borderRadius: radius.md,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = colors.bg.subtle; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                        <X size={20} color={colors.text.muted} />
                    </button>
                </div>

                {/* 요약 */}
                {sorted.length > 0 && (
                    <div style={{
                        padding: `${spacing['4']} ${spacing['6']}`,
                        background: colors.bg.faint,
                        borderBottom: `1px solid ${colors.border.default}`,
                        display: 'flex',
                        gap: spacing['4'],
                    }}>
                        <SummaryBadge label="총 수집 횟수" value={`${sorted.length}회`} />
                        <SummaryBadge label="수집된 상품" value={`${totalCollected}건`} color={colors.success} />
                    </div>
                )}

                {/* 목록 */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: `${spacing['4']} ${spacing['6']}`,
                }}>
                    {sorted.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: `${spacing['8']} 0`,
                            color: colors.text.muted,
                            fontSize: font.size.base,
                        }}>
                            아직 수집 기록이 없어요
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                            {sorted.map((notif) => {
                                const isRunning = notif.status === 'running';
                                const label = getNotifLabel(notif, sourcingProducts, editingProducts);
                                const matchedSourcing = sourcingProducts.filter(p => p.jobId === notif.id);
                                const matchedEditing = editingProducts.filter(p => p.jobId === notif.id);
                                const thumbnail = matchedSourcing.length > 0
                                    ? matchedSourcing[0].thumbnailUrl
                                    : matchedEditing.length > 0
                                        ? matchedEditing[0].thumbnailUrl
                                        : null;

                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => { onSelectJob(notif.id); onClose(); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: spacing['3'],
                                            padding: spacing['3'],
                                            background: isRunning ? colors.bg.info : 'transparent',
                                            borderRadius: radius.md,
                                            border: isRunning
                                                ? `1px solid ${colors.primaryLightBorder}`
                                                : '1px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isRunning) e.currentTarget.style.background = colors.bg.faint;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = isRunning ? colors.bg.info : 'transparent';
                                        }}
                                    >
                                        {/* 썸네일 */}
                                        {thumbnail ? (
                                            <img
                                                src={thumbnail}
                                                alt=""
                                                style={{
                                                    width: '36px', height: '36px',
                                                    borderRadius: radius.md,
                                                    objectFit: 'cover',
                                                    border: `1px solid ${colors.border.default}`,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '36px', height: '36px',
                                                borderRadius: radius.md,
                                                background: isRunning ? colors.primaryLight : colors.bg.subtle,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {isRunning
                                                    ? <Loader2 size={14} color={colors.primary} />
                                                    : <CheckCircle2 size={14} color={colors.success} />
                                                }
                                            </div>
                                        )}

                                        {/* 상품명 + 날짜 */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: font.size.sm,
                                                fontWeight: font.weight.semibold,
                                                color: colors.text.primary,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {label.name}
                                                {label.suffix && (
                                                    <span style={{
                                                        fontWeight: font.weight.medium,
                                                        color: colors.text.muted,
                                                        marginLeft: spacing['1'],
                                                    }}>
                                                        {label.suffix}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontSize: font.size.xs,
                                                color: colors.text.muted,
                                                marginTop: '1px',
                                            }}>
                                                {formatDate(notif.createdAt)}
                                            </div>
                                        </div>

                                        {/* 유형 태그 + 결과 */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: spacing['2'],
                                            flexShrink: 0,
                                            paddingTop: '1px',
                                        }}>
                                            <span style={{
                                                fontSize: font.size.xs,
                                                fontWeight: font.weight.semibold,
                                                padding: '2px 8px',
                                                borderRadius: radius.full,
                                                background: notif.type === 'url' ? colors.primaryLight : colors.warningLight,
                                                color: notif.type === 'url' ? colors.primary : colors.warningIcon,
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {notif.type === 'url' ? 'URL' : '자동'}
                                            </span>

                                            {isRunning ? (
                                                <span style={{
                                                    fontSize: font.size.xs,
                                                    fontWeight: font.weight.semibold,
                                                    color: colors.primary,
                                                }}>
                                                    {notif.currentCount}/{notif.totalCount}
                                                </span>
                                            ) : (
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    fontSize: font.size.xs,
                                                    fontWeight: font.weight.semibold,
                                                    color: colors.success,
                                                }}>
                                                    <CheckCircle2 size={13} />{notif.currentCount}건
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 하단 */}
                <div style={{
                    padding: `${spacing['4']} ${spacing['6']}`,
                    borderTop: `1px solid ${colors.border.default}`,
                }}>
                    <span style={{
                        fontSize: font.size.xs,
                        color: colors.text.muted,
                    }}>
                        수집 기록을 클릭하면 해당 상품이 선택돼요
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes sourcingOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes sourcingModalSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

// ── 하위 컴포넌트 ─────────────────────────────────────────────────────────

const SummaryBadge: React.FC<{
    label: string;
    value: string;
    color?: string;
}> = ({ label, value, color }) => (
    <div>
        <div style={{
            fontSize: font.size.xs,
            fontWeight: font.weight.medium,
            color: colors.text.muted,
            marginBottom: '2px',
        }}>
            {label}
        </div>
        <div style={{
            fontSize: font.size.base,
            fontWeight: font.weight.bold,
            color: color ?? colors.text.primary,
        }}>
            {value}
        </div>
    </div>
);
