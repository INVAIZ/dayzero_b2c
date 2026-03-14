import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search, Shield, Clock } from 'lucide-react';
import { colors, font, spacing, radius } from '../../design/tokens';
import { MainLayout } from '../../components/layout/MainLayout';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useRegistrationStore } from '../../store/useRegistrationStore';


import { RegistrationProviderFilter } from './components/RegistrationTabBar';
import { RegistrationProgressSection } from './components/RegistrationProgressSection';
import { SuccessSummaryCard } from './components/SuccessSummaryCard';
import { AllProductsTable } from './components/AllProductsTable';
import { BulkActionBar } from './components/FailedBulkActionBar';
import { BatchHistoryModal } from './components/BatchHistoryModal';
import { MonitoringStatusTabs, type MonitoringTabFilter } from './components/MonitoringStatusTabs';
import { MonitoringHistoryModal } from './components/MonitoringHistoryModal';

const FREE_PLAN_LIMIT = 50;

const issueOrder = (lastCheckResult: string | undefined) => {
    if (lastCheckResult === 'negative_margin' || lastCheckResult === 'out_of_stock') return 0;
    if (lastCheckResult === 'price_changed') return 1;
    return 2;
};

export const RegistrationResultPage: React.FC = () => {
    const navigate = useNavigate();
    const { jobs, deleteResults, pauseSales, resumeSales, enableMonitoring, disableMonitoring, runMonitoringCheck, forceIssueOnOne } = useRegistrationStore();


    // 탭 & 필터 상태
    const [monitoringTab, setMonitoringTab] = useState<MonitoringTabFilter>('판매 중');
    const [providerFilter, setProviderFilter] = useState('전체');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // 모달 상태
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEnableMonitoringModalOpen, setIsEnableMonitoringModalOpen] = useState(false);
    const [isDisableMonitoringModalOpen, setIsDisableMonitoringModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isMonitoringHistoryOpen, setIsMonitoringHistoryOpen] = useState(false);

    // 프로그레스 카드
    const processingJob = useMemo(
        () => jobs.find(j => j.status === 'processing') ?? null,
        [jobs]
    );
    const [isProgressDismissed, setIsProgressDismissed] = useState(false);
    const progressJob = isProgressDismissed ? null : processingJob;

    useEffect(() => {
        if (processingJob) setIsProgressDismissed(false);
    }, [processingJob]);

    const handleProgressDismiss = useCallback(() => {
        setIsProgressDismissed(true);
    }, []);

    // 모든 성공 결과 통합
    const allSuccessResults = useMemo(
        () => jobs.flatMap(j => j.results.filter(r => r.status === 'success')),
        [jobs]
    );

    // 모니터링 관련 카운트
    const monitoringCounts = useMemo(() => {
        return allSuccessResults.reduce(
            (acc, r) => {
                if (r.salesStatus === 'paused') {
                    acc.paused++;
                } else {
                    acc.active++;
                    if (r.monitoring?.status === 'active') {
                        acc.monitoring++;
                        const cr = r.monitoring.lastCheckResult;
                        if (cr === 'negative_margin' || cr === 'out_of_stock') acc.issues++;
                    }
                }
                return acc;
            },
            { active: 0, monitoring: 0, issues: 0, paused: 0 }
        );
    }, [allSuccessResults]);

    // 모니터링 탭에 따른 1차 필터
    const tabFilteredResults = useMemo(() => {
        switch (monitoringTab) {
            case '판매 중지':
                return allSuccessResults.filter(r => r.salesStatus === 'paused');
            case '변동 확인 중': {
                const results = allSuccessResults.filter(r => r.salesStatus !== 'paused' && r.monitoring?.status === 'active');
                return [...results].sort((a, b) => issueOrder(a.monitoring?.lastCheckResult) - issueOrder(b.monitoring?.lastCheckResult));
            }
            default: // '판매 중'
                return allSuccessResults.filter(r => r.salesStatus !== 'paused');
        }
    }, [monitoringTab, allSuccessResults]);

    // 소싱처 목록
    const providers = useMemo(() => {
        const set = new Set(tabFilteredResults.map(r => r.product.provider));
        return Array.from(set);
    }, [tabFilteredResults]);


    // 소싱처 + 검색 2차 필터
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

    // 선택된 항목의 모니터링/판매 상태
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
                    };
                },
                { hasMonitored: false, hasUnmonitored: false, monitoredCount: 0, unmonitoredCount: 0, hasPaused: false, hasActive: false }
            );
    }, [selectedIds, allSuccessResults]);

    const hasAnyMonitoring = monitoringCounts.monitoring > 0;

    // 핸들러
    const handleTabChange = (tab: MonitoringTabFilter) => {
        setMonitoringTab(tab);
        setProviderFilter('전체');
        setSearchKeyword('');
        setSelectedIds([]);
    };

    const handleSelectJob = (jobId: string) => {
        setMonitoringTab('판매 중');
        setProviderFilter('전체');
        setSearchKeyword('');
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

    const handlePause = () => {
        if (selectedIds.length === 0) return;
        pauseSales(selectedIds);
        setSelectedIds([]);
        setIsPauseModalOpen(false);
    };

    const resumeTargets = useMemo(() =>
        allSuccessResults.filter(r => selectedIds.includes(r.id) && r.salesStatus === 'paused'),
        [selectedIds, allSuccessResults]
    );
    const hasOutOfStockInResume = resumeTargets.some(
        r => r.monitoring?.lastCheckResult === 'out_of_stock'
    );

    const handleResume = () => {
        if (resumeTargets.length === 0) return;
        setIsResumeModalOpen(true);
    };

    const confirmResume = () => {
        resumeSales(resumeTargets.map(r => r.id));
        setSelectedIds([]);
        setIsResumeModalOpen(false);
    };

    const handleDelete = () => {
        if (selectedIds.length === 0) return;
        jobs.forEach(job => {
            const jobResultIds = job.results
                .filter(r => selectedIds.includes(r.id))
                .map(r => r.id);
            if (jobResultIds.length > 0) {
                deleteResults(job.id, jobResultIds);
            }
        });
        setSelectedIds([]);
        setIsDeleteModalOpen(false);
    };

    const handleEnableMonitoring = () => {
        const unmonitoredIds = allSuccessResults
            .filter(r => selectedIds.includes(r.id) && r.monitoring?.status !== 'active')
            .map(r => r.id);
        if (unmonitoredIds.length === 0) return;
        enableMonitoring(unmonitoredIds);
        setSelectedIds([]);
        setIsEnableMonitoringModalOpen(false);
    };

    const handleDisableMonitoring = () => {
        const monitoredIds = allSuccessResults
            .filter(r => selectedIds.includes(r.id) && r.monitoring?.status === 'active')
            .map(r => r.id);
        if (monitoredIds.length === 0) return;
        disableMonitoring(monitoredIds);
        setSelectedIds([]);
        setIsDisableMonitoringModalOpen(false);
    };

    const handleRowClick = (resultId: string) => {
        navigate(`/registration/${resultId}`);
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
                            판매 중인 상품
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
                            Qoo10 JP에 등록된 상품을 관리하고, 소싱처 가격·재고 변동을 확인하세요.
                        </p>
                    </div>

                    {/* 우측 버튼들 */}
                    <div style={{ display: 'flex', gap: spacing['2'], flexShrink: 0 }}>
                        {jobs.filter(j => j.status === 'completed').length >= 1 && (
                            <HeaderButton
                                icon={<History size={14} />}
                                label="등록 기록"
                                onClick={() => setIsHistoryModalOpen(true)}
                            />
                        )}
                        {hasAnyMonitoring && (
                            <HeaderButton
                                icon={<Shield size={14} />}
                                label="변동 기록"
                                onClick={() => setIsMonitoringHistoryOpen(true)}
                            />
                        )}
                    </div>
                </div>

                {/* 등록 진행 프로그레스 */}
                {progressJob && (
                    <RegistrationProgressSection job={progressJob} onDismiss={handleProgressDismiss} />
                )}

                {/* 성과 요약 (프로그레스 없을 때만) */}
                {!progressJob && allSuccessResults.length > 0 && (
                    <SuccessSummaryCard results={allSuccessResults} />
                )}

                {/* 모니터링 상태 탭 */}
                {allSuccessResults.length > 0 && (
                    <MonitoringStatusTabs
                        activeTab={monitoringTab}
                        onChange={handleTabChange}
                        counts={monitoringCounts}
                    />
                )}

                {/* 변동 확인 콜아웃 (모든 탭) */}
                {hasAnyMonitoring && (
                    <MonitoringInfoCallout
                        monitoringCount={monitoringCounts.monitoring}
                        limit={FREE_PLAN_LIMIT}
                    />
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
                {tabFilteredResults.length > 0 && (
                    <RegistrationProviderFilter
                        activeFilter={providerFilter}
                        onChange={(f) => { setProviderFilter(f); setSelectedIds([]); }}
                        providers={providers}
                                    />
                )}

                {/* 상품 테이블 */}
                <AllProductsTable
                    results={filteredResults}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onSelectAll={handleSelectAll}
                    onRowClick={handleRowClick}
                    showMonitoring
                    emptyMessage={
                        monitoringTab === '변동 확인 중' ? '변동 확인 중인 상품이 없어요' :
                        monitoringTab === '판매 중지' ? '판매 중지된 상품이 없어요' :
                        '판매 중인 상품이 없어요'
                    }
                />
            </div>

            {/* 벌크 액션 바 */}
            {selectedIds.length > 0 && (
                <BulkActionBar
                    selectedCount={selectedIds.length}
                    onPause={() => setIsPauseModalOpen(true)}
                    onResume={handleResume}
                    onDelete={() => setIsDeleteModalOpen(true)}
                    onClear={() => setSelectedIds([])}
                    onEnableMonitoring={selectedMonitoringInfo.hasUnmonitored
                        ? () => setIsEnableMonitoringModalOpen(true)
                        : undefined
                    }
                    onDisableMonitoring={selectedMonitoringInfo.hasMonitored
                        ? () => setIsDisableMonitoringModalOpen(true)
                        : undefined
                    }
                    hasMonitoredSelected={selectedMonitoringInfo.hasMonitored}
                    hasUnmonitoredSelected={selectedMonitoringInfo.hasUnmonitored}
                    hasPausedSelected={selectedMonitoringInfo.hasPaused}
                    hasActiveSelected={selectedMonitoringInfo.hasActive}
                />
            )}

            {/* 판매 재개 확인 모달 */}
            <ConfirmModal
                isOpen={isResumeModalOpen}
                onClose={() => setIsResumeModalOpen(false)}
                onConfirm={confirmResume}
                title={`${resumeTargets.length}건을 판매 재개할까요?`}
                description={
                    hasOutOfStockInResume
                        ? '선택한 상품 중 아직 품절 상태인 상품이 있어요. 품절 상태에서 판매를 재개하면 주문이 들어왔을 때 배송이 어려울 수 있어요.'
                        : '판매를 재개하면 Qoo10에서 바로 구매 가능 상태로 전환돼요.'
                }
                confirmText="판매 재개"
                cancelText="취소"
                type={hasOutOfStockInResume ? 'danger' : 'info'}
            />

            {/* 일시 중지 확인 모달 */}
            <ConfirmModal
                isOpen={isPauseModalOpen}
                onClose={() => setIsPauseModalOpen(false)}
                onConfirm={handlePause}
                title={`${selectedIds.length}건을 판매 일시 중지할까요?`}
                description="일시 중지해도 Qoo10 등록은 그대로 유지돼요. 언제든지 다시 판매를 재개할 수 있어요."
                confirmText="판매 일시 중지"
                cancelText="취소"
            />

            {/* 판매 종료 확인 모달 */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title={`${selectedIds.length}건의 판매를 종료할까요?`}
                description="판매 종료 후에는 복구할 수 없어요. Qoo10에서도 상품이 완전히 제거되고, 편집 목록으로 돌아가지 않아요."
                confirmText="판매 종료"
                cancelText="취소"
                type="danger"
            />

            {/* 변동 알림 등록 모달 */}
            <ConfirmModal
                isOpen={isEnableMonitoringModalOpen}
                onClose={() => setIsEnableMonitoringModalOpen(false)}
                onConfirm={handleEnableMonitoring}
                title={`${selectedMonitoringInfo.unmonitoredCount}건에 변동 알림을 등록할까요?`}
                description={`매일 오전 7시에 소싱처의 가격과 재고를 자동으로 확인해서, 역마진이나 품절이 생기면 알려드려요.\n\n현재 등록: ${monitoringCounts.monitoring}건 / 최대 ${FREE_PLAN_LIMIT}건`}
                confirmText="변동 알림 받기"
                cancelText="취소"
                type="info"
            />

            {/* 변동 알림 해제 모달 */}
            <ConfirmModal
                isOpen={isDisableMonitoringModalOpen}
                onClose={() => setIsDisableMonitoringModalOpen(false)}
                onConfirm={handleDisableMonitoring}
                title={`${selectedMonitoringInfo.monitoredCount}건의 변동 알림을 해제할까요?`}
                description="해제하면 소싱처 가격·재고 변동이 더 이상 확인되지 않아요."
                confirmText="알림 해제"
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

            {/* 변동 기록 모달 */}
            <MonitoringHistoryModal
                isOpen={isMonitoringHistoryOpen}
                onClose={() => setIsMonitoringHistoryOpen(false)}
                results={allSuccessResults}
                onSimulate={runMonitoringCheck}
                onForceIssue={forceIssueOnOne}
            />
        </MainLayout>
    );
};

// ── 하위 컴포넌트 ─────────────────────────────────────────────────────────

const HeaderButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
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
        {icon}
        {label}
    </button>
);

/** 변동 확인 중 탭 콜아웃 — 프로그레스 바 없이 명확한 텍스트 */
const MonitoringInfoCallout: React.FC<{
    monitoringCount: number;
    limit: number;
}> = ({ monitoringCount, limit }) => {
    return (
        <div style={{
            background: colors.bg.info,
            border: `1px solid ${colors.primaryLightBorder}`,
            borderRadius: radius.lg,
            padding: `${spacing['4']} ${spacing['5']}`,
            marginBottom: spacing['4'],
            display: 'flex',
            alignItems: 'center',
            gap: spacing['4'],
            animation: 'calloutIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            {/* 아이콘 */}
            <div style={{
                width: '40px', height: '40px',
                borderRadius: radius.md,
                background: colors.bg.surface,
                border: `1px solid ${colors.primaryLightBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Shield size={20} color={colors.primary} />
            </div>

            {/* 정보 */}
            <div style={{ flex: 1 }}>
                {/* 라벨 */}
                <div style={{
                    fontSize: font.size.xs,
                    fontWeight: 600,
                    color: colors.text.tertiary,
                    marginBottom: '4px',
                }}>
                    변동 확인 중
                </div>

                {/* 카운트 + 태그 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['2'],
                    marginBottom: spacing['2'],
                    flexWrap: 'wrap',
                }}>
                    <span style={{
                        fontSize: font.size.base,
                        fontWeight: 700,
                        color: colors.text.primary,
                    }}>
                        {monitoringCount}건
                        <span style={{ fontWeight: 500, color: colors.text.muted, fontSize: font.size.sm }}>
                            {' '}/ 최대 {limit}건
                        </span>
                    </span>
                    <span style={{
                        fontSize: font.size['2xs'],
                        fontWeight: 600,
                        color: colors.primary,
                        background: colors.bg.surface,
                        border: `1px solid ${colors.primaryLightBorder}`,
                        padding: '2px 8px',
                        borderRadius: radius.full,
                    }}>
                        무료 플랜
                    </span>
                </div>

                {/* 설명 */}
                <div style={{
                    fontSize: font.size.sm,
                    color: colors.text.tertiary,
                    lineHeight: '1.5',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '4px',
                }}>
                    <Clock size={12} color={colors.text.muted} style={{ flexShrink: 0, marginTop: '2px' }} />
                    변동 확인을 등록하면 매일 오전 7시에 소싱처 가격·재고를 자동으로 확인하고, 역마진이나 품절이 생기면 바로 알려드려요.
                </div>
            </div>

            <style>{`
                @keyframes calloutIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
