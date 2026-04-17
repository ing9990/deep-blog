# 언어 설정 토글 + 카테고리/UI chrome 이중화

**Date**: 2026-04-18
**Status**: Approved
**Related**: `docs/superpowers/specs/2026-04-17-postcard-redesign-and-settings.md` (기존 `SettingsProvider` 인프라)

## 1. 목표

전역 설정 패널에 언어 토글(한국어/영어, 기본값 English)을 추가한다. 토글 즉시 **카테고리 라벨/설명**과 **블로그 UI chrome**(헤더 네비, 최근 글 heading, 검색 placeholder, 설정 패널 문구 등)이 해당 언어로 전환된다. 포스트 제목·요약·본문 번역과 URL 분리 / `hreflang` / sitemap 이중은 **후속 PR**에서 다룬다.

## 2. 결정 요약

| 항목 | 결정 | 이유 |
|---|---|---|
| 범위 | 토글 + 카테고리 `label`/`description` + 블로그 chrome | 토글이 즉시 체감되도록. 포스트 제목 이중화는 별도 PR |
| SEO | localStorage 단일 URL | 영어 본문이 없는 상태에서 URL 분리는 thin content 위험. 본문 이중화 시점에 활성화 |
| 번역 저장 | 중앙집중 dict + `useTranslation()` 훅 | literal union key로 누락 컴파일 에러 강제, 대응표 한 파일 |
| 기본값 | `language: 'en'` | 사용자 요청 |

## 3. 언어 상태 관리

### 3.1 `SettingsProvider` 확장

`components/providers/SettingsProvider.tsx`:

```ts
export type Language = 'en' | 'ko'

export interface Settings {
  cardLayout: CardLayout
  language: Language   // 신규
}

const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'editorial',
  language: 'en',
}
```

- 기존 `updateSetting(key, value)` 제네릭 시그니처 재사용 → `updateSetting('language', 'ko')`.
- localStorage 키 `deep-settings` 유지. `loadSettings()`의 `{ ...DEFAULT_SETTINGS, ...parsed }` 머지로 **기존 저장값에 `language: 'en'` 자동 주입** (마이그레이션 불필요).
- **값 검증**: `loadSettings()`에서 `parsed.language`가 `'ko' | 'en'` 외일 경우 `'en'`으로 치환.

### 3.2 SSR / hydration

- Server render는 항상 `DEFAULT_SETTINGS.language = 'en'`.
- Client hydrate 후 localStorage 값 반영 → 카테고리 라벨·UI chrome이 한 번 re-render.
- 기존 `cardLayout`과 동일 메커니즘이라 신규 flash 문제 아님. `suppressHydrationWarning` 불필요 (텍스트 내용 교체만).

## 4. 번역 인프라

### 4.1 파일

**신규:**
- `lib/i18n/messages.ts` — 번역 dict
- `lib/i18n/useTranslation.ts` — 훅

### 4.2 `messages.ts` 구조

```ts
export const MESSAGES = {
  'nav.home':              { ko: '홈',        en: 'Home' },
  'nav.tags':              { ko: '태그',      en: 'Tags' },
  'search.placeholder':    { ko: '검색...',   en: 'Search...' },
  'search.empty':          { ko: '검색 결과가 없습니다', en: 'No results' },
  'blog.recent':           { ko: '최근 글',    en: 'Recent Posts' },
  'blog.empty':            { ko: '조건에 맞는 글이 없습니다. 필터를 조정해보세요.',
                             en: 'No posts match your filter. Try adjusting filters.' },
  'tag.filter.title':      { ko: '태그',      en: 'Tags' },
  'tag.filter.all':        { ko: '전체',      en: 'All' },
  'settings.title':        { ko: '설정',      en: 'Settings' },
  'settings.close':        { ko: '설정 닫기', en: 'Close settings' },
  'settings.open':         { ko: '설정 열기', en: 'Open settings' },
  'settings.theme':        { ko: '테마',      en: 'Theme' },
  'settings.language':     { ko: '언어',      en: 'Language' },
  'settings.lang.ko':      { ko: '한국어',    en: 'Korean' },
  'settings.lang.en':      { ko: '영어',      en: 'English' },
  'settings.layout.editorial': { ko: 'Editorial', en: 'Editorial' },
  'settings.layout.timeline':  { ko: 'Timeline',  en: 'Timeline' },
  'settings.layout.floating':  { ko: 'Floating',  en: 'Floating' },
  'post.read-time.minutes':{ ko: '{n}분 읽기', en: '{n} min read' },
  // 실제 사용처 grep 결과에 따라 writing-plans 단계에서 추가
} as const

export type MessageKey = keyof typeof MESSAGES
```

