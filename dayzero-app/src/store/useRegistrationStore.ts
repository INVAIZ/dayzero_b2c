import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RegistrationJob, RegistrationResult, MonitoringCheckResult, PriceHistoryEntry } from '../types/registration';
import type { ProductDetail } from '../types/editing';
import { useEditingStore } from './useEditingStore';

function generateQoo10ItemCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

/** 최초 등록 시 결과 (항상 정상) */
function generateInitialMonitoringResult(originalPrice: number): {
    result: MonitoringCheckResult;
    currentPrice: number;
    issueDescription?: string;
} {
    return { result: 'normal', currentPrice: originalPrice };
}

/** 시뮬레이션 확인 결과 생성 (UT 프로토타입용 — "확인 실행" 시) */
function generateSimulatedCheckResult(originalPrice: number, salePriceJpy: number): {
    result: MonitoringCheckResult;
    currentPrice: number;
    issueDescription?: string;
} {
    const rand = Math.random();
    if (rand < 0.45) {
        return { result: 'normal', currentPrice: originalPrice };
    } else if (rand < 0.65) {
        const change = Math.round(originalPrice * (0.05 + Math.random() * 0.1));
        const newPrice = originalPrice + change;
        return {
            result: 'price_changed',
            currentPrice: newPrice,
            issueDescription: `쇼핑몰 구매가가 ₩${originalPrice.toLocaleString()} → ₩${newPrice.toLocaleString()}로 변동됐어요. 현재 마진율은 유지되고 있어요.`,
        };
    } else if (rand < 0.85) {
        const increase = Math.round(originalPrice * (0.4 + Math.random() * 0.3));
        const newPrice = originalPrice + increase;
        const saleInKrw = salePriceJpy / 0.11;
        const marginPct = ((saleInKrw - newPrice) / saleInKrw * 100).toFixed(1);
        const recommendedJpy = Math.ceil((newPrice * 1.2) * 0.11);
        return {
            result: 'negative_margin',
            currentPrice: newPrice,
            issueDescription: `쇼핑몰 구매가가 ₩${originalPrice.toLocaleString()} → ₩${newPrice.toLocaleString()}로 올라 현재 판매가(¥${salePriceJpy.toLocaleString()}) 기준 마진율이 ${marginPct}%예요. 판매가를 ¥${recommendedJpy.toLocaleString()} 이상으로 조정하거나, 다른 쇼핑몰을 검토해주세요.`,
        };
    } else {
        return {
            result: 'out_of_stock',
            currentPrice: originalPrice,
            issueDescription: `쇼핑몰에서 해당 상품이 품절됐어요. Qoo10 판매를 일시 중지하거나, 다른 쇼핑몰을 찾아주세요.`,
        };
    }
}

/** 더미 가격 이력 생성 (최근 14일) */
function generateDummyPriceHistory(
    basePrice: number,
    salePriceJpy: number,
    checkResult: MonitoringCheckResult,
    currentPrice: number,
): PriceHistoryEntry[] {
    const entries: PriceHistoryEntry[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        let price: number;
        if (i <= 2 && checkResult !== 'normal') {
            // 최근 2일은 변동된 가격 사용
            price = currentPrice;
        } else {
            // 이전에는 원래 가격 ±3%
            const jitter = basePrice * (Math.random() * 0.06 - 0.03);
            price = Math.round(basePrice + jitter);
        }

        const saleInKrw = salePriceJpy / 0.11;
        const margin = saleInKrw > 0 ? ((saleInKrw - price) / saleInKrw * 100) : 0;

        entries.push({
            date: date.toISOString(),
            sourcePriceKrw: price,
            stockStatus: (i <= 1 && checkResult === 'out_of_stock') ? 'out_of_stock' : 'in_stock',
            marginPercent: Math.round(margin * 10) / 10,
        });
    }
    return entries;
}

// --- Store ---
interface RegistrationState {
    jobs: RegistrationJob[];

    startJob: (productIds: string[], products: ProductDetail[]) => string;
    unregister: (jobId: string, resultIds: string[]) => void;
    deleteResults: (jobId: string, resultIds: string[]) => void;
    getLatestJob: () => RegistrationJob | null;

    pauseSales: (resultIds: string[]) => void;
    resumeSales: (resultIds: string[]) => void;

    // 변동 확인
    enableMonitoring: (resultIds: string[]) => void;
    disableMonitoring: (resultIds: string[]) => void;
    runMonitoringCheck: () => void;  // UT 시뮬레이션: 하루 경과 후 확인 실행
    forceIssueOnOne: () => void;    // UT 시뮬레이션: 모니터링 중인 첫 번째 상품에 이슈 강제 설정
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

            pauseSales: (resultIds) => {
                set((state) => ({
                    jobs: state.jobs.map(j => ({
                        ...j,
                        results: j.results.map(r =>
                            resultIds.includes(r.id) ? { ...r, salesStatus: 'paused' as const } : r
                        ),
                    })),
                }));
            },

            resumeSales: (resultIds) => {
                set((state) => ({
                    jobs: state.jobs.map(j => ({
                        ...j,
                        results: j.results.map(r =>
                            resultIds.includes(r.id) ? { ...r, salesStatus: 'active' as const } : r
                        ),
                    })),
                }));
            },

            getLatestJob: () => {
                const { jobs } = get();
                return jobs.length > 0 ? jobs[0] : null;
            },

