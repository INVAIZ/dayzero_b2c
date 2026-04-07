# DayZero 공통 컴포넌트 API 명세

> **목적**: 개발자가 각 컴포넌트의 Props, 상태, 변형을 빠르게 파악하여 정확히 재구현할 수 있도록 한다.
> **참조**: 토큰 → `tokens.ts` | 패턴 → `DESIGN_SYSTEM.md` | 애니메이션 → `animations.ts`

---

## 컴포넌트 선택 가이드

| 상황 | 사용할 컴포넌트 |
|------|----------------|
| 삭제/위험 동작 확인 | `ConfirmModal` (type='danger') |
| 정보 확인 다이얼로그 | `ConfirmModal` (type='info') |
| 완료/에러 알림 | `useToastStore` → `ToastContainer` |
| 상품 선택 체크박스 | `Checkbox` |
| 작업 상태 아이콘 | `StatusIcon` |
| 진행률 표시 | `ProgressBar` |
| 빈 목록 안내 | `EmptyState` |
| AI/크롤링 출처 표시 | `SourceTag` |
| AI 아이콘 단독 사용 | `AIIcon` |
| Qoo10 카테고리 선택 | `CategorySelectModal` |
| Qoo10 브랜드 선택 | `BrandSelectModal` |
| 알림 패널 (가격/품절) | `NotificationPanel` (전역, MainLayout에 포함) |
| 요소 위 툴팁 | `FloatingTooltip` |
| 앱 기본 레이아웃 | `MainLayout` (Sidebar + 콘텐츠) |
| 온보딩 레이아웃 | `OnboardingLayout` (스테퍼 + 콘텐츠) |

---

## 1. ConfirmModal

- **파일**: `components/common/ConfirmModal.tsx`
- **용도**: 사용자에게 확인/취소를 묻는 모달 다이얼로그

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `isOpen` | `boolean` | O | - | 모달 표시 여부 |
| `onClose` | `() => void` | O | - | 닫기/취소 콜백 |
| `onConfirm` | `() => void` | O | - | 확인 버튼 클릭 콜백 |
| `title` | `string` | O | - | 모달 제목 |
| `description` | `React.ReactNode` | O | - | 본문 설명 (문자열 또는 JSX) |
| `confirmText` | `string` | | `'삭제하기'` | 확인 버튼 텍스트 |
| `cancelText` | `string` | | `'취소'` | 취소 버튼 텍스트 |
| `type` | `'danger' \| 'info'` | | `'danger'` | 모달 톤 |

### 변형 (Variants)

| type | 아이콘 배경 | 아이콘/확인 버튼 색상 | 용도 |
|------|-----------|---------------------|------|
| `danger` | `colors.dangerBg` | `colors.danger` (빨간) | 삭제, 위험 동작 |
| `info` | `colors.primaryLight` | `colors.primary` (파란) | 정보 확인 |

### 상태

| 상태 | 설명 |
|------|------|
| closed | `isOpen=false` → `null` 반환 |
| open | backdrop(rgba 0.4 + blur 4px) + slideUp 애니메이션 |
| hover (닫기) | 배경 → `colors.bg.subtle` |
| hover (취소) | 배경 → `colors.border.default` |
| hover (확인) | opacity → 0.9 |

### 주요 토큰

`colors.bg.surface`, `colors.text.primary`, `colors.text.tertiary`, `colors.danger`, `colors.dangerBg`, `colors.primary`, `colors.primaryLight`, `colors.white`, `radius.xl`, `shadow.lg`, `zIndex.modal`

---

## 2. ToastContainer

- **파일**: `components/common/ToastContainer.tsx`
- **용도**: 우하단 말풍선 형태 토스트 알림 (zustand `useToastStore` 연동)

### Props

Props 없음. 내부에서 `useToastStore`로 토스트 목록 구독.

### 사용법

