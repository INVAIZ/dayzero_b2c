import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useEditingStore } from '../../store/useEditingStore';
import { useSourcingStore } from '../../store/useSourcingStore';
import { useOnboarding } from '../../components/onboarding/OnboardingContext';
import { SOURCING_PROVIDERS } from '../../types/sourcing';
import type { EditTabFilter, ProductDetail } from '../../types/editing';
import { ProductListItem } from './components/ProductListItem';
import { BulkActionBar } from './components/BulkActionBar';
import { TranslationModal } from './components/TranslationModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Checkbox } from '../../components/common/Checkbox';
import { colors, font, radius, spacing } from '../../design/tokens';
import { calculateIntlShippingKrw } from '../../utils/shipping';

const TAB_LABELS: { key: EditTabFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'needs_translation', label: '번역 필요' },
    { key: 'translated', label: '번역 완료' },
];

type SortKey = 'createdAt' | 'salePriceJpy' | 'title';
type SortDir = 'asc' | 'desc';

const SortHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    active: SortKey;
    dir: SortDir;
    onSort: (k: SortKey) => void;
    style?: React.CSSProperties;
}> = ({ label, sortKey, active, dir, onSort, style }) => {
    const isActive = active === sortKey;
    return (
        <div
            onClick={() => onSort(sortKey)}
            style={{
                ...style,
                display: 'flex', alignItems: 'center', gap: '3px',
                fontSize: font.size.xs, fontWeight: 600,
                color: colors.text.muted,
                cursor: 'pointer', userSelect: 'none',
            }}
        >
            {label}
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <ChevronUp size={10} style={{ opacity: isActive && dir === 'asc' ? 1 : 0.25 }} />
                <ChevronDown size={10} style={{ opacity: isActive && dir === 'desc' ? 1 : 0.25 }} />
            </span>
        </div>
    );
};

