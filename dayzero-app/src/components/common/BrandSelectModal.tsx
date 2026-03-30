import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { AIIcon } from './AIIcon';
import { colors, font, radius, shadow, spacing, zIndex } from '../../design/tokens';

// ── Mock Qoo10 등록 브랜드 DB ───────────────────────────────────────────────

export interface Qoo10Brand {
  code: string;
  name: string;
}

export const QOO10_BRANDS: Qoo10Brand[] = [
  { code: 'B012345', name: 'TORRIDEN' },
  { code: 'B012346', name: 'ROUND LAB' },
  { code: 'B012347', name: 'ANUA' },
  { code: 'B012348', name: 'MEDIHEAL' },
  { code: 'B012349', name: 'innisfree' },
  { code: 'B012350', name: 'LANEIGE' },
  { code: 'B012351', name: 'COSRX' },
  { code: 'B012352', name: 'Dr.G' },
  { code: 'B012353', name: 'Sulwhasoo' },
  { code: 'B012354', name: 'ETUDE' },
  { code: 'B012355', name: 'MISSHA' },
  { code: 'B012356', name: 'SKINFOOD' },
  { code: 'B012357', name: "Tony Moly" },
  { code: 'B012358', name: 'CLIO' },
  { code: 'B012359', name: 'SOME BY MI' },
  { code: 'B023456', name: 'LocknLock' },
  { code: 'B023457', name: '3M' },
  { code: 'B023458', name: 'Persil' },
  { code: 'B034567', name: 'Crocs' },
  { code: 'B034568', name: '오뚜기' },
  { code: 'B034569', name: '남양유업' },
  { code: 'B034570', name: 'bibigo' },
  { code: 'B034571', name: '농심' },
  { code: 'B034572', name: '동원' },
  { code: 'B034573', name: 'SPAM' },
  { code: 'B034574', name: '삼양' },
  { code: 'B034575', name: 'T-fal' },
  { code: 'B034576', name: 'CUCKOO' },
  { code: 'B034577', name: 'Dyson' },
  { code: 'B034578', name: 'Philips' },
  { code: 'B034580', name: 'Nike' },
  { code: 'B034581', name: 'New Balance' },
  { code: 'B034582', name: 'Apple' },
  { code: 'B034583', name: 'Samsung' },
  { code: 'B034584', name: 'Logicool' },
  { code: 'B034585', name: 'Head & Shoulders' },
  { code: 'B034586', name: 'Downy' },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface BrandSelectModalProps {
  /** 현재 선택된 Qoo10 브랜드 코드 */
  currentCode?: string;
  /** AI가 매칭한 브랜드 코드 (추천 뱃지용) */
  aiMatchedCode?: string;
  /** 브랜드 선택 콜백 — null이면 "브랜드 없음" */
  onSelect: (brand: Qoo10Brand | null) => void;
  /** 모달 닫기 */
  onClose: () => void;
}

// ── 스타일 상수 ──────────────────────────────────────────────────────────────

const MODAL_WIDTH = 420;
const MODAL_MAX_H = 520;

const flexCenter: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
};

const ghostBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
};

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export const BrandSelectModal: React.FC<BrandSelectModalProps> = ({
  currentCode,
  aiMatchedCode,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? QOO10_BRANDS.filter(b => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q))
      : [...QOO10_BRANDS];
    return filtered.sort((a, b) => {
      // AI 추천 항상 최상단
      if (a.code === aiMatchedCode) return -1;
      if (b.code === aiMatchedCode) return 1;
      if (q) {
        const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStart - bStart;
      }
      return 0;
    });
  }, [query, aiMatchedCode]);

  const isNoneSelected = !currentCode;

  const highlight = (text: string) => {
    const q = query.trim();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: colors.primaryLight, color: colors.primary, borderRadius: radius.xs, padding: '0 1px' }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

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
            Qoo10 브랜드 선택
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
              placeholder="브랜드 검색 (예: TORRIDEN, 농심)"
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
          {query.trim() && (
            <div style={{ marginTop: spacing['1'], fontSize: font.size.xs, color: colors.text.muted }}>
              {results.length}개 결과
            </div>
          )}
        </div>

        {/* 리스트 */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
          {/* 브랜드 없음 옵션 */}
          <button
            onClick={() => { onSelect(null); onClose(); }}
            style={{
              ...flexCenter, justifyContent: 'space-between',
              width: '100%', padding: `12px ${spacing['5']}`,
              background: isNoneSelected ? colors.primaryLight : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              borderBottom: `1px solid ${colors.border.default}`,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (!isNoneSelected) e.currentTarget.style.background = colors.bg.faint; }}
            onMouseLeave={e => { if (!isNoneSelected) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{
              fontSize: font.size.sm, fontWeight: isNoneSelected ? 700 : 500,
              color: isNoneSelected ? colors.primary : colors.text.tertiary,
            }}>
              브랜드 없음
            </span>
            {isNoneSelected && <Check size={16} color={colors.primary} style={{ flexShrink: 0 }} />}
          </button>

          {/* 브랜드 리스트 */}
          {results.map(brand => {
            const isSelected = brand.code === currentCode;
            const isAiRec = brand.code === aiMatchedCode;
            return (
              <button
                key={brand.code}
                onClick={() => { onSelect(brand); onClose(); }}
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
                <div style={{ ...flexCenter, gap: spacing['2'], minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: font.size.sm, fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? colors.primary : colors.text.primary,
                  }}>
                    {highlight(brand.name)}
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
                {isSelected && <Check size={16} color={colors.primary} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}

          {/* 검색 결과 없음 */}
          {query.trim() && results.length === 0 && (
            <div style={{
              padding: `${spacing['10']} ${spacing['5']}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: font.size.base, color: colors.text.muted, marginBottom: spacing['1'] }}>
                "{query}"에 해당하는 브랜드가 없어요
              </div>
              <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>
                Qoo10에 등록된 브랜드만 검색할 수 있어요
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