```tsx
import { useToastStore } from '../../store/useToastStore';

// 토스트 발행
useToastStore.getState().addToast({ message: '저장 완료', details: '3건 저장됨' });
```

### 토스트 아이템 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 고유 식별자 |
| `message` | `string` | 메인 메시지 |
| `details` | `string?` | 부가 설명 (선택) |

### 스타일

- 위치: fixed, bottom 96px, right 24px
- 말풍선 형태: borderRadius `16px 16px 4px 16px` + 우하단 꼬리
- 애니메이션: `toastBubbleUp` (scale 0.9→1 + translateY 16→0)

---

## 3. Checkbox

- **파일**: `components/common/Checkbox.tsx`
- **용도**: 커스텀 체크박스 (20×20)

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `checked` | `boolean` | O | - | 체크 상태 |
| `onClick` | `() => void` | O | - | 토글 콜백 |

### 상태

| 상태 | 배경 | 테두리 | 아이콘 |
|------|------|--------|--------|
| unchecked | `colors.bg.surface` | `colors.border.light` (2px) | 없음 |
| checked | `colors.primary` | `colors.primary` (2px) | 흰색 체크마크 SVG |

### 주요 토큰

`colors.primary`, `colors.border.light`, `colors.bg.surface`, `radius.xs` (4px)

---

## 4. StatusIcon

- **파일**: `components/common/StatusComponents.tsx`
- **용도**: 작업 상태 표시 아이콘 (36×36, borderRadius 10px)

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `status` | `'running' \| 'completed' \| 'failed' \| 'processing' \| 'queued' \| 'scheduled'` | O | - | 작업 상태 |

### 변형

| status | 배경색 | 아이콘 | 아이콘 색상 |
|--------|--------|--------|-----------|
| `completed` | `colors.successBg` | CheckCircle2 | `colors.success` |
| `failed` | `colors.dangerBg` | X | `colors.danger` |
| `scheduled` | `colors.scheduledBg` | Zap (filled) | `colors.scheduledIcon` |
| `running` / `processing` / `queued` | `colors.primaryLight` | Loader2 (spin) | `colors.primary` |

---

## 5. ProgressBar

- **파일**: `components/common/StatusComponents.tsx`
- **용도**: 수평 진행 바 (높이 4px)

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `value` | `number` | O | - | 현재 진행 값 |
| `max` | `number` | O | - | 최대 값 |

### 스타일

- 트랙: `colors.bg.subtle`, height 4px, borderRadius 2px
- 바: `colors.primary`, transition `width 0.4s ease`

---

## 6. EmptyState

- **파일**: `components/common/StatusComponents.tsx`
- **용도**: 빈 목록 안내 (PackageOpen 아이콘 + 텍스트)

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `label` | `string` | O | - | 안내 메시지 |

### 스타일

- 아이콘: PackageOpen (40px), `colors.border.default`
- 텍스트: `font.size.sm`, `colors.text.muted`
- 레이아웃: flex column center, padding 40px, gap 12px

---

## 7. SourceTag

- **파일**: `components/common/SourceTag.tsx`
- **용도**: 데이터 출처 태그 뱃지 (AI/크롤링)

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `source` | `'crawled' \| 'ai' \| 'manual'` | O | - | 데이터 출처 |
| `size` | `number` | | `10` | 아이콘 크기 (px) |

### 변형

| source | 배경 | 텍스트/아이콘 | 표시 |
|--------|------|-------------|------|
| `ai` | `colors.primary` | `colors.white` + AIIcon | 파란 태그 |
| `crawled` | `colors.border.light` | `colors.text.secondary` + Globe | 회색 태그 |
| `manual` | - | - | 렌더링 안 됨 |

### 추가 Export

- `SOURCE_TAG_STYLES`: 외부에서 스타일만 참조할 때 사용
- `SourceType`: 타입 정의

---

## 8. AIIcon