export default function EditingListPage() {
    const navigate = useNavigate();
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir(key === 'createdAt' ? 'desc' : 'asc'); }
    };
    const location = useLocation();
    const {
        products, selectedProductIds, activeTab, providerFilter, searchKeyword,
        setActiveTab, setProviderFilter, setSearchKeyword,
        toggleSelectProduct, selectAll, clearSelection,
        openTranslationModal, closeTranslationModal, isTranslationModalOpen, deleteProducts, updateProduct,
        startTranslationJobs, startRegistrationBatch, markProductsRead, selectByJobId
    } = useEditingStore();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        return () => {
            markProductsRead();
        };
    }, [markProductsRead]);

    const { state: onboardingState } = useOnboarding();
    const { clearUnprocessedCount } = useSourcingStore();

    useEffect(() => {
        clearUnprocessedCount();
    }, [clearUnprocessedCount]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const focusJobId = params.get('focusJobId');

        if (focusJobId && products.length > 0) {
            const hasFocusItems = products.some(p => p.jobId === focusJobId);

            if (hasFocusItems) {
                setActiveTab('all');
                setProviderFilter('전체');
                selectByJobId(focusJobId);
                setTimeout(() => {
                    const element = document.querySelector(`[data-job-id="${focusJobId}"]`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);

                navigate(location.pathname, { replace: true });
            }
        }
    }, [selectByJobId, setActiveTab, setProviderFilter, products.length, location.search, location.pathname, navigate]);

    useEffect(() => {
        // 일괄 업데이트를 위해 변경사항 수집
        const updates: { id: string, updates: Partial<ProductDetail> }[] = [];

        products.forEach(p => {
            const intlShippingFromWeight = calculateIntlShippingKrw(p.weightKg);
            const costKrw = p.originalPriceKrw + onboardingState.domesticShipping + onboardingState.prepCost + intlShippingFromWeight;
            const margin = onboardingState.marginType === '%' ? costKrw * (onboardingState.marginValue / 100) : onboardingState.marginValue;
            const salePriceKrw = costKrw + margin;
            const expectedJpy = Math.round(salePriceKrw * 0.11);

            if (Math.abs(p.salePriceJpy - expectedJpy) > 10) {
                updates.push({ id: p.id, updates: { salePriceJpy: expectedJpy } });
            }
        });

        // 한 번에 하나씩 업데이트 (루프 방지를 위해 순차적 처리 또는 추후 스토어에 batchUpdate 추가 필요)
        if (updates.length > 0) {
            updates.forEach(u => updateProduct(u.id, u.updates));
        }
    }, [products.length, onboardingState, updateProduct]);

    // 탭별 건수 (providerFilter 무관하게 계산)
    const counts = useMemo(() => ({
        all: products.length,
        needs_translation: products.filter((p) => ['pending', 'failed', 'processing'].includes(p.translationStatus)).length,
        translated: products.filter((p) => p.translationStatus === 'completed').length,
    }), [products]);

    // 탭 기준 필터링 (소싱처 필터 전)
    const tabFiltered = useMemo(() => products.filter((p) => {
        if (activeTab === 'needs_translation') return ['pending', 'failed', 'processing'].includes(p.translationStatus);
        if (activeTab === 'translated') return p.translationStatus === 'completed';
        return true;
    }), [products, activeTab]);

    // 현재 탭에 존재하는 소싱처만 추출
    const availableProviders = useMemo(() => {
        const set = new Set(tabFiltered.map((p) => p.provider));
        return SOURCING_PROVIDERS.filter((sp) => set.has(sp.name));
    }, [tabFiltered]);

    // 최종 필터링
    const filtered = useMemo(() => tabFiltered.filter((p) => {
        if (providerFilter !== '전체' && p.provider !== providerFilter) return false;
        if (searchKeyword && !p.titleKo.includes(searchKeyword) && !(p.titleJa ?? '').includes(searchKeyword)) return false;
        return true;
    }), [tabFiltered, providerFilter, searchKeyword]);

    const sorted = useMemo(() => [...filtered].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
        else if (sortKey === 'salePriceJpy') cmp = a.salePriceJpy - b.salePriceJpy;
        else if (sortKey === 'title') cmp = (a.titleJa ?? a.titleKo).localeCompare(b.titleJa ?? b.titleKo);
        return sortDir === 'asc' ? cmp : -cmp;
    }), [filtered, sortKey, sortDir]);

    const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedProductIds.includes(p.id));

    const selectedTranslateCount = useMemo(() =>
        products.filter((p) => selectedProductIds.includes(p.id) && ['pending', 'failed', 'completed'].includes(p.translationStatus)).length,
        [products, selectedProductIds]
    );

    const selectedTranslatedIds = useMemo(() =>
        products.filter(p => selectedProductIds.includes(p.id) && p.translationStatus === 'completed').map(p => p.id),
        [products, selectedProductIds]
    );
    const selectedAlreadyTranslatedCount = selectedTranslatedIds.length;
    const selectedRegisterCount = selectedTranslatedIds.length;

    const handleSelectAll = () => {
        if (allFilteredSelected) clearSelection();
        else selectAll(filtered.map((p) => p.id));
    };

    return (
        <MainLayout>
            <style>{`
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @keyframes tooltipFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* 페이지 헤더 */}
            <div style={{ marginBottom: spacing['6'], animation: 'fadeInUp 0.6s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], marginBottom: '6px' }}>
                    <h1 style={{ fontSize: font.size['2xl'], fontWeight: 700, color: colors.text.primary }}>수집된 상품</h1>
                    <span style={{
                        padding: '4px 10px', borderRadius: radius.full,
                        background: colors.bg.subtle, fontSize: font.size.sm,
                        fontWeight: 700, color: colors.text.secondary,
                    }}>
                        {products.length}건
                    </span>
                </div>
                <p style={{ fontSize: font.size.md, color: colors.text.tertiary }}>
                    번역 후 Qoo10에 등록할 상품을 편집하고 등록하세요.
                </p>
            </div>

            {/* 메인 탭 */}
            <div style={{ display: 'flex', gap: '2px', borderBottom: `2px solid ${colors.border.default}`, marginBottom: spacing['4'] }}>
                {TAB_LABELS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => { setActiveTab(key); setProviderFilter('전체'); }}
                        style={{
                            padding: `${spacing['3']} ${spacing['4']}`,
                            background: 'none', border: 'none',
                            borderBottom: `2px solid ${activeTab === key ? colors.primary : 'transparent'}`,
                            marginBottom: '-2px',
                            fontSize: font.size.base,
                            fontWeight: activeTab === key ? 700 : 500,
                            color: activeTab === key ? colors.primary : colors.text.tertiary,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: spacing['2'],
                            transition: 'color 0.15s',
                        }}
                    >
                        {label}
                        <span style={{
                            padding: '2px 7px', borderRadius: radius.full,
                            fontSize: font.size.xs, fontWeight: 700,
                            background: activeTab === key ? colors.primary : colors.bg.subtle,
                            color: activeTab === key ? '#fff' : colors.text.muted,
                        }}>
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* 검색 */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: spacing['2'],
                padding: `0 ${spacing['3']}`,
                border: `1px solid ${colors.border.default}`,
                borderRadius: radius.md, background: colors.bg.surface,
                marginBottom: spacing['3'],
            }}>
                <Search size={16} color={colors.text.muted} />
                <input
                    type="text"
                    placeholder="상품명으로 검색"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        fontSize: font.size.base, color: colors.text.primary,
                        padding: `${spacing['3']} 0`, background: 'transparent',
                    }}
                />
            </div>

            {/* 소싱처 필터 (소싱 페이지와 동일한 디자인) */}
            {availableProviders.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: spacing['4'], overflowX: 'auto', paddingBottom: '4px' }}>
                    {['전체', ...availableProviders.map((p) => p.name)].map((filter) => {
                        const isActive = providerFilter === filter;
                        const logo = SOURCING_PROVIDERS.find((p) => p.name === filter)?.logo;
                        return (
                            <button
                                key={filter}
                                onClick={() => setProviderFilter(filter)}
                                style={{
                                    padding: filter === '전체' ? '8px 16px' : (isActive ? '8px 16px' : '8px'),
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: isActive ? 600 : 500,
                                    color: isActive ? colors.primary : colors.text.tertiary,
                                    background: isActive ? colors.primaryLight : colors.bg.surface,
                                    border: isActive ? `1px solid ${colors.primaryLight}` : `1px solid ${colors.border.default}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: filter === '전체' ? '6px' : (isActive ? '6px' : '0px'),
                                }}
                            >
                                <div style={{
                                    width: isActive ? '14px' : '0px',
                                    opacity: isActive ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Check size={14} strokeWidth={3} style={{ flexShrink: 0 }} />
                                </div>

                                {filter !== '전체' && logo && (
                                    <img src={logo} alt={filter} style={{ width: '16px', height: '16px', borderRadius: '4px', objectFit: 'cover' }} />
                                )}

                                <div style={{
                                    maxWidth: filter === '전체' || isActive ? '100px' : '0px',
                                    opacity: filter === '전체' || isActive ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    display: 'flex', alignItems: 'center',
                                }}>
                                    {filter}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* 컬럼 헤더 (전체 선택 체크박스 포함) */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: spacing['5'],
                padding: `0 ${spacing['5']}`, marginBottom: spacing['2'],
            }}>
                <Checkbox checked={allFilteredSelected} onClick={handleSelectAll} />
                <div style={{ width: '48px', flexShrink: 0, fontSize: font.size.xs, color: colors.text.muted, fontWeight: 600 }}>이미지</div>
                <SortHeader label="상품명" sortKey="title" active={sortKey} dir={sortDir} onSort={handleSort} style={{ flex: 3 }} />
                <div style={{ flex: 1.2, fontSize: font.size.xs, color: colors.text.muted, fontWeight: 600 }}>카테고리</div>
                <div style={{ width: '100px', flexShrink: 0, fontSize: font.size.xs, color: colors.text.muted, fontWeight: 600, paddingLeft: '4px' }}>무게</div>
                <SortHeader label="판매가" sortKey="salePriceJpy" active={sortKey} dir={sortDir} onSort={handleSort} style={{ width: '100px', flexShrink: 0 }} />
                <div style={{ width: '90px', flexShrink: 0, fontSize: font.size.xs, color: colors.text.muted, fontWeight: 600 }}>원가</div>
                <SortHeader label="등록일" sortKey="createdAt" active={sortKey} dir={sortDir} onSort={handleSort} style={{ width: '72px', flexShrink: 0 }} />
            </div>

            {/* 상품 목록 */}
            {filtered.length === 0 ? (
                <div key={activeTab} style={{ textAlign: 'center', padding: `${spacing['12']} 0`, color: colors.text.muted, fontSize: font.size.base, animation: 'fadeInUp 0.4s ease' }}>
                    {searchKeyword || providerFilter !== '전체' ? '검색 조건에 맞는 상품이 없어요.' : '수집된 상품이 없어요.'}
                </div>
            ) : (
                <div key={activeTab} style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'], paddingBottom: '100px', animation: 'fadeInUp 0.4s ease' }}>
                    {sorted.map((product) => (
                        <ProductListItem
                            key={product.id}
                            product={product}
                            data-job-id={product.jobId}
                            selected={selectedProductIds.includes(product.id)}
                            onToggle={() => toggleSelectProduct(product.id)}
                            onClick={() => navigate(`/editing/${product.id}`)}
                        />
                    ))}
                </div>
            )}

            <BulkActionBar
                selectedCount={selectedProductIds.length}
                translateCount={selectedTranslateCount}
                registerCount={selectedRegisterCount}
                onTranslate={openTranslationModal}
                onRegister={() => {
                    if (selectedTranslatedIds.length > 0) {
                        startRegistrationBatch(selectedTranslatedIds);
                        clearSelection();
                    }
                }}
                onDelete={() => setIsDeleteModalOpen(true)}
                onClear={clearSelection}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    deleteProducts(selectedProductIds);
                    clearSelection();
                }}
                title={`선택한 ${selectedProductIds.length}개의 상품을 삭제할까요?`}
                description="삭제된 상품 정보는 복구할 수 없으며, 수집된 모든 데이터가 영구적으로 삭제됩니다."
                confirmText="삭제하기"
                cancelText="취소"
            />

            <TranslationModal
                isOpen={isTranslationModalOpen}
                onClose={closeTranslationModal}
                selectedCount={selectedProductIds.length}
                alreadyTranslatedCount={selectedAlreadyTranslatedCount}
                onStart={(targets) => {
                    startTranslationJobs(selectedProductIds, targets);
                    closeTranslationModal();
                    clearSelection();
                }}
            />
        </MainLayout>
    );
}
