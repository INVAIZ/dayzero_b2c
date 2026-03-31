import { useState, useMemo, useCallback } from 'react';
import type { RegistrationResult } from '../../../types/registration';
import type { MonitoringTabFilter } from '../components/MonitoringStatusTabs';
import { isActualNegativeMargin as checkNegativeMargin } from '../../../utils/margin';

function isActualNegativeMargin(r: RegistrationResult): boolean {
    return checkNegativeMargin(r.monitoring, r.product);
}

export function useRegistrationFilters(allSuccessResults: RegistrationResult[]) {
    const [monitoringTab, setMonitoringTab] = useState<MonitoringTabFilter>('판매 중');
    const [providerFilter, setProviderFilter] = useState('전체');
    const [searchKeyword, setSearchKeyword] = useState('');

    const monitoringCounts = useMemo(() => {
        return allSuccessResults.reduce(
            (acc, r) => {
                if (r.salesStatus === 'paused') {
                    acc.paused++;
                } else {
                    acc.active++;
                }
                if (r.monitoring?.status === 'active') {
                    acc.monitoring++;
                    const cr = r.monitoring.lastCheckResult;
                    if (cr === 'out_of_stock') acc.outOfStock++;
                    if (cr === 'negative_margin' && isActualNegativeMargin(r)) acc.negativeMargin++;
                }
                return acc;
            },
            { active: 0, monitoring: 0, outOfStock: 0, negativeMargin: 0, paused: 0 }
        );
    }, [allSuccessResults]);

    const tabFilteredResults = useMemo(() => {
        switch (monitoringTab) {
            case '일시 중지':
                return allSuccessResults.filter(r => r.salesStatus === 'paused');
            case '가격·재고 확인 중':
                return allSuccessResults.filter(r => r.monitoring?.status === 'active');
            case '품절':
                return allSuccessResults.filter(r =>
                    r.monitoring?.status === 'active' && r.monitoring.lastCheckResult === 'out_of_stock'
                );
            case '역마진':
                return allSuccessResults.filter(r => isActualNegativeMargin(r));
            default: // '판매 중'
                return allSuccessResults.filter(r => r.salesStatus !== 'paused');
        }
    }, [monitoringTab, allSuccessResults]);

    const providers = useMemo(() => {
        const set = new Set(tabFilteredResults.map(r => r.product.provider));
        return Array.from(set);
    }, [tabFilteredResults]);

    const filteredResults = useMemo(() => {
        let results = tabFilteredResults;
        if (providerFilter !== '전체') {
            results = results.filter(r => r.product.provider === providerFilter);
        }
        if (searchKeyword.trim()) {
            const kw = searchKeyword.trim().toLowerCase();
            results = results.filter(r =>
                (r.product.titleJa ?? r.product.titleKo).toLowerCase().includes(kw)
                || r.product.titleKo.toLowerCase().includes(kw)
                || (r.qoo10ItemCode ?? '').toLowerCase().includes(kw)
            );
        }
        return results;
    }, [providerFilter, searchKeyword, tabFilteredResults]);

    const handleTabChange = useCallback((tab: MonitoringTabFilter) => {
        setMonitoringTab(tab);
        setProviderFilter('전체');
        setSearchKeyword('');
    }, []);

    const handleProviderChange = useCallback((f: string) => {
        setProviderFilter(f);
    }, []);

    return {
        monitoringTab,
        providerFilter,
        searchKeyword,
        setSearchKeyword,
        monitoringCounts,
        tabFilteredResults,
        filteredResults,
        providers,
        handleTabChange,
        handleProviderChange,
        hasAnyMonitoring: monitoringCounts.monitoring > 0,
    };
}