- **Flat dotted key** — grep/검색 용이. nested보다 누락 추적이 쉬움.
- **`as const`** + `keyof` → `MessageKey`가 literal union. `t('typo')` 컴파일 에러.
- 값은 `{ ko, en }` 객체. 언어 추가 시 dict 구조만 확장, 호출부 변경 불필요.

### 4.3 `useTranslation.ts`

```ts
'use client'
import { useSettings } from '@/components/providers/SettingsProvider'
import { MESSAGES, type MessageKey } from './messages'

export function useTranslation() {
  const { settings } = useSettings()
  const t = (key: MessageKey, params?: Record<string, string | number>) => {
    let msg = MESSAGES[key][settings.language]
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replaceAll(`{${k}}`, String(v))
      }
    }
    return msg
  }
  return { t, lang: settings.language }
}
```

- 보간 지원: `t('post.read-time.minutes', { n: 3 })` → `'3분 읽기'` / `'3 min read'`.
- 클라이언트 전용 (`useSettings()` 의존). Server Component가 번역 필요하면 해당 leaf만 `'use client'` 전환 또는 부모에서 prop 주입.

## 5. 설정 패널 UI

`components/layout/SettingsPanel.tsx` 수정:

- 헤더 `<h3>설정</h3>` → `<h3>{t('settings.title')}</h3>`.
- 닫기 버튼 `aria-label="설정 닫기"` → `aria-label={t('settings.close')}`.
- 기존 **테마 섹션** 라벨 `테마` → `{t('settings.theme')}`.
- 테마 섹션 3개 옵션 라벨(`Editorial/Timeline/Floating`) → `t('settings.layout.editorial')` 등.
- **언어 섹션 신규 추가** (테마 섹션 아래 구분선 + 새 블록):

```tsx
<div className="border-t border-border" />
<div className="px-5 py-3">
  <div className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
    {t('settings.language')}
  </div>
  <div className="flex gap-2">
    {(['ko', 'en'] as const).map((l) => (
      <button
        key={l}
        type="button"
        onClick={() => updateSetting('language', l)}
        className={cn(
          'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[12.5px] font-semibold transition-all',
          lang === l
            ? 'border-primary bg-accent text-foreground'
            : 'border-border bg-background text-muted-foreground hover:border-border-strong',
        )}
      >
        {t(l === 'ko' ? 'settings.lang.ko' : 'settings.lang.en')}
      </button>
    ))}
  </div>
</div>
```

**디자인 원칙:**
- 테마 섹션의 활성 상태 토큰(`border-primary bg-accent`) 재사용 → 일관성.
- 2개 옵션 가로 균등 (`flex-1`). 아이콘 없이 텍스트만 — 언어 라벨이 곧 시각 신호.
- 패널 width 300px 그대로. 세로 성장만. 기존 `panel-in` 애니메이션 수용.
- 라벨/옵션 모두 현재 언어로 렌더 (영어 모드 → `Language / Korean / English`, 한국어 모드 → `언어 / 한국어 / 영어`).

`SettingsFab` aria-label도 `t('settings.open')`으로 교체.

## 6. 카테고리 데이터 이중화

### 6.1 `lib/categories.ts` 스키마

