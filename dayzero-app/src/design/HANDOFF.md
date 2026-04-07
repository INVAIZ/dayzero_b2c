# DayZero B2C 개발자 핸드오프 가이드

> **목적**: 프로토타입의 디자인과 UX를 실제 개발에서 정확히 재현하기 위한 최종 참조 문서
> **대상**: 프론트엔드 개발자

---

## 디자인 시스템 문서 구조

```
dayzero-app/src/design/
├── tokens.ts          ← 모든 디자인 값의 단일 소스 (색상, 폰트, 간격, 반경, 그림자, z-index)
├── animations.ts      ← CSS 키프레임 애니메이션 정의
├── DESIGN_SYSTEM.md   ← UI 패턴 라이브러리 (레이아웃, 폼, 버튼, 피드백, 모션 등)
├── COMPONENT_API.md   ← 공통 컴포넌트 Props/상태/변형 명세
└── HANDOFF.md         ← 이 문서. 개발자 핸드오프 가이드
```

**읽는 순서**: tokens.ts → DESIGN_SYSTEM.md → COMPONENT_API.md → 이 문서

---

## 1. 토큰 사용법

### Import

```tsx
import { colors, font, radius, spacing, shadow, zIndex } from '@/design/tokens';
import { ANIM } from '@/design/animations';
```

### 토큰 전체 레퍼런스

#### 색상 — 브랜드 & 상태

| 토큰 | 값 | 용도 |
|------|---|------|
| `colors.white` | #FFFFFF | 버튼 텍스트, 아이콘 (컬러 배경 위) |
| `colors.primary` | #3182F6 | CTA 버튼, 활성 상태, 링크 |
| `colors.primaryDark` | #2563EB | CTA 버튼 hover |
| `colors.primaryLight` | #EFF6FF | 선택된 필터/탭 배경 |
| `colors.primaryBorder` | #C7DCFD | AI 버튼/선택 상태 테두리 |
| `colors.primaryHover` | #DCEEFE | 버튼 호버 배경 |
| `colors.primaryLightBorder` | #BFDBFE | 정보 카드 테두리 |
| `colors.success` | #00C853 | 활성 토글, 완료 상태 |
| `colors.successLight` | #E8F5E9 | 완료 태그/뱃지 배경 |
| `colors.successBorder` | #BBF0D4 | 수익 카드 테두리 |
| `colors.successBg` | #F6FEF9 | 수익 카드 배경 |
| `colors.successDark` | #00884A | 수익/이익 금액 강조 |
| `colors.successAlt` | #3ED4A4 | 수익/상승 지표 |
| `colors.danger` | #F04452 | 에러, 삭제 액션 |
| `colors.dangerDark` | #DC2626 | 진한 에러 텍스트 |
| `colors.dangerLight` | #FDE2E4 | 에러 칩/뱃지 배경 |
| `colors.dangerBg` | #FEF0F1 | 실패 아이템 행 배경 |
| `colors.warning` | #FBBC05 | 경고 |
| `colors.warningLight` | #FFFBEB | 경고 배경 |
| `colors.warningBorder` | #FDE68A | 경고 테두리 |
| `colors.warningIcon` | #D97706 | 경고 아이콘 |
| `colors.warningTextDark` | #92400E | 경고 텍스트 |
| `colors.orange` | #FF9500 | 재고 없음, 일시정지 상태 |
| `colors.orangeIcon` | #E67E22 | 마진 경고, 슬라이더 |
| `colors.orangeLight` | #FFF4E0 | 재고 없음 상태 뱃지 배경 |
| `colors.orangeBg` | #FFF8EE | 주의 카드 배경 |
| `colors.orangeBorder` | #FFD99A | 주의 카드 테두리 |
| `colors.scheduledBg` | #F5F3FF | 예약 상태 배경 (보라) |
| `colors.scheduledIcon` | #8B5CF6 | 예약 상태 아이콘 (보라) |
| `colors.darkHover` | #2D3540 | FAB 버튼 호버 |

#### 색상 — 텍스트

