# PostCard 3종 디자인 + 전역 설정 패널

**Date**: 2026-04-17
**Status**: Approved

## 1. 목표

인덱스 페이지의 게시글 카드를 3가지 레이아웃(Editorial Accent, Minimal Timeline, Floating Icon)으로 구현하고, 전역 설정 FAB + 패널을 통해 사용자가 레이아웃을 전환할 수 있게 한다. 설정 시스템은 향후 언어 등 추가 설정으로 확장 가능하게 설계한다.

## 2. 설정 시스템 아키텍처

### 2.1 Settings 타입

```ts
interface Settings {
  cardLayout: 'editorial' | 'timeline' | 'floating'
  // 확장 시 여기에 키 추가
}

const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'editorial',
}
```

### 2.2 SettingsProvider

- **위치**: `components/providers/SettingsProvider.tsx`
- React Context + `localStorage` (키: `deep-settings`)
- `useSettings()` 훅: `{ settings, updateSetting }` 반환
- `updateSetting(key, value)` 호출 시 state + localStorage 동시 갱신
- SSR 안전: 초기값 `DEFAULT_SETTINGS`, `useEffect`에서 localStorage 읽기 (hydration mismatch 방지)
- `'use client'` 컴포넌트

### 2.3 Provider 배치

`app/layout.tsx`에서 기존 `ThemeProvider > MobileUIProvider` 체인 안에 `SettingsProvider`를 추가한다:

```
ThemeProvider > MobileUIProvider > SettingsProvider > {children} + SettingsFab
```

`SettingsFab`은 `fixed` 포지션이므로 flex 컨테이너 바깥, SettingsProvider 안에 배치.

## 3. 설정 FAB + 패널

### 3.1 SettingsFab

- **위치**: `components/layout/SettingsFab.tsx`
- `'use client'` 컴포넌트
- `fixed bottom-6 right-6 z-50`으로 모든 페이지에 상시 표시
- 48×48px, `rounded-xl`, `bg-foreground text-background`
- Lucide `Settings` 아이콘 (22px), hover 시 60deg 회전
- `box-shadow: 0 4px 16px rgba(0,0,0,0.15)`
- 클릭 시 `SettingsPanel` 토글

### 3.2 SettingsPanel

- **위치**: `components/layout/SettingsPanel.tsx`
- FAB 위에 슬라이드업 (bottom-20 right-6, 너비 320px)
- `border rounded-2xl shadow-xl`, 진입 애니메이션은 CSS (`scale(0.95) → 1`, `opacity 0 → 1`, 250ms)
- 패널 외부 클릭 시 닫힘 (backdrop click handler)
- ESC 키로 닫힘

**패널 내부 구조:**
- 헤더: "설정" 타이틀 + X 닫기 버튼
- 바디: 섹션별 독립 컴포넌트 스택
  - `ThemeSection`: 카드 레이아웃 3종 선택 (미니 와이어프레임 아이콘 + 라벨)
  - (미래) `LanguageSection` 등 추가 시 바디에 구분선 + 새 섹션

### 3.3 ThemeSection

3개 옵션을 가로 배치. 각 옵션:
- 미니 와이어프레임 아이콘 (해당 레이아웃의 시각적 특징을 추상화)
- 라벨: "Editorial" / "Timeline" / "Floating"
- 선택 시 `border-primary bg-accent` 활성 상태
- 클릭 → `updateSetting('cardLayout', value)` 호출

## 4. PostCard 3종

모든 카드는 동일 데이터를 표시: 카테고리 아이콘, 카테고리 라벨, 태그, 제목, 요약, 날짜.

### 4.1 카테고리 컬러 매핑

각 카테고리에 고유 accent 색상 부여 (CSS custom properties):

