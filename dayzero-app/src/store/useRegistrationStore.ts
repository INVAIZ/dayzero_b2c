import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RegistrationJob, RegistrationResult } from '../types/registration';
import type { ProductDetail } from '../types/editing';
import { useEditingStore } from './useEditingStore';

function generateQoo10ItemCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// --- Store ---
interface RegistrationState {
    jobs: RegistrationJob[];

    startJob: (productIds: string[], products: ProductDetail[]) => string;
    unregister: (jobId: string, resultIds: string[]) => void;
    deleteResults: (jobId: string, resultIds: string[]) => void;
    getLatestJob: () => RegistrationJob | null;
}

export const useRegistrationStore = create<RegistrationState>()(
    persist(
        (set, get) => ({
            jobs: [],

            startJob: (productIds, products) => {
                const jobId = `rj-${Date.now()}`;
                const startTime = Date.now();

                const newJob: RegistrationJob = {
                    id: jobId,
                    productIds,
                    results: [],
                    totalCount: productIds.length,
                    currentCount: 0,
                    successCount: 0,
                    failedCount: 0,
                    status: 'processing',
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    jobs: [newJob, ...state.jobs],
                }));

                // 기존 알림 패널 연동
                useEditingStore.getState().startRegistrationBatch(productIds);

                // 순차 처리 시뮬레이션 (2~3초 간격)
                let cumulativeDelay = 0;
                productIds.forEach((pid, i) => {
                    const product = products.find(p => p.id === pid);
                    if (!product) return;

                    const completedCount = i + 1;
                    cumulativeDelay += 2000 + Math.floor(Math.random() * 1000);
                    const delay = cumulativeDelay;

                    setTimeout(() => {
                        const itemCode = generateQoo10ItemCode();

                        const result: RegistrationResult = {
                            id: `rr-${pid}-${Date.now()}`,
                            productId: pid,
                            product: { ...product },
                            status: 'success',
                            marketplace: 'qoo10_jp',
                            registeredAt: new Date().toISOString(),
                            qoo10ItemCode: itemCode,
                            qoo10ProductUrl: `https://www.qoo10.jp/item/${itemCode}`,
                        };

                        set((state) => ({
                            jobs: state.jobs.map(j => {
                                if (j.id !== jobId) return j;
                                const updatedResults = [...j.results, result];
                                const isComplete = completedCount >= productIds.length;
                                return {
                                    ...j,
                                    results: updatedResults,
                                    currentCount: completedCount,
                                    successCount: updatedResults.length,
                                    failedCount: 0,
                                    ...(isComplete
                                        ? {
                                            status: 'completed' as const,
                                            completedAt: new Date().toISOString(),
                                            elapsedTime: Date.now() - startTime,
                                        }
                                        : {}),
                                };
                            }),
                        }));
                    }, delay);
                });

                return jobId;
            },

            unregister: (jobId, resultIds) => {
                const job = get().jobs.find(j => j.id === jobId);
                if (!job) return;

                const targetResults = job.results.filter(
                    r => resultIds.includes(r.id)
                );

                // 편집 스토어의 상품 상태 복구
                const editingStore = useEditingStore.getState();
                targetResults.forEach(r => {
                    editingStore.updateProduct(r.productId, {
                        editStatus: 'pending',
                        translationStatus: 'completed',
                    });
                });

                // 결과에서 제거
                set((state) => ({
                    jobs: state.jobs.map(j => {
                        if (j.id !== jobId) return j;
                        const remaining = j.results.filter(r => !resultIds.includes(r.id));
                        return {
                            ...j,
                            results: remaining,
                            successCount: remaining.length,
                        };
                    }),
                }));
            },

            deleteResults: (jobId, resultIds) => {
                set((state) => ({
                    jobs: state.jobs.map(j => {
                        if (j.id !== jobId) return j;
                        const remaining = j.results.filter(r => !resultIds.includes(r.id));
                        return {
                            ...j,
                            results: remaining,
                            successCount: remaining.length,
                        };
                    }),
                }));
            },

            getLatestJob: () => {
                const { jobs } = get();
                return jobs.length > 0 ? jobs[0] : null;
            },
        }),
        {
            name: 'dayzero-registration-jobs',
            partialize: (state) => ({ jobs: state.jobs }),
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                // HMR/새로고침 시 processing 상태 복구
                state.jobs = state.jobs.map(j =>
                    j.status === 'processing' ? { ...j, status: 'completed' as const } : j
                );
            },
        }
    )
);