- **파일**: `components/common/AIIcon.tsx`
- **용도**: AI 스파클 SVG 아이콘

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `size` | `number` | | `14` | 아이콘 크기 (px) |
| `color` | `string` | | `colors.primary` | fill 색상 |

---

## 9. CategorySelectModal

- **파일**: `components/common/CategorySelectModal.tsx`
- **용도**: Qoo10 카테고리 3단계 드릴다운 + 검색 선택 모달

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `currentCode` | `string` | | - | 현재 선택된 소분류 코드 |
| `currentPath` | `string` | | - | 현재 카테고리 경로 (fallback 매칭) |
| `aiRecommendedCode` | `string` | | - | AI 추천 소분류 코드 |
| `onSelect` | `(item: CategoryFlat) => void` | O | - | 카테고리 선택 콜백 |
| `onClose` | `() => void` | O | - | 모달 닫기 콜백 |

### 상태

| 상태 | 설명 |
|------|------|
| 검색 모드 | query 입력 시 자동 전환, 전체 소분류 검색 |
| 드릴다운 모드 | 대분류 → 중분류 → 소분류 3단계 |
| AI 추천 | `AI 추천` 뱃지 표시, 리스트 최상단 정렬 |
| 선택됨 | 배경 `primaryLight` + 체크 아이콘 |
| hover | 배경 → `bg.faint` |

### 내부 상태

`query` (검색어), `step` (드릴다운 단계), `selectedLarge`, `selectedMedium`

---

## 10. BrandSelectModal

- **파일**: `components/common/BrandSelectModal.tsx`
- **용도**: Qoo10 브랜드 검색/선택 모달 ("브랜드 없음" 옵션 포함)

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `currentCode` | `string` | | - | 현재 선택된 브랜드 코드 |
| `aiMatchedCode` | `string` | | - | AI 매칭 브랜드 코드 |
| `onSelect` | `(brand: Qoo10Brand \| null) => void` | O | - | 선택 콜백 (null=브랜드 없음) |
| `onClose` | `() => void` | O | - | 닫기 콜백 |

### 상태

CategorySelectModal과 동일 패턴 (검색 + AI 추천 + 선택 + hover)

---

## 11. NotificationPanel

- **파일**: `components/common/NotificationPanel.tsx`
- **용도**: 우하단 FAB + 가격 변동/품절/재입고 알림 사이드 패널

### Props

Props 없음. `useRegistrationStore`, `useNotificationStore`, `useToastStore` 사용.

### 구성 요소

| 요소 | 설명 |
|------|------|
| **FAB** | 56×56 원형 버튼, 우하단 고정. `colors.text.primary` 배경, hover → `colors.darkHover`. 미읽음 뱃지(최대 9+) |
| **패널** | 480px 너비 사이드 패널. slideUp 애니메이션 |
| **필터 탭** | 전체 / 가격 변동 / 품절 / 재입고. 각 탭에 미읽음 카운트 |
| **알림 아이템** | 미읽음: `bg.unread` / 읽음: 투명 / hover: `bg.faint` |

### 알림 아이콘 변형

| 타입 | 아이콘 | 아이콘 배경 | 아이콘 색상 |
|------|--------|-----------|-----------|
| negative_margin | AlertTriangle | `colors.dangerLight` | `colors.danger` |
| out_of_stock | PackageX | `colors.dangerLight` | `colors.danger` |
| out_of_stock (자동중지) | PauseCircle | `colors.orangeLight` | `colors.orange` |
| restocked | PackageCheck | `colors.successLight` | `colors.success` |

### 내부 상태

`isOpen`, `activeTab` (FilterTab), `hoveredId` (dismiss 버튼 표시용)

---

## 12. FloatingTooltip

- **파일**: `components/common/FloatingTooltip.tsx`
- **용도**: 뷰포트 경계 자동 보정 툴팁

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `data` | `TooltipData` | O | - | 위치(x, y)와 내용(content) |

### TooltipData