| 토큰 | 값 | 용도 |
|------|---|------|
| `colors.text.primary` | #191F28 | 제목, 강조 텍스트 |
| `colors.text.secondary` | #4E5968 | 본문, 일반 레이블 |
| `colors.text.tertiary` | #6B7684 | 부가 설명, 메타 |
| `colors.text.muted` | #8B95A1 | 비활성, 플레이스홀더 보조 |
| `colors.text.placeholder` | #C4CAD4 | 입력 placeholder |
| `colors.text.disabled` | #B0B8C1 | 완전 비활성 |

#### 색상 — 배경

| 토큰 | 값 | 용도 |
|------|---|------|
| `colors.bg.page` | #F9FAFB | 페이지 배경 |
| `colors.bg.surface` | #FFFFFF | 카드/모달/패널 배경 |
| `colors.bg.subtle` | #F2F4F6 | 태그, 뱃지, 인풋 배경 |
| `colors.bg.faint` | #F8F9FA | 콜아웃, 섹션 구분, hover |
| `colors.bg.info` | #F0F6FF | 인포 박스 배경 |
| `colors.bg.unread` | #F8FAFF | 읽지 않은 알림 배경 |

#### 색상 — 테두리

| 토큰 | 값 | 용도 |
|------|---|------|
| `colors.border.default` | #E5E8EB | 기본 구분선, 카드 테두리 |
| `colors.border.light` | #D1D6DB | 연한 구분선 |

#### 타이포그래피

| 토큰 | 값 | 용도 |
|------|---|------|
| `font.family.sans` | Pretendard, ... | 기본 폰트 (전역) |
| `font.size['2xs']` | 10px | 아주 작은 캡션 |
| `font.size['2xs+']` | 11px | 작은 태그, 뱃지 |
| `font.size.xs` | 12px | 태그, 캡션 |
| `font.size.sm` | 13px | 보조 텍스트, 메타 |
| `font.size.md` | 14px | 본문 보조 |
| `font.size.base` | 15px | 본문 기본 |
| `font.size.lg` | 18px | 섹션 제목 |
| `font.size.xl` | 22px | 서브 타이틀 |
| `font.size['2xl']` | 28px | 페이지 타이틀 |
| `font.weight.regular` | 400 | 본문 |
| `font.weight.medium` | 500 | 보조 강조 |
| `font.weight.semibold` | 600 | 캡션, 버튼 |
| `font.weight.bold` | 700 | 제목, CTA |
| `font.lineHeight.tight` | 1.3 | 제목 |
| `font.lineHeight.normal` | 1.5 | 본문 |
| `font.lineHeight.relaxed` | 1.7 | 긴 설명 |

#### 간격 (spacing)

| 토큰 | 값 |
|------|---|
| `spacing['1']` | 4px |
| `spacing['2']` | 8px |
| `spacing['3']` | 12px |
| `spacing['4']` | 16px |
| `spacing['5']` | 20px |
| `spacing['6']` | 24px |
| `spacing['8']` | 32px |
| `spacing['10']` | 40px |
| `spacing['12']` | 48px |

#### 반경 (radius)

| 토큰 | 값 | 용도 |
|------|---|------|
| `radius.xs` | 4px | 인라인 뱃지, 작은 태그 |
| `radius.sm` | 6px | 태그, 뱃지 |
| `radius.md` | 8px | 버튼, 인풋 |
| `radius.img` | 10px | 이미지 썸네일 |
| `radius.lg` | 12px | 카드, 드롭다운 |
| `radius.xl` | 16px | 모달, 패널 |
| `radius.full` | 9999px | 토글, 풀 라운드 |

---

## 2. 화면별 컴포넌트 맵

### 레이아웃 유형

| 유형 | 해당 화면 | 특징 |
|------|----------|------|
| **OnboardingLayout** | Qoo10 연결, 기본정보, 판매설정, 프로그램설치 | 스텝 인디케이터 + 중앙 콘텐츠 |
| **MainLayout** | 소싱 메인, 자동소싱, URL소싱, 수집된 상품, 등록 결과, 상품 상세 | Sidebar 280px + 메인 (padding 48px 64px, max 1200px) |
| **Sidebar 독립** | 편집 상세, 등록 편집, 설정 | Sidebar만 + 풀 콘텐츠 |
| **독립** | 로그인 | 레이아웃 없음 |

