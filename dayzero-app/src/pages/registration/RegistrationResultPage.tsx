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

import { MonitoringEnableDescription, MonitoringDisableDescription, MonitoringDisableOosDescription } from './components/MonitoringModalDescriptions';
import type { MonitoringTabFilter } from './components/MonitoringStatusTabs';
import { useRegistrationFilters } from './hooks/useRegistrationFilters';
import { useRegistrationSelection } from './hooks/useRegistrationSelection';
import { useRegistrationActions } from './hooks/useRegistrationActions';

const FREE_PLAN_LIMIT = 30;

const EMPTY_MESSAGES: Record<MonitoringTabFilter, string> = {
    '전체': '등록된 상품이 없어요',
    '판매 중': '판매 중인 상품이 없어요',
    '가격·품절 확인 중': '가격·품절 확인 중인 상품이 없어요',
    '품절': '품절된 상품이 없어요',
    '문제 발생': '문제가 발생한 상품이 없어요',
    '일시 중지': '일시 중지된 상품이 없어요',
};

export const RegistrationResultPage: React.FC = () => {
    const navigate = useNavigate();
    const { jobs, deleteResults, pauseSales, resumeSales, enableMonitoring, disableMonitoring, runMonitoringCheck, forceIssueOnOne, seedDemoIssues } = useRegistrationStore();

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

    // 모니터링 한도 초과 모달
    const [isMonitoringLimitModalOpen, setIsMonitoringLimitModalOpen] = useState(false);

    // 개별 토글 모니터링
    const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
    const [isToggleEnableModalOpen, setIsToggleEnableModalOpen] = useState(false);
    const [isToggleDisableModalOpen, setIsToggleDisableModalOpen] = useState(false);

    const handleToggleMonitoring = useCallback((resultId: string, enable: boolean) => {
        setPendingToggleId(resultId);
        if (enable) {
            if (filters.monitoringCounts.monitoring >= FREE_PLAN_LIMIT) {
                setIsMonitoringLimitModalOpen(true);
                return;
            }
            setIsToggleEnableModalOpen(true);
        } else {
            setIsToggleDisableModalOpen(true);
        }
    }, [filters.monitoringCounts.monitoring]);

    const handleConfirmToggleEnable = useCallback(() => {
        if (pendingToggleId) {
            enableMonitoring([pendingToggleId]);
        }
        setIsToggleEnableModalOpen(false);
        setPendingToggleId(null);
    }, [pendingToggleId, enableMonitoring]);

    const handleConfirmToggleDisable = useCallback(() => {
        if (pendingToggleId) {
            disableMonitoring([pendingToggleId]);
        }
        setIsToggleDisableModalOpen(false);
        setPendingToggleId(null);
    }, [pendingToggleId, disableMonitoring]);

    // OFF 모달에 표시할 상태별 문구
    const pendingResult = pendingToggleId
        ? allSuccessResults.find(r => r.id === pendingToggleId)
        : null;
    const pendingCheckResult = pendingResult?.monitoring?.lastCheckResult;
    const disableModalDescription = pendingCheckResult === 'out_of_stock'
        ? MonitoringDisableOosDescription
        : MonitoringDisableDescription;

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
                            Qoo10 JP에 등록된 상품을 관리하고, 쇼핑몰 가격·품절 변동을 확인하세요.
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
                    onToggleMonitoring={handleToggleMonitoring}
                    emptyMessage={EMPTY_MESSAGES[filters.monitoringTab]}
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
                        ? () => {
                            const newTotal = filters.monitoringCounts.monitoring + selection.selectedMonitoringInfo.unmonitoredCount;
                            if (newTotal > FREE_PLAN_LIMIT || filters.monitoringCounts.monitoring >= FREE_PLAN_LIMIT) {
                                setIsMonitoringLimitModalOpen(true);
                            } else {
                                actions.setIsEnableMonitoringModalOpen(true);
                            }
                        }
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
                    monitoredCount={selection.selectedMonitoringInfo.monitoredCount}
                    unmonitoredCount={selection.selectedMonitoringInfo.unmonitoredCount}
                    pausedCount={selection.selectedMonitoringInfo.pausedCount}
                    activeCount={selection.selectedMonitoringInfo.activeCount}
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

            {/* 삭제 확인 모달 */}
            <ConfirmModal
                isOpen={actions.isDeleteModalOpen}
                onClose={() => actions.setIsDeleteModalOpen(false)}
                onConfirm={actions.handleDelete}
                title={`${selection.selectedIds.length}건을 삭제할까요?`}
                description="삭제 후에는 복구할 수 없어요. Qoo10에서도 상품이 완전히 제거되고, 편집 목록으로 돌아가지 않아요."
                confirmText="삭제"
                cancelText="취소"
                type="danger"
            />

            {/* 가격·재고 자동 확인 등록 모달 */}
            <ConfirmModal
                isOpen={actions.isEnableMonitoringModalOpen}
                onClose={() => actions.setIsEnableMonitoringModalOpen(false)}
                onConfirm={actions.handleEnableMonitoring}
                title={`${selection.selectedMonitoringInfo.unmonitoredCount}건에 가격·품절 확인을 켤까요?`}
                description={`매일 오전 7시에 쇼핑몰의 가격과 재고를 자동으로 확인해서, 역마진이나 품절이 생기면 알려드려요.\n\n현재 등록: ${filters.monitoringCounts.monitoring}건 / 최대 ${FREE_PLAN_LIMIT}건`}
                confirmText="가격·품절 확인 시작"
                cancelText="취소"
                type="info"
            />

            {/* 모니터링 한도 초과 모달 */}
            <ConfirmModal
                isOpen={isMonitoringLimitModalOpen}
                onClose={() => setIsMonitoringLimitModalOpen(false)}
                onConfirm={() => setIsMonitoringLimitModalOpen(false)}
                title="가격·품절 확인 한도 초과"
                description={`최대 ${FREE_PLAN_LIMIT}건까지 가격·품절 확인이 가능해요.\n기존 제품을 해제하거나 플랜을 업그레이드해 주세요.`}
                confirmText="확인"
            />

            {/* 가격·재고 자동 확인 해제 모달 */}
            <ConfirmModal
                isOpen={actions.isDisableMonitoringModalOpen}
                onClose={() => actions.setIsDisableMonitoringModalOpen(false)}
                onConfirm={actions.handleDisableMonitoring}
                title={`${selection.selectedMonitoringInfo.monitoredCount}건의 가격·품절 확인을 끌까요?`}
                description="해제하면 쇼핑몰 가격·품절 변동이 더 이상 확인되지 않아요."
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
            {/* 자동확인 토글 ON 안내 모달 */}
            <ConfirmModal
                isOpen={isToggleEnableModalOpen}
                onClose={() => { setIsToggleEnableModalOpen(false); setPendingToggleId(null); }}
                onConfirm={handleConfirmToggleEnable}
                title="가격·품절 확인을 켤까요?"
                description={MonitoringEnableDescription}
                confirmText="켜기"
                cancelText="취소"
                type="info"
            />
            {/* 자동확인 토글 OFF 확인 모달 */}
            <ConfirmModal
                isOpen={isToggleDisableModalOpen}
                onClose={() => { setIsToggleDisableModalOpen(false); setPendingToggleId(null); }}
                onConfirm={handleConfirmToggleDisable}
                title="가격·품절 확인을 끌까요?"
                description={disableModalDescription}
                confirmText="끄기"
                cancelText="취소"
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

