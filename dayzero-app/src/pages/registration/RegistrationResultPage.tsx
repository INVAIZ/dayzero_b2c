import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search } from 'lucide-react';
import { colors, font, spacing, radius } from '../../design/tokens';
import { MainLayout } from '../../components/layout/MainLayout';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useRegistrationStore } from '../../store/useRegistrationStore';
import { useToastStore } from '../../store/useToastStore';

import { RegistrationProviderFilter } from './components/RegistrationTabBar';
import { RegistrationProgressSection } from './components/RegistrationProgressSection';
import { BatchHistoryModal } from './components/BatchHistoryModal';
import { SuccessSummaryCard } from './components/SuccessSummaryCard';
import { AllProductsTable } from './components/AllProductsTable';
import { BulkActionBar } from './components/FailedBulkActionBar';

export const RegistrationResultPage: React.FC = () => {
    const navigate = useNavigate();
    const { jobs, unregister } = useRegistrationStore();
    const addToast = useToastStore(s => s.addToast);

    const [providerFilter, setProviderFilter] = useState('전체');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isUnregisterModalOpen, setIsUnregisterModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // 프로그레스 카드: processing job이 있을 때만 표시, 완료 후 fade-out
    const processingJob = useMemo(
        () => jobs.find(j => j.status === 'processing') ?? null,
        [jobs]
    );
    const [progressJobId, setProgressJobId] = useState<string | null>(
        () => processingJob?.id ?? null
    );
    const progressJob = useMemo(
        () => progressJobId ? jobs.find(j => j.id === progressJobId) ?? null : null,
        [jobs, progressJobId]
    );

    // 새 processing job 감지 시 표시
    useEffect(() => {
        if (processingJob) setProgressJobId(processingJob.id);
    }, [processingJob?.id]);

    const handleProgressDismiss = useCallback(() => {
        setProgressJobId(null);
    }, []);

    // 모든 job의 성공 결과를 통합 (이 페이지는 등록된 전체 상품을 표시)
    const successResults = useMemo(
        () => jobs.flatMap(j => j.results.filter(r => r.status === 'success')),
        [jobs]
    );

    // 소싱처 목록 추출
    const providers = useMemo(() => {
        const set = new Set(successResults.map(r => r.product.provider));
        return Array.from(set);
    }, [successResults]);

    // 소싱처별 카운트
    const providerCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        successResults.forEach(r => {
            const p = r.product.provider;
            counts[p] = (counts[p] ?? 0) + 1;
        });
        return counts;
    }, [successResults]);

    // 소싱처 + 검색 필터 적용
    const filteredResults = useMemo(() => {
        let results = successResults;
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
    }, [providerFilter, searchKeyword, successResults]);

    const handleSelectJob = (jobId: string) => {
        setProviderFilter('전체');
        setSearchKeyword('');
        // 해당 job의 성공 결과를 선택 (없으면 빈 배열)
        const job = jobs.find(j => j.id === jobId);
        const resultIds = job?.results.filter(r => r.status === 'success').map(r => r.id) ?? [];
        setSelectedIds(resultIds);
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredResults.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredResults.map(r => r.id));
        }
    };

    const handleUnregister = () => {
        if (selectedIds.length === 0) return;
        const count = selectedIds.length;
        // 선택된 결과를 각 job별로 분류하여 등록 해제
        jobs.forEach(job => {
            const jobResultIds = job.results
                .filter(r => selectedIds.includes(r.id))
                .map(r => r.id);
            if (jobResultIds.length > 0) {
                unregister(job.id, jobResultIds);
            }
        });
        setSelectedIds([]);
        setIsUnregisterModalOpen(false);
        addToast('등록 해제 완료', `${count}건의 상품이 편집 목록으로 되돌아갔습니다`);
        navigate('/editing');
    };

    return (
        <MainLayout>
            <div>
                {/* 헤더 */}
                <div style={{ marginBottom: spacing['6'], display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{
                            fontSize: font.size['2xl'],
                            fontWeight: 700,
                            color: colors.text.primary,
                            margin: 0,
                            marginBottom: spacing['2'],
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing['2'],
                        }}>
                            등록된 상품
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: font.size.xs,
                                fontWeight: 600,
                                color: colors.text.secondary,
                                background: colors.bg.subtle,
                                padding: '4px 10px',
                                borderRadius: radius.full,
                            }}>
                                <img src="/logos/큐텐.png" alt="Qoo10" style={{ height: '16px', objectFit: 'contain' }} />
                                JP
                            </span>
                        </h1>
                        <p style={{ fontSize: font.size.md, color: colors.text.tertiary, margin: 0 }}>
                            Qoo10 JP에 등록된 상품 현황을 확인하세요.
                        </p>
                    </div>
                    {jobs.filter(j => j.status === 'completed').length >= 1 && (
                        <button
                            onClick={() => setIsHistoryModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing['2'],
                                padding: `${spacing['2']} ${spacing['3']}`,
                                background: colors.bg.surface,
                                border: `1px solid ${colors.border.default}`,
                                borderRadius: radius.md,
                                fontSize: font.size.sm,
                                fontWeight: 500,
                                color: colors.text.secondary,
                                cursor: 'pointer',
                                transition: 'border-color 0.15s',
                                flexShrink: 0,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primary; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border.default; }}
                        >
                            <History size={14} />
                            등록 기록
                        </button>
                    )}
                </div>

                {/* 진행 중 / 완료 프로그레스 (processing job이 있을 때만) */}
                {progressJob && (
                    <RegistrationProgressSection job={progressJob} onDismiss={handleProgressDismiss} />
                )}

                {/* 성과 요약 (프로그레스 카드가 없을 때) */}
                {!progressJob && successResults.length > 0 && (
                    <SuccessSummaryCard results={successResults} />
                )}

                {/* 검색 */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: spacing['2'],
                    padding: `0 ${spacing['3']}`,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.md, background: colors.bg.surface,
                    marginBottom: spacing['3'],
                }}>
                    <Search size={16} color={colors.text.muted} />
                    <input
                        type="text"
                        placeholder="상품명 또는 상품번호로 검색"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={{
                            flex: 1, border: 'none', outline: 'none',
                            fontSize: font.size.base, color: colors.text.primary,
                            padding: `${spacing['3']} 0`, background: 'transparent',
                        }}
                    />
                </div>

                {/* 소싱처 필터 */}
                {successResults.length > 0 && (
                    <RegistrationProviderFilter
                        activeFilter={providerFilter}
                        onChange={(f) => { setProviderFilter(f); setSelectedIds([]); }}
                        providers={providers}
                        counts={providerCounts}
                        totalCount={successResults.length}
                    />
                )}

                {/* 등록된 상품 테이블 */}
                <AllProductsTable
                    results={filteredResults}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onSelectAll={handleSelectAll}
                />
            </div>

            {/* 벌크 액션 바 */}
            {selectedIds.length > 0 && (
                <BulkActionBar
                    selectedCount={selectedIds.length}
                    onUnregister={() => setIsUnregisterModalOpen(true)}
                    onClear={() => setSelectedIds([])}
                />
            )}

            {/* 등록 해제 확인 모달 */}
            <ConfirmModal
                isOpen={isUnregisterModalOpen}
                onClose={() => setIsUnregisterModalOpen(false)}
                onConfirm={handleUnregister}
                title={`${selectedIds.length}건의 상품을 등록 해제할까요?`}
                description="등록 해제된 상품은 편집 목록으로 되돌아갑니다. Qoo10에서도 판매가 중지됩니다."
                confirmText="등록 해제"
                cancelText="취소"
            />

            {/* 등록 기록 모달 */}
            <BatchHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                jobs={jobs}
                activeJobId={null}
                onSelectJob={handleSelectJob}
            />
        </MainLayout>
    );
};