### 화면별 상세 맵

| 화면 | 레이아웃 | 공통 컴포넌트 | 주요 UI 패턴 |
|------|---------|-------------|-------------|
| **Qoo10 연결** | OnboardingLayout | OnboardingLayout | 폼 인풋, 툴팁, 가이드 블록, CTA 버튼 |
| **기본 정보** | OnboardingLayout | OnboardingLayout | 멀티스텝 폼, 드롭다운, 주소 입력, 체크박스 |
| **판매 설정** | OnboardingLayout | OnboardingLayout | 가격 계산기, 드롭다운, 수익 시뮬레이션, 섹션 카드 |
| **프로그램 설치** | OnboardingLayout | OnboardingLayout, ANIM | Phase 전환 (idle/waiting/done), 외부 링크 |
| **소싱 메인** | MainLayout | ConfirmModal, UrlSourcingContent | 탭 전환, 필터 칩, 토글, 삭제 모달, 한도 모달 |
| **자동 소싱** | MainLayout | — | 멀티스텝 설정 폼, Provider 선택 그리드 |
| **URL 소싱** | MainLayout | — | textarea, 실시간 검증 패널, 프로그레스 바, 아이템 상태 |
| **수집된 상품** | MainLayout | ConfirmModal, Checkbox, ProductListItem, BulkActionBar, TranslationModal | 탭 필터, 검색, 정렬, 체크박스 선택, 일괄 작업, 번역 모달 |
| **편집 상세** | Sidebar | ConfirmModal, EditingTabBar, 4개 편집 탭 | 탭바 (basic/price/thumbnail/detail) |
| **등록 결과** | MainLayout | ConfirmModal(8), RegistrationProgressSection, AllProductsTable, MonitoringStatusTabs, MonitoringHistoryModal 등 | Provider 필터, 진행 섹션, 테이블, 모니터링 탭 |
| **등록 편집** | Sidebar | ConfirmModal, EditingTabBar, 4개 편집 탭 | 편집 상세와 동일 탭 재사용 |
| **상품 상세** | MainLayout | ConfirmModal(5), PriceHistorySection, InfoCard, AlertCard, ANIM | 이전/다음 네비, 정보 카드, 모니터링 토글, 가격 히스토리 |
| **설정** | Sidebar | — | 탭 전환 (sales/qoo10/account), 폼, 가격 시뮬레이터, 토글, useBlocker |
| **로그인** | 독립 | LoginForm, SignupForm | 로그인/회원가입 모드 전환, 인라인 토스트 |

### 공통 컴포넌트 사용 빈도

| 컴포넌트 | 사용 화면 수 |
|---------|:----------:|
| `ConfirmModal` | 7 |
| `MainLayout` | 6 |
| `OnboardingLayout` | 4 |
| `Sidebar` | 3 |
| `EditingTabBar` + 편집 탭 4종 | 2 |
| `Checkbox` | 1+ (하위 컴포넌트에서 추가 사용) |

---

## 3. Do / Don't 가이드

### 색상

```tsx
// DO
style={{ color: colors.text.primary }}
style={{ background: colors.bg.surface }}
style={{ borderColor: colors.border.default }}

// DON'T
style={{ color: '#191F28' }}
style={{ background: '#FFFFFF' }}
style={{ borderColor: '#E5E8EB' }}
```

### 타이포그래피

```tsx
// DO
style={{ fontSize: font.size.base, fontWeight: font.weight.bold }}

// DON'T
style={{ fontSize: '15px', fontWeight: 700 }}
```

### 간격

```tsx
// DO
style={{ padding: spacing['4'], gap: spacing['3'] }}

// DON'T
style={{ padding: '16px', gap: '12px' }}
```

### 반경

