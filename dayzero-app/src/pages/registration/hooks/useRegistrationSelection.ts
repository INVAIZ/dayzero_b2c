import { useState, useMemo, useCallback } from 'react';
import type { RegistrationResult } from '../../../types/registration';

export function useRegistrationSelection(
    allSuccessResults: RegistrationResult[],
    filteredResults: RegistrationResult[],
) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const selectedMonitoringInfo = useMemo(() => {
        const idSet = new Set(selectedIds);
        return allSuccessResults
            .filter(r => idSet.has(r.id))
            .reduce(
                (acc, r) => {
                    const isMonitored = r.monitoring?.status === 'active';
                    const isPaused = r.salesStatus === 'paused';
                    return {
                        hasMonitored: acc.hasMonitored || isMonitored,
                        hasUnmonitored: acc.hasUnmonitored || !isMonitored,
                        monitoredCount: acc.monitoredCount + (isMonitored ? 1 : 0),
                        unmonitoredCount: acc.unmonitoredCount + (!isMonitored ? 1 : 0),
                        hasPaused: acc.hasPaused || isPaused,
                        hasActive: acc.hasActive || !isPaused,
                        pausedCount: acc.pausedCount + (isPaused ? 1 : 0),
                        activeCount: acc.activeCount + (!isPaused ? 1 : 0),
                    };
                },
                { hasMonitored: false, hasUnmonitored: false, monitoredCount: 0, unmonitoredCount: 0, hasPaused: false, hasActive: false, pausedCount: 0, activeCount: 0 }
            );
    }, [selectedIds, allSuccessResults]);

    const resumeTargets = useMemo(() =>
        allSuccessResults.filter(r => selectedIds.includes(r.id) && r.salesStatus === 'paused'),
        [selectedIds, allSuccessResults]
    );

    const hasOutOfStockInResume = resumeTargets.some(
        r => r.monitoring?.lastCheckResult === 'out_of_stock'
    );

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const handleSelectAll = useCallback((pageIds?: string[]) => {
        if (pageIds) {
            const allPageSelected = pageIds.every(id => selectedIds.includes(id));
            if (allPageSelected) {
                setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
            } else {
                setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
            }
        } else {
            if (selectedIds.length === filteredResults.length) {
                setSelectedIds([]);
            } else {
                setSelectedIds(filteredResults.map(r => r.id));
            }
        }
    }, [selectedIds, filteredResults]);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    return {
        selectedIds,
        setSelectedIds,
        selectedMonitoringInfo,
        resumeTargets,
        hasOutOfStockInResume,
        handleToggleSelect,
        handleSelectAll,
        clearSelection,
    };
}
