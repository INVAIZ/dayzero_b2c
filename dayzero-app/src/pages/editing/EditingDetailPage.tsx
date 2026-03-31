import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';

import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useEditingStore } from '../../store/useEditingStore';
import { useRegistrationStore } from '../../store/useRegistrationStore';
import { EditingHeader } from './components/EditingHeader';
import { EditingTabBar, type DetailTab } from './components/EditingTabBar';
import { BasicEditTab } from './tabs/BasicEditTab';
import { PriceEditTab } from './tabs/PriceEditTab';
import { ThumbnailEditTab } from './tabs/ThumbnailEditTab';
import { DetailImageEditTab } from './tabs/DetailImageEditTab';
import { colors, spacing } from '../../design/tokens';

export default function EditingDetailPage() {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();

    const { products, setCurrentEditProduct, deleteProducts } = useEditingStore();

    const [searchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as DetailTab) || 'basic';
    const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const productIndex = products.findIndex((p) => p.id === productId);
    const product = products[productIndex];

    useEffect(() => {
        if (product) {
            setCurrentEditProduct(product.id);
        }
        return () => setCurrentEditProduct(null);
    }, [product?.id, setCurrentEditProduct]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                const tag = (e.target as HTMLElement).tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA') return;
                e.preventDefault();
                navigate('/editing');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    // 존재하지 않는 ID → /editing redirect
    useEffect(() => {
        if (products.length > 0 && !product) {
            navigate('/editing', { replace: true });
        }
    }, [products.length, product, navigate]);

    if (!product) return null;

    const hasPrev = productIndex > 0;
    const hasNext = productIndex < products.length - 1;

    const handlePrev = () => {
        if (hasPrev) navigate(`/editing/${products[productIndex - 1].id}`);
    };

    const handleNext = () => {
        if (hasNext) navigate(`/editing/${products[productIndex + 1].id}`);
    };

    const handleRegister = () => {
        useRegistrationStore.getState().startJob([product.id], [product]);
        navigate('/registration');
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: colors.bg.surface,
            fontFamily: "'Pretendard', -apple-system, sans-serif",
        }}>
            <Sidebar />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    if (productId) {
                        deleteProducts([productId]);
                        navigate('/editing');
                    }
                }}
                title="이 상품을 삭제할까요?"
                description="수집 목록에서 제거되고, 편집 내용도 함께 삭제돼요. 이 작업은 되돌릴 수 없어요."
                confirmText="삭제"
                cancelText="취소"
            />

            <main style={{
                flex: 1,
                marginLeft: '280px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}>
                <EditingHeader
                    product={product}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    currentIndex={productIndex}
                    totalCount={products.length}
                    onBack={() => navigate('/editing')}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onRegister={handleRegister}
                    onDelete={() => setIsDeleteModalOpen(true)}
                />

                <div style={{
                    flex: 1,
                    padding: `${spacing['6']} 64px 64px`,
                    maxWidth: '1200px',
                    width: '100%',
                    margin: '0 auto',
                    boxSizing: 'border-box',
                }}>
                    <EditingTabBar activeTab={activeTab} onChange={setActiveTab} />

                    {activeTab === 'basic' && <BasicEditTab product={product} />}
                    {activeTab === 'price' && <PriceEditTab product={product} />}
                    {activeTab === 'images' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
                            <ThumbnailEditTab product={product} />
                            <div style={{ maxWidth: '760px', borderTop: `1px solid ${colors.border.default}` }} />
                            <DetailImageEditTab product={product} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