| 필드 | 타입 | 설명 |
|------|------|------|
| `x` | `number` | 화면 x좌표 |
| `y` | `number` | 화면 y좌표 |
| `content` | `React.ReactNode` | 툴팁 내용 |

### 스타일

- 배경: `colors.text.primary` (다크), 글자: `colors.bg.surface` (흰)
- borderRadius: `radius.lg`, padding: `spacing['3'] spacing['4']`
- 뷰포트 경계 자동 보정 (우측/하단 넘침 시 위치 재계산)

---

## 13. GlobalNavigationBar

- **파일**: `components/common/GlobalNavigationBar.tsx`
- **용도**: 상단 고정 내비게이션 바 (현재 미사용 — Sidebar로 대체됨)
- **비고**: Sidebar 기반 레이아웃으로 전환되어 현재 어디에서도 import하지 않음. 제거 검토 필요.

---

## 14. MainLayout

- **파일**: `components/layout/MainLayout.tsx`
- **용도**: Sidebar(280px) + 메인 콘텐츠 + ToastContainer + NotificationPanel 조합

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `children` | `ReactNode` | O | - | 메인 콘텐츠 영역 |

### 레이아웃 구조

```
<div style={{ display: flex, minHeight: 100vh }}>
  <Sidebar />                          ← 280px 고정
  <main style={{                       ← flex: 1
    padding: 48px 64px,
    maxWidth: 1200px,
    margin: 0 auto,
    background: colors.bg.surface
  }}>
    {children}
  </main>
  <ToastContainer />
  <NotificationPanel />
</div>
```

---

## 15. Sidebar

- **파일**: `components/layout/Sidebar.tsx`
- **용도**: 좌측 고정 사이드바 내비게이션

### Props

Props 없음. `useSourcingStore`, `useNavigate`, `useLocation` 사용.

### 메뉴 구조

| 메뉴 | 경로 | 아이콘 |
|------|------|--------|
| 수집하기 | `/sourcing` | Search |
| 수집된 상품 | `/editing` | Package + 뱃지 |
| 판매 중인 상품 | `/registration/result` | ShoppingBag |
| 설정 | `/settings` | Settings (접힘/펼침) |
| └ 판매 설정 | `/settings#margin` | - |
| └ Qoo10 연동 | `/settings#qoo10` | - |
| └ 계정 | `/settings#account` | - |

### 상태

| 상태 | 스타일 |
|------|--------|
| default | 투명 배경 |
| hover | `colors.bg.subtle` |
| active | `colors.border.default` 배경, 진한 텍스트/아이콘 |
| 뱃지 | 미처리 수 표시, 증가 시 bounce 애니메이션 |

---

## 16. OnboardingLayout

- **파일**: `components/onboarding/OnboardingLayout.tsx`
- **용도**: 온보딩 4단계 프로그레스 스테퍼 + 콘텐츠 전환 레이아웃

### Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|:----:|--------|------|
| `children` | `ReactNode` | O | - | 현재 스텝 콘텐츠 |
| `currentStep` | `number` | O | - | 활성 스텝 (1~4) |
| `onStepClick` | `(stepId: number) => void` | | - | 스텝 클릭 콜백 (방문 스텝만) |
| `exiting` | `boolean` | | - | true → 콘텐츠 페이드아웃 |

### 스텝 상태

| 스텝 상태 | 원형 스타일 | 커넥터 |
|----------|-----------|--------|
| completed | 파란 배경 + 체크 아이콘 | 파란색 fill |
| current | 흰 배경 + 파란 테두리 + pulse | 회색 |
| 미방문 | 회색 배경 + 회색 테두리 | 회색 |

### 온보딩 스텝 목록

| 스텝 | 라벨 | 페이지 |
|------|------|--------|
| 1 | 계정 연결 | Qoo10ConnectPage |
| 2 | 기본 정보 | BasicInfoPage |
| 3 | 판매 설정 | BasicMarginPage |
| 4 | 프로그램 설치 | ExtensionInstallPage |