```ts
import type { Language } from '@/components/providers/SettingsProvider'

export interface CategoryMeta {
  id: CategoryId
  label:       { ko: string; en: string }
  description: { ko: string; en: string }
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: 'computer-science',
    label:       { en: 'Computer Science', ko: '컴퓨터 과학' },
    description: { en: 'OS, algorithms', ko: 'OS, 알고리즘' } },
  { id: 'data-structure',
    label:       { en: 'Data Structure', ko: '자료구조' },
    description: { en: 'B-Tree, hash maps, arrays, linked lists', ko: 'B-Tree, 해시맵, 배열, 연결 리스트' } },
  { id: 'language',
    label:       { en: 'Language', ko: '언어' },
    description: { en: 'Kotlin, TypeScript, Java, JVM', ko: 'Kotlin, TypeScript, Java, JVM' } },
  { id: 'database',
    label:       { en: 'Database', ko: '데이터베이스' },
    description: { en: 'MySQL, PostgreSQL, indexes', ko: 'MySQL, PostgreSQL, 인덱스' } },
  { id: 'frameworks',
    label:       { en: 'Frameworks', ko: '프레임워크' },
    description: { en: 'Spring Boot, Next.js', ko: 'Spring Boot, Next.js' } },
  { id: 'library',
    label:       { en: 'Library', ko: '라이브러리' },
    description: { en: 'Querydsl, JPA', ko: 'Querydsl, JPA' } },
  { id: 'ai',
    label:       { en: 'AI', ko: 'AI' },
    description: { en: 'LLM, machine learning, AI engineering', ko: 'LLM, 머신러닝, AI 엔지니어링' } },
  { id: 'knowledge',
    label:       { en: 'Knowledge', ko: '지식' },
    description: { en: 'Terms, concepts, fundamentals', ko: '용어, 개념, 기초 지식' } },
  { id: 'etc',
    label:       { en: 'ETC', ko: '그 외' },
    description: { en: 'Other topics', ko: '그 외 주제' } },
]
```

### 6.2 접근 패턴

기존 `getCategory(id)` 함수를 그대로 사용하고, 사용처에서 `.label[lang]` / `.description[lang]`로 직접 접근한다. 별도 helper 함수는 추가하지 않는다 (함수 계층 한 겹 추가 대비 이득 미미).

```tsx
const { lang } = useTranslation()
const meta = getCategory(post.category)
const label = meta.label[lang]
const desc  = meta.description[lang]
```

### 6.3 사용처 마이그레이션

- `CategoryMeta.label` 타입이 `string` → `{ ko; en }`로 변경되어 **기존 `meta.label`(string 기대) 참조 전부 컴파일 에러**. TypeScript가 누락 방지.
- 에러 목록을 따라가며 `meta.label[lang]`로 일괄 교체.
- 사용처가 Server Component이면:
  - leaf만 `'use client'` 분리 후 훅 사용, 또는
  - 부모에서 Client로 내리며 `label` 문자열을 prop으로 주입 (서버 렌더 언어 = `'en'` 고정이라 이 경우 hydration 시 재렌더).
- 정확한 파일 목록은 writing-plans 단계에서 `grep -r "meta\.label\|\.label,\|\.description\b" components/ app/ lib/`로 스캔.
- `groupPostsByCategory`의 `title.localeCompare(a.title, 'ko')`는 정렬 기준으로 유지 (언어와 무관한 실제 post 제목 비교).

## 7. 블로그 chrome 번역 적용

### 7.1 영역 카탈로그

| 영역 | 적용 키 (초안) | 비고 |
|---|---|---|
| 헤더 네비 | `nav.home`, `nav.tags` | Server Component면 `'use client'` 전환 또는 prop 주입 |
| `SearchDialog` | `search.placeholder`, `search.empty`, `search.title` | 이미 client |
| 인덱스 empty state | `blog.empty` | `BlogHomeClient` / `PostList` (client) |
| 태그 필터 | `tag.filter.title`, `tag.filter.all` | `TagFilterBar` (client 추정) |
| 카테고리 네비 | §6 helper로 처리 | 별도 key 불필요 |
| 최근 글 heading | `blog.recent` | `RecentPostsSection` (client) |
| 읽는 시간 | `post.read-time.minutes` | 보간 `{n}` |
| 설정 패널 | §5 참조 | 이미 client |
| 푸터 | 실제 내용 확인 후 키 추가 | writing-plans에서 scan |

### 7.2 날짜 포맷

`lib/utils.ts`의 `formatDate`가 UTC 기반. 언어 인자 추가:

