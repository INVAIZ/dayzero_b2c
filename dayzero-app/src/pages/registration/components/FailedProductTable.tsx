import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { colors, font, spacing, radius } from '../../../design/tokens';
import { EmptyState } from '../../../components/common/StatusComponents';
import { ErrorDetailPanel, ERROR_TYPE_LABELS } from './ErrorDetailPanel';
import { handleImgError } from '../../../utils/image';
import type { RegistrationResult, RegistrationErrorType } from '../../../types/registration';

interface Props {
    results: RegistrationResult[];
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    onSelectAll: () => void;
    onGoToEdit: (productId: string) => void;
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

// 에러 유형별 태그 색상
const ERROR_TAG_STYLES: Record<RegistrationErrorType, { bg: string; color: string }> = {
    api_error: { bg: colors.dangerBg, color: colors.danger },
    missing_required: { bg: colors.warningLight, color: colors.warningTextDark },
    category_mismatch: { bg: colors.primaryLight, color: colors.primary },
    image_spec: { bg: colors.dangerLight, color: colors.danger },
    policy_violation: { bg: colors.dangerBg, color: colors.danger },
    server_timeout: { bg: colors.bg.subtle, color: colors.text.tertiary },
};

const Checkbox = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
    <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
            width: '20px', height: '20px',
            borderRadius: radius.sm,
            border: checked ? 'none' : `2px solid ${colors.border.light}`,
            background: checked ? colors.primary : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
        }}
    >
        {checked && <Check size={14} color={colors.bg.surface} strokeWidth={2.5} />}
    </div>
);

export const FailedProductTable: React.FC<Props> = ({ results, selectedIds, onToggleSelect, onSelectAll, onGoToEdit }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const allSelected = results.length > 0 && selectedIds.length === results.length;

    if (results.length === 0) {
        return <EmptyState label="등록 실패한 상품이 없습니다" />;
    }

    return (
        <div style={{
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.lg,
            overflow: 'hidden',
        }}>
            {/* 헤더 — 통일된 테이블 헤더 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['3'],
                padding: `${spacing['3']} ${spacing['4']}`,
                background: colors.bg.faint,
                borderBottom: `1px solid ${colors.border.default}`,
            }}>
                <Checkbox checked={allSelected} onClick={onSelectAll} />
                <span style={{ ...headerStyle, flex: 1, minWidth: 0 }}>
                    {selectedIds.length > 0 ? `${selectedIds.length}건 선택` : '상품'}
                </span>
                <span style={{ ...headerStyle, flex: '0 0 100px' }}>에러 유형</span>
                <span style={{ ...headerStyle, flex: '0 0 110px' }}>실패일시</span>
                <span style={{ ...headerStyle, flex: '0 0 30px' }} />
            </div>

            {/* 상품 목록 */}
            {results.map((r, i) => {
                const isExpanded = expandedId === r.id;
                const isSelected = selectedIds.includes(r.id);
                const tagStyle = r.error
                    ? ERROR_TAG_STYLES[r.error.type] ?? ERROR_TAG_STYLES.server_timeout
                    : ERROR_TAG_STYLES.server_timeout;
                const isLast = i === results.length - 1;

                return (
                    <div key={r.id} style={{
                        borderBottom: isLast ? 'none' : `1px solid ${colors.border.default}`,
                        background: isSelected ? colors.primaryLight : colors.bg.surface,
                        transition: 'background 0.1s',
                    }}>
                        {/* 행 */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing['3'],
                                padding: `${spacing['3']} ${spacing['4']}`,
                                cursor: 'pointer',
                            }}
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        >
                            <Checkbox
                                checked={isSelected}
                                onClick={() => onToggleSelect(r.id)}
                            />

                            {/* 상품 */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: spacing['3'], minWidth: 0 }}>
                                <img
                                    src={r.product.thumbnailUrl}
                                    alt=""
                                    onError={handleImgError}
                                    style={{
                                        width: '36px', height: '36px',
                                        borderRadius: radius.md,
                                        objectFit: 'cover',
                                        border: `1px solid ${colors.border.default}`,
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontSize: font.size.sm,
                                        fontWeight: 500,
                                        color: colors.text.primary,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {r.product.titleJa ?? r.product.titleKo}
                                    </div>
                                    {r.error && (
                                        <div style={{
                                            fontSize: font.size.xs,
                                            color: colors.danger,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            marginTop: '1px',
                                        }}>
                                            {r.error.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 에러 유형 태그 */}
                            <div style={{ flex: '0 0 100px' }}>
                                {r.error && (
                                    <span style={{
                                        background: tagStyle.bg,
                                        color: tagStyle.color,
                                        fontSize: font.size.xs,
                                        fontWeight: 600,
                                        padding: '3px 10px',
                                        borderRadius: radius.full,
                                        whiteSpace: 'nowrap',
                                        display: 'inline-block',
                                    }}>
                                        {ERROR_TYPE_LABELS[r.error.type] ?? r.error.type}
                                    </span>
                                )}
                            </div>

                            {/* 실패일시 */}
                            <div style={{
                                flex: '0 0 110px',
                                fontSize: font.size.sm,
                                color: colors.text.muted,
                                whiteSpace: 'nowrap',
                            }}>
                                {formatDate(r.registeredAt)}
                            </div>

                            {/* 확장 아이콘 */}
                            <div style={{
                                flex: '0 0 30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}>
                                <ChevronDown size={16} color={colors.text.muted} />
                            </div>
                        </div>

                        {/* 에러 상세 패널 */}
                        {isExpanded && r.error && (
                            <div style={{
                                padding: `0 ${spacing['4']} ${spacing['4']}`,
                                paddingLeft: `calc(20px + ${spacing['3']} + ${spacing['4']})`,
                            }}>
                                <ErrorDetailPanel
                                    error={r.error}
                                    productId={r.productId}
                                    onGoToEdit={onGoToEdit}
                                />
                            </div>
                        )}
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
