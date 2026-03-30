import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search, X, ChevronRight, ChevronLeft, Check, FolderOpen } from 'lucide-react';
import { AIIcon } from './AIIcon';
import {
  CATEGORY_LARGE,
  CATEGORY_MEDIUM,
  CATEGORY_SMALL,
  CATEGORY_FLAT,
  type CategoryFlat,
} from '../../mock/qoo10Categories';
import { colors, font, radius, shadow, spacing, zIndex } from '../../design/tokens';

// ── Props ────────────────────────────────────────────────────────────────────

interface CategorySelectModalProps {
  /** 현재 선택된 소분류 코드 */
  currentCode?: string;
  /** 현재 선택된 카테고리 경로 (코드 없을 때 fallback 매칭) */
  currentPath?: string;
  /** AI 추천 소분류 코드 */
  aiRecommendedCode?: string;
  /** 카테고리 선택 시 콜백 */
  onSelect: (item: CategoryFlat) => void;
  /** 모달 닫기 */
  onClose: () => void;
}

// ── 스타일 상수 ──────────────────────────────────────────────────────────────

const MODAL_WIDTH = 520;
const MODAL_MAX_H = 620;

const flexCenter: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
};

const ghostBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
};

// ── 검색 결과 아이템 ──────────────────────────────────────────────────────────

const SearchResultItem: React.FC<{
  item: CategoryFlat;
  isSelected: boolean;
  isAiRec: boolean;
  query: string;
  onClick: () => void;
}> = ({ item, isSelected, isAiRec, query, onClick }) => {
  const highlight = (text: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: colors.primaryLight, color: colors.primary, borderRadius: radius.xs, padding: '0 1px' }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <button
      onClick={onClick}
      style={{
        ...flexCenter, justifyContent: 'space-between',
        width: '100%', padding: `12px ${spacing['5']}`,
        background: isSelected ? colors.primaryLight : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        borderBottom: `1px solid ${colors.border.default}`,
        transition: 'background 0.12s', gap: spacing['2'],
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = colors.bg.faint; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ ...flexCenter, gap: spacing['2'], flexWrap: 'wrap' }}>
          <span style={{
            fontSize: font.size.sm, fontWeight: isSelected ? 700 : 500,
            color: isSelected ? colors.primary : colors.text.primary,
          }}>
            {highlight(item.smallName)}
          </span>
          {isAiRec && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              fontSize: font.size['2xs+'], fontWeight: 600,
              color: colors.primary, background: colors.primaryLight,
              padding: '1px 6px', borderRadius: radius.full,
            }}>
              <AIIcon size={9} /> AI 추천
            </span>
          )}
        </div>
        <div style={{
          fontSize: font.size.xs, color: colors.text.muted,
          marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {highlight(item.largeName)} &gt; {highlight(item.mediumName)}
        </div>
      </div>
      {isSelected && <Check size={16} color={colors.primary} style={{ flexShrink: 0 }} />}
    </button>
  );
};

// ── 드릴다운 리스트 아이템 ────────────────────────────────────────────────────

const DrillItem: React.FC<{
  name: string;
  count?: number;
  isSelected?: boolean;
  hasArrow?: boolean;
  isAiRec?: boolean;
  onClick: () => void;
}> = ({ name, count, isSelected, hasArrow = true, isAiRec, onClick }) => (
  <button
    onClick={onClick}
    style={{
      ...flexCenter, justifyContent: 'space-between',
      width: '100%', padding: `12px ${spacing['5']}`,
      background: isSelected ? colors.primaryLight : 'transparent',
      border: 'none', cursor: 'pointer', textAlign: 'left',
      borderBottom: `1px solid ${colors.border.default}`,
      transition: 'background 0.12s',
    }}
    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = colors.bg.faint; }}
    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
  >
    <div style={{ ...flexCenter, gap: spacing['2'], minWidth: 0, flex: 1 }}>
      <span style={{
        fontSize: font.size.sm, fontWeight: isSelected ? 700 : 500,
        color: isSelected ? colors.primary : colors.text.primary,
      }}>
        {name}
      </span>
      {isAiRec && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          fontSize: font.size['2xs+'], fontWeight: 600,
          color: colors.primary, background: colors.primaryLight,
          padding: '1px 6px', borderRadius: radius.full,
        }}>
          <AIIcon size={9} /> AI 추천
        </span>
      )}
      {count !== undefined && (
        <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>
          ({count})
        </span>
      )}
    </div>
    {hasArrow ? (
      <ChevronRight size={16} color={colors.text.muted} style={{ flexShrink: 0 }} />
    ) : isSelected ? (
      <Check size={16} color={colors.primary} style={{ flexShrink: 0 }} />
    ) : null}
  </button>
);

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────

type DrillStep = 'large' | 'medium' | 'small';

