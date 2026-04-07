# DayZero B2C 디자인 시스템

> **목적**: 개발자가 UI를 새로 만들지 않고 이 문서의 패턴을 참조하여 일관성을 유지한다.
> **토큰**: `tokens.ts` | **애니메이션**: `animations.ts` | **컴포넌트 API**: `COMPONENT_API.md`

---

## 목차

1. [파운데이션](#1-파운데이션) — 색상, 타이포그래피, 공간, 그림자
2. [레이아웃](#2-레이아웃) — 페이지, 카드, 콜아웃, 사이드 패널
3. [폼 요소](#3-폼-요소) — 인풋, 드롭다운, 토글, 체크박스, 설정 행
4. [버튼](#4-버튼) — Primary, Secondary, Ghost, 작은 액션
5. [피드백](#5-피드백) — 모달, 토스트, 상태 아이콘, 프로그레스 바
6. [데이터 표시](#6-데이터-표시) — 리스트, 테이블, 뱃지/태그, 검색 하이라이트
7. [모션](#7-모션) — 전환 타이밍, hover, 스크롤 진입
8. [원칙](#8-원칙) — Do/Don't, 색상 사용, 정보 밀도

---

## 1. 파운데이션

### 1-1. 색상 체계

#### 배경색 계층
```
페이지 전체: colors.bg.page (#F9FAFB)
  └─ 카드/패널: colors.bg.surface (#FFFFFF)
       └─ 강조 영역: colors.bg.subtle (#F2F4F6)
       └─ 인포 영역: colors.bg.info (#F0F6FF)
       └─ 미세 구분: colors.bg.faint (#F8F9FA)
       └─ 미읽음: colors.bg.unread (#F8FAFF)
```

#### 상태별 색상 조합

| 상태 | 배경 | 텍스트/아이콘 | 테두리 |
|------|------|-------------|--------|
| 정보/기본 | `primaryLight` | `primary` | `primaryBorder` |
| 성공/완료 | `successBg` / `successLight` | `successDark` | `successBorder` |
| 경고/주의 | `warningLight` | `warningIcon` / `warningTextDark` | `warningBorder` |
| 에러/위험 | `dangerBg` / `dangerLight` | `danger` / `dangerDark` | — |
| 재고없음/중지 | `orangeLight` / `orangeBg` | `orange` / `orangeIcon` | `orangeBorder` |
| 예약 상태 | `scheduledBg` | `scheduledIcon` | — |

#### 시각적 계층 구조

1. **지배 색상**: `colors.primary` (파란색) — CTA, 활성 상태에만 사용
2. **절제된 악센트**: 성공(초록), 위험(빨간), 경고(노란), 주황은 상태 표시에만
3. **중립 기반**: 페이지 대부분은 `bg.page` + `bg.surface` + `text.*` 계열
4. **파란색 남발 금지**: primary 색상은 행동을 유도하는 곳에만 쓴다

### 1-2. 타이포그래피

**폰트**: Pretendard (고정, 다른 폰트 사용 금지)

| 용도 | 크기 | 굵기 | 색상 |
|------|------|------|------|
| 페이지 타이틀 | `font.size['2xl']` (28px) | `bold` (700) | `text.primary` |
| 서브 타이틀 | `font.size.xl` (22px) | `bold` (700) | `text.primary` |
| 섹션 타이틀 | `font.size.lg` (18px) | `bold` (700) | `text.primary` |
| 본문 | `font.size.base` (15px) | `regular` (400) | `text.secondary` |
| 본문 보조 | `font.size.md` (14px) | `medium` (500) | `text.secondary` |
| 보조 텍스트 | `font.size.sm` (13px) | `regular` (400) | `text.tertiary` |
| 캡션/태그 | `font.size.xs` (12px) | `semibold` (600) | `text.muted` |
| 작은 뱃지 | `font.size['2xs+']` (11px) | `semibold` (600) | 맥락에 따라 |
| 아주 작은 캡션 | `font.size['2xs']` (10px) | `medium` (500) | `text.muted` |

### 1-3. 여백 리듬

| 영역 | 간격 |
|------|------|
| 페이지 패딩 | `48px 64px` (MainLayout) |
| 섹션 간 | `spacing['6']` (24px) ~ `spacing['8']` (32px) |
| 카드 내부 패딩 | `spacing['5']` (20px) ~ `spacing['6']` (24px) |
| 폼 필드 간 | `spacing['4']` (16px) ~ `spacing['5']` (20px) |
| 인라인 요소 | `spacing['2']` (8px) ~ `spacing['3']` (12px) |

### 1-4. 그림자

| 용도 | 토큰 | 값 |
|------|------|---|
| 카드, 드롭다운 | `shadow.sm` | `0 1px 4px rgba(0,0,0,0.06)` |
| 모달, 패널 | `shadow.md` | `0 4px 16px rgba(0,0,0,0.10)` |
| 플로팅 버튼, 팝오버 | `shadow.lg` | `0 8px 32px rgba(0,0,0,0.14)` |

---

## 2. 레이아웃

### 2-1. 페이지 레이아웃

```
MainLayout (Sidebar 280px + Main flex:1)
├── Main: padding 48px 64px, maxWidth 1200px, margin 0 auto
├── ToastContainer (fixed bottom-right)
└── NotificationPanel (FAB + 사이드 패널)
```

### 2-2. 섹션 카드

```tsx
{
  background: colors.bg.surface,
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.xl,      // 16px — 섹션급 카드
  padding: spacing['6'],         // 24px
  boxShadow: shadow.sm,         // 선택적
}
```

### 2-3. 내부 서브 카드

```tsx
{
  background: colors.bg.surface,
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.lg,      // 12px
  padding: spacing['5'],         // 20px
}
```

### 2-4. 정보 콜아웃 (인포 박스)

```tsx
// 파란색 안내 영역
{
  background: colors.bg.info,    // #F0F6FF
  borderRadius: radius.lg,
  padding: spacing['4'],
  display: 'flex', gap: spacing['3'], alignItems: 'flex-start',
}

// 연한 회색 안내 영역
{
  background: colors.bg.faint,   // #F8F9FA
  borderRadius: radius.lg,
  padding: spacing['4'],
}
```

### 2-5. 사이드 패널

NotificationPanel, SettingsPanel에서 공통 사용:

```tsx
// Overlay
{
  position: 'fixed', inset: 0, zIndex: zIndex.modal,
  animation: 'fadeIn 0.2s ease',
}

// Backdrop
{
  position: 'absolute', inset: 0,
  background: 'rgba(0,0,0,0.3)',
}

// Panel (우측 슬라이드)
{
  position: 'absolute', top: 0, right: 0, bottom: 0,
  width: '480px',
  background: colors.bg.surface,
  boxShadow: shadow.lg,
  display: 'flex', flexDirection: 'column',
  animation: 'slideInRight 0.3s ease',
}
```

---

## 3. 폼 요소

### 3-1. 텍스트 인풋 (표준)

```tsx
const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: spacing['4'],                    // 16px
  borderRadius: radius.lg,                  // 12px
  border: `1px solid ${colors.border.default}`,
  fontSize: font.size.base,                 // 15px
  color: colors.text.primary,
  backgroundColor: colors.bg.surface,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

// Focus: borderColor → colors.primary, boxShadow → '0 0 0 3px rgba(49, 130, 246, 0.1)'
// Blur:  borderColor → colors.border.default, boxShadow → 'none'
// Disabled: background → colors.bg.subtle
```

### 3-2. 설정 패널 인풋 (컴팩트)

```tsx
{
  padding: `${spacing['3']} ${spacing['4']}`,  // 12px 16px — 더 작음
  borderRadius: radius.md,                      // 8px
  border: `1px solid ${colors.border.default}`,
  fontSize: font.size.md,                       // 14px
  fontWeight: font.weight.medium,
  color: colors.text.primary,
  background: colors.bg.surface,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  width: '100%',
  boxSizing: 'border-box',
}
```

### 3-3. 드롭다운 트리거

```tsx
{
  padding: `${spacing['3']} ${spacing['4']}`,
  borderRadius: radius.md,
  border: `1px solid ${colors.border.default}`,
  fontSize: font.size.md,
  fontWeight: font.weight.medium,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing['3'],
  background: colors.bg.surface,
  color: colors.text.primary,
  transition: 'border-color 0.15s',
  width: '100%',
}
```

### 3-4. 토글 스위치

```tsx
// 컨테이너: 44×24, radius.full
<button style={{
  width: '44px', height: '24px',
  borderRadius: radius.full,
  background: isActive ? colors.primary : colors.border.default,
  border: 'none',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background 0.2s',
  padding: 0, flexShrink: 0,
}}>
  {/* 핸들: 20×20, radius.full */}
  <div style={{
    width: '20px', height: '20px',
    borderRadius: radius.full,
    background: colors.bg.surface,
    position: 'absolute', top: '2px',
    left: isActive ? '22px' : '2px',
    transition: 'left 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  }} />
</button>
```

### 3-5. 체크박스

```
Checkbox 컴포넌트 사용 (components/common/Checkbox.tsx)
- 20×20, radius.xs(4px), border 2px
- checked: bg primary + white check SVG
- unchecked: bg surface + border.light
```

### 3-6. 설정 행 (Row)

```tsx
// 행 컨테이너
{ padding: `${spacing['5']} 0`, borderBottom: `1px solid ${colors.bg.subtle}` }

// 행 라벨
{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: '2px' }

// 행 설명
{ fontSize: font.size.sm, color: colors.text.muted, lineHeight: font.lineHeight.normal, marginBottom: spacing['3'] }
```

---

## 4. 버튼

### 4-1. Primary (CTA)

```tsx
{
  background: colors.primary,
  color: colors.white,
  padding: '14px',
  borderRadius: radius.md,      // 8px
  border: 'none',
  fontSize: font.size.md,       // 14px
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'opacity 0.2s',
}
// Hover: opacity 0.9
// 대체 Hover: background → colors.primaryDark
```

### 4-2. Secondary

```tsx
{
  background: colors.bg.subtle,
  color: colors.text.secondary,
  padding: '14px',
  borderRadius: radius.md,
  border: 'none',
  fontSize: font.size.md,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s',
}
// Hover: background → colors.border.default
```

### 4-3. Ghost (텍스트 버튼)

```tsx
{
  background: 'none',
  border: 'none',
  color: colors.primary,        // 또는 colors.text.secondary
  fontSize: font.size.md,
  fontWeight: font.weight.semibold,
  cursor: 'pointer',
  padding: 0,
}
```

### 4-4. 작은 액션 버튼

```tsx
{
  padding: '4px 12px',
  borderRadius: radius.md,
  background: colors.primary,
  border: 'none',
  fontSize: font.size.xs,       // 12px
  fontWeight: 600,
  color: colors.white,
  cursor: 'pointer',
}
```

### 4-5. 다크 버튼 (강조 액션)

```tsx
{
  background: colors.text.primary,  // #191F28
  color: colors.white,
  padding: '14px',
  borderRadius: radius.md,
  border: 'none',
  fontSize: font.size.md,
  fontWeight: 700,
  cursor: 'pointer',
}
```

---

## 5. 피드백

### 5-1. 확인 모달

```
ConfirmModal 컴포넌트 사용 (components/common/ConfirmModal.tsx)
- type: 'danger' | 'info'
- 아이콘(56px) + 제목(xl) + 설명(base) + 버튼 2개
- 상세 API: COMPONENT_API.md 참조
```

### 5-2. 커스텀 모달

```tsx
// Overlay
{
  position: 'fixed', inset: 0, zIndex: zIndex.modal,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  animation: 'fadeIn 0.2s ease',
}

// Backdrop
{
  position: 'absolute', inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(4px)',
}

// Modal Content
{
  position: 'relative',
  maxWidth: '440px',             // 기본. 검색 모달은 420px
  width: '100%',
  background: colors.bg.surface,
  borderRadius: radius.xl,      // 16px
  boxShadow: shadow.lg,
  padding: '32px 24px 24px',
  animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
}

// 닫기 버튼 (X) — position absolute top-right
{
  position: 'absolute', top: '16px', right: '16px',
  background: 'none', border: 'none',
  color: colors.text.muted, cursor: 'pointer',
  padding: '4px', borderRadius: '50%',
}
// Hover: background → colors.bg.subtle
```

### 5-3. 토스트 메시지

```
ToastContainer 컴포넌트 + useToastStore 사용
- 위치: fixed bottom-right (bottom: 96px, right: 24px)
- 스타일: 말풍선 (borderRadius: 16px 16px 4px 16px) + 우하단 꼬리
- 애니메이션: toastBubbleUp (scale 0.9→1 + translateY 16→0)
- 상세 API: COMPONENT_API.md 참조
```

### 5-4. 상태 아이콘 (36×36)

```
StatusIcon 컴포넌트 사용
- completed: successBg 배경 + CheckCircle2
- failed: dangerBg 배경 + X
- scheduled: scheduledBg 배경 + Zap (scheduledIcon)
- running/processing: primaryLight 배경 + Loader2(spin)
- 상세 API: COMPONENT_API.md 참조
```

### 5-5. 진행 바

```
ProgressBar 컴포넌트 사용
- 높이: 4px (기본) 또는 8px (강조)
- 트랙: colors.bg.subtle
- 바: colors.primary
- 전환: width 0.4s ease
```

### 5-6. 상태 전환 피드백 매트릭스

| 액션 | 피드백 | 구현 |
|------|--------|------|
| 저장 완료 | 토스트 메시지 | `useToastStore` |
| 삭제 확인 | ConfirmModal (danger) | `ConfirmModal` |
| 로딩 중 | 스피너 + 텍스트 셰이머 | `spin` 애니메이션 + 파란 배경 |
| 토글 ON/OFF | 슬라이드 + 색상 전환 | `transition: left 0.2s, background 0.2s` |
| 입력 포커스 | 테두리 + 글로우 | `borderColor: primary + boxShadow: ring` |
| 에러 | 빨간 테두리 + 메시지 | `borderColor: danger` |

---

## 6. 데이터 표시

### 6-1. 리스트 아이템

```tsx
{
  padding: `12px ${spacing['5']}`,
  borderBottom: `1px solid ${colors.border.default}`,
  cursor: 'pointer',
  transition: 'background 0.15s',
}
// Hover: background → colors.bg.faint
```

### 6-2. 테이블 헤더

```tsx
{
  background: colors.bg.page,
  borderBottom: `1px solid ${colors.border.default}`,
  color: colors.text.muted,
  fontSize: font.size.xs,       // 12px
  fontWeight: font.weight.semibold,
}
```

### 6-3. 뱃지/태그

```tsx
// 작은 뱃지 (카운트 등)
{
  display: 'inline-flex', alignItems: 'center',
  padding: '1px 6px',
  borderRadius: radius.full,
  fontSize: font.size['2xs+'],  // 11px
  fontWeight: 600,
}

// 일반 태그 (카테고리 등)
{
  display: 'inline-flex', alignItems: 'center', gap: '3px',
  padding: '3px 5px',
  borderRadius: radius.xs,      // 4px
}
```

### 6-4. 인라인 상태 도트

```tsx
{
  width: '6px', height: '6px',
  borderRadius: '50%',
  background: colors.warningIcon,  // 또는 primary, danger, success
  flexShrink: 0,
}
```

### 6-5. 데이터 출처 표시

```
SourceTag 컴포넌트 사용
- ai: 파란 배경(primary) + 흰 AIIcon
- crawled: 회색 배경(border.light) + Globe 아이콘
- 상세 API: COMPONENT_API.md 참조
```

### 6-6. 검색 하이라이트

```tsx
<mark style={{
  background: colors.primaryLight,
  color: colors.primary,
  borderRadius: radius.xs,
  padding: '0 1px',
}}>
```

---

## 7. 모션

### 7-1. 모션 철학

- **잘 설계된 전환 1개 > 산발적 마이크로인터랙션 10개**
- 모션은 사용자의 주의를 안내하고, 상태 변화를 설명하기 위해 사용한다
- 장식적 애니메이션은 지양한다. 모든 모션에는 목적이 있어야 한다

### 7-2. 애니메이션 키프레임

| 사용처 | 키프레임 | import |
|--------|---------|--------|
| 리스트/카드 진입 | `fadeInUp` (8px) | `ANIM.fadeInUp` |
| 오버레이/배경 | `fadeIn` | `ANIM.fadeIn` |
| 모달 콘텐츠 | `slideUp` (20px) | `ANIM.slideUp` |
| 모달 + 스케일 | `modalSlideUp` | `ANIM.modalSlideUp` |
| 페이지 전환 | `pageIn` (12px) | `ANIM.pageIn` |
| 툴팁 | `tooltipFadeIn` (4px) | `ANIM.tooltipFadeIn` |
| 콜아웃 (위→아래) | `calloutIn` | `ANIM.calloutIn` |
| 로딩 스피너 | `spin` | `ANIM.spin` |
| 테이블 행 | `rowSlideIn` | `ANIM.rowSlideIn` |

**사용법**: `<style>{ANIM.fadeIn + ANIM.slideUp}</style>`

### 7-3. 전환 타이밍 기준

| 용도 | 지속 시간 | 이징 |
|------|----------|------|
| hover 상태 변경 | `0.15s ~ 0.2s` | `ease` 또는 `linear` |
| 토글/체크 상태 | `0.15s` | `ease` |
| 모달 진입 | `0.3s` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 페이지 전환 | `0.3s ~ 0.4s` | `ease` |
| 리스트 아이템 진입 | `0.2s ~ 0.3s` | `ease` |
| 토스트 진입 | `0.4s` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 프로그레스 바 | `0.4s` | `ease` |

### 7-4. Hover 규칙

```tsx
// Primary 버튼 — opacity 변경
onMouseEnter: opacity → 0.9
// 대체: background → colors.primaryDark

// Secondary 버튼 — 배경색 변경
onMouseEnter: background → colors.border.default

// 리스트 아이템 — 배경색 변경
onMouseEnter: background → colors.bg.faint

// 아이콘/닫기 버튼 — 배경 추가
onMouseEnter: background → colors.bg.subtle

// 모든 hover에는 transition 필수
transition: 'background 0.2s' 또는 'opacity 0.2s'
```

### 7-5. 스크롤 & 진입 애니메이션

- 리스트 아이템: `animation-delay`로 순차 진입 (`index * 0.03s`)
- 카드 그리드: `fadeInUp` + stagger
- 중요 숫자/통계: 카운트업 없이 즉시 표시 (SaaS 도구는 속도감 우선)

---

## 8. 원칙

### 8-1. 정보 밀도

- SaaS 도구이므로 **정보 밀도가 높되 정돈된 느낌** 유지
- 카드 사이 구분은 `border` 또는 `spacing`으로 — 과도한 그림자 지양
- 테이블은 `compact` (12px vertical padding) 기본
- 빈 공간이 너무 많으면 도구로서의 전문성이 떨어져 보임

### 8-2. 참조 규칙 (Do / Don't)

**Do:**
- 새 UI를 만들기 전, 이 문서에서 해당 패턴이 있는지 확인한다
- 패턴이 있으면 그대로 사용한다. 변형이 필요하면 최소한으로 조정한다
- 모든 값은 `tokens.ts`에서 가져온다
- 애니메이션은 `animations.ts`의 기존 키프레임만 사용한다
- 복잡한 컴포넌트 재구현 시 `COMPONENT_API.md`에서 Props/상태 확인

**Don't:**
- hex 색상 하드코딩 금지 (예: `'#3182F6'` → `colors.primary`)
- 숫자 폰트 크기 하드코딩 금지 (예: `'15px'` → `font.size.base`)
- 임의의 px 간격 금지 (예: `'16px'` → `spacing['4']`)
- 임의의 border-radius 금지 (예: `'12px'` → `radius.lg`)
- `colors.primary`를 상태 표시가 아닌 장식에 남발 금지
- 장식적 애니메이션 금지. 모든 모션에는 목적이 있어야 한다
- 패턴이 없는 완전히 새로운 UI를 사전 확인 없이 만들기 금지
