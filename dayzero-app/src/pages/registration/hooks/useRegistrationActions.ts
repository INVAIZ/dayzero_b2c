import { useState, useCallback } from 'react';
import type { RegistrationJob } from '../../../types/registration';
import type { RegistrationResult } from '../../../types/registration';

interface Actions {
    pauseSales: (ids: string[]) => void;
    resumeSales: (ids: string[]) => void;
    deleteResults: (jobId: string, resultIds: string[]) => void;
    enableMonitoring: (ids: string[]) => void;
    disableMonitoring: (ids: string[]) => void;
}

export function useRegistrationActions(
    jobs: RegistrationJob[],
    allSuccessResults: RegistrationResult[],
    selectedIds: string[],
    _selectedMonitoringInfo: { unmonitoredCount: number; monitoredCount: number },
    _monitoringCount: number,
    clearSelection: () => void,
    actions: Actions,
) {
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEnableMonitoringModalOpen, setIsEnableMonitoringModalOpen] = useState(false);
    const [isDisableMonitoringModalOpen, setIsDisableMonitoringModalOpen] = useState(false);
    const [isMonitoringHistoryOpen, setIsMonitoringHistoryOpen] = useState(false);

    const handlePause = useCallback(() => {
        if (selectedIds.length === 0) return;
        actions.pauseSales(selectedIds);
        clearSelection();
        setIsPauseModalOpen(false);
    }, [selectedIds, actions, clearSelection]);

    const handleResume = useCallback((resumeTargetIds: string[]) => {
        actions.resumeSales(resumeTargetIds);
        clearSelection();
        setIsResumeModalOpen(false);
    }, [actions, clearSelection]);

    const handleDelete = useCallback(() => {
        if (selectedIds.length === 0) return;
        jobs.forEach(job => {
            const jobResultIds = job.results
                .filter(r => selectedIds.includes(r.id))
                .map(r => r.id);
            if (jobResultIds.length > 0) {
                actions.deleteResults(job.id, jobResultIds);
            }
        });
        clearSelection();
        setIsDeleteModalOpen(false);
    }, [selectedIds, jobs, actions, clearSelection]);

    const handleEnableMonitoring = useCallback(() => {
        const unmonitoredIds = allSuccessResults
            .filter(r => selectedIds.includes(r.id) && r.monitoring?.status !== 'active')
            .map(r => r.id);
        if (unmonitoredIds.length === 0) return;
        actions.enableMonitoring(unmonitoredIds);
        clearSelection();
        setIsEnableMonitoringModalOpen(false);
    }, [selectedIds, allSuccessResults, actions, clearSelection]);

    const handleDisableMonitoring = useCallback(() => {
        const monitoredIds = allSuccessResults
            .filter(r => selectedIds.includes(r.id) && r.monitoring?.status === 'active')
            .map(r => r.id);
        if (monitoredIds.length === 0) return;
        actions.disableMonitoring(monitoredIds);
        clearSelection();
        setIsDisableMonitoringModalOpen(false);
    }, [selectedIds, allSuccessResults, actions, clearSelection]);

    return {
        // 모달 상태
        isPauseModalOpen, setIsPauseModalOpen,
        isResumeModalOpen, setIsResumeModalOpen,
        isDeleteModalOpen, setIsDeleteModalOpen,
        isEnableMonitoringModalOpen, setIsEnableMonitoringModalOpen,
        isDisableMonitoringModalOpen, setIsDisableMonitoringModalOpen,
        isMonitoringHistoryOpen, setIsMonitoringHistoryOpen,
        // 액션 핸들러
        handlePause,
        handleResume,
        handleDelete,
        handleEnableMonitoring,
        handleDisableMonitoring,
    };
}
