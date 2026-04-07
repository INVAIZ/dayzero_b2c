/**
 * DayZero Design Tokens
 *
 * UI 작업 시 반드시 이 파일의 값을 사용한다.
 * 하드코딩된 색상·간격·폰트 크기는 금지.
 *
 * 사용법:
 *   import { colors, font, radius, spacing } from '@/design/tokens';
 *   style={{ color: colors.text.primary, fontSize: font.size.md }}
 */

// ── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  /** 순수 흰색. 버튼 텍스트, 아이콘 색상 등 */
  white: '#FFFFFF',

  /** 브랜드 파란색. CTA 버튼, 활성 상태, 링크 */
  primary: '#3182F6',
  /** 프라이머리 다크. CTA 버튼 hover 상태 */
  primaryDark: '#2563EB',
  /** 연한 파란색 배경. 선택된 필터·탭 배경 */
  primaryLight: '#EFF6FF',
  /** 파란색 테두리. AI 버튼·선택 상태 테두리 */
  primaryBorder: '#C7DCFD',
  /** 파란색 호버 배경. 버튼 호버 */
  primaryHover: '#DCEEFE',
  /** 연한 파란색 테두리. 정보 카드 테두리 */
  primaryLightBorder: '#BFDBFE',

  /** 성공. 활성 토글, 완료 상태 */
  success: '#00C853',
  /** 연한 성공 배경. 완료 태그·뱃지 */
  successLight: '#E8F5E9',
  /** 성공 테두리. 수익 카드 테두리 */
  successBorder: '#BBF0D4',
  /** 아주 연한 성공 배경. 수익 카드 배경 */
  successBg: '#F6FEF9',
  /** 성공 강조. 수익/이익 금액 */
  successDark: '#00884A',
  /** 성공 (대체). 수익/상승 지표 */
  successAlt: '#3ED4A4',

  /** 에러·위험. 입력 오류, 삭제 액션 */
  danger: '#F04452',
  /** 진한 에러 텍스트. 위험 피드백 메시지 */
  dangerDark: '#DC2626',
  /** 연한 에러 배경. 칩·배지 테두리 */
  dangerLight: '#FDE2E4',
  /** 아주 연한 에러 배경. 실패 아이템 행 배경 */
  dangerBg: '#FEF0F1',

  /** 경고 */
  warning: '#FBBC05',
  /** 경고 배경 */
  warningLight: '#FFFBEB',
  /** 경고 테두리 */
  warningBorder: '#FDE68A',
  /** 경고 아이콘 */
  warningIcon: '#D97706',
  /** 경고 텍스트 */
  warningTextDark: '#92400E',

  /** 주황색. 재고 없음, 일시정지 상태 */
  orange: '#FF9500',
  /** 주황색 아이콘/텍스트. 마진 경고, 슬라이더 */
  orangeIcon: '#E67E22',
  /** 연한 주황색 배경. 재고 없음 상태 뱃지 */
  orangeLight: '#FFF4E0',
  /** 아주 연한 주황색 배경. 주의 카드 */
  orangeBg: '#FFF8EE',
  /** 주황색 테두리. 주의 카드 테두리 */
  orangeBorder: '#FFD99A',

  /** 예약 상태 배경 (보라) */
  scheduledBg: '#F5F3FF',
  /** 예약 상태 아이콘 (보라) */
  scheduledIcon: '#8B5CF6',

  /** 다크 호버. FAB 버튼 호버 등 */
  darkHover: '#2D3540',

  text: {
    /** 제목, 강조 텍스트 */
    primary: '#191F28',
    /** 본문, 일반 레이블 */
    secondary: '#4E5968',
    /** 부가 설명, 메타 정보 */
    tertiary: '#6B7684',
    /** 비활성, 플레이스홀더 보조 */
    muted: '#8B95A1',
    /** 입력 placeholder */
    placeholder: '#C4CAD4',
    /** 완전 비활성 */
    disabled: '#B0B8C1',
  },

  bg: {
    /** 페이지 배경 */
    page: '#F9FAFB',
    /** 카드·모달·패널 배경 */
    surface: '#FFFFFF',
    /** 보조 배경. 태그, 뱃지, 인풋 배경 */
    subtle: '#F2F4F6',
    /** 아주 연한 배경. 콜아웃·섹션 구분 */
    faint: '#F8F9FA',
    /** 인포 박스 배경 */
    info: '#F0F6FF',
    /** 읽지 않은 알림 배경 */
    unread: '#F8FAFF',
  },

  border: {
    /** 기본 구분선, 카드 테두리 */
    default: '#E5E8EB',
    /** 연한 구분선 */
    light: '#D1D6DB',
  },
} as const;

// ── Typography ───────────────────────────────────────────────────────────────

export const font = {
  family: {
    sans: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  size: {
    /** 10px – 아주 작은 캡션, 뱃지 숫자 */
    '2xs': '10px',
    /** 11px – 작은 태그, 보조 뱃지 */
    '2xs+': '11px',
    /** 12px – 태그, 캡션 */
    xs: '12px',
    /** 13px – 보조 텍스트, 메타 */
    sm: '13px',
    /** 14px – 본문 보조, 설명 */
    md: '14px',
    /** 15px – 본문 기본 */
    base: '15px',
    /** 16px – 온보딩 CTA 버튼, 소제목 */
    'base+': '16px',
    /** 18px – 섹션 제목 */
    lg: '18px',
    /** 20px – 인트로 헤딩, 서브 타이틀 */
    'lg+': '20px',
    /** 22px – 페이지 서브 타이틀 */
    xl: '22px',
    /** 24px – 스텝 타이틀, 온보딩 제목 */
    'xl+': '24px',
    /** 26px – 온보딩 메인 타이틀 */
    '2xl-': '26px',
    /** 28px – 페이지 메인 타이틀 */
    '2xl': '28px',
    /** 32px – 대형 숫자 표시 */
    '3xl': '32px',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: '1.3',
    normal: '1.5',
    relaxed: '1.7',
  },
} as const;

// ── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  /** 2px – 프로그레스 바 내부 */
  '2xs': '2px',
  /** 4px – 인라인 배지, 작은 태그 */
  xs: '4px',
  /** 6px – 태그, 뱃지 */
  sm: '6px',
  /** 8px – 버튼, 인풋, 작은 카드 */
  md: '8px',
  /** 10px – 이미지 썸네일 */
  img: '10px',
  /** 12px – 카드, 드롭다운 */
  lg: '12px',
  /** 16px – 모달, 패널 */
  xl: '16px',
  /** 9999px – 토글, 풀 라운드 */
  full: '9999px',
} as const;

// ── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
} as const;

// ── Shadows ──────────────────────────────────────────────────────────────────

export const shadow = {
  /** 카드, 드롭다운 */
  sm: '0 1px 4px rgba(0,0,0,0.06)',
  /** 모달, 패널 */
  md: '0 4px 16px rgba(0,0,0,0.10)',
  /** 플로팅 버튼, 팝오버 */
  lg: '0 8px 32px rgba(0,0,0,0.14)',
} as const;

// ── Z-index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 500,
  nav: 1000,
  modal: 2000,
  toast: 3000,
} as const;
