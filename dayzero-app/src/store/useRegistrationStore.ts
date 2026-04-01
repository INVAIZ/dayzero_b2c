import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RegistrationJob, RegistrationResult } from '../types/registration';
import type { ProductDetail } from '../types/editing';
import { useEditingStore } from './useEditingStore';
import {
    generateInitialMonitoringResult,
    generateSimulatedCheckResult,
    generateDummyPriceHistory,
} from './monitoringSimulation';

function generateQoo10ItemCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// --- Store ---
interface RegistrationState {
    jobs: RegistrationJob[];
    autoPauseOnOutOfStock: boolean;
    autoPauseOnNegativeMargin: boolean;

    startJob: (productIds: string[], products: ProductDetail[]) => string;
    unregister: (jobId: string, resultIds: string[]) => void;
    deleteResults: (jobId: string, resultIds: string[]) => void;
    getLatestJob: () => RegistrationJob | null;

    pauseSales: (resultIds: string[], reason?: 'auto' | 'manual') => void;
    resumeSales: (resultIds: string[]) => void;
    setAutoPauseOnOutOfStock: (enabled: boolean) => void;
    setAutoPauseOnNegativeMargin: (enabled: boolean) => void;

    // 등록 상품 수정
    updateRegisteredProduct: (resultId: string, product: ProductDetail) => void;

    // 변동 확인
    enableMonitoring: (resultIds: string[]) => void;
    disableMonitoring: (resultIds: string[]) => void;
    runMonitoringCheck: () => void;  // UT 시뮬레이션: 하루 경과 후 확인 실행
    forceIssueOnOne: () => void;    // UT 시뮬레이션: 모니터링 중인 첫 번째 상품에 이슈 강제 설정
    seedDemoIssues: () => void;     // UT 시뮬레이션: 품절 1건 + 역마진 1건 강제 생성
}