export const CategorySelectModal: React.FC<CategorySelectModalProps> = ({
  currentCode,
  currentPath,
  aiRecommendedCode,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [step, setStep] = useState<DrillStep>('large');
  const [selectedLarge, setSelectedLarge] = useState<string | null>(null);
  const [selectedMedium, setSelectedMedium] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // AI 추천 카테고리의 부모 코드 조회
  const aiRecFlat = useMemo(
    () => aiRecommendedCode ? CATEGORY_FLAT.find(c => c.smallCode === aiRecommendedCode) : undefined,
    [aiRecommendedCode],
  );

  // 현재 선택된 카테고리 정보
  const currentFlat = useMemo(() => {
    if (currentCode) return CATEGORY_FLAT.find(c => c.smallCode === currentCode);
    if (currentPath) return CATEGORY_FLAT.find(c => c.path === currentPath);
    return undefined;
  }, [currentCode, currentPath]);

  // Escape 키 닫기 + 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 스텝 변경 시 스크롤 초기화
  useEffect(() => {
    listRef.current?.scrollTo(0, 0);
  }, [step, selectedLarge, selectedMedium]);

  // ── 검색 로직 ──────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return CATEGORY_FLAT
      .filter(c =>
        c.smallName.toLowerCase().includes(q) ||
        c.mediumName.toLowerCase().includes(q) ||
        c.largeName.toLowerCase().includes(q) ||
        c.path.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        // AI 추천 우선
        if (a.smallCode === aiRecommendedCode) return -1;
        if (b.smallCode === aiRecommendedCode) return 1;
        // 소분류 이름 매칭 우선
        const aSmall = a.smallName.toLowerCase().includes(q) ? 0 : 1;
        const bSmall = b.smallName.toLowerCase().includes(q) ? 0 : 1;
        return aSmall - bSmall;
      })
      .slice(0, 50); // 최대 50개
  }, [query, aiRecommendedCode]);

  const isSearchMode = query.trim().length > 0;

  // ── 드릴다운 핸들러 ────────────────────────────────────────────────────────
  const handleLargeSelect = useCallback((code: string) => {
    setSelectedLarge(code);
    setSelectedMedium(null);
    setStep('medium');
  }, []);

  const handleMediumSelect = useCallback((code: string) => {
    setSelectedMedium(code);
    setStep('small');
  }, []);

  const handleSmallSelect = useCallback((smallCode: string) => {
    const item = CATEGORY_FLAT.find(c => c.smallCode === smallCode);
    if (item) onSelect(item);
    onClose();
  }, [onSelect, onClose]);

  const handleSearchSelect = useCallback((item: CategoryFlat) => {
    onSelect(item);
    onClose();
  }, [onSelect, onClose]);

  const handleBack = useCallback(() => {
    if (step === 'small') {
      setStep('medium');
      setSelectedMedium(null);
    } else if (step === 'medium') {
      setStep('large');
      setSelectedLarge(null);
    }
  }, [step]);

  // ── 브레드크럼 ─────────────────────────────────────────────────────────────
  const largeName = selectedLarge
    ? CATEGORY_LARGE.find(c => c.code === selectedLarge)?.name
    : null;
  const mediumName = selectedMedium
    ? CATEGORY_MEDIUM[selectedLarge!]?.find(c => c.code === selectedMedium)?.name
    : null;

  // ── 렌더 ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* 오버레이 */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: zIndex.modal,
      }} />

      {/* 모달 */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: zIndex.modal + 1,
        background: colors.bg.surface, borderRadius: radius.xl,
        width: `${MODAL_WIDTH}px`, maxHeight: `${MODAL_MAX_H}px`,
        display: 'flex', flexDirection: 'column',
        boxShadow: shadow.lg, overflow: 'hidden',
        animation: 'modalIn 0.18s ease',
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `${spacing['5']} ${spacing['5']}`,
          borderBottom: `1px solid ${colors.border.default}`,
        }}>
          <span style={{ fontSize: font.size.lg, fontWeight: 700, color: colors.text.primary }}>
            Qoo10 카테고리 선택
          </span>
          <button onClick={onClose} style={{
            ...ghostBtn, color: colors.text.muted, display: 'flex',
            padding: '4px', borderRadius: radius.sm,
          }}>
            <X size={20} />
          </button>
        </div>

        {/* 검색 바 */}
        <div style={{ padding: `${spacing['3']} ${spacing['5']}`, borderBottom: `1px solid ${colors.border.default}` }}>
          <div style={{
            ...flexCenter, gap: spacing['2'],
            padding: `10px ${spacing['3']}`,
            border: `1.5px solid ${colors.border.default}`,
            borderRadius: radius.md, background: colors.bg.faint,
          }}>
            <Search size={15} color={colors.text.muted} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="카테고리 검색 (예: 스킨케어, 세럼, 주방)"
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent',
                fontSize: font.size.base, color: colors.text.primary,
                fontFamily: 'inherit',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ ...ghostBtn, display: 'flex', color: colors.text.muted }}>
                <X size={14} />
              </button>
            )}
          </div>
          {isSearchMode && (
            <div style={{ marginTop: spacing['1'], fontSize: font.size.xs, color: colors.text.muted }}>
              {searchResults.length}개 결과{searchResults.length >= 50 ? ' (상위 50개)' : ''}
            </div>
          )}
        </div>

        {/* 브레드크럼 (검색 모드가 아닐 때) */}
        {!isSearchMode && step !== 'large' && (
          <div style={{
            ...flexCenter, gap: spacing['1'],
            padding: `${spacing['2']} ${spacing['5']}`,
            background: colors.bg.faint,
            borderBottom: `1px solid ${colors.border.default}`,
          }}>
            <button onClick={handleBack} style={{
              ...ghostBtn, ...flexCenter, gap: '2px',
              color: colors.primary, fontSize: font.size.xs, fontWeight: 600,
            }}>
              <ChevronLeft size={14} />
              뒤로
            </button>
            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>|</span>
            <button
              onClick={() => { setStep('large'); setSelectedLarge(null); setSelectedMedium(null); }}
              style={{
                ...ghostBtn, fontSize: font.size.xs,
                color: colors.primary,
                fontWeight: 500,
              }}
            >
              전체
            </button>
            {largeName && (
              <>
                <ChevronRight size={12} color={colors.text.muted} />
                <button
                  onClick={() => { setStep('medium'); setSelectedMedium(null); }}
                  style={{
                    ...ghostBtn, fontSize: font.size.xs,
                    color: step === 'medium' ? colors.text.primary : colors.primary,
                    fontWeight: 500,
                  }}
                >
                  {largeName}
                </button>
              </>
            )}
            {mediumName && (
              <>
                <ChevronRight size={12} color={colors.text.muted} />
                <span style={{ fontSize: font.size.xs, color: colors.text.primary, fontWeight: 500 }}>
                  {mediumName}
                </span>
              </>
            )}
          </div>
        )}

        {/* 리스트 영역 */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
          {isSearchMode ? (
            /* 검색 결과 */
            searchResults.length === 0 ? (
              <EmptyState message="일치하는 카테고리가 없어요" />
            ) : (
              searchResults.map(item => (
                <SearchResultItem
                  key={item.smallCode}
                  item={item}
                  isSelected={item.smallCode === currentFlat?.smallCode}
                  isAiRec={item.smallCode === aiRecommendedCode}
                  query={query.trim()}
                  onClick={() => handleSearchSelect(item)}
                />
              ))
            )
          ) : step === 'large' ? (
            /* 대분류 */
            CATEGORY_LARGE.map(cat => (
              <DrillItem
                key={cat.code}
                name={cat.name}
                count={CATEGORY_MEDIUM[cat.code]?.length}
                isSelected={cat.code === currentFlat?.largeCode}
                isAiRec={cat.code === aiRecFlat?.largeCode}
                onClick={() => handleLargeSelect(cat.code)}
              />
            ))
          ) : step === 'medium' && selectedLarge ? (
            /* 중분류 */
            (CATEGORY_MEDIUM[selectedLarge] ?? []).map(cat => (
              <DrillItem
                key={cat.code}
                name={cat.name}
                count={CATEGORY_SMALL[cat.code]?.length}
                isSelected={cat.code === currentFlat?.mediumCode}
                isAiRec={cat.code === aiRecFlat?.mediumCode}
                onClick={() => handleMediumSelect(cat.code)}
              />
            ))
          ) : step === 'small' && selectedMedium ? (
            /* 소분류 — 최종 선택 */
            (CATEGORY_SMALL[selectedMedium] ?? []).map(cat => (
              <DrillItem
                key={cat.code}
                name={cat.name}
                hasArrow={false}
                isSelected={cat.code === currentFlat?.smallCode}
                isAiRec={cat.code === aiRecommendedCode}
                onClick={() => handleSmallSelect(cat.code)}
              />
            ))
          ) : (
            <EmptyState message="카테고리를 불러올 수 없어요" />
          )}
        </div>

        {/* 현재 선택 표시 (하단 고정) */}
        {currentFlat && (
          <div style={{
            padding: `${spacing['3']} ${spacing['5']}`,
            borderTop: `1px solid ${colors.border.default}`,
            background: colors.bg.faint,
          }}>
            <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginBottom: '2px' }}>
              현재 선택
            </div>
            <div style={{ fontSize: font.size.sm, color: colors.text.primary, fontWeight: 600 }}>
              {currentFlat.path}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: `${spacing['10']} ${spacing['6']}`,
    color: colors.text.muted, gap: spacing['2'],
  }}>
    <FolderOpen size={32} strokeWidth={1.5} />
    <span style={{ fontSize: font.size.sm }}>{message}</span>
  </div>
);

export default CategorySelectModal;