```tsx
// DO
style={{ borderRadius: radius.lg }}

// DON'T
style={{ borderRadius: '12px' }}
```

### 컴포넌트 재사용

```tsx
// DO — 확인 모달이 필요할 때
<ConfirmModal isOpen={showDelete} onClose={() => setShowDelete(false)}
  onConfirm={handleDelete} title="삭제하시겠습니까?"
  description="이 작업은 되돌릴 수 없습니다." type="danger" />

// DON'T — 직접 모달 구현
<div className="custom-modal">
  <h2>삭제하시겠습니까?</h2>
  ...
</div>
```

```tsx
// DO — 토스트 발행
useToastStore.getState().addToast({ message: '저장 완료' });

// DON'T — 커스텀 토스트 구현
setState({ showToast: true, toastMessage: '저장 완료' });
```

### 애니메이션

```tsx
// DO — 기존 키프레임 사용
import { ANIM } from '@/design/animations';
<style>{ANIM.fadeInUp + ANIM.slideUp}</style>

// DON'T — 인라인 키프레임 정의
const fadeIn = `@keyframes myFadeIn { ... }`;
```

### 버튼

```tsx
// DO — Primary 버튼
style={{
  background: colors.primary,
  color: colors.white,
  borderRadius: radius.md,
  fontSize: font.size.md,
  fontWeight: font.weight.bold,
}}

// DON'T
style={{
  background: '#3182F6',
  color: 'white',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 700,
}}
```

---

## 4. 구현 체크리스트

새 화면이나 컴포넌트를 구현할 때 아래를 순서대로 확인합니다:

### 시작 전

- [ ] `DESIGN_SYSTEM.md`에서 해당 패턴이 이미 있는지 확인
- [ ] `COMPONENT_API.md`에서 재사용 가능한 공통 컴포넌트 확인
- [ ] 레이아웃 유형 결정 (MainLayout / OnboardingLayout / Sidebar / 독립)

### 구현 중

- [ ] 모든 색상은 `colors.*` 토큰 사용 (hex 하드코딩 금지)
- [ ] 모든 폰트 크기는 `font.size.*` 사용
- [ ] 모든 간격은 `spacing['*']` 사용
- [ ] 모든 반경은 `radius.*` 사용
- [ ] 애니메이션은 `ANIM.*` 키프레임만 사용
- [ ] hover 상태에 transition 속성 포함
- [ ] 폰트는 Pretendard만 사용

### 구현 후

- [ ] 하드코딩된 hex 값이 없는지 확인 (`grep -r "'#" src/`)
- [ ] 모든 인터랙티브 요소에 hover/focus 상태가 있는지 확인
- [ ] 모달은 backdrop blur + fadeIn/slideUp 애니메이션 포함
- [ ] 토스트는 `useToastStore` 사용

---

## 5. 기술 스택 참고

| 항목 | 기술 |
|------|------|
| 프레임워크 | React + TypeScript |
| 라우팅 | React Router v6 |
| 상태 관리 | Zustand |
| 스타일링 | Inline styles (CSS-in-JS, tokens.ts 기반) |
| 아이콘 | Lucide React |
| 폰트 | Pretendard |
| 번들러 | Vite |

### 스타일링 방식

이 프로젝트는 **인라인 스타일** 기반입니다. CSS 파일이나 styled-components가 아닌, `style={{ }}` 속성에 `tokens.ts`의 값을 직접 사용합니다.

```tsx
// 이 프로젝트의 스타일링 패턴
import { colors, font, radius, spacing } from '@/design/tokens';

<div style={{
  background: colors.bg.surface,
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.xl,
  padding: spacing['6'],
}}>
```

### Zustand 스토어 목록

| 스토어 | 용도 |
|--------|------|
| `useToastStore` | 토스트 알림 관리 |
| `useSourcingStore` | 소싱 상품 목록/상태 |
| `useRegistrationStore` | 등록 상품 목록/상태 |
| `useNotificationStore` | 알림 읽음/안읽음 상태 |
| `useOnboardingStore` | 온보딩 진행 상태 |