            enableMonitoring: (resultIds) => {
                const now = new Date();
                const nextCheck = new Date(now);
                nextCheck.setDate(nextCheck.getDate() + 1);
                nextCheck.setHours(7, 0, 0, 0);

                set((state) => ({
                    jobs: state.jobs.map(j => ({
                        ...j,
                        results: j.results.map(r => {
                            if (!resultIds.includes(r.id)) return r;
                            if (r.monitoring?.status === 'active') return r;

                            // 최초 등록 시 항상 '정상'
                            const initial = generateInitialMonitoringResult(
                                r.product.originalPriceKrw,
                            );
                            const history = generateDummyPriceHistory(
                                r.product.originalPriceKrw,
                                r.product.salePriceJpy,
                                initial.result,
                                initial.currentPrice,
                            );

                            return {
                                ...r,
                                monitoring: {
                                    status: 'active' as const,
                                    lastCheckResult: initial.result,
                                    lastCheckAt: now.toISOString(),
                                    nextCheckAt: nextCheck.toISOString(),
                                    currentSourcePriceKrw: initial.currentPrice,
                                    priceHistory: history,
                                    issueDescription: initial.issueDescription,
                                },
                            };
                        }),
                    })),
                }));
            },

            disableMonitoring: (resultIds) => {
                set((state) => ({
                    jobs: state.jobs.map(j => ({
                        ...j,
                        results: j.results.map(r => {
                            if (!resultIds.includes(r.id)) return r;
                            return {
                                ...r,
                                monitoring: {
                                    status: 'inactive' as const,
                                },
                            };
                        }),
                    })),
                }));
            },

            forceIssueOnOne: () => {
                const now = new Date();
                const checkTime = new Date(now);
                checkTime.setHours(7, 0, 0, 0);
                const nextCheck = new Date(checkTime);
                nextCheck.setDate(nextCheck.getDate() + 1);

                set((state) => {
                    // 모니터링 중인 첫 번째 상품 찾기
                    let found = false;
                    return {
                        jobs: state.jobs.map(j => ({
                            ...j,
                            results: j.results.map(r => {
                                if (found || r.monitoring?.status !== 'active') return r;
                                found = true;

                                // negative_margin / out_of_stock 번갈아 가며
                                const issueType = Math.random() < 0.5 ? 'negative_margin' : 'out_of_stock';
                                const simulated = issueType === 'out_of_stock'
                                    ? {
                                        result: 'out_of_stock' as const,
                                        currentPrice: r.product.originalPriceKrw,
                                        issueDescription: `쇼핑몰에서 해당 상품이 품절됐어요. Qoo10 판매를 일시 중지하거나, 다른 쇼핑몰을 찾아주세요.`,
                                    }
                                    : (() => {
                                        const increase = Math.round(r.product.originalPriceKrw * (0.5 + Math.random() * 0.2));
                                        const newPrice = r.product.originalPriceKrw + increase;
                                        const saleInKrw = r.product.salePriceJpy / 0.11;
                                        const marginPct = ((saleInKrw - newPrice) / saleInKrw * 100).toFixed(1);
                                        const recommendedJpy = Math.ceil((newPrice * 1.2) * 0.11);
                                        return {
                                            result: 'negative_margin' as const,
                                            currentPrice: newPrice,
                                            issueDescription: `쇼핑몰 구매가가 ₩${r.product.originalPriceKrw.toLocaleString()} → ₩${newPrice.toLocaleString()}로 올라 현재 판매가(¥${r.product.salePriceJpy.toLocaleString()}) 기준 마진율이 ${marginPct}%예요. 판매가를 ¥${recommendedJpy.toLocaleString()} 이상으로 조정하거나, 다른 쇼핑몰을 검토해주세요.`,
                                        };
                                    })();

                                const history = generateDummyPriceHistory(
                                    r.product.originalPriceKrw,
                                    r.product.salePriceJpy,
                                    simulated.result,
                                    simulated.currentPrice,
                                );

                                return {
                                    ...r,
                                    monitoring: {
                                        ...r.monitoring,
                                        lastCheckResult: simulated.result,
                                        lastCheckAt: checkTime.toISOString(),
                                        nextCheckAt: nextCheck.toISOString(),
                                        currentSourcePriceKrw: simulated.currentPrice,
                                        priceHistory: history,
                                        issueDescription: simulated.issueDescription,
                                    },
                                };
                            }),
                        })),
                    };
                });
            },

            runMonitoringCheck: () => {
                const now = new Date();
                const checkTime = new Date(now);
                checkTime.setHours(7, 0, 0, 0);
                const nextCheck = new Date(checkTime);
                nextCheck.setDate(nextCheck.getDate() + 1);

                set((state) => ({
                    jobs: state.jobs.map(j => ({
                        ...j,
                        results: j.results.map(r => {
                            if (r.monitoring?.status !== 'active') return r;

                            const simulated = generateSimulatedCheckResult(
                                r.product.originalPriceKrw,
                                r.product.salePriceJpy,
                            );
                            const history = generateDummyPriceHistory(
                                r.product.originalPriceKrw,
                                r.product.salePriceJpy,
                                simulated.result,
                                simulated.currentPrice,
                            );

                            return {
                                ...r,
                                monitoring: {
                                    ...r.monitoring,
                                    lastCheckResult: simulated.result,
                                    lastCheckAt: checkTime.toISOString(),
                                    nextCheckAt: nextCheck.toISOString(),
                                    currentSourcePriceKrw: simulated.currentPrice,
                                    priceHistory: history,
                                    issueDescription: simulated.issueDescription,
                                },
                            };
                        }),
                    })),
                }));
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
