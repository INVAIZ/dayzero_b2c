import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RegistrationJob, RegistrationResult, MonitoringActivityLog } from '../types/registration';
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

                            // 활동 로그 — 14일치 더미 데이터
                            const activityLog: MonitoringActivityLog[] = [];
                            const basePrice = r.product.originalPriceKrw;
                            const baseSale = r.product.salePriceJpy;

                            activityLog.push({
                                date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                                type: 'monitoring_started',
                                description: '가격·품절 자동확인이 시작됐어요. 변동이 생기면 알려드릴게요.',
                            });

                            const priceSteps = [1.05, 0.97, 0.97, 0.97, 1.08, 1.03, 1.03, 1.03, 1.1, 1.0];
                            const dummyEvents: Array<{ daysAgo: number; type: MonitoringActivityLog['type']; desc: string }> = [
                                { daysAgo: 12, type: 'price_changed', desc: (() => { const p = Math.round(basePrice * priceSteps[0]); const s = Math.ceil((p * 1.2) * 0.11); return `원가 ₩${basePrice.toLocaleString()} → ₩${p.toLocaleString()}로 변동, 판매가를 ¥${baseSale.toLocaleString()} → ¥${s.toLocaleString()}로 자동 조정했어요.`; })() },
                                { daysAgo: 10, type: 'price_changed', desc: (() => { const p = Math.round(basePrice * priceSteps[1]); const s = Math.ceil((p * 1.2) * 0.11); return `원가 ₩${Math.round(basePrice * priceSteps[0]).toLocaleString()} → ₩${p.toLocaleString()}로 변동, 판매가를 ¥${Math.ceil((Math.round(basePrice * priceSteps[0]) * 1.2) * 0.11).toLocaleString()} → ¥${s.toLocaleString()}로 자동 조정했어요.`; })() },
                                { daysAgo: 8, type: 'out_of_stock', desc: '쇼핑몰에서 품절이 감지되어 판매를 자동 일시중지했어요.' },
                                { daysAgo: 7, type: 'restocked', desc: '재입고가 확인되어 판매를 자동 재개했어요.' },
                                { daysAgo: 6, type: 'price_changed', desc: (() => { const p = Math.round(basePrice * priceSteps[4]); const s = Math.ceil((p * 1.2) * 0.11); return `원가 ₩${Math.round(basePrice * priceSteps[1]).toLocaleString()} → ₩${p.toLocaleString()}로 변동, 판매가를 ¥${Math.ceil((Math.round(basePrice * priceSteps[1]) * 1.2) * 0.11).toLocaleString()} → ¥${s.toLocaleString()}로 자동 조정했어요.`; })() },
                                { daysAgo: 5, type: 'price_changed', desc: (() => { const p = Math.round(basePrice * priceSteps[5]); const s = Math.ceil((p * 1.2) * 0.11); return `원가 ₩${Math.round(basePrice * priceSteps[4]).toLocaleString()} → ₩${p.toLocaleString()}로 변동, 판매가를 ¥${Math.ceil((Math.round(basePrice * priceSteps[4]) * 1.2) * 0.11).toLocaleString()} → ¥${s.toLocaleString()}로 자동 조정했어요.`; })() },
                                { daysAgo: 4, type: 'out_of_stock', desc: '쇼핑몰에서 품절이 감지되어 판매를 자동 일시중지했어요.' },
                                { daysAgo: 3, type: 'restocked', desc: '재입고가 확인되어 판매를 자동 재개했어요.' },
                                { daysAgo: 2, type: 'price_changed', desc: (() => { const p = Math.round(basePrice * priceSteps[8]); const s = Math.ceil((p * 1.2) * 0.11); return `원가 ₩${Math.round(basePrice * priceSteps[5]).toLocaleString()} → ₩${p.toLocaleString()}로 변동, 판매가를 ¥${Math.ceil((Math.round(basePrice * priceSteps[5]) * 1.2) * 0.11).toLocaleString()} → ¥${s.toLocaleString()}로 자동 조정했어요.`; })() },
                                { daysAgo: 1, type: 'price_changed', desc: (() => { const s = Math.ceil((initial.currentPrice * 1.2) * 0.11); return `원가 ₩${Math.round(basePrice * priceSteps[8]).toLocaleString()} → ₩${initial.currentPrice.toLocaleString()}로 변동, 판매가를 ¥${Math.ceil((Math.round(basePrice * priceSteps[8]) * 1.2) * 0.11).toLocaleString()} → ¥${s.toLocaleString()}로 자동 조정했어요.`; })() },
                            ];

                            if (initial.result === 'out_of_stock') {
                                dummyEvents.push({ daysAgo: 0, type: 'out_of_stock', desc: '쇼핑몰에서 품절이 감지되어 판매를 자동 일시중지했어요.' });
                            }

                            for (const ev of dummyEvents) {
                                activityLog.push({ date: new Date(now.getTime() - ev.daysAgo * 24 * 60 * 60 * 1000).toISOString(), type: ev.type, description: ev.desc });
                            }

                            activityLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                                    activityLog,
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

                                // 품절 / 가격변동 번갈아 가며
                                const issueType = Math.random() < 0.5 ? 'out_of_stock' : 'price_changed';
                                const simulated = issueType === 'out_of_stock'
                                    ? {
                                        result: 'out_of_stock' as const,
                                        currentPrice: r.product.originalPriceKrw,
                                        issueDescription: '쇼핑몰에서 해당 상품이 품절됐어요. 판매를 자동 일시중지했어요.',
                                    }
                                    : (() => {
                                        const change = Math.round(r.product.originalPriceKrw * (0.05 + Math.random() * 0.15));
                                        const newPrice = r.product.originalPriceKrw + change;
                                        const newSaleJpy = Math.ceil((newPrice * 1.2) * 0.11);
                                        return {
                                            result: 'price_changed' as const,
                                            currentPrice: newPrice,
                                            issueDescription: `원가 ₩${r.product.originalPriceKrw.toLocaleString()} → ₩${newPrice.toLocaleString()}로 변동, 판매가를 ¥${r.product.salePriceJpy.toLocaleString()} → ¥${newSaleJpy.toLocaleString()}로 자동 조정했어요.`,
                                        };
                                    })();

                                const history = generateDummyPriceHistory(
                                    r.product.originalPriceKrw,
                                    r.product.salePriceJpy,
                                    simulated.result,
                                    simulated.currentPrice,
                                );

                                const autoPause = simulated.result === 'out_of_stock';
                                // 활동 로그 갱신
                                const prevLog = r.monitoring?.activityLog ?? [];
                                const newLogEntry: MonitoringActivityLog = simulated.result === 'out_of_stock'
                                    ? { date: checkTime.toISOString(), type: 'out_of_stock', description: '품절 감지 → 판매 자동 일시중지' }
                                    : { date: checkTime.toISOString(), type: 'price_changed', description: simulated.issueDescription ?? '원가 변동 → 판매가 자동 조정', details: { prevPrice: r.product.originalPriceKrw, newPrice: simulated.currentPrice } };
                                const updatedLog = [newLogEntry, ...prevLog];

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
                                        activityLog: updatedLog,
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
                // 이슈 유형 패턴: 품절, 가격변동, 재입고 혼합
                const issuePattern: Array<'out_of_stock' | 'price_changed' | 'restocked'> = [
                    'out_of_stock', 'restocked', 'price_changed',
                    'out_of_stock', 'price_changed', 'out_of_stock', 'price_changed',
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
                                        const change = Math.round(r.product.originalPriceKrw * (0.05 + Math.random() * 0.15));
                                        const newPrice = r.product.originalPriceKrw + change;
                                        const newSaleJpy = Math.ceil((newPrice * 1.2) * 0.11);
                                        return {
                                            result: 'price_changed' as const,
                                            currentPrice: newPrice,
                                            issueDescription: `원가 ₩${r.product.originalPriceKrw.toLocaleString()} → ₩${newPrice.toLocaleString()}로 변동, 판매가를 ¥${r.product.salePriceJpy.toLocaleString()} → ¥${newSaleJpy.toLocaleString()}로 자동 조정했어요.`,
                                        };
                                    })();

                                const history = generateDummyPriceHistory(
                                    r.product.originalPriceKrw,
                                    r.product.salePriceJpy,
                                    simulated.result,
                                    simulated.currentPrice,
                                );

                                const idx = config.idx;

                                // 활동 로그 생성
                                const prevLog2 = r.monitoring?.activityLog ?? [];
                                const newEntry2: MonitoringActivityLog = simulated.result === 'out_of_stock'
                                    ? { date: checkTime.toISOString(), type: 'out_of_stock', description: '품절 감지 → 판매 자동 일시중지' }
                                    : simulated.result === 'restocked'
                                    ? { date: checkTime.toISOString(), type: 'restocked', description: '재입고 감지 → 판매 자동 재개' }
                                    : { date: checkTime.toISOString(), type: 'negative_margin', description: simulated.issueDescription ?? '역마진 발생', details: { prevPrice: r.product.originalPriceKrw, newPrice: simulated.currentPrice } };
                                const updatedLog2 = [newEntry2, ...prevLog2];

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
                                            activityLog: updatedLog2,
                                        },
                                    };
                                }

                                // 품절 시 자동 일시중지 (idx===5는 자동중지 안 함 — 데모용)
                                const shouldAutoPause = idx !== 5;
                                const autoPause = shouldAutoPause && simulated.result === 'out_of_stock';

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
                                        activityLog: updatedLog2,
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

                            const autoPause = simulated.result === 'out_of_stock';
                            // 활동 로그 갱신
                            const prevLog3 = r.monitoring?.activityLog ?? [];
                            const newEntry3: MonitoringActivityLog = simulated.result === 'out_of_stock'
                                ? { date: checkTime.toISOString(), type: 'out_of_stock', description: '품절 감지 → 판매 자동 일시중지' }
                                : simulated.result === 'negative_margin'
                                ? { date: checkTime.toISOString(), type: 'negative_margin', description: simulated.issueDescription ?? '역마진 발생' }
                                : simulated.result === 'restocked'
                                ? { date: checkTime.toISOString(), type: 'restocked', description: '재입고 감지 → 판매 자동 재개' }
                                : simulated.result === 'price_changed'
                                ? { date: checkTime.toISOString(), type: 'price_changed', description: `원가 변동: ₩${r.product.originalPriceKrw.toLocaleString()} → ₩${simulated.currentPrice.toLocaleString()}` }
                                : { date: checkTime.toISOString(), type: 'monitoring_started', description: '정상 확인 완료' };
                            const updatedLog3 = [newEntry3, ...prevLog3];

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
                                    activityLog: updatedLog3,
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
