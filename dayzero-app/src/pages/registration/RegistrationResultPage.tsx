import { useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield } from 'lucide-react';
import { colors, font, spacing, radius } from '../../design/tokens';
import { MainLayout } from '../../components/layout/MainLayout';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useRegistrationStore } from '../../store/useRegistrationStore';

import { RegistrationProviderFilter } from './components/RegistrationTabBar';
import { RegistrationProgressSection } from './components/RegistrationProgressSection';
import { SuccessSummaryCard } from './components/SuccessSummaryCard';
import { AllProductsTable } from './components/AllProductsTable';
import { BulkActionBar } from './components/FailedBulkActionBar';
import { MonitoringStatusTabs } from './components/MonitoringStatusTabs';
import { MonitoringHistoryModal } from './components/MonitoringHistoryModal';
import { MonitoringInfoCallout } from './components/MonitoringInfoCallout';
import { MonitoringSettingsModal } from './components/MonitoringSettingsModal';

import { useRegistrationFilters } from './hooks/useRegistrationFilters';
import { useRegistrationSelection } from './hooks/useRegistrationSelection';
import { useRegistrationActions } from './hooks/useRegistrationActions';

const FREE_PLAN_LIMIT = 10;

export const RegistrationResultPage: React.FC = () => {
    const navigate = useNavigate();
    const { jobs, deleteResults, pauseSales, resumeSales, enableMonitoring, disableMonitoring, runMonitoringCheck, forceIssueOnOne, seedDemoIssues, autoPauseOnOutOfStock, setAutoPauseOnOutOfStock, autoPauseOnNegativeMargin, setAutoPauseOnNegativeMargin } = useRegistrationStore();

    // 모든 성공 결과 통합
    const allSuccessResults = useMemo(
        () => jobs.flatMap(j => j.results.filter(r => r.status === 'success')),
        [jobs]
    );

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

    // 필터링
    const filters = useRegistrationFilters(allSuccessResults);

    // 선택
    const selection = useRegistrationSelection(
        allSuccessResults,
        filters.filteredResults,
    );

    // 탭 변경 시 선택 초기화
    const handleTabChange = useCallback((tab: Parameters<typeof filters.handleTabChange>[0]) => {
        filters.handleTabChange(tab);
        selection.clearSelection();
    }, [filters, selection]);

    // 액션 & 모달
    const actions = useRegistrationActions(
        jobs,
        allSuccessResults,
        selection.selectedIds,
        selection.selectedMonitoringInfo,
        filters.monitoringCounts.monitoring,
        selection.clearSelection,
        { pauseSales, resumeSales, deleteResults, enableMonitoring, disableMonitoring },
    );

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleRowClick = useCallback((resultId: string) => {
        navigate(`/registration/${resultId}`);
    }, [navigate]);


    return (
        <MainLayout>
            <div>
                {/* 헤더 */}
                <div style={{ marginBottom: spacing['6'], display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', animation: 'fadeInUp 0.6s ease' }}>
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
                            Qoo10 JP에 등록된 상품을 관리하고, 쇼핑몰 가격·재고 변동을 확인하세요.
                        </p>
                    </div>

                    {/* 우측 버튼들 */}
                    <div style={{ display: 'flex', gap: spacing['2'], flexShrink: 0 }}>
                        {filters.hasAnyMonitoring && (
                            <HeaderButton
                                icon={<Shield size={14} />}
                                label="변동 기록"
                                onClick={() => actions.setIsMonitoringHistoryOpen(true)}
                            />
                        )}
                    </div>
                </div>

                {/* 등록 진행 프로그레스 */}
                {progressJob && (
                    <RegistrationProgressSection job={progressJob} onDismiss={handleProgressDismiss} />
                )}

                {/* 성과 요약 (프로그레스 없을 때만) */}
                {!progressJob && (
                    <SuccessSummaryCard results={allSuccessResults} />
                )}

                {/* 변동 확인 콜아웃 */}
                <MonitoringInfoCallout
                    monitoringCount={filters.monitoringCounts.monitoring}
                    limit={FREE_PLAN_LIMIT}
                    autoPauseOnOutOfStock={autoPauseOnOutOfStock}
                    autoPauseOnNegativeMargin={autoPauseOnNegativeMargin}
                    onSettingsClick={() => setIsSettingsOpen(true)}
                />

                {/* 모니터링 상태 탭 */}
                <MonitoringStatusTabs
                    activeTab={filters.monitoringTab}
                    onChange={handleTabChange}
                    counts={filters.monitoringCounts}
                />

                {/* 검색 */}
                {allSuccessResults.length > 0 && (
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
                            value={filters.searchKeyword}
                            onChange={(e) => filters.setSearchKeyword(e.target.value)}
                            style={{
                                flex: 1, border: 'none', outline: 'none',
                                fontSize: font.size.base, color: colors.text.primary,
                                padding: `${spacing['3']} 0`, background: 'transparent',
                            }}
                        />
                    </div>
                )}

                {/* 소싱처 필터 */}
                {filters.tabFilteredResults.length > 0 && (
                    <RegistrationProviderFilter
                        activeFilter={filters.providerFilter}
                        onChange={(f) => { filters.handleProviderChange(f); selection.clearSelection(); }}
                        providers={filters.providers}
                    />
                )}

                {/* 상품 테이블 */}
                <AllProductsTable
                    results={filters.filteredResults}
                    selectedIds={selection.selectedIds}
                    onToggleSelect={selection.handleToggleSelect}
                    onSelectAll={selection.handleSelectAll}
                    onRowClick={handleRowClick}
                    showMonitoring
                    emptyMessage={
                        filters.monitoringTab === '가격·재고 확인 중' ? '가격·재고 자동 확인 중인 상품이 없어요' :
                            filters.monitoringTab === '품절' ? '품절된 상품이 없어요' :
                                filters.monitoringTab === '역마진' ? '역마진 상품이 없어요' :
                                    filters.monitoringTab === '일시 중지' ? '일시 중지된 상품이 없어요' :
                                        '판매 중인 상품이 없어요'
                    }
                />
            </div>

            {/* 벌크 액션 바 */}
            {selection.selectedIds.length > 0 && (
                <BulkActionBar
                    selectedCount={selection.selectedIds.length}
                    onPause={() => actions.setIsPauseModalOpen(true)}
                    onResume={() => {
                        if (selection.resumeTargets.length === 0) return;
                        actions.setIsResumeModalOpen(true);
                    }}
                    onDelete={() => actions.setIsDeleteModalOpen(true)}
                    onClear={selection.clearSelection}
                    onEnableMonitoring={selection.selectedMonitoringInfo.hasUnmonitored
                        ? () => actions.setIsEnableMonitoringModalOpen(true)
                        : undefined
                    }
                    onDisableMonitoring={selection.selectedMonitoringInfo.hasMonitored
                        ? () => actions.setIsDisableMonitoringModalOpen(true)
                        : undefined
                    }
                    hasMonitoredSelected={selection.selectedMonitoringInfo.hasMonitored}
                    hasUnmonitoredSelected={selection.selectedMonitoringInfo.hasUnmonitored}
                    hasPausedSelected={selection.selectedMonitoringInfo.hasPaused}
                    hasActiveSelected={selection.selectedMonitoringInfo.hasActive}
                />
            )}

            {/* 판매 재개 확인 모달 */}
            <ConfirmModal
                isOpen={actions.isResumeModalOpen}
                onClose={() => actions.setIsResumeModalOpen(false)}
                onConfirm={() => actions.handleResume(selection.resumeTargets.map(r => r.id))}
                title={`${selection.resumeTargets.length}건을 판매 재개할까요?`}
                description={
                    selection.hasOutOfStockInResume
                        ? '선택한 상품 중 아직 품절 상태인 상품이 있어요. 품절 상태에서 판매를 재개하면 주문이 들어왔을 때 배송이 어려울 수 있어요.'
                        : '판매를 재개하면 Qoo10에서 바로 구매 가능 상태로 전환돼요.'
                }
                confirmText="판매 재개"
                cancelText="취소"
                type={selection.hasOutOfStockInResume ? 'danger' : 'info'}
            />

            {/* 일시 중지 확인 모달 */}
            <ConfirmModal
                isOpen={actions.isPauseModalOpen}
                onClose={() => actions.setIsPauseModalOpen(false)}
                onConfirm={actions.handlePause}
                title={`${selection.selectedIds.length}건을 판매 일시 중지할까요?`}
                description="일시 중지해도 Qoo10 등록은 그대로 유지돼요. 언제든지 다시 판매를 재개할 수 있어요."
                confirmText="판매 일시 중지"
                cancelText="취소"
            />

            {/* 판매 종료 확인 모달 */}
            <ConfirmModal
                isOpen={actions.isDeleteModalOpen}
                onClose={() => actions.setIsDeleteModalOpen(false)}
                onConfirm={actions.handleDelete}
                title={`${selection.selectedIds.length}건의 판매를 종료할까요?`}
                description="판매 종료 후에는 복구할 수 없어요. Qoo10에서도 상품이 완전히 제거되고, 편집 목록으로 돌아가지 않아요."
                confirmText="판매 종료"
                cancelText="취소"
                type="danger"
            />

            {/* 가격·재고 자동 확인 등록 모달 */}
            <ConfirmModal
                isOpen={actions.isEnableMonitoringModalOpen}
                onClose={() => actions.setIsEnableMonitoringModalOpen(false)}
                onConfirm={actions.handleEnableMonitoring}
                title={`${selection.selectedMonitoringInfo.unmonitoredCount}건에 가격·재고 자동 확인을 등록할까요?`}
                description={`매일 오전 7시에 쇼핑몰의 가격과 재고를 자동으로 확인해서, 역마진이나 품절이 생기면 알려드려요.\n\n현재 등록: ${filters.monitoringCounts.monitoring}건 / 최대 ${FREE_PLAN_LIMIT}건`}
                confirmText="가격·재고 자동 확인 시작"
                cancelText="취소"
                type="info"
            />

            {/* 가격·재고 자동 확인 해제 모달 */}
            <ConfirmModal
                isOpen={actions.isDisableMonitoringModalOpen}
                onClose={() => actions.setIsDisableMonitoringModalOpen(false)}
                onConfirm={actions.handleDisableMonitoring}
                title={`${selection.selectedMonitoringInfo.monitoredCount}건의 가격·재고 자동 확인을 해제할까요?`}
                description="해제하면 쇼핑몰 가격·재고 변동이 더 이상 확인되지 않아요."
                confirmText="알림 해제"
                cancelText="취소"
            />

            {/* 변동 기록 모달 */}
            <MonitoringHistoryModal
                isOpen={actions.isMonitoringHistoryOpen}
                onClose={() => actions.setIsMonitoringHistoryOpen(false)}
                results={allSuccessResults}
                onSimulate={runMonitoringCheck}
                onForceIssue={forceIssueOnOne}
                onSeedDemoIssues={seedDemoIssues}
            />
            {/* 알림 설정 모달 */}
            <MonitoringSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                autoPauseOnOutOfStock={autoPauseOnOutOfStock}
                onToggleOutOfStock={setAutoPauseOnOutOfStock}
                autoPauseOnNegativeMargin={autoPauseOnNegativeMargin}
                onToggleNegativeMargin={setAutoPauseOnNegativeMargin}
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

