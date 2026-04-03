import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductDetail, TranslationJob, EditTabFilter, TranslationBatch, RegistrationBatch } from '../types/editing';
import { PENDING_JA_TITLES, getProductMeta } from '../mock/editingMock';
import { getCategoryByCode, CATEGORY_FLAT } from '../mock/qoo10Categories';
import { toJaTitle, mockTranslateOption, MOCK_DESC_JA } from '../utils/editing';

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
    removeProduct: (id: string) => void;

    markTranslationsRead: () => void;
    markRegistrationsRead: () => void;
    markTranslationJobRead: (id: string) => void;
    markTranslationBatchRead: (id: string) => void;
    markRegistrationBatchRead: (id: string) => void;
    removeTranslationJob: (id: string) => void;
    removeTranslationBatch: (id: string) => void;
    removeRegistrationBatch: (id: string) => void;
    startRegistrationBatch: (productIds: string[]) => void;
    addCompletedTranslationBatch: (productId: string, label: string) => void;
    markProductsRead: (exceptJobId?: string) => void;
    selectByJobId: (jobId: string) => void;
}

export const useEditingStore = create<EditingState>()(
  persist(
    (set, get) => ({
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
                    updatedProducts = state.products.map((p) => {
                        if (p.id !== job.productId) return p;
                        const productUpdates: Partial<typeof p> = {
                            translationStatus: 'completed' as const,
                            isReTranslating: false,
                        };
                        if (job.targets.includes('title')) {
                            productUpdates.titleJa = PENDING_JA_TITLES[p.id] ?? toJaTitle(p.titleKo);
                        }
                        if (job.targets.includes('options')) {
                            productUpdates.options = p.options.map(o => ({
                                ...o,
                                nameJa: mockTranslateOption(o.nameKo),
                            }));
                        }
                        if (job.targets.includes('description')) {
                            productUpdates.descriptionJa = MOCK_DESC_JA;
                        }
                        if (job.targets.includes('thumbnail')) {
                            productUpdates.thumbnailTranslated = true;
                        }
                        if (job.targets.includes('detailPage')) {
                            productUpdates.detailPageTranslated = true;
                        }
                        return { ...p, ...productUpdates };
                    });
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

    removeProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id),
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
    addCompletedTranslationBatch: (productId, label) => {
        const batch: TranslationBatch = {
            id: `tb-detail-${Date.now()}`,
            productIds: [productId],
            totalCount: 1,
            currentCount: 1,
            status: 'completed',
            createdAt: new Date().toISOString(),
            isRead: false,
            label,
        };
        set((state) => ({ translationBatches: [batch, ...state.translationBatches] }));
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
  }),
  {
      name: 'dayzero-editing-products',
      version: 3, // v3: 브랜드 매칭 + 발송가능일 필드 추가
      migrate: (_persisted, version) => {
          if (version < 3) {
              // v1→v2: 일본어 카테고리 경로 → 한국어 + 실제 코드. 상품 데이터 초기화해서 새 mock 데이터 사용
              return { products: [] };
          }
          return _persisted as Record<string, unknown>;
      },
      partialize: (state) => ({ products: state.products }),
      onRehydrateStorage: () => (state) => {
          if (!state) return;
          // 수정 페이지 임시 상품 제거
          state.products = state.products.filter(p => !p.id.startsWith('__reg_edit__'));
          state.products = state.products.map(p => {
              let updated = p;
              // titleJa가 titleKo와 동일하면 번역 실패 → 초기화
              if (updated.titleJa && updated.titleJa === updated.titleKo) {
                  updated = { ...updated, titleJa: null };
              }
              // HMR/새로고침 시 'processing' 상태에서 멈춘 상품 복구
              if (updated.translationStatus === 'processing') {
                  // 번역 데이터가 있으면 completed, 없으면 pending
                  const hasTranslation = !!updated.titleJa;
                  updated = {
                      ...updated,
                      translationStatus: hasTranslation ? 'completed' as const : 'pending' as const,
                      isReTranslating: false,
                  };
              }
              // weightSource / priceSource 필드가 없는 기존 데이터 보정
              if (!updated.weightSource) {
                  updated = { ...updated, weightSource: updated.isWeightEstimated ? 'ai' as const : 'crawled' as const };
              }
              if (!updated.priceSource) {
                  updated = { ...updated, priceSource: 'crawled' as const };
              }
              // brand / manufacturer / productionPlace / sourceCategoryPath 기본값
              if (!updated.brand || !updated.manufacturer || !updated.productionPlace || !updated.sourceCategoryPath) {
                  const meta = getProductMeta(updated.id);
                  updated = {
                      ...updated,
                      brand: updated.brand || meta.brand,
                      manufacturer: updated.manufacturer || meta.manufacturer,
                      productionPlace: updated.productionPlace || meta.productionPlace,
                      sourceCategoryPath: updated.sourceCategoryPath || meta.sourceCategoryPath,
                  };
              }
              // 구 데이터 마이그레이션: 일본어 경로 또는 가짜 catId → 실제 코드로 변환
              const isOldCatId = !updated.qoo10CategoryId || updated.qoo10CategoryId.startsWith('qoo10-') || updated.qoo10CategoryId.startsWith('cat-');
              const hasJaPath = /[\u3000-\u9FFF]/.test(updated.qoo10CategoryPath ?? '');
              if (isOldCatId || hasJaPath) {
                  // 실제 코드가 있으면 경로를 복원, 없으면 FLAT에서 이름 매칭 시도
                  const byCode = !isOldCatId ? getCategoryByCode(updated.qoo10CategoryId) : undefined;
                  if (byCode) {
                      updated = { ...updated, qoo10CategoryPath: byCode.path };
                  } else {
                      // 경로 내 소분류 이름으로 매칭 시도
                      const pathParts = (updated.qoo10CategoryPath ?? '').split('>').map((s: string) => s.trim());
                      const lastPart = pathParts[pathParts.length - 1];
                      const match = lastPart ? CATEGORY_FLAT.find(c => c.smallName === lastPart || c.path === updated.qoo10CategoryPath) : undefined;
                      if (match) {
                          updated = { ...updated, qoo10CategoryId: match.smallCode, qoo10CategoryPath: match.path };
                      }
                      // 매칭 안 되면 기존 값 유지 (수동 변경 필요)
                  }
              }
              // 브랜드 매칭 상태 기본값
              if (!updated.brandMatchStatus) {
                  updated = { ...updated, brandMatchStatus: updated.brand && updated.brand !== '-' && updated.brand !== '' ? 'matched' as const : 'none' as const };
              }
              // 발송가능일 기본값
              if (!updated.shippingType) {
                  updated = { ...updated, shippingType: 'standard' as const, shippingDays: 3 };
              }
              // aiRecommended 기본값
              if (!updated.aiRecommendedCategoryPath) {
                  updated = { ...updated, aiRecommendedCategoryPath: updated.qoo10CategoryPath };
              }
              if (!updated.aiRecommendedCategoryId) {
                  updated = { ...updated, aiRecommendedCategoryId: updated.qoo10CategoryId };
              }
              // AI 추천 브랜드 코드 기본값
              if (!updated.aiRecommendedBrandCode && updated.brandQoo10Code) {
                  updated = { ...updated, aiRecommendedBrandCode: updated.brandQoo10Code };
              }
              return updated;
          });
      },
  }
));
