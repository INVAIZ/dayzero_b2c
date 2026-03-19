import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SourcingJob, AutoSchedule, SourcedProduct, ParsedUrl } from '../types/sourcing';

export interface CollectionNotification {
    id: string;
    type: 'url' | 'auto';
    title: string;
    status: 'running' | 'completed' | 'scheduled';
    currentCount: number;
    totalCount: number;
    createdAt: string;
    completedAt?: string;
    timeString?: string;
    isRead?: boolean;
}

interface SourcingState {
    jobs: SourcingJob[];
    schedules: AutoSchedule[];
    unprocessedProductCount: number;
    products: SourcedProduct[];
    notifications: CollectionNotification[];
    unreadCount: number;
    particleOrigin: { x: number; y: number } | null;
    flyingBalls: Array<{ id: number; originX: number; originY: number }>;
    selectedAutoFilter: string;
    urlSourcing: {
        urls: string[];
        parsedUrls: ParsedUrl[];
        isCollecting: boolean;
        collectionStarted: boolean;
        hasFailedOnce: boolean;
    };

    setUrlSourcing: (updates: Partial<SourcingState['urlSourcing']>) => void;
    setSelectedAutoFilter: (filter: string) => void;

    addJob: (job: SourcingJob) => void;
    updateJob: (id: string, updates: Partial<SourcingJob>) => void;
    addSchedule: (schedule: AutoSchedule) => void;
    updateSchedule: (id: string, updates: Partial<AutoSchedule>) => void;
    deleteSchedule: (id: string) => void;
    reorderSchedules: (schedules: AutoSchedule[]) => void;
    toggleSchedule: (id: string) => void;
    setUnprocessedCount: (count: number) => void;
    clearUnprocessedCount: () => void;
    addProduct: (product: SourcedProduct) => void;
    addNotification: (notification: CollectionNotification) => void;
    updateNotification: (id: string, updates: Partial<CollectionNotification>) => void;
    removeNotification: (id: string) => void;
    markNotificationRead: (id: string) => void;
    markAllRead: () => void;
    triggerParticle: (origin: { x: number; y: number } | null) => void;
    triggerFlyingBall: (origin: { x: number; y: number }) => void;
    removeFlyingBall: (id: number) => void;
}

export const useSourcingStore = create<SourcingState>()(
    persist(
        (set) => ({
            jobs: [],
            schedules: [],
            unprocessedProductCount: 0,
            products: [],
            notifications: [
                { id: 'n-2', type: 'url', title: '쿠팡 직접 수집', status: 'completed', currentCount: 8, totalCount: 8, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), isRead: false },
                { id: 'n-3', type: 'auto', title: '다이소 자동 수집', status: 'completed', currentCount: 15, totalCount: 15, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: false },
            ],
            unreadCount: 2,
            particleOrigin: null,
            flyingBalls: [],
            selectedAutoFilter: '전체',
            urlSourcing: {
                urls: [],
                parsedUrls: [],
                isCollecting: false,
                collectionStarted: false,
                hasFailedOnce: false,
            },

            setUrlSourcing: (updates) => set((state) => ({
                urlSourcing: { ...state.urlSourcing, ...updates }
            })),

            setSelectedAutoFilter: (filter) => set({ selectedAutoFilter: filter }),

            addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),

            updateJob: (id, updates) => set((state) => ({
                jobs: state.jobs.map((job) => job.id === id ? { ...job, ...updates } : job)
            })),

            addSchedule: (schedule) => set((state) => ({ schedules: [...state.schedules, schedule] })),

            updateSchedule: (id, updates) => set((state) => ({
                schedules: state.schedules.map((s) => s.id === id ? { ...s, ...updates } : s)
            })),

            deleteSchedule: (id) => set((state) => ({
                schedules: state.schedules.filter((s) => s.id !== id),
            })),

            reorderSchedules: (schedules) => set({ schedules }),

            toggleSchedule: (id) => set((state) => ({
                schedules: state.schedules.map((s) => s.id === id ? { ...s, isActive: !s.isActive } : s)
            })),

            setUnprocessedCount: (count) => set({ unprocessedProductCount: count }),

            clearUnprocessedCount: () => set({ unprocessedProductCount: 0 }),

            addProduct: (product) => set((state) => ({
                products: [product, ...state.products],
                unprocessedProductCount: state.unprocessedProductCount + 1
            })),

            addNotification: (notification) => set((state) => ({
                notifications: [notification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
            })),

            updateNotification: (id, updates) => set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, ...updates } : n
                ),
            })),

            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
            })),

            markNotificationRead: (id) => set((state) => {
                const notif = state.notifications.find((n) => n.id === id);
                if (!notif || notif.isRead) return state;
                return {
                    notifications: state.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
                    unreadCount: Math.max(0, state.unreadCount - 1),
                };
            }),

            markAllRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            })),

            triggerParticle: (origin) => set({ particleOrigin: origin }),

            triggerFlyingBall: (origin) => set((state) => ({
                flyingBalls: [...state.flyingBalls, { id: Date.now(), originX: origin.x, originY: origin.y }],
            })),

            removeFlyingBall: (id) => set((state) => ({
                flyingBalls: state.flyingBalls.filter((b) => b.id !== id),
            })),
        }),
        {
            name: 'dayzero-sourcing-storage',
            partialize: (state) => ({
                jobs: state.jobs,
                schedules: state.schedules,
                unprocessedProductCount: state.unprocessedProductCount,
                products: state.products,
                notifications: state.notifications,
                unreadCount: state.unreadCount,
                urlSourcing: state.urlSourcing,
            }),
        }
    )
);
