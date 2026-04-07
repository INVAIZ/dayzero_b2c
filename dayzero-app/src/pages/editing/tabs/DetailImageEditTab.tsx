import { useState } from 'react';
import { Loader2, Check, RotateCcw, Languages } from 'lucide-react';
import type { ProductDetail } from '../../../types/editing';
import { useEditingStore } from '../../../store/useEditingStore';
import { colors, font, radius, spacing } from '../../../design/tokens';
import { getDetailSvgs } from '../../../mock/detailImageSvgs';

interface Props {
    product: ProductDetail;
}

export const DetailImageEditTab: React.FC<Props> = ({ product }) => {
    const { addCompletedTranslationBatch } = useEditingStore();
    const [status, setStatus] = useState<'idle' | 'translating' | 'done'>('idle');
    const [progress, setProgress] = useState(0);

    const { ko: koSvgs, ja: jaSvgs } = getDetailSvgs(product.qoo10CategoryPath);
    const isDone = status === 'done';
    const totalCount = koSvgs.length;

    const handleTranslateAll = () => {
        if (status === 'translating' || isDone) return;
        setStatus('translating');
        setProgress(0);
        let done = 0;
        koSvgs.forEach((_, i) => {
            setTimeout(() => {
                done++;
                setProgress(Math.round((done / totalCount) * 100));
                if (done === totalCount) {
                    setStatus('done');
                    addCompletedTranslationBatch(product.id, '상세페이지 번역');
                }
            }, (i + 1) * 1800);
        });
    };

    const handleRevertAll = () => {
        setStatus('idle');
        setProgress(0);
    };

    const displayImages = isDone ? jaSvgs : koSvgs;

    return (
        <div style={{ maxWidth: '760px' }}>
            <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

            {/* 상단 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing['4'] }}>
                <div>
                    <span style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.secondary }}>상세페이지 이미지</span>
                </div>
                <div style={{ display: 'flex', gap: spacing['2'] }}>
                    {isDone && (
                        <button
                            onClick={handleRevertAll}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: `7px ${spacing['3']}`,
                                background: 'none',
                                border: `1px solid ${colors.border.default}`,
                                borderRadius: radius.md,
                                fontSize: font.size.sm, fontWeight: font.weight.semibold,
                                color: colors.text.secondary,
                                cursor: 'pointer',
                            }}
                        >
                            <RotateCcw size={13} /> 원본 복원
                        </button>
                    )}
                    <button
                        onClick={handleTranslateAll}
                        disabled={status === 'translating' || isDone}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: `7px ${spacing['3']}`,
                            background: (status === 'translating' || isDone) ? colors.bg.subtle : colors.primaryLight,
                            border: `1px solid ${(status === 'translating' || isDone) ? colors.border.default : colors.primaryBorder}`,
                            borderRadius: radius.md,
                            fontSize: font.size.sm, fontWeight: font.weight.semibold,
                            color: (status === 'translating' || isDone) ? colors.text.muted : colors.primary,
                            cursor: (status === 'translating' || isDone) ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {status === 'translating'
                            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            : isDone ? <Check size={13} /> : <Languages size={13} />
                        }
                        {isDone ? '번역 완료' : status === 'translating' ? `번역 중... ${progress}%` : '상세페이지 번역'}
                    </button>
                </div>
            </div>

            {/* 진행률 바 */}
            {status === 'translating' && (
                <div style={{ marginBottom: spacing['4'] }}>
                    <div style={{ height: '4px', background: colors.border.default, borderRadius: radius.full, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', background: colors.primary,
                            width: `${progress}%`, transition: 'width 0.4s ease',
                            borderRadius: radius.full,
                        }} />
                    </div>
                    <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '4px' }}>
                        {Math.round(progress / 100 * totalCount)}장 / {totalCount}장 처리 중
                    </div>
                </div>
            )}

            {/* 이미지 스트립 */}
            <div style={{
                border: `1px solid ${isDone ? colors.primaryBorder : colors.border.default}`,
                overflow: 'hidden',
                position: 'relative',
            }}>
                {displayImages.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt=""
                        style={{ width: '100%', display: 'block' }}
                    />
                ))}
                {status === 'translating' && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(49,130,246,0.08)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: spacing['3'],
                    }}>
                        <Loader2 size={36} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.primary }}>
                            상세페이지 번역 중...
                        </span>
                    </div>
                )}
                {isDone && (
                    <div style={{
                        position: 'absolute', top: spacing['3'], right: spacing['3'],
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        background: colors.primary, color: colors.white,
                        padding: '4px 10px', borderRadius: radius.full,
                        fontSize: font.size.xs, fontWeight: font.weight.bold,
                    }}>
                        <Check size={11} /> 일본어 번역 완료
                    </div>
                )}
            </div>
        </div>
    );
};
