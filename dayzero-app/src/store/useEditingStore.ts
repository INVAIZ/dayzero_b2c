import { create } from 'zustand';
import type { ProductDetail, TranslationJob, EditTabFilter, TranslationBatch, RegistrationBatch } from '../types/editing';
import { PENDING_JA_TITLES } from '../mock/editingMock';

const PROVIDER_PREFIX_MAP: Record<string, string> = {
    '[위버스샵]': '[Weverse Shop]',
    '[Ktown4u]': '[Ktown4u]',
    '[메이크스타]': '[Makestar]',
    '[위치폼]': '[Wicefom]',
    '[FANS]': '[FANS]',
    '[올리브영]': '[Olive Young]',
    '[쿠팡]': '[Coupang]',
    '[다이소]': '[Daiso]',
    '[yes24]': '[yes24]',
    '[알라딘]': '[aladin]',
};

const toJaTitle = (titleKo: string): string => {
    let result = titleKo;
    for (const [ko, en] of Object.entries(PROVIDER_PREFIX_MAP)) {
        if (result.includes(ko)) {
            result = result.replace(ko, en);
            break;
        }
    }
    return result;
};

interface EditingState {
    products: ProductDetail[];

    // ED-01 UI 상태
    selectedProductIds: string[];
    activeTab: EditTabFilter;
    providerFilter: string;
    searchKeyword: string;

    // ED-01a 번역 작업
    translationJobs: TranslationJob[];
    isTranslationModalOpen: boolean;

    // 배치 작업 (알림 패널용)
    translationBatches: TranslationBatch[];
    registrationBatches: RegistrationBatch[];

    // ED-02 현재 편집 상품
    currentEditProductId: string | null;

    // Actions — 필터/탭
    setActiveTab: (tab: EditTabFilter) => void;
    setProviderFilter: (filter: string) => void;
    setSearchKeyword: (keyword: string) => void;

    // Actions — 선택
    toggleSelectProduct: (id: string) => void;
    selectAll: (ids: string[]) => void;
    clearSelection: () => void;

    // Actions — 번역 모달
    openTranslationModal: () => void;
    closeTranslationModal: () => void;
    startTranslationJobs: (productIds: string[], targets: TranslationJob['targets']) => void;
    updateTranslationJob: (jobId: string, updates: Partial<TranslationJob>) => void;

    // Actions — 상품
    updateProduct: (id: string, updates: Partial<ProductDetail>) => void;
    deleteProducts: (ids: string[]) => void;
    setCurrentEditProduct: (id: string | null) => void;
    addProduct: (product: ProductDetail) => void;

    markTranslationsRead: () => void;
    markRegistrationsRead: () => void;
    markTranslationJobRead: (id: string) => void;
    markTranslationBatchRead: (id: string) => void;
    markRegistrationBatchRead: (id: string) => void;
    removeTranslationJob: (id: string) => void;
    removeTranslationBatch: (id: string) => void;
    removeRegistrationBatch: (id: string) => void;
    startRegistrationBatch: (productIds: string[]) => void;
    markProductsRead: (exceptJobId?: string) => void;
    selectByJobId: (jobId: string) => void;
}

