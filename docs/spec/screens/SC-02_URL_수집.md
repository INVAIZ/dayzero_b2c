# [SC-02] URL 직접 수집

## 화면 목적
쇼핑몰 상품 URL을 직접 입력하여 상품을 수집한다.
Enter/Space/붙여넣기로 URL을 태그 형태로 추가하며, 최대 20개까지 입력 가능.

## 진입 경로
- SC-01 직접 수집 탭 → 별도 페이지 이동
- 직접 URL `/sourcing/url` 접근

## 레이아웃
MainLayout — 최대 너비 800px, 가운데 정렬, 하단 패딩 100px.
페이지 진입 시 `fadeInUp 0.4s ease` 애니메이션 적용.

```
┌──────────────────────────────────────┐
│ ← 수집 홈으로                         │
│                                      │
│ 직접 수집                             │
│ (설명 텍스트)                         │
│                                      │
│ [수집 프로그램 상태 콜아웃]             │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 수집할 URL 목록 (최대 20개)       │ │
│ │ ┌────────────────────────────┐  │ │
│ │ │ [태그] [태그] [태그] [입력] │  │ │
│ │ │                            │  │ │
│ │ └────────────────────────────┘  │ │
│ │                                  │ │
│ │ 지원 쇼핑몰에서 찾아보세요         │ │
│ │ [올리브영] [쿠팡] [다이소] ...    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [총 N건 수집 시작하기] 버튼            │
│                                      │
│ ── 수집 시작 후 ──                    │
│ ┌──────────────────────────────────┐ │
│ │ 🔄 상품 정보를 수집하고 있어요      │ │
│ │ [프로그레스 바]     N/M건 완료     │ │
│ │                                  │ │
│ │ ✅ URL 1 — 상품명, 원가           │ │
│ │ 🔄 URL 2 — 정보를 가져오고 있어요  │ │
│ │ ❌ URL 3 — 에러 [재시도]           │ │
│ │ ⊘ URL 4 — 이미 판매 중            │ │
│ │ ○ URL 5 — 대기 중...              │ │
│ │                                  │ │
│ │ [수집된 상품 확인하기 →]            │ │
│ │ [추가 수집하기]                    │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## 컴포넌트 구조

이 화면은 두 파일로 분리되어 있다:
- `UrlSourcingPage.tsx` — 구버전 (현재 미사용, 라우트에서 UrlSourcingContent로 대체됨)
- `components/UrlSourcingContent.tsx` — 현재 활성 컴포넌트

상태는 `useSourcingStore`의 `urlSourcing` 슬라이스로 관리한다:
- `urls: string[]` — 입력된 URL 배열
- `parsedUrls: ParsedUrl[]` — 파싱된 URL 목록 (상태 포함)
- `isCollecting: boolean` — 수집 진행 중 여부
- `collectionStarted: boolean` — 수집 시작 여부

---

## 상태별 분기

### 1. 크롬 익스텐션 상태 콜아웃 (수집 시작 전에만 표시)

| 조건 | 배경색 | 테두리 | 아이콘 | 제목 | 설명 | 액션 |
|------|--------|--------|--------|------|------|------|
| 미설치 (`ext_installed !== 'true'`) | `colors.bg.faint` | `colors.border.default` | 다운로드 화살표 (muted) | `수집 프로그램 미설치` | `프로그램을 설치하면 URL 복사 없이 쇼핑몰에서 바로 상품을 담을 수 있어요` | `+ 설치하기` 버튼 |
| 설치됨 (`ext_installed === 'true'`) | `colors.bg.info` | `colors.primaryLightBorder` | 체크마크 (primary) | `수집 프로그램이 설치되어 있어요` | `지원 쇼핑몰에서 상품을 둘러보면서 클릭 한 번으로 목록에 추가할 수 있어요` | 없음 |

- 설치 상태는 `sessionStorage.getItem('ext_installed')` 로 판정
- `+ 설치하기` 클릭 시: Chrome 웹스토어 새 탭 열기 + `sessionStorage.setItem('ext_installed', 'true')` + 상태 갱신

### 2. 입력 단계 (수집 시작 전)

`collectionStarted === false`일 때 표시.

#### URL 입력 영역
- 상단 라벨: `수집할 URL 목록 (최대 20개)` (sm, semibold, secondary)
- 태그 입력 컨테이너 (160px 최소 높이):
  - 배경: `colors.bg.page`, 테두리: `colors.border.light`
  - 포커스 시 테두리: `colors.primary` (transition 0.2s)
  - 블러 시 테두리: `colors.border.light`로 복원
  - 컨테이너 클릭 시 내부 input에 포커스

#### URL 태그 (parsedUrls 배열의 각 항목)

| 조건 | 테두리 | 내용 |
|------|--------|------|
| 유효한 URL (`!p.error`) | `colors.border.default` | [쇼핑몰 로고 16x16] + URL 텍스트 (ellipsis, 최대 200px) + ✅ CheckCircle2 (success) + X 삭제 버튼 |
| 에러 URL (`p.error`) | `colors.dangerLight` | ⚠ AlertCircle (danger) + URL 텍스트 (취소선, muted) + 에러 메시지 (xs, danger, semibold) + X 삭제 버튼 |

- 태그 모양: `border-radius: radius.full`, `padding: 6px 10px`, `background: colors.bg.surface`
- X 삭제 버튼: 호버 시 `background: colors.bg.subtle`, 클릭 시 해당 URL을 `urls` 배열에서 제거

#### URL 입력 방식 (input 요소)

| 트리거 | 동작 |
|--------|------|
| Enter 또는 Space 키 | 입력값에서 URL 정규식 `/(https?:\/\/[^\s)]+)/g` 매칭 시도 → 매칭되면 URL 추가, 아니면 전체 텍스트를 URL로 추가. 중복 제거 (`Set`). 입력창 비움 |
| 붙여넣기 (Paste) | `e.preventDefault()` → 클립보드 텍스트에서 URL 정규식 매칭 → 매칭 있으면 전부 추가, 없으면 줄바꿈/공백 분리하여 추가. 중복 제거 |
| Backspace (입력값 비어있을 때) | 마지막 URL 태그 삭제 (`urls.slice(0, -1)`) |
| Blur | 입력값이 있고 중복이 아니면 URL로 추가 + 입력창 비움 |

- Placeholder (URL 0개일 때): `지원 쇼핑몰의 상품 URL만 붙여넣으면 모든 상품 정보를 가져와요. 여러 개도 한 번에 요청할 수 있어요.`

#### URL 파싱 로직 (`useEffect`)
- `collectionStarted`가 true이면 파싱 중단 (입력 고정)
- `urls` 배열을 순회하며 각 URL에 대해:
  - `MOCK_URL_TO_PROVIDER(url)` 호출 → 지원 쇼핑몰 매칭
  - 매칭 실패 시 provider를 `'기타'`로 설정
  - `http`로 시작하지 않으면 error: `올바른 URL을 입력해주세요`
  - 매칭 성공 + http 시작 → error 없음

#### 지원 쇼핑몰 그리드
- 라벨: `지원 쇼핑몰에서 찾아보세요` (sm, semibold, muted)
- 4열 그리드, 각 카드: [로고 24x24] + 쇼핑몰명
- 클릭 시 해당 쇼핑몰 URL을 새 탭으로 열기 (`window.open(p.url, '_blank')`)
- 호버: `background: colors.bg.subtle`, `borderColor: colors.border.light`

#### 중복/판매 중 안내 문구
- 위치: 수집 시작 버튼 바로 위
- 아이콘: Info (14px, `colors.text.muted`)
- 텍스트: `이미 판매 중이거나 수집된 상품은 자동으로 제외돼요.`
- 스타일: `font.size.sm`, `colors.text.muted`, `font.weight.medium`
- 표시 조건: URL이 1건 이상 입력되었을 때

#### 수집 시작 버튼
- 텍스트: `총 {validCount}건 수집 시작하기` (Link2 아이콘 포함)
- 높이: 56px
- 활성: `validCount > 0` (에러 없는 URL 수)
- 비활성: `validCount === 0` → `disabled`

### 3. 수집 진행 중

`collectionStarted === true`일 때 표시. 입력 영역 + 버튼 숨김.
프로그레스 카드: `slideUp 0.4s ease` 애니메이션으로 등장.

#### 전체 진행 헤더

| 상태 | 아이콘 | 제목 텍스트 |
|------|--------|-------------|
| 수집 중 (`isCollecting === true`) | Loader2 스피너 (primary) | `상품 정보를 수집하고 있어요` |
| 완료 (`isCollecting === false`) | CheckCircle2 (success) | `수집이 완료됐어요` |

#### 진행 건수 텍스트 (우측)

| 조건 | 텍스트 |
|------|--------|
| 수집 중 또는 blocked 없음 | `{completedCount} / {parsedUrls.length}건 완료` |
| 완료 + blocked 있음 | `{successCount}건 수집 완료, {blockedCount}건 판매 중 제외` |

#### 프로그레스 바
- 높이: 8px, 배경: `colors.bg.subtle`, 모서리: `radius.xs`
- 채움: `(completedCount / parsedUrls.length) * 100`%
- 색상:
  - 진행 중 또는 일부 실패: `colors.primary`
  - 전체 성공 (`successCount === parsedUrls.length`): `colors.success`
- 트랜지션: `width 0.4s ease, background 0.4s ease`

### 4. URL별 5가지 상태

각 URL 항목은 카드 형태로 표시 (16px 패딩, `radius.lg`).

| 상태 | 배경색 | 테두리 | 불투명도 | 아이콘 | 보조 텍스트 |
|------|--------|--------|----------|--------|-------------|
| `idle` | `colors.bg.page` | `colors.border.default` | 1 | 빈 원 (20x20, `border: 2px solid colors.border.light`) | `대기 중...` (sm, muted) |
| `running` | `colors.bg.page` | `colors.border.default` | 1 | Loader2 스피너 (primary) | `정보를 가져오고 있어요...` (sm, primary) |
| `completed` | `colors.bg.page` | `colors.border.default` | 1 | 체크 원 (20x20, `border: 1.5px solid colors.success` + 체크 SVG) | 원가 `₩{price}` + 소스 URL |
| `failed` | `colors.dangerBg` | `colors.dangerLight` | 1 | XCircle (danger) | 에러 메시지 + `재시도` 링크 (밑줄, danger, semibold) |
| `blocked` | `colors.bg.subtle` | `colors.border.default` | 0.75 | X 원 (20x20, `border: 1.5px solid colors.text.muted` + X SVG) | `이미 판매 중인 상품입니다` (sm, semibold, muted) |

#### completed 상태 상세
- 제목: 상품명 (링크, 호버 시 밑줄)
- 하단: `원가` 라벨 (muted) + `₩{originalPriceKrw.toLocaleString()}` (semibold) + `|` 구분자 + 소스 URL (muted, ellipsis 240px)
- 우측: 썸네일 영역 48x48 (빈 박스, `colors.bg.subtle`)

#### blocked 상태 발동 조건
- **유효 URL이 2건 이상일 때, 마지막 1건이 blocked 처리됨**
- blocked 상품명은 provider별 하드코딩:
  - 올리브영: `[단독기획] 닥터지 레드 블레미쉬 클리어 수딩 크림 70ml`
  - 쿠팡: `퍼실 파워젤 세탁세제 리필 2.7L 3개`
  - 다이소: `다이소 미니 선풍기 USB 충전식`

### 5. 수집 완료 후 액션

`isAllCompleted === true`일 때 `fadeInUp 0.4s ease`로 표시.

| 버튼 | 스타일 | 조건 | 동작 |
|------|--------|------|------|
| `수집된 상품 확인하기` → | `btn-primary`, 전체 너비 | `successCount > 0` | `urls` 초기화 + `collectionStarted` false + `/editing?focusJobId={lastJobId}` 이동 |
| `추가 수집하기` | `btn-google`, `colors.bg.subtle` 배경, 테두리 없음 | 항상 | `collectionStarted` false + `urls` 초기화 (입력 화면 복귀) |

---

## 동작 정의

### URL 입력 → 실시간 파싱

- **Given**: 입력 컨테이너에 포커스
- **When**: Enter/Space 키 입력, 붙여넣기, 또는 블러
- **Then**:
  1. 입력값에서 URL 추출 (정규식 또는 전체 텍스트)
  2. 중복 제거 (`Set`)
  3. `urls` 배열에 추가
  4. `useEffect`에 의해 즉시 `parsedUrls` 재계산
  5. 각 URL에 대해 provider 매칭 + 에러 검증
  6. 태그 UI 즉시 갱신

### 수집 시작

- **Given**: `validCount >= 1` (에러 없는 URL 1건 이상)
- **When**: `총 N건 수집 시작하기` 버튼 클릭
- **Then**:
  1. 알림 생성: `{ type: 'url', title: '직접 수집 ({validCount}건)', status: 'running', currentCount: 0, totalCount: validCount }`
  2. `collectionStarted = true`, `isCollecting = true`
  3. 입력 영역 숨김, 프로그레스 카드 표시
  4. `parsedUrls` 스냅샷 기준으로 순차 처리:
     - 에러 있는 URL → 건너뜀
     - blocked 대상 (마지막 유효 URL, 유효 2건 이상일 때) → `blocked` 처리
     - 나머지 → `running` (2.5~5초 랜덤 대기) → `completed`
  5. 각 URL 처리 시 `running` → `completed`/`failed`/`blocked` 상태 전환
  6. 알림 `currentCount` 실시간 업데이트
  7. 전체 완료 시:
     - `isCollecting = false`
     - 알림: `status: 'completed'`, `completedAt` 설정
     - `successProcessed > 0`이면 Job 추가: `{ type: 'URL', categorySummary: '{N}건 수동 수집', status: 'completed' }`
     - 완료 액션 버튼 표시

### 수집된 상품 데이터 생성 (completed 시)

각 성공 상품에 대해 `useEditingStore.addProduct()`로 편집 목록에도 추가:
- **상품명**: provider와 카테고리 키워드 기반 현실적 더미 제목 (K-POP/뷰티/일반)
- **가격 자동 계산**: `원가 + 국내배송비 + 준비비용 + 국제배송비 + 마진 → 원화 판매가 → JPY 변환 (×0.11)`
  - 마진 계산: `marginType === '%'`이면 비율, 아니면 고정 금액 (onboardingState에서 가져옴)
- **카테고리 자동 매핑**: 상품명 키워드 기반 규칙 매칭 (크림→스킨케어, 쿠션→베이스메이크업, 세제→생활용품 등 13개 규칙)
- **무게**: 앨범 0.45kg, 기타 0.25kg. AI 예측 보장 1건 이상 (`isWeightEstimated`, `weightSource: 'ai' | 'crawled'`)
- **옵션 자동 생성**: K-POP (버전 2~3개), 뷰티 (본품/리필, 호수 등), 생활 (사이즈, 컬러)
- **브랜드/제조사**: provider별 현실적 더미 데이터

### 실패 재시도

- **Given**: `status === 'failed'`인 URL 항목
- **When**: `재시도` 링크 클릭
- **Then**:
  1. 해당 URL `status: 'running'`, `error: undefined`
  2. 2초 대기
  3. `status: 'completed'` + 더미 상품 생성 (`{provider} 재시도 상품`, ₩15,000)

### 수집 완료 → 편집 이동

- **Given**: `isAllCompleted === true`, `successCount > 0`
- **When**: `수집된 상품 확인하기` 클릭
- **Then**:
  1. `urls` 배열 초기화 (빈 배열)
  2. `collectionStarted = false`
  3. `/editing?focusJobId={lastJobId}` 로 이동 (편집 목록에서 해당 Job 포커스)

### 추가 수집

- **Given**: `isAllCompleted === true`
- **When**: `추가 수집하기` 클릭
- **Then**:
  1. `collectionStarted = false`
  2. `urls` 배열 초기화
  3. 입력 화면으로 복귀

---

## UI 텍스트 전체 목록

| 위치 | 텍스트 | 조건 |
|------|--------|------|
| 뒤로가기 | `← 수집 홈으로` | 항상 (UrlSourcingPage 레벨) |
| 페이지 제목 | `직접 수집` | 항상 |
| 페이지 설명 | `수집하려는 상품의 URL을 입력하세요. 줄바꿈으로 최대 20개까지 한 번에 수집할 수 있어요.` | 항상 |
| 익스텐션 미설치 제목 | `수집 프로그램 미설치` | ext 미설치 |
| 익스텐션 미설치 설명 | `프로그램을 설치하면 URL 복사 없이 쇼핑몰에서 바로 상품을 담을 수 있어요` | ext 미설치 |
| 익스텐션 미설치 버튼 | `+ 설치하기` | ext 미설치 |
| 익스텐션 설치됨 제목 | `수집 프로그램이 설치되어 있어요` | ext 설치됨 |
| 익스텐션 설치됨 설명 | `지원 쇼핑몰에서 상품을 둘러보면서 클릭 한 번으로 목록에 추가할 수 있어요` | ext 설치됨 |
| 입력 영역 라벨 | `수집할 URL 목록 (최대 20개)` | 수집 전 |
| input placeholder | `지원 쇼핑몰의 상품 URL만 붙여넣으면 모든 상품 정보를 가져와요. 여러 개도 한 번에 요청할 수 있어요.` | URL 0개 |
| 유효하지 않은 URL 에러 | `올바른 URL을 입력해주세요` | http 미포함 |
| 쇼핑몰 그리드 라벨 | `지원 쇼핑몰에서 찾아보세요` | 수집 전 |
| 시작 버튼 | `총 {N}건 수집 시작하기` | validCount > 0 |
| 진행 중 제목 | `상품 정보를 수집하고 있어요` | isCollecting |
| 진행 건수 (기본) | `{completedCount} / {parsedUrls.length}건 완료` | 수집 중 |
| 진행 건수 (blocked 있음) | `{successCount}건 수집 완료, {blockedCount}건 판매 중 제외` | 완료 + blocked > 0 |
| 완료 제목 | `수집이 완료됐어요` | 전체 완료 |
| idle 상태 | `대기 중...` | status === 'idle' |
| running 상태 | `정보를 가져오고 있어요...` | status === 'running' |
| completed 원가 라벨 | `원가` | status === 'completed' |
| failed 에러 | `쇼핑몰 접속이 일시적으로 불안정해요. 잠시 후 재시도해보세요` | status === 'failed' |
| 재시도 링크 | `재시도` | status === 'failed' |
| blocked 메시지 | `이미 판매 중인 상품입니다` | status === 'blocked' |
| 완료 버튼 1 | `수집된 상품 확인하기` | successCount > 0 |
| 완료 버튼 2 | `추가 수집하기` | 항상 (완료 시) |
| 알림 제목 | `직접 수집 ({N}건)` | 수집 시작 시 |

---

## 애니메이션

| 대상 | 애니메이션 | 타이밍 |
|------|-----------|--------|
| 페이지 진입 | `fadeInUp 0.4s ease` | 마운트 시 |
| 프로그레스 카드 등장 | `slideUp 0.4s ease` | collectionStarted 전환 시 |
| 완료 액션 버튼 영역 | `fadeInUp 0.4s ease` | isAllCompleted 전환 시 |
| 프로그레스 바 채움 | `width 0.4s ease, background 0.4s ease` | 매 건 완료 시 |
| URL 항목 상태 전환 | `all 0.3s ease` (opacity, background) | 상태 변경 시 |
| Loader2 스피너 | `spinner 1s linear infinite` (360도 회전) | running 상태 |

---

## 이동 경로

| 액션 | 목적지 | 조건 |
|------|--------|------|
| `← 수집 홈으로` | `/sourcing` (SC-01) | 항상 |
| `수집된 상품 확인하기` | `/editing?focusJobId={lastJobId}` (ED-01) | 완료 + 성공 건 있음 |
| `추가 수집하기` | 현재 페이지 초기화 (입력 화면) | 완료 후 |
| 지원 쇼핑몰 카드 클릭 | 해당 쇼핑몰 URL (새 탭) | 수집 전 |
| `+ 설치하기` | Chrome 웹스토어 (새 탭) | ext 미설치 |

---

## 검증 체크리스트

- [ ] 크롬 익스텐션 상태 콜아웃 (미설치/설치 분기)
- [ ] URL 태그 입력 (Enter, Space, 붙여넣기, Backspace 삭제)
- [ ] 유효/에러 URL 태그 스타일 분기
- [ ] 개별 URL 삭제 (X 버튼)
- [ ] URL 중복 자동 제거
- [ ] `http` 미포함 에러 표시
- [ ] 지원 쇼핑몰 그리드 (12개, 클릭 시 새 탭)
- [ ] 수집 시작 버튼 활성/비활성
- [ ] 수집 시작 → 입력 영역 숨김 + 프로그레스 카드 표시
- [ ] URL별 5가지 상태 (idle/running/completed/failed/blocked) 표시
- [ ] blocked 상태: 유효 2건 이상일 때 마지막 1건
- [ ] 실패 재시도 (2초 후 completed)
- [ ] 완료 시 건수 텍스트 분기 (blocked 유무)
- [ ] 프로그레스 바 색상 분기 (전체 성공 시 녹색)
- [ ] 알림 생성 (running → completed)
- [ ] Job 생성 (성공 건 있을 때)
- [ ] `수집된 상품 확인하기` → `/editing?focusJobId=...` 이동
- [ ] `추가 수집하기` → 입력 화면 복귀
- [ ] 수집된 상품 편집 스토어에 자동 등록 (가격 계산, 카테고리 매핑, 옵션 생성)
