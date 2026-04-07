import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useRegistrationStore } from '../../store/useRegistrationStore';
import { useEditingStore } from '../../store/useEditingStore';
import { EditingTabBar, type DetailTab } from '../editing/components/EditingTabBar';
import { BasicEditTab } from '../editing/tabs/BasicEditTab';
import { PriceEditTab } from '../editing/tabs/PriceEditTab';
import { ThumbnailEditTab } from '../editing/tabs/ThumbnailEditTab';
import { DetailImageEditTab } from '../editing/tabs/DetailImageEditTab';
import { stripPrefix } from '../../utils/editing';
import { handleImgError } from '../../utils/image';
import { getProviderLogo } from '../../types/sourcing';
import { colors, font, radius, shadow, spacing } from '../../design/tokens';

const TEMP_ID_PREFIX = '__reg_edit__';

export default function RegistrationEditPage() {
    const { resultId } = useParams<{ resultId: string }>();
    const navigate = useNavigate();

    const { jobs, updateRegisteredProduct } = useRegistrationStore();
    const addProduct = useEditingStore(s => s.addProduct);
    const removeProduct = useEditingStore(s => s.removeProduct);
    const setCurrentEditProduct = useEditingStore(s => s.setCurrentEditProduct);

    const [searchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as DetailTab) || 'basic';
    const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(false);


    // 등록 스토어에서 결과 조회
    const result = useMemo(() => {
        for (const job of jobs) {
            const found = job.results.find(r => r.id === resultId);
            if (found) return found;
        }
        return null;
    }, [jobs, resultId]);

    const tempProductId = `${TEMP_ID_PREFIX}${resultId}`;

    // 마운트: 등록 상품을 편집 스토어에 임시 추가
    useEffect(() => {
        if (!result) return;

        // 이미 존재하면 추가하지 않음
        const existing = useEditingStore.getState().products.find(p => p.id === tempProductId);
        if (!existing) {
            const updatedPrice = result.monitoring?.currentSourcePriceKrw;
            addProduct({
                ...result.product,
                id: tempProductId,
                ...(updatedPrice != null ? { originalPriceKrw: updatedPrice } : {}),
            });
        }
        setCurrentEditProduct(tempProductId);

        return () => {
            setCurrentEditProduct(null);
            removeProduct(tempProductId);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resultId]);

    // 편집 스토어에서 임시 상품 조회 (selector로 불필요한 리렌더 방지)
    const product = useEditingStore(s => s.products.find(p => p.id === tempProductId));

    // 변경 감지
    const snapshotKey = (p: typeof product) => p ? JSON.stringify({
        titleKo: p.titleKo, titleJa: p.titleJa,
        descriptionKo: p.descriptionKo, descriptionJa: p.descriptionJa,
        salePriceJpy: p.salePriceJpy, originalPriceKrw: p.originalPriceKrw,
        qoo10CategoryId: p.qoo10CategoryId, weightKg: p.weightKg,
    }) : '';

    const snapshotRef = useRef<string | null>(null);
    useEffect(() => {
        if (!product) return;
        const key = snapshotKey(product);
        if (snapshotRef.current === null) {
            snapshotRef.current = key;
            return;
        }
        if (key !== snapshotRef.current) {
            isDirtyRef.current = true;
            setIsDirty(true);
        }
    }, [product]);

    const markClean = () => {
        isDirtyRef.current = false;
        setIsDirty(false);
        snapshotRef.current = snapshotKey(product);
    };

    const handleBack = () => {
        if (isDirtyRef.current) {
            setPendingLeave(() => () => navigate(`/registration/${resultId}`));
            setIsLeaveModalOpen(true);
        } else {
            navigate(`/registration/${resultId}`);
        }
    };

    const handleSave = () => {
        if (!product || !resultId) return;
        const savedProduct = { ...product, id: result!.product.id };
        updateRegisteredProduct(resultId, savedProduct);
        markClean();
        setIsSaveModalOpen(false);
    };

    if (!result || !product) {
        return (
            <div style={{
                display: 'flex', minHeight: '100vh',
                background: colors.bg.surface,
                fontFamily: "'Pretendard', -apple-system, sans-serif",
            }}>
                <Sidebar />
                <main style={{
                    flex: 1, marginLeft: '280px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{ textAlign: 'center', color: colors.text.muted }}>
                        <p style={{ fontSize: font.size.lg, marginBottom: spacing['4'] }}>상품을 찾을 수 없어요</p>
                        <button
                            onClick={() => navigate('/registration')}
                            style={{
                                padding: `${spacing['2']} ${spacing['4']}`,
                                background: colors.primary, color: colors.white,
                                border: 'none', borderRadius: radius.md,
                                fontSize: font.size.base, fontWeight: font.weight.semibold, cursor: 'pointer',
                            }}
                        >
                            목록으로 돌아가기
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const displayTitle = product.titleJa
        ? stripPrefix(product.titleJa)
        : stripPrefix(product.titleKo);

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: colors.bg.surface,
            fontFamily: "'Pretendard', -apple-system, sans-serif",
        }}>
            <Sidebar />

            <main style={{
                flex: 1,
                marginLeft: '280px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}>
                {/* 헤더 */}
                <div style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    background: colors.bg.surface,
                    borderBottom: `1px solid ${colors.border.default}`,
                    padding: `${spacing['4']} ${spacing['6']}`,
                    boxShadow: shadow.sm,
                }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: spacing['4'],
                    maxWidth: '1200px', margin: '0 auto',
                }}>
                    {/* 돌아가기 */}
                    <button
                        onClick={handleBack}
                        style={{
                            display: 'flex', alignItems: 'center', gap: spacing['1'],
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: font.size.sm, color: colors.text.tertiary,
                            padding: `${spacing['1']} ${spacing['2']}`,
                            borderRadius: radius.md,
                            whiteSpace: 'nowrap', flexShrink: 0,
                            transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = colors.text.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.color = colors.text.tertiary; }}
                    >
                        <ArrowLeft size={14} />
                        돌아가기
                    </button>

                    <div style={{ width: '1px', height: '32px', background: colors.border.default, flexShrink: 0 }} />

                    {/* 썸네일 + 상품 정보 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], flex: 1, minWidth: 0, maxWidth: '600px' }}>
                        <img
                            src={product.thumbnailUrl}
                            alt=""
                            onError={handleImgError}
                            style={{
                                width: '40px', height: '40px',
                                borderRadius: radius.md,
                                objectFit: 'cover', flexShrink: 0,
                                border: `1px solid ${colors.border.default}`,
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], minWidth: 0 }}>
                            <img
                                src={getProviderLogo(product.provider)}
                                alt={product.provider}
                                style={{ width: '18px', height: '18px', borderRadius: radius.xs, objectFit: 'cover', flexShrink: 0 }}
                            />
                            <span style={{
                                fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.text.primary,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {displayTitle}
                            </span>
                        </div>
                    </div>

                    {/* 저장하기 */}
                    <button
                        onClick={() => isDirty && setIsSaveModalOpen(true)}
                        disabled={!isDirty}
                        style={{
                            display: 'flex', alignItems: 'center', gap: spacing['2'],
                            padding: `${spacing['2']} ${spacing['4']}`,
                            background: isDirty ? colors.primary : colors.border.default,
                            color: isDirty ? colors.bg.surface : colors.text.muted,
                            border: 'none', borderRadius: radius.md,
                            fontSize: font.size.sm, fontWeight: font.weight.semibold,
                            cursor: isDirty ? 'pointer' : 'not-allowed',
                            flexShrink: 0,
                            marginLeft: spacing['10'],
                            transition: 'background 0.2s',
                            opacity: isDirty ? 1 : 0.6,
                        }}
                        onMouseEnter={e => { if (isDirty) e.currentTarget.style.background = colors.primaryHover; }}
                        onMouseLeave={e => { if (isDirty) e.currentTarget.style.background = colors.primary; }}
                    >
                        저장하기
                    </button>
                </div>
                </div>

                {/* 탭 + 콘텐츠 */}
                <div style={{
                    flex: 1,
                    padding: `${spacing['6']} 64px 64px`,
                    maxWidth: '1200px',
                    width: '100%',
                    margin: '0 auto',
                    boxSizing: 'border-box',
                }}>
                    <EditingTabBar activeTab={activeTab} onChange={setActiveTab} />

                    {activeTab === 'basic' && <BasicEditTab product={product} hideProgress />}
                    {activeTab === 'price' && <PriceEditTab product={product} autoSave={false} onChanged={() => { isDirtyRef.current = true; setIsDirty(true); }} />}
                    {activeTab === 'images' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
                            <ThumbnailEditTab product={product} />
                            <div style={{ maxWidth: '760px', borderTop: `1px solid ${colors.border.default}` }} />
                            <DetailImageEditTab product={product} />
                        </div>
                    )}
                </div>
            </main>

            {/* 저장 확인 모달 */}
            <ConfirmModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onConfirm={handleSave}
                title="이대로 Qoo10에 반영할까요?"
                description="수정한 내용이 Qoo10 JP 상품 페이지에 즉시 반영됩니다."
                confirmText="반영하기"
                cancelText="취소"
                type="info"
            />

            {/* 이탈 방어 모달 */}
            <ConfirmModal
                isOpen={isLeaveModalOpen}
                onClose={() => { setIsLeaveModalOpen(false); setPendingLeave(null); }}
                onConfirm={() => {
                    setIsLeaveModalOpen(false);
                    isDirtyRef.current = false;
                    pendingLeave?.();
                    setPendingLeave(null);
                }}
                title="수정한 내용이 저장되지 않아요"
                description="이 페이지를 나가면 수정한 내용이 모두 사라집니다."
                confirmText="나가기"
                cancelText="계속 수정하기"
            />
        </div>
    );
}