```ts
export function formatDate(iso: string, lang: Language = 'en'): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() // 0-indexed
  const day = d.getUTCDate()

  if (lang === 'ko') {
    return `${y}년 ${m + 1}월 ${day}일`
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${MONTHS[m]} ${day}, ${y}`
}
```

호출부: `formatDate(post.date, lang)`. 기존 `formatDate(post.date)` 호출은 `lang` 기본값 `'en'`로 하위호환되지만, **모든 사용처를 lang 인자 전달로 업데이트**한다(클라이언트 컴포넌트면 `useTranslation().lang` 사용). 기존 한국어 전용 포맷과 출력이 달라지므로 회귀 검증 필요.

## 8. 예상 파일 구조

**신규:**
- `lib/i18n/messages.ts`
- `lib/i18n/useTranslation.ts`

**수정:**
- `components/providers/SettingsProvider.tsx` — `language` 필드, 기본값, 값 검증
- `components/layout/SettingsPanel.tsx` — `useTranslation` 사용, 언어 섹션 추가, 테마 라벨 번역
- `components/layout/SettingsFab.tsx` — aria-label 번역
- `lib/categories.ts` — 스키마 이중화 + helper
- `lib/utils.ts` (또는 `lib/reading-time.ts` 인근) — `formatDate(lang)` 시그니처 확장
- `components/blog/*` — 카드 3종, PostList, RecentPostsSection, TagFilterBar, CategoryNav, BlogHomeClient (grep 결과에 따름)
- `components/layout/Header.tsx`, `Footer.tsx` — 네비 라벨, 푸터 문구
- `components/blog/SearchDialog.tsx` — placeholder, empty state
- 카테고리 사용하는 app 라우트 (`app/categories/[id]/page.tsx` 등 — 존재 여부 scan)

**테스트:**
- `__tests__/i18n.test.ts` — `translate(key, lang, params)` 순수 함수로 분리했을 때 or `MESSAGES` dict 구조 검증
- `__tests__/categories.test.ts` — `CategoryMeta` 구조 변경 후 `groupPostsByCategory` 동작 유지

## 9. Fallback · 엣지 케이스

- **번역 키 누락** → `MessageKey` literal union + `MESSAGES[key][lang]` 접근이 타입 레벨에서 강제. 런타임 fallback 불필요.
- **카테고리 라벨 누락** → `{ ko; en }` 둘 다 required. 컴파일 에러.
- **localStorage 조작** (알 수 없는 값) → `loadSettings()`에서 `'ko' | 'en'`만 허용, 외는 `'en'`으로 치환.
- **SSR flash** → 기본값 `en`으로 서버 렌더 후 클라이언트 hydrate 시 localStorage 값 반영. 기존 `cardLayout`과 동일 트레이드오프.

## 10. 테스트 전략

**유닛 (vitest + jsdom):**
- `useTranslation` / `translate()` — 언어 전환 시 각 키의 값 반환, 보간 동작, 존재하지 않는 key는 타입 에러로 빌드 차단.
- `categories.ts` — `CategoryMeta` 변경 후 `getCategory`, `groupPostsByCategory` 동작 유지.
- `formatDate(iso, lang)` — 라이트 포맷 회귀 (`'ko'` 기본값 변경으로 기존 한국어 포맷 출력 확인).

**수동 (dev 서버 `http://blog.localhost:3010/`):**
1. 첫 방문 → 영어 표시 (헤더·인덱스·카드 pill·최근 글·설정 패널 전부).
2. 설정 FAB → 언어 섹션 → `한국어` 클릭 → 즉시 전환.
3. 새로고침 → 한국어 유지.
4. localStorage 수동 제거 → 영어로 복귀.
5. 라이트/다크 교차 — 언어 토글과 독립 동작.
6. 모바일 375px — 설정 패널 2섹션 세로 스크롤 필요한지 확인.

## 11. 제외 사항 (향후 PR)

- 포스트 제목/요약 이중화 (frontmatter `titleKo/titleEn`, `summaryKo/summaryEn` + 11개 포스트 마이그레이션)
- MDX 본문 이중화 (`*.ko.mdx` vs 단일 파일 분기)
- MDX 콜아웃 기본 타이틀 번역
- URL 분리 / `hreflang` / sitemap 두 버전 (본문 이중화 시점에 도입)
- 서버 사이드 쿠키 기반 언어 SSR (flash 제거 필요할 때)
- `blog-writer` 스킬 수정 (본문 이중화 PR과 묶음)
