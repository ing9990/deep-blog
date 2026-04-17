# MDX `<Tabs>` 컴포넌트 — 설계 스펙

**Date:** 2026-04-17
**Status:** Approved — ready for planning
**Owner:** blog author (ing9990)

---

## 1. 배경 & 동기

Anthropic 공식 문서([claude.ai/docs](https://claude.ai/docs))의 설치 가이드 페이지처럼, **하나의 논리적 주제**를 독자의 환경(OS / 도구 / 언어 버전)에 따라 **대안 경로**로 나누어 보여주는 UI 패턴이 필요하다.

### 블로그에서의 유스케이스

- 플랫폼별 명령어: macOS / Linux / Windows
- 언어별 예제: Java / Kotlin / TypeScript
- 도구별 설정: IntelliJ / VS Code / Vim
- 버전별 문법: Java 17 / Java 21

### 가치

본문 흐름을 끊지 않으면서 독자가 자신의 환경에 해당하는 내용만 읽게 한다.
독자의 맥락이 바뀔 때마다 모든 대안을 차례대로 나열하는 장문 섹션보다 훨씬 가독성이 높다.

---

## 2. 결정 요약

| 항목 | 결정 |
|---|---|
| MDX 문법 | `<Tabs group="os"><Tab label="macOS">...</Tab></Tabs>`, 자유 MDX children 허용 |
| 상태 scope | 페이지 내 그룹 동기화. `localStorage` 영속화 **안 함** |
| 식별자 | `label.toLowerCase().trim()`, 같은 `<Tabs>` 내 중복은 dev `console.warn` |
| 구현 | `@radix-ui/react-tabs` 래퍼 + `TabsGroupProvider` React Context |
| 스타일 | Underline 스타일, `--primary`(blue) 2px, 기존 shadcn 토큰만 |
| a11y | Radix 자동 처리 + `focus-visible:ring-ring` |
| Provider 위치 | `components/mdx/MDXContent.tsx` 최상위 (포스트당 scope 1개) |
| 테스트 | 정규화/children 순회 단위 테스트 + 샌드박스 포스트로 수동 회귀 |

---

## 3. MDX 작성 문법

### 3.1 기본 사용

```mdx
<Tabs group="os">
  <Tab label="macOS">
    ```bash
    curl -fsSL https://claude.ai/install.sh | bash
    ```
  </Tab>
  <Tab label="Linux">
    ```bash
    curl -fsSL https://claude.ai/install.sh | bash
    ```
  </Tab>
  <Tab label="Windows">
    ```powershell
    irm https://claude.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>
```

- `<Tab>` 안에는 **자유 MDX** 허용(텍스트, 코드블록, 표, Callout, KeywordLink, Visualization 등)
- 첫 번째 `<Tab>`이 기본 선택 (`defaultValue` 미지정 시)

### 3.2 `group` 동작

- `group="os"` 같이 명시하면 페이지 내 같은 `group` 값을 공유하는 모든 `<Tabs>`가 **함께 전환**된다
- `group` 미지정 시 해당 Tabs는 **독립** (로컬 state만)

### 3.3 `defaultValue` (선택)

```mdx
<Tabs group="os" defaultValue="linux">
  ...
</Tabs>
```

- 명시 시 해당 value로 시작
- 그룹이 이미 값을 가지고 있으면 **그룹 값이 우선** (페이지 내 일관성 우선)
- value는 `label`의 정규화된 형태(`"Linux"` → `"linux"`)

### 3.4 label 정규화 규칙

```ts
const toValue = (label: string) => label.toLowerCase().trim()
```

- `"macOS"` → `"macos"`
- `"  Linux "` → `"linux"`
- `"Native Install (Recommended)"` → `"native install (recommended)"`

**작성 규율:** 같은 `group` 내에서는 label 표기를 통일해야 한다(예: 항상 `"macOS"`로, `"Mac OS"` 금물).
다른 group(`group="os"` vs `group="ide"`)은 정규화된 값이 우연히 같아도 독립적이다.

---

## 4. 아키텍처

### 4.1 파일 구조 (신규/변경)

```
components/mdx/
├── Tabs.tsx                 # ← NEW: Tabs, Tab export
├── TabsGroupProvider.tsx    # ← NEW: Context + Provider
├── MDXContent.tsx           # ← 수정: 최상위에 Provider 래핑
└── components.tsx           # ← 수정: mdxComponents에 Tabs, Tab 등록

__tests__/
├── tabs-value.test.ts       # ← NEW: 정규화 유닛 테스트
└── tabs-children.test.ts    # ← NEW: children 순회 유닛 테스트

content/posts/
└── _tabs-sandbox.mdx        # ← NEW (draft: true): 수동 회귀용 샘플
```

### 4.2 컴포넌트 경계

```
[Server Component] MDXContent
  └─ [Client Component] TabsGroupProvider  ← "use client"
       └─ <MDX components={mdxComponents} />
            └─ [Client Component] Tabs      ← "use client"
                 └─ <Tab> (선언 전용, 렌더링 없음)
```

- `TabsGroupProvider`가 클라이언트 경계를 만들고, 그 **아래 children은 서버에서 렌더된 HTML**(Shiki pre/code, Callout, KeywordLink 등)이 그대로 hydrate된다
- `<Tab>`은 자체 렌더링하지 않고 `React.Children.toArray`로 수집되는 **선언 전용 컴포넌트**

### 4.3 렌더링 매핑

```
<Tabs group="os">              →  <RadixTabs.Root value={v} onValueChange={setV}>
  <Tab label="macOS">               <RadixTabs.List>
    ...                                <RadixTabs.Trigger value="macos">
  </Tab>                                 macOS
  <Tab label="Linux">...</Tab>         </Trigger>
</Tabs>                                ...
                                     </List>
                                     <RadixTabs.Content value="macos">...</Content>
                                     ...
                                   </RadixTabs.Root>
```

---

## 5. 데이터 흐름

### 5.1 `TabsGroupProvider`

```ts
type GroupState = {
  groups: Record<string, string>              // groupId → current value
  setGroup: (groupId: string, value: string) => void
}
const TabsGroupContext = createContext<GroupState | null>(null)
```

- Provider는 `useState<Record<string, string>>({})`로 상태를 보유
- `setGroup(id, v)` → `setState(prev => ({ ...prev, [id]: v }))`
- Provider는 **Client Component**이며, 포스트 본문 전체를 감싼다

### 5.2 `<Tabs>` 동작 로직

```
1. children에서 <Tab> 노드만 추출 → [{ label, value, node }]
2. group prop 있음?
   ├─ YES:
   │   const groupValue = ctx.groups[group]
   │   const current = (groupValue && tabs.some(t => t.value === groupValue))
   │                 ? groupValue
   │                 : (defaultValue ?? tabs[0].value)
   │   onValueChange = v => ctx.setGroup(group, v)
   └─ NO:
       useState(defaultValue ?? tabs[0].value)  (로컬만)
3. RadixTabs.Root로 controlled 렌더
4. (mount 시) groupValue가 없고 defaultValue가 있으면 setGroup으로 seeding
```

### 5.3 엣지 케이스

| 상황 | 동작 |
|---|---|
| 같은 `<Tabs>` 내 중복 label | dev 환경 `console.warn`, 첫 번째만 렌더. prod 경고 없음 |
| group에 있는 value가 현재 Tabs에 없음 | 첫 탭으로 fallback, 그룹 값은 건드리지 않음 (다른 블록 보호) |
| 빈 `<Tabs>` (Tab 자식 없음) | 아무것도 렌더하지 않음 |
| `<Tab>` 외 자식 (텍스트, 다른 컴포넌트) | 무시. dev `console.warn` |
| `label` 누락 | dev 환경 `console.warn`, `"unlabeled"`로 fallback 렌더 |
| `group` prop 있는데 Provider 밖에서 사용 | dev 환경 `console.warn`, 독립 모드(로컬 state)로 fallback |

---

## 6. 스타일

### 6.1 토큰

**기존 shadcn 토큰만 사용. 새 CSS 변수 추가 없음.**

| 슬롯 | 토큰 |
|---|---|
| 컨테이너 border | `--border` |
| 비활성 탭 텍스트 | `--muted-foreground` |
| 활성 탭 텍스트 | `--foreground` |
| 활성 탭 밑줄 | `--primary` |
| 포커스 ring | `--ring` |

### 6.2 Tailwind 클래스 (구현 지침)

- Root wrapper: `my-6 rounded-[14px] border border-border overflow-hidden`
- TabList: `flex gap-1 border-b border-border px-2 overflow-x-auto`
- Trigger:
  ```
  px-4 py-2.5 text-[14px] font-medium text-muted-foreground
  whitespace-nowrap -mb-px
  hover:text-foreground
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  data-[state=active]:text-foreground
  data-[state=active]:border-b-2 data-[state=active]:border-primary
  ```
- Content: `p-4 [&>:first-child]:mt-0 [&>:last-child]:mb-0`

### 6.3 prose-kr와의 상호작용

- Content 내부의 `pre`, `table`, `figure` 등은 **기존 `.prose-kr` 스타일을 그대로 상속** — 별도 override 없음
- `<article className="min-w-0">` + `max-width: 100%` 3종 세트가 상위에서 이미 overflow를 막고 있음 → Tabs 래퍼가 이를 깨지 않도록 `overflow-hidden` 유지
- `.prose-kr button` 전역 스타일은 존재하지 않음(grep 확인) → Radix Trigger(`<button>`)에 간섭 없음
- `.prose-kr a.keyword-link` 셀렉터는 `<button>`에 매치되지 않음 → 키워드 링크 스타일과 충돌 없음

### 6.4 모바일 (375px)

- TabList `overflow-x-auto` + Trigger `whitespace-nowrap` → 탭이 많거나 label이 길어도 세로로 꺾이지 않고 가로 스크롤
- 스크롤바는 `scrollbar-width: none` / `-webkit-scrollbar { display: none }`로 숨김 (기존 컴포넌트 관습 확인 필요, 없으면 Tailwind arbitrary value로 처리)

---

## 7. 접근성

- Radix가 처리: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`
- 키보드: `←/→` 탭 이동, `Home/End` 처음/끝, `Tab`으로 패널 진입
- `activationMode="automatic"` 기본 유지(포커스만 옮겨도 전환) — 탭 콘텐츠가 즉시 렌더 가능한 정적 내용이므로 자동 활성화가 자연스럽다
- 색만으로 상태를 구분하지 않음: 활성 탭은 `font-medium → data-[state=active]:`로 텍스트 색과 밑줄이 동시에 바뀜 + `aria-selected`
- Reduced motion: 탭 전환에 애니메이션 없음 → 별도 분기 불필요

---

## 8. 테스트 전략

### 8.1 단위 테스트 (Vitest)

**`__tests__/tabs-value.test.ts`**
- `toValue("macOS")` → `"macos"`
- `toValue("  Linux ")` → `"linux"`
- `toValue("Native Install (Recommended)")` → `"native install (recommended)"`
- `toValue("")` → `""`

**`__tests__/tabs-children.test.ts`**
- `<Tab>` 자식만 추출 (텍스트/다른 컴포넌트 필터)
- 중복 label 시 첫 번째만 유지
- `label` 누락 시 `"unlabeled"` fallback
- 빈 배열 입력 → 빈 배열 반환

순수 함수만 테스트 (DOM 불필요, `node` env 유지).

### 8.2 수동 회귀 (`content/posts/_tabs-sandbox.mdx`)

`draft: true` 샘플 포스트에 다음 케이스를 모두 담는다. **이 파일은 리포에 영구 잔존** — draft 필터가 `lib/posts.ts`에서 적용되어 공개 인덱스에 노출되지 않으며, 이후 Tabs 관련 회귀를 확인할 상시 레퍼런스로 사용한다.

1. `<Tabs group="os">` 2개 (설치 / 설정 경로) → 동기화 확인
2. `group` 없는 `<Tabs>` 2개 → 독립 동작 확인
3. `<Tabs>` 내부에 Shiki 코드블록 (`bash`, `powershell`)
4. `<Tabs>` 내부에 Markdown 테이블
5. `<Tabs>` 내부에 `<Callout>` + `<KeywordLink>`
6. 5개 이상 탭 (긴 label 포함) → 모바일 가로 스크롤 확인

### 8.3 수동 체크리스트 (dev 서버)

`PORT=3010 pnpm dev` 백그라운드 실행 후 `http://blog.localhost:3010/posts/_tabs-sandbox`:

- [ ] 라이트/다크 토글 — 밑줄이 `--primary`로 정상
- [ ] 모바일 375px — 가로 스크롤, 컨테이너 overflow 없음
- [ ] 그룹 동기화 — 한쪽 전환 시 다른 쪽 전환
- [ ] 독립 Tabs — 서로 영향 없음
- [ ] 탭 내부 Shiki/테이블/Callout/KeywordLink 정상 렌더
- [ ] 키보드 포커스 ring 가시성 + `←/→` 전환
- [ ] dev 로그에 hydration warning 없음

### 8.4 필수 검증 커맨드 (CLAUDE.md 정책)

- `pnpm type-check`
- `pnpm lint`
- `pnpm build` (변경 규모상 필요)

---

## 9. 의존성 추가

```
pnpm add @radix-ui/react-tabs
```

- 현재 `package.json`에 `@radix-ui/react-popover`, `react-select`, `react-slot`가 있어 **Radix 런타임은 이미 번들에 포함**. `react-tabs` 추가분은 소량
- shadcn 패턴 연장이며, 기존 `components/ui/{popover,select}.tsx`와 톤을 맞춘다

---

## 10. 비목표 (Out of Scope)

이번 설계에 **포함하지 않는** 항목들:

- `localStorage` 기반 영속화 (페이지 이동해도 선택 유지) — 필요해지면 storage 레이어만 추가
- URL hash/search param 동기화 (`?os=macos`) — 공유 링크 요구가 생길 때 별도 설계
- OS 자동 감지 (`navigator.userAgent`) — SSR hydration mismatch 위험 + UX 복잡도 증가
- 탭 비활성화(`disabled`) — 현재 블로그 포스트 유스케이스에 없음
- 세로 탭 / 좌측 탭 — 본문 가독성 흐름에 맞지 않음
- 탭 lazy loading — 블로그 콘텐츠 볼륨이 작아 불필요
- 애니메이션 전환 — 정적 콘텐츠에 오버엔지니어링

---

## 11. 불변식 / 회귀 방지 (CLAUDE.md 연동)

이 기능 추가로 인해 **깨지면 안 되는** 기존 규칙들:

1. `MDXContent`는 Server Component 유지 — Provider만 Client 경계
2. 3색 체계(blue / indigo / teal) 유지 — 새 색 없음
3. `<article className="min-w-0">` + prose figure/pre 3종 세트 유지 — Tabs wrapper가 이를 깨면 긴 코드블록 overflow 회귀
4. 인라인 코드/키워드 링크 스타일 간섭 없음
5. 새 CSS 변수 없음 (shadcn 토큰만 사용)
6. `content/posts/*.mdx` 직접 편집은 여전히 blog-writer 스킬 전용 (단, `_tabs-sandbox.mdx`는 개발 도구이므로 예외)

CLAUDE.md §6 "변경 금지 결정" 섹션에 **이번 작업으로 인한 신규 불변식** 추가 (spec → 이행 시점):

- `Tabs` / `Tab` children 순회 패턴: `React.Children.toArray`로 `Tab`만 필터. 외부 자식은 dev `console.warn`
- Provider는 `MDXContent` 최상위 1개. 블로그 레이아웃 최상위로 올리지 말 것 (포스트 간 state leak)