export const useEditingStore = create<EditingState>((set, get) => ({
    products: [],

    selectedProductIds: [],
    activeTab: 'all',
    providerFilter: '전체',
    searchKeyword: '',

    translationJobs: [],
    isTranslationModalOpen: false,
    translationBatches: [],
    registrationBatches: [],

    currentEditProductId: null,

    setActiveTab: (tab) => set({ activeTab: tab }),
    setProviderFilter: (filter) => set({ providerFilter: filter }),
    setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

    toggleSelectProduct: (id) =>
        set((state) => ({
            selectedProductIds: state.selectedProductIds.includes(id)
                ? state.selectedProductIds.filter((sid) => sid !== id)
                : [...state.selectedProductIds, id],
        })),

    selectAll: (ids) => set({ selectedProductIds: ids }),
    clearSelection: () => set({ selectedProductIds: [] }),

    openTranslationModal: () => set({ isTranslationModalOpen: true }),
    closeTranslationModal: () => set({ isTranslationModalOpen: false }),

    startTranslationJobs: (productIds, targets) => {
        const batchId = `tb-${Date.now()}`;
        const newBatch: TranslationBatch = {
            id: batchId,
            productIds,
            totalCount: productIds.length,
            currentCount: 0,
            status: 'processing',
            createdAt: new Date().toISOString(),
            isRead: true,
        };

        const newJobs: TranslationJob[] = productIds.map((pid) => {
            const product = get().products.find((p) => p.id === pid);
            return {
                id: `job-${pid}-${Date.now()}`,
                productId: pid,
                productTitleKo: product?.titleKo ?? pid,
                status: 'queued',
                targets,
                isRead: true
            };
        });

        set((state) => ({
            translationJobs: [...newJobs, ...state.translationJobs],
            translationBatches: [newBatch, ...state.translationBatches],
            products: state.products.map((p) => {
                if (!productIds.includes(p.id)) return p;
                if (p.translationStatus === 'completed') return { ...p, isReTranslating: true };
                return { ...p, translationStatus: 'processing' as const };
            }),
        }));

        // setTimeout × N (setInterval 금지) — 상품당 2~3초 간격으로 순차 완료
        let cumulativeDelay = 0;
        productIds.forEach((_pid, i) => {
            const currentJob = newJobs[i];
            const completedCount = i + 1;
            cumulativeDelay += 2000 + Math.floor(Math.random() * 1500);
            const delay = cumulativeDelay;
            setTimeout(() => {
                get().updateTranslationJob(currentJob.id, { status: 'completed' });
                set((state) => ({
                    translationBatches: state.translationBatches.map(b =>
                        b.id === batchId ? { ...b, currentCount: completedCount } : b
                    )
                }));
                if (completedCount >= productIds.length) {
                    // 완료 시 isRead: false → 알림 패널 뱃지 표시
                    set((state) => ({
                        translationBatches: state.translationBatches.map(b =>
                            b.id === batchId ? {
                                ...b,
                                status: 'completed',
                                completedAt: new Date().toISOString(),
                                isRead: false,
                            } : b
                        )
                    }));
                }
            }, delay);
        });
    },

    updateTranslationJob: (jobId, updates) =>
        set((state) => {
            const updatedJobs = state.translationJobs.map((j) =>
                j.id === jobId ? { ...j, ...updates } : j
            );

            // 번역 완료 시 상품 상태도 함께 갱신
            let updatedProducts = state.products;
            if (updates.status === 'completed') {
                const job = state.translationJobs.find((j) => j.id === jobId);
                if (job) {
                    updatedProducts = state.products.map((p) =>
                        p.id === job.productId
                            ? {
                                ...p,
                                translationStatus: 'completed' as const,
                                isReTranslating: false,
                                titleJa: PENDING_JA_TITLES[p.id] ?? p.titleJa ?? toJaTitle(p.titleKo),
                            }
                            : p
                    );
                }
            }
            if (updates.status === 'failed') {
                const job = state.translationJobs.find((j) => j.id === jobId);
                if (job) {
                    updatedProducts = state.products.map((p) =>
                        p.id === job.productId
                            ? { ...p, translationStatus: 'failed' as const }
                            : p
                    );
                }
            }

            return { translationJobs: updatedJobs, products: updatedProducts };
        }),

    updateProduct: (id, updates) =>
        set((state) => ({
            products: state.products.map((p) =>
                p.id === id ? { ...p, ...updates, lastSavedAt: new Date().toISOString() } : p
            ),
        })),

    deleteProducts: (ids) =>
        set((state) => ({
            products: state.products.filter((p) => !ids.includes(p.id)),
            selectedProductIds: state.selectedProductIds.filter((sid) => !ids.includes(sid)),
        })),

    setCurrentEditProduct: (id) => set({ currentEditProductId: id }),

    addProduct: (product) => set((state) => ({
        products: [{ ...product, isRead: false }, ...state.products],
    })),

    markTranslationsRead: () => set((state) => {
        const anyUnread = state.translationJobs.some(j => !j.isRead) || state.translationBatches.some(b => !b.isRead);
        if (!anyUnread) return state;
        return {
            translationJobs: state.translationJobs.map(j => j.isRead ? j : { ...j, isRead: true }),
            translationBatches: state.translationBatches.map(b => b.isRead ? b : { ...b, isRead: true }),
        };
    }),

    markRegistrationsRead: () => set((state) => {
        if (state.registrationBatches.every(b => b.isRead)) return state;
        return { registrationBatches: state.registrationBatches.map(b => b.isRead ? b : { ...b, isRead: true }) };
    }),

    markTranslationJobRead: (id) => set((state) => ({
        translationJobs: state.translationJobs.map(j => j.id === id ? { ...j, isRead: true } : j)
    })),

    markTranslationBatchRead: (id) => set((state) => ({
        translationBatches: state.translationBatches.map(b => b.id === id ? { ...b, isRead: true } : b)
    })),

    markRegistrationBatchRead: (id) => set((state) => ({
        registrationBatches: state.registrationBatches.map(b => b.id === id ? { ...b, isRead: true } : b)
    })),

    removeTranslationJob: (id) => set((state) => ({
        translationJobs: state.translationJobs.filter(j => j.id !== id),
    })),

    removeTranslationBatch: (id) => set((state) => ({
        translationBatches: state.translationBatches.filter(b => b.id !== id),
    })),

    removeRegistrationBatch: (id) => set((state) => ({
        registrationBatches: state.registrationBatches.filter(b => b.id !== id),
    })),

    startRegistrationBatch: (productIds) => {
        const batchId = `rb-${Date.now()}`;
        const newBatch: RegistrationBatch = {
            id: batchId,
            totalCount: productIds.length,
            currentCount: 0,
            status: 'processing',
            createdAt: new Date().toISOString(),
            isRead: true,
        };

        // Update local state first
        set((state) => ({
            registrationBatches: [newBatch, ...state.registrationBatches],
            products: state.products.map((p) =>
                productIds.includes(p.id) ? { ...p, editStatus: 'processing' } : p
            ),
        }));

        // setTimeout × N (setInterval 금지) — 상품당 2~3초 간격으로 순차 완료
        let cumulativeDelay = 0;
        productIds.forEach((_pid, i) => {
            const completedCount = i + 1;
            cumulativeDelay += 2000 + Math.floor(Math.random() * 1000);
            const delay = cumulativeDelay;
            setTimeout(() => {
                set((state) => ({
                    registrationBatches: state.registrationBatches.map(b =>
                        b.id === batchId ? { ...b, currentCount: completedCount } : b
                    )
                }));
                if (completedCount >= productIds.length) {
                    set((state) => ({
                        registrationBatches: state.registrationBatches.map(b =>
                            b.id === batchId ? { ...b, status: 'completed', isRead: false } : b
                        ),
                        products: state.products.map((p) =>
                            productIds.includes(p.id) ? { ...p, editStatus: 'completed' } : p
                        ),
                    }));
                }
            }, delay);
        });
    },
    markProductsRead: (exceptJobId) => set((state) => ({
        products: state.products.map(p => {
            if (p.isRead) return p;
            if (exceptJobId && p.jobId === exceptJobId) return p;
            return { ...p, isRead: true };
        })
    })),
    selectByJobId: (jobId) => set((state) => {
        const productIds = state.products
            .filter(p => p.jobId === jobId)
            .map(p => p.id);
        return { selectedProductIds: productIds };
    }),
}));
