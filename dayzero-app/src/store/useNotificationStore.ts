import { create } from 'zustand';

interface NotificationState {
    readIds: Set<string>;
    dismissedIds: Set<string>;
    markRead: (id: string) => void;
    markAllRead: (ids: string[]) => void;
    dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    readIds: new Set(),
    dismissedIds: new Set(),

    markRead: (id) => set((state) => ({
        readIds: new Set(state.readIds).add(id),
    })),

    markAllRead: (ids) => set((state) => {
        const next = new Set(state.readIds);
        ids.forEach(id => next.add(id));
        return { readIds: next };
    }),

    dismiss: (id) => set((state) => ({
        dismissedIds: new Set(state.dismissedIds).add(id),
    })),
}));