| Category | Color | Light tint |
|----------|-------|------------|
| database | emerald (#059669) | #ECFDF5 |
| computer-science | violet (#7C3AED) | #F5F3FF |
| knowledge | amber (#D97706) | #FFFBEB |
| language | blue (#2563EB) | #EFF6FF |
| library | red (#DC2626) | #FEF2F2 |
| frameworks | cyan (#0891B2) | #ECFEFF |
| etc | pink (#DB2777) | #FDF2F8 |

`lib/category-colors.ts`에 `CATEGORY_COLORS` 맵으로 정의. `category-icons.ts` 패턴과 동일.

### 4.2 PostCardEditorial (A — Editorial Accent)

- 좌측 3.5px 카테고리 컬러 바 (hover 시 opacity 0.5 → 1)
- 상단 행: 카테고리 pill (아이콘+라벨, accent 배경) / 날짜 (우측)
- 제목: 17px semibold, hover 시 primary 컬러
- 요약: 14px, 2줄 clamp
- 하단: 태그 칩들 (muted 배경, 작은 글씨)
- hover: border-strong + 미세 shadow + translateY(-1px)

### 4.3 PostCardTimeline (B — Minimal Timeline)

- 2-column: 좌측 72px 타임라인 / 우측 카드
- 타임라인: 40px 원형 날짜(일), 아래 월 라벨, 수직 연결선
- 카드: 카테고리 아이콘(26px 정사각 배경) + 라벨 → 제목 → 요약 → 해시태그
- hover: 날짜 원의 border가 primary로 변경

**주의**: `PostList`가 타임라인 모드일 때 카드 래퍼 구조가 달라짐 (wrapper div에 timeline 영역 포함). `PostList`에서 분기 처리.

### 4.4 PostCardFloating (C — Floating Icon Card)

- 2-column grid: 좌측 44px 아이콘 박스 / 우측 콘텐츠
- 아이콘 박스: 12px 라운드, accent tint 배경 + 미세 accent border, hover 시 scale(1.05) + glow shadow
- 상단: 카테고리 라벨 / 날짜
- 제목 → 요약 → 태그 칩

## 5. PostList 분기

`components/blog/PostList.tsx`에서 `useSettings().cardLayout`을 읽어 렌더링 분기:

```tsx
switch (settings.cardLayout) {
  case 'editorial': return <PostCardEditorial post={post} />
  case 'timeline':  return <TimelineWrapper><PostCardTimeline post={post} /></TimelineWrapper>
  case 'floating':  return <PostCardFloating post={post} />
}
```

타임라인은 카드 사이 연결선이 필요하므로, `PostList` 레벨에서 별도 래퍼 처리. 마지막 카드의 연결선은 숨김.

`RecentPostsSection` (포스트 상세 하단 "최근 글")에서도 동일 분기 적용.

**참고**: `CategoryGroupedFeed`는 CLAUDE.md에 개념으로 언급되나 실제 컴포넌트 파일은 없음. 인덱스에서 category 그룹 뷰가 필요하면 `BlogHomeClient`가 직접 처리.

**주의**: 현재 `PostList`는 Server Component. `useSettings()` 사용으로 `'use client'`로 전환 필요. PostCard 3종도 모두 client component (hover 상태, settings context 의존).

## 6. 파일 구조 (신규/수정)

**신규:**
- `components/providers/SettingsProvider.tsx` — Context + hook
- `components/layout/SettingsFab.tsx` — FAB 버튼 + 패널 토글
- `components/layout/SettingsPanel.tsx` — 패널 컨테이너 + 섹션
- `components/blog/PostCardEditorial.tsx`
- `components/blog/PostCardTimeline.tsx`
- `components/blog/PostCardFloating.tsx`
- `lib/category-colors.ts` — 카테고리별 accent 컬러 맵

**수정:**
- `app/layout.tsx` — SettingsProvider + SettingsFab 추가
- `components/blog/PostList.tsx` — `'use client'` 전환 + cardLayout 분기 렌더링
- `components/blog/RecentPostsSection.tsx` — 동일 분기 적용
- `components/blog/PostCard.tsx` — 마이그레이션 완료 후 삭제

## 7. 다크모드 대응

- 카테고리 컬러: 라이트/다크 모두 동일 accent 사용 가능 (tint 배경만 다크 버전으로 조정)
- `category-colors.ts`에서 `light`/`dark` 쌍으로 정의하거나, CSS `color-mix`로 다크모드 tint 자동 생성
- FAB: `bg-foreground text-background`이므로 테마에 자동 반전
- 패널: 기존 `--background`, `--border` 등 토큰 사용으로 자동 대응

## 8. 제외 사항

- 라이트/다크 테마 토글은 이 설정 패널에 포함하지 않음 (기존 헤더 토글 유지)
- 모바일 반응형: 타임라인 레이아웃에서 좌측 타임라인 영역을 숨기고 날짜를 카드 내부로 이동 (breakpoint: md 미만)
- 애니메이션: CSS only. framer-motion 등 추가 의존성 없음