export const useRegistrationStore = create<RegistrationState>()(
    persist(
        (set, get) => ({
            jobs: [],
            autoPauseOnOutOfStock: true,
            autoPauseOnNegativeMargin: true,

            setAutoPauseOnOutOfStock: (enabled) => {
                set({ autoPauseOnOutOfStock: enabled });
            },

            setAutoPauseOnNegativeMargin: (enabled) => {
                set({ autoPauseOnNegativeMargin: enabled });
            },

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

                        // 먼저 currentCount를 갱신 (프로그레스 바 100%까지 채움)
                        set((state) => ({
                            jobs: state.jobs.map(j => {
                                if (j.id !== jobId) return j;
                                const updatedResults = [...j.results, result];
                                return {
                                    ...j,
                                    results: updatedResults,
                                    currentCount: completedCount,
                                    successCount: updatedResults.length,
                                    failedCount: 0,
                                };
                            }),
                        }));

                        // 마지막 상품이면 프로그레스 바 애니메이션 후 completed 처리
                        const isComplete = completedCount >= productIds.length;
                        if (isComplete) {
                            setTimeout(() => {
                                set((state) => ({
                                    jobs: state.jobs.map(j => {
                                        if (j.id !== jobId) return j;
                                        return {
                                            ...j,
                                            status: 'completed' as const,
                                            completedAt: new Date().toISOString(),
                                            elapsedTime: Date.now() - startTime,
                                        };
                                    }),
                                }));
                            }, 900);
                        }
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

            updateRegisteredProduct: (resultId, product) => {
                set((state) => ({
                    jobs: state.jobs.map(j => ({
                        ...j,
                        results: j.results.map(r => {
                            if (r.id !== resultId) return r;
                            const updated = { ...r, product };
                            // 가격 수정 후 모니터링 상태 재계산
                            if (updated.monitoring?.status === 'active' && updated.monitoring.lastCheckResult === 'negative_margin') {
                                const cost = updated.monitoring.currentSourcePriceKrw ?? product.originalPriceKrw;
                                const saleInKrw = product.salePriceJpy / 0.11;
                                const margin = saleInKrw > 0 ? ((saleInKrw - cost) / saleInKrw * 100) : 0;
                                if (margin > 5) {
                                    updated.monitoring = {
                                        ...updated.monitoring,
                                        lastCheckResult: 'normal',
                                        issueDescription: undefined,
                                    };
                                }
                            }
                            return updated;
                        }),
                    })),
                }));
            },

            pauseSales: (resultIds, reason = 'manual') => {
                set((state) => ({
                    jobs: state.jobs.map(j => ({
                        ...j,
                        results: j.results.map(r =>
                            resultIds.includes(r.id)
                                ? { ...r, salesStatus: 'paused' as const, pauseReason: reason }
                                : r
                        ),
                    })),
                }));
            },

            resumeSales: (resultIds) => {
                set((state) => ({
                    jobs: state.jobs.map(j => ({
                        ...j,
                        results: j.results.map(r =>
                            resultIds.includes(r.id)
                                ? { ...r, salesStatus: 'active' as const, pauseReason: undefined }
                                : r
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

                                const autoPause = (state.autoPauseOnOutOfStock && simulated.result === 'out_of_stock') || (state.autoPauseOnNegativeMargin && simulated.result === 'negative_margin');
                                return {
                                    ...r,
                                    ...(autoPause ? { salesStatus: 'paused' as const, pauseReason: 'auto' as const } : {}),
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

            seedDemoIssues: () => {
                const now = new Date();
                const nextCheck = new Date(now);
                nextCheck.setDate(nextCheck.getDate() + 1);
                nextCheck.setHours(7, 0, 0, 0);

                // 다양한 감지 시간 (시간대별로 분산)
                const hoursAgo = [1, 2, 3, 5, 9, 14, 22];
                // 이슈 유형 패턴: 품절, 역마진, 재입고 혼합 (재입고를 2번째에 배치)
                const issuePattern: Array<'out_of_stock' | 'negative_margin' | 'restocked'> = [
                    'out_of_stock', 'restocked', 'negative_margin',
                    'out_of_stock', 'negative_margin', 'out_of_stock', 'negative_margin',
                ];

                set((state) => {
                    const allResults = state.jobs.flatMap(j => j.results.filter(r => r.status === 'success'));
                    const targets = allResults.slice(0, Math.min(allResults.length, 7));
                    if (targets.length === 0) return state;

                    const targetMap = new Map(
                        targets.map((t, i) => [t.id, { issueType: issuePattern[i % issuePattern.length], hoursAgo: hoursAgo[i % hoursAgo.length], idx: i }])
                    );

                    return {
                        jobs: state.jobs.map(j => ({
                            ...j,
                            results: j.results.map(r => {
                                const config = targetMap.get(r.id);
                                if (!config) return r;

                                const checkTime = new Date(now.getTime() - config.hoursAgo * 60 * 60 * 1000);

                                const simulated = config.issueType === 'out_of_stock'
                                    ? {
                                        result: 'out_of_stock' as const,
                                        currentPrice: r.product.originalPriceKrw,
                                        issueDescription: '해당 상품이 품절됐어요.',
                                    }
                                    : config.issueType === 'restocked'
                                    ? {
                                        result: 'restocked' as const,
                                        currentPrice: r.product.originalPriceKrw,
                                        issueDescription: '재입고가 확인돼 자동으로 판매가 재개됐어요.',
                                    }
                                    : (() => {
                                        const increase = Math.round(r.product.originalPriceKrw * (0.4 + Math.random() * 0.3));
                                        const newPrice = r.product.originalPriceKrw + increase;
                                        const saleInKrw = r.product.salePriceJpy / 0.11;
                                        const marginPct = ((saleInKrw - newPrice) / saleInKrw * 100).toFixed(1);
                                        const recommendedJpy = Math.ceil((newPrice * 1.2) * 0.11);
                                        return {
                                            result: 'negative_margin' as const,
                                            currentPrice: newPrice,
                                            issueDescription: `구매가가 ₩${r.product.originalPriceKrw.toLocaleString()} → ₩${newPrice.toLocaleString()}로 올라 마진율이 ${marginPct}%예요. 판매가를 ¥${recommendedJpy.toLocaleString()} 이상으로 조정해주세요.`,
                                        };
                                    })();

                                const history = generateDummyPriceHistory(
                                    r.product.originalPriceKrw,
                                    r.product.salePriceJpy,
                                    simulated.result,
                                    simulated.currentPrice,
                                );

                                const idx = config.idx;

                                // 재입고: 판매 재개 상태
                                if (simulated.result === 'restocked') {
                                    return {
                                        ...r,
                                        salesStatus: 'active' as const,
                                        pauseReason: undefined,
                                        monitoring: {
                                            status: 'active' as const,
                                            lastCheckResult: simulated.result,
                                            lastCheckAt: checkTime.toISOString(),
                                            nextCheckAt: nextCheck.toISOString(),
                                            currentSourcePriceKrw: simulated.currentPrice,
                                            priceHistory: history,
                                            issueDescription: simulated.issueDescription,
                                        },
                                    };
                                }

                                // 대부분 자동 처리, idx===5 (6번째)만 자동중지 안 됨 → 빨간 품절
                                const shouldAutoPause = idx !== 5;
                                const autoPause = shouldAutoPause && (
                                    (state.autoPauseOnOutOfStock && simulated.result === 'out_of_stock') ||
                                    (state.autoPauseOnNegativeMargin && simulated.result === 'negative_margin')
                                );

                                return {
                                    ...r,
                                    ...(autoPause ? { salesStatus: 'paused' as const, pauseReason: 'auto' as const } : {}),
                                    monitoring: {
                                        status: 'active' as const,
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

                            const autoPause = (state.autoPauseOnOutOfStock && simulated.result === 'out_of_stock') || (state.autoPauseOnNegativeMargin && simulated.result === 'negative_margin');
                            return {
                                ...r,
                                ...(autoPause ? { salesStatus: 'paused' as const, pauseReason: 'auto' as const } : {}),
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
            partialize: (state) => ({ jobs: state.jobs, autoPauseOnOutOfStock: state.autoPauseOnOutOfStock, autoPauseOnNegativeMargin: state.autoPauseOnNegativeMargin }),
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
