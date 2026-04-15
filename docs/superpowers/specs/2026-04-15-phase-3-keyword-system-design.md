# Phase 3 — 키워드 자동 링크 시스템 디자인 명세

**작성일**: 2026-04-15
**대상 단계**: Phase 3 (CLAUDE.md §12 기준)
**선행 조건**: Phase 2 완료 (`phase-2-complete` 태그)
**관련 CLAUDE.md 섹션**: §5 키워드 자동 링크 시스템

---

## 1. 배경 및 목표

Backend Notes는 "본문의 기술 용어가 해당 용어를 심층적으로 다룬 글로 자동 링크되는" 위키형 지식 그래프를 지향한다(CLAUDE.md §1). Phase 3는 이 자동 링크 시스템의 빌드 타임 파이프라인과 런타임 UI를 구축한다.

### 달성 목표

1. MDX 파일 전체를 빌드 타임에 스캔해 `keyword → slug` 맵을 생성
2. Remark 플러그인이 각 MDX 파일의 text 노드에서 키워드를 찾아 링크로 치환
3. 치환된 링크는 `KeywordLink` 컴포넌트로 래핑되어 호버 시 글 제목/요약 프리뷰 표시
4. 런타임 비용 0 (키워드 맵은 빌드 타임에만 소비되고 출력은 정적 HTML)

### Phase 3의 경계

**포함**: 빌드 전 키워드 맵 생성, Remark 플러그인, 경계 규칙(한글/영문 이중), greedy matching, KeywordLink 컴포넌트 + shadcn Popover, 모바일에서 Popover 비활성화, TDD 기반 단위 테스트, Velite 통합 테스트.

**제외** (이월):
- HMR 지원 (dev 중 새 MDX 추가 시 자동 맵 재생성) — Phase 6 polish
- 키워드 변형/별칭 (`B-Tree` ↔ `B트리` ↔ `비트리`) — Phase 5 이후
- Aho-Corasick 등 고급 문자열 매칭 최적화 — YAGNI

---

## 2. 주요 결정 사항

브레인스토밍에서 확정된 결정.

### 2.1 Remark 플러그인으로 구현

MDAST 단계에서 변환한다. 이유: 코드 블록/기존 링크 제외 규칙이 MDAST 노드 타입(`code`, `inlineCode`, `link`)으로 선언적으로 표현되고, `rehype-pretty-code`가 HAST 단계에서 코드 블록 구조를 감싸기 전이라 탐지가 명확하다. `mdast-util-find-and-replace` 대신 `unist-util-visit-parents`로 직접 구현하면 greedy + claimed 범위 추적 로직을 테스트 가능한 순수 함수로 분리할 수 있다.

### 2.2 키워드 맵은 pre-build 스크립트로 생성

`scripts/generate-keyword-map.ts`가 `prebuild`/`predev`/`pretest` npm 훅으로 자동 실행되어 `lib/generated/keyword-map.ts`를 쓴다. 이 파일은 **커밋 대상**이다(이유: clean clone에서 즉시 빌드 가능, 로컬 전용 프로젝트에서 그래프 히스토리 추적 가치가 diff 노이즈 비용보다 큼). `velite.config.ts`가 이 파일을 `import`해 Remark 플러그인에 주입한다.

### 2.3 충돌 시 빌드 실패 (엄격)

같은 키워드가 두 글 이상에서 선언되면 `generate-keyword-map` 스크립트가 상세 에러 메시지(파일 경로, 충돌 키워드 목록)를 출력하고 `process.exit(1)`. CLAUDE.md §4.3의 "1:1 매핑" 원칙 위배를 즉시 알려주는 것이 늦게 발견하는 것보다 작성 흐름에 덜 방해된다. 우회 플래그는 YAGNI.

### 2.4 한글/영문 이중 경계 규칙

키워드 첫·끝 글자가 Latin이면 `/[A-Za-z0-9_]/` 경계, 한글(`/[\uAC00-\uD7A3]/`)이면 한글 경계, 혼합 키워드(`"Kafka 컨슈머"`)는 양쪽을 독립 판정. 이유: 한국어에서 키워드는 조사(`를/가/의/는/에/로`)와 결합해 등장하므로, 범용 `[A-Za-z0-9가-힣]` 경계 규칙을 쓰면 모든 실제 등장이 경계 실패로 배제된다. 이중 규칙이 유일한 현실적 해답이다.

### 2.5 모바일에서 Popover 비활성화

`@media (hover: hover)` 기반으로 데스크톱만 Popover 활성, 모바일은 일반 `<Link>`로 렌더. 이유: 모바일 2-탭 패턴(첫 탭 프리뷰, 둘째 탭 이동)은 "링크 = 즉시 이동" 멘탈 모델을 깨뜨린다. 구현은 Radix 이벤트 트리거를 조건부로 붙이는 대신, **두 벌 렌더링**(`hidden md:contents` + `md:hidden`)으로 단순하고 hydration-safe하게 처리.

### 2.6 shadcn Popover 도입

Phase 2에서 이미 `--popover`/`--popover-foreground` 토큰을 CSS에 정의해둔 이유가 바로 Phase 3에서 Radix Popover를 도입하기 위함이었다. 포커스 관리/키보드 접근성/포지셔닝(화면 가장자리 자동 뒤집기)/ESC 닫기/클릭 밖 닫기 등 Radix가 수 년간 다듬은 동작을 재발명하지 않는다.

### 2.7 테스트 범위 — 순수 함수 + MDAST 변환

Phase 2와 동일한 원칙. `lib/keyword-matcher.ts`는 100% TDD, Remark 플러그인은 `unified` 파이프라인 기반 MDAST 변환 테스트. UI(`KeywordLink`)는 `pnpm build` + dev 서버 수동 확인으로 방어. 예상 추가 테스트 ~38개.

---

## 3. 아키텍처

### 3.1 전체 데이터 흐름

```
[pnpm dev | build] 실행
       │
       ▼
prebuild 훅 → scripts/generate-keyword-map.ts
  1. content/posts/**/*.mdx 프론트매터 스캔 (gray-matter)
  2. draft: true 글 제외
  3. keyword → slug/title/summary 맵 생성
  4. 충돌 감지 — 있으면 상세 에러 출력 후 process.exit(1)
  5. lib/generated/keyword-map.ts에 TypeScript 상수로 쓰기
       │
       ▼
velite build
  - lib/generated/keyword-map.ts를 import
  - mdx.remarkPlugins의 remarkAutoLink에 주입
  - 각 MDX 파일 파싱 시:
    ├ text 노드를 visitParents로 순회
    ├ 조상 체인에 link/inlineCode/code 있으면 스킵
    ├ findMatches로 greedy + 경계 규칙 매칭
    ├ 한 글 안에서 같은 키워드는 첫 등장만 링크
    ├ currentSlug와 매핑된 키워드는 스킵 (자기 링크 방지)
    └ text 노드를 [text, link, text, link, ...]로 치환
       │
       ▼
next build / next dev
  - 컴파일된 MDX 본문에 <a href="/posts/..." data-keyword-link="true">X</a> 포함
  - 런타임에 mdxComponents.a가 이 속성을 감지해 <KeywordLink>로 래핑
  - 데스크톱: Radix Popover로 제목/요약 프리뷰
  - 모바일: 일반 링크
```

### 3.2 4계층 분리

| 계층 | 파일 | 책임 |
|---|---|---|
| 순수 함수 | `lib/keyword-matcher.ts` | `hasBoundary`, `findMatches` — I/O 없음, 100% TDD |
| AST 변환 | `plugins/remark-auto-link.ts` | MDAST text → link 노드 치환, ancestor stack 관리 |
| I/O | `scripts/generate-keyword-map.ts` | 파일 스캔, 프론트매터 파싱, 맵 생성, TS 파일 쓰기 |
| UI | `components/blog/KeywordLink.tsx` | shadcn Popover 래퍼, 데스크톱/모바일 이중 렌더 |

네 계층은 상호 독립적으로 테스트·교체 가능하다.

---

## 4. 파일 구조

```
scripts/
└── generate-keyword-map.ts      [신규] pre-build 스크립트

lib/
├── generated/
│   └── keyword-map.ts           [신규, 커밋 대상] 빌드 타임 생성물
├── keyword-matcher.ts           [신규] 순수 매칭 함수
└── posts.ts                     (기존)

plugins/
└── remark-auto-link.ts          [신규] Remark 플러그인

components/
├── blog/
│   └── KeywordLink.tsx          [신규, 'use client'] Popover 래퍼
├── mdx/
│   └── components.tsx           [수정] a 오버라이드에 data-keyword-link 분기
└── ui/
    └── popover.tsx              [신규, shadcn CLI]

velite.config.ts                 [수정] remarkPlugins 추가 + keyword-map import
package.json                     [수정] prebuild/predev/pretest 훅 + tsx/gray-matter
content/posts/
└── b-tree-structure.mdx         [신규] 키워드 링크 검증용 대상 글

tests/
├── keyword-matcher.test.ts      [신규, ~18 케이스]
├── generate-keyword-map.test.ts [신규, ~8 케이스]
├── remark-auto-link.test.ts     [신규, ~10 케이스]
└── velite-build.test.ts         [수정, +2 케이스]
```

**Phase 3 이후 신규 코드 파일**: 5개 (+ 1개 수정).
**Phase 3 이후 신규 테스트 파일**: 3개 (+ 1개 수정).
**예상 총 테스트 수**: Phase 1 17 + Phase 2 29 + Phase 3 38 = **~84**.

---

## 5. `scripts/generate-keyword-map.ts` 명세

### 5.1 책임

1. `content/posts/**/*.mdx` 전체 스캔
2. 각 파일의 frontmatter에서 `slug`, `title`, `summary`, `keywords`, `draft` 추출 (`gray-matter`)
3. `draft: true` 제외
4. `keyword → { slug, title, summary }` 맵 생성
5. 충돌 검사 후 실패 또는 성공
6. `lib/generated/keyword-map.ts`에 TypeScript 상수로 직렬화

### 5.2 출력 파일 포맷

```typescript
// lib/generated/keyword-map.ts
// DO NOT EDIT — generated by scripts/generate-keyword-map.ts

export interface KeywordEntry {
  slug: string
  title: string
  summary: string
}

export const KEYWORD_MAP: ReadonlyMap<string, KeywordEntry> = new Map([
  ['B-Tree', { slug: 'b-tree-structure', title: 'B-Tree 구조', summary: '...' }],
  ['Kafka Consumer', { slug: 'kafka-consumer-group', title: '...', summary: '...' }],
])

/** Greedy matching용 — 긴 키워드부터 정렬 */
export const KEYWORDS_BY_LENGTH: readonly string[] = [
  'Kafka Consumer Group',
  'Kafka Consumer',
  'B-Tree',
]

/** KeywordLink가 slug로 entry 조회하는 역방향 맵 */
export const SLUG_TO_ENTRY: ReadonlyMap<string, KeywordEntry> = new Map([
  ['b-tree-structure', { slug: 'b-tree-structure', title: 'B-Tree 구조', summary: '...' }],
])
```

세 가지를 함께 export하는 이유:
- `KEYWORD_MAP` — remark 플러그인이 slug 조회에 사용
- `KEYWORDS_BY_LENGTH` — greedy matching 순서 미리 정렬
- `SLUG_TO_ENTRY` — KeywordLink가 `href="/posts/<slug>"`에서 O(1)로 Popover 데이터 조회

### 5.3 충돌 에러 포맷

```
[keyword-map] KEYWORD CONFLICT DETECTED

Keyword "B-Tree" is declared in 2 files:
  - content/posts/database-index.mdx (slug: database-index)
  - content/posts/b-tree-structure.mdx (slug: b-tree-structure)

Keyword "인덱스" is declared in 2 files:
  - content/posts/database-index.mdx (slug: database-index)
  - content/posts/postgres-indexing.mdx (slug: postgres-indexing)

Resolution: Each keyword may only be declared in one post's frontmatter.
Aborting build.
```

### 5.4 구조

순수 함수를 최대한 분리해 단위 테스트 가능하게 한다:

```typescript
interface ScannedPost {
  file: string
  slug: string
  title: string
  summary: string
  keywords: string[]
}

// I/O — 테스트 제외
async function scanPosts(postsDir: string): Promise<ScannedPost[]>

// 순수 — 테스트 대상
export function buildMap(posts: ScannedPost[]): {
  map: Map<string, KeywordEntry>
  conflicts: Array<{ keyword: string; files: Array<{ file: string; slug: string }> }>
}

// 순수 — 테스트 대상
export function formatConflictError(
  conflicts: Array<{ keyword: string; files: Array<{ file: string; slug: string }> }>,
): string

// 순수 — 테스트 대상
export function serializeMap(map: Map<string, KeywordEntry>): string
```

`main()`은 이 함수들을 조합만 한다.

---

## 6. `lib/keyword-matcher.ts` 명세

### 6.1 인터페이스

```typescript
export interface Match {
  start: number     // text 내 시작 인덱스
  end: number       // text 내 끝 인덱스 (exclusive)
  keyword: string   // 원본 text에서 잘라낸 값 (대소문자 보존)
  slug: string      // 연결할 글 slug
}

export function findMatches(
  text: string,
  keywordsByLength: readonly string[],
  keywordToSlug: ReadonlyMap<string, string>,
  excludeSlug: string,
): Match[]

export function hasBoundary(
  text: string,
  keyword: string,
  start: number,
): boolean
```

### 6.2 `hasBoundary` 구현

경계 규칙은 한글/영문 이중으로 동작하되, **한글 키워드의 뒤 경계는 완화** 처리한다 (이유는 §6.4 참조).

```typescript
const HANGUL = /[\uAC00-\uD7A3]/
const LATIN_BOUNDARY = /[A-Za-z0-9_]/

export function hasBoundary(
  text: string,
  keyword: string,
  start: number,
): boolean {
  const end = start + keyword.length
  const prev = start > 0 ? text[start - 1] : ''
  const next = end < text.length ? text[end] : ''

  const firstChar = keyword[0]
  const lastChar = keyword[keyword.length - 1]

  // 앞 경계 — 엄격
  const prevOk =
    LATIN_BOUNDARY.test(firstChar) ? !LATIN_BOUNDARY.test(prev) :
    HANGUL.test(firstChar)         ? !HANGUL.test(prev) :
    true

  // 뒤 경계 — Latin은 엄격, 한글은 완화 (조사 허용)
  const nextOk =
    LATIN_BOUNDARY.test(lastChar) ? !LATIN_BOUNDARY.test(next) :
    HANGUL.test(lastChar)         ? true :
    true

  return prevOk && nextOk
}
```

### 6.3 `findMatches` 알고리즘

1. `claimed[text.length]` boolean 배열 초기화 (false)
2. `keywordsByLength`를 순회 (긴 키워드부터)
3. 각 키워드에 대해:
   a. `keywordToSlug.get(keyword)`가 `excludeSlug`와 같으면 스킵
   b. 대소문자 무시 `indexOf`로 등장 위치 찾기
   c. 범위가 `claimed`와 겹치면 스킵 (이미 더 긴 키워드가 차지)
   d. `hasBoundary` 실패 시 스킵
   e. 매치 추가, `claimed` 범위 마킹
4. 결과를 `start` 오름차순 정렬해 반환

복잡도: O(K × T) — K는 키워드 수, T는 텍스트 길이. 실제 규모(K < 100, T < 10KB per text 노드)에서 무시 가능.

### 6.4 경계 규칙 설계 배경 (한글 조사 처리)

한국어 기술 문서에서 키워드는 거의 항상 조사(`를/을/가/이/은/는/의/에/로/...`)와 결합해 등장한다. 한글 키워드의 **뒤 경계를 엄격히** 적용하면(`!HANGUL.test(next)`) `"인덱스를 사용"`의 `인덱스`가 뒤의 `를`에 가로막혀 탈락해 **실제 본문의 대부분이 링크 안 되는 문제**가 발생한다.

반면 `"재인덱싱"`처럼 키워드 **앞**에 한글이 붙는 경우는 "접두사 + 어간"의 일부일 가능성이 높아 오탐의 위험이 있다.

**비대칭 규칙**으로 해결:
- **한글 앞 경계**: 엄격 (`!HANGUL.test(prev)`) — `"재인덱싱"`의 `인덱스` 탈락
- **한글 뒤 경계**: 완화 (항상 통과) — `"인덱스를"`의 `인덱스` 매치

**완화 규칙의 예외 처리**: 오탐(예: `"인덱스"`가 `"인덱스쓰레기"` 같은 복합 단어의 일부로 매칭)은 작성자가 keywords 배열에 복합 단어를 별도 키워드로 등록하면 greedy matching이 자동으로 긴 쪽을 우선한다. 조사 리스트를 하드코딩하는 방식은 `~라는/~으로/~에서의` 같은 복합 조사까지 커버해야 해서 유지보수 비용이 크고, 완화 규칙보다 우위가 명확하지 않다.

**결론**: §6.2 코드가 최종 규칙. 단순하고 현실에서 동작한다.

### 6.5 핵심 테스트 케이스

- `"B-Tree를 사용"` → `B-Tree` 매치 (뒤 `를`이 한글 → Latin 끝 경계: 한글은 Latin 아니므로 통과)
- `"AB-Tree"` → `B-Tree` 탈락 (앞 `A`가 Latin → Latin 앞 경계 실패)
- `"인덱스를 사용"` → `인덱스` 매치 (뒤 경계 완화)
- `"인덱스가 빠른"` → `인덱스` 매치
- `"재인덱싱"` + 키워드 `인덱스` → 탈락 (앞 `재`가 한글 → 한글 앞 경계 실패)
- `"인덱스"` + 본문 `"인덱스쓰레기"` → 매치 (완화 규칙 오탐 — 작성자가 필요하면 `인덱스쓰레기`를 별도 키워드로 등록해 해결)
- `"Kafka Consumer Group"`이 있을 때 본문 `"Kafka Consumer Group 리밸런싱"` → `Kafka Consumer Group` 매치, `Kafka`·`Consumer`·`Group`은 `claimed` 범위 겹침으로 제외

---

## 7. `plugins/remark-auto-link.ts` 명세

### 7.1 인터페이스

```typescript
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

export interface RemarkAutoLinkOptions {
  keywordsByLength: readonly string[]
  keywordToSlug: ReadonlyMap<string, string>
}

// currentSlug는 옵션이 아니라 플러그인이 VFile의 파일 경로에서 직접 유도 (§7.5 참고)
const remarkAutoLink: Plugin<[RemarkAutoLinkOptions], Root>

export default remarkAutoLink
```

### 7.2 동작

`unist-util-visit-parents`로 `text` 노드를 순회한다. 각 방문 시:

1. **Ancestor 체크**: 조상 체인에 `link`, `inlineCode`, `code` 중 하나라도 있으면 스킵 (`return`)
2. **매칭**: `findMatches(node.value, keywordsByLength, keywordToSlug, currentSlug)`
3. **중복 필터**: visitor 외부 `Set<string> usedKeywords`로 한 글에서 같은 키워드(대소문자 무시) 첫 등장만 유지
4. **치환**: 매치가 있으면 `splitTextNode`로 `[text, link, text, link, text]` 배열 생성, parent.children에 splice
5. **재방문 방지**: `return [SKIP, index + newNodes.length]` — visitor에게 새 노드들을 건너뛰고 그 다음부터 방문하도록 지시

### 7.3 `splitTextNode`

```typescript
function splitTextNode(
  node: Text,
  matches: Match[],
  keywordToSlug: ReadonlyMap<string, string>,
): Array<Text | Link> {
  const result: Array<Text | Link> = []
  let cursor = 0

  for (const match of matches) {
    // 매치 앞의 text
    if (match.start > cursor) {
      result.push({ type: 'text', value: node.value.slice(cursor, match.start) })
    }
    // 매치를 link 노드로
    result.push({
      type: 'link',
      url: `/posts/${match.slug}`,
      title: null,
      children: [{ type: 'text', value: match.keyword }],
      data: {
        hProperties: {
          'data-keyword-link': 'true',
        },
      },
    })
    cursor = match.end
  }

  // 마지막 매치 뒤 trailing text
  if (cursor < node.value.length) {
    result.push({ type: 'text', value: node.value.slice(cursor) })
  }

  return result
}
```

### 7.4 `data.hProperties`

`data.hProperties`는 `mdast-util-to-hast`가 HAST로 변환할 때 추가 HTML 속성으로 투영하는 표준 확장 포인트다. 결과적으로 컴파일된 MDX는 `<a href="/posts/b-tree-structure" data-keyword-link="true">B-Tree</a>` 형태가 되고, `components/mdx/components.tsx`의 `a` 오버라이드가 이 속성을 감지해 `KeywordLink`로 래핑한다.

### 7.5 `currentSlug` 주입 — 파일 경로 basename 전략

Remark 플러그인은 **현재 파일이 어떤 slug인지** 알아야 자기 링크를 방지할 수 있다. 하지만 `mdx.remarkPlugins` 설정은 모든 파일에 동일한 플러그인 인스턴스를 적용한다.

**해결**: 플러그인이 unified에서 받는 두 번째 인자 `file`(VFile)의 `file.history[0]`에서 파일 경로를 추출하고 **basename에서 확장자를 제거**해 `currentSlug`로 사용한다. 이는 Velite의 `s.slug('post')` 기본 동작(파일 경로 basename을 slug로 사용)과 정확히 일치하므로 매핑이 1:1로 보장된다.

```typescript
// plugins/remark-auto-link.ts
import { basename, extname } from 'path'

const remarkAutoLink: Plugin<[RemarkAutoLinkOptions], Root> = (options) => {
  return (tree, file) => {
    const filePath = file.history[0] ?? file.path ?? ''
    const currentSlug = basename(filePath, extname(filePath))
    // currentSlug로 findMatches의 excludeSlug 파라미터에 전달
    // ...
  }
}
```

이 전략의 장점:
1. Velite API에 의존하지 않음 — VFile의 `history` 필드는 unified/vfile의 표준 속성
2. 테스트 시점에서도 `new VFile({ path: 'content/posts/b-tree-structure.mdx', value: '...' })` 같은 식으로 간단히 주입 가능
3. Velite 0.x → 1.x 업그레이드 시에도 영향 없음

작성자가 `slug` frontmatter 필드를 파일명과 다르게 수동 지정하는 경우는 CLAUDE.md §4.1에서 "slug는 URL 경로"로 정의되어 있고 실무상 파일명과 일치하므로 문제 없음. 예외가 필요하면 Phase 3 이후 요청에 따라 확장.

### 7.6 `velite.config.ts` 통합

```typescript
import { KEYWORDS_BY_LENGTH, KEYWORD_MAP } from './lib/generated/keyword-map'
import remarkAutoLink from './plugins/remark-auto-link'

// KEYWORD_MAP에서 slug만 추출한 Map<string, string>
const keywordToSlug = new Map(
  Array.from(KEYWORD_MAP.entries()).map(([kw, entry]) => [kw, entry.slug]),
)

// ... posts 컬렉션 정의 (기존 유지) ...

export default defineConfig({
  // ... root, output, collections 기존 유지
  mdx: {
    remarkPlugins: [
      [remarkAutoLink, { keywordsByLength: KEYWORDS_BY_LENGTH, keywordToSlug }],
    ],
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, { /* 기존 */ }]],
  },
})
```

`currentSlug`는 옵션으로 전달되지 않는다 — 플러그인이 VFile에서 직접 읽는다(§7.5).

---

## 8. `components/blog/KeywordLink.tsx` 명세

### 8.1 Props

```tsx
interface KeywordLinkProps {
  href: string         // "/posts/b-tree-structure"
  children: ReactNode  // 키워드 텍스트
}
```

### 8.2 구조

데스크톱/모바일 이중 렌더:

```tsx
'use client'

import Link from 'next/link'
import { SLUG_TO_ENTRY } from '@/lib/generated/keyword-map'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function KeywordLink({ href, children }: KeywordLinkProps) {
  const slug = href.replace(/^\/posts\//, '')
  const entry = SLUG_TO_ENTRY.get(slug)

  return (
    <>
      <span className="hidden md:contents">
        <Popover>
          <PopoverTrigger asChild>
            <Link
              href={href}
              className="text-keyword underline decoration-dotted underline-offset-4 transition-colors hover:bg-keyword-bg rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {children}
            </Link>
          </PopoverTrigger>
          {entry && (
            <PopoverContent side="top" align="start" sideOffset={6} className="w-[320px] p-4">
              <p className="text-sm font-semibold leading-tight text-foreground">
                {entry.title}
              </p>
              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                {entry.summary}
              </p>
            </PopoverContent>
          )}
        </Popover>
      </span>

      <Link
        href={href}
        className="md:hidden text-keyword underline decoration-dotted underline-offset-4"
      >
        {children}
      </Link>
    </>
  )
}
```

### 8.3 `hidden md:contents` + `md:hidden` 이중 렌더

- **데스크톱 (`md` 이상)**: `hidden md:contents` 래퍼가 `display: contents`로 전환되어 레이아웃 flow에 영향을 주지 않으면서 Popover가 trigger를 감싼다. 동시에 `md:hidden` 폴백은 숨겨진다.
- **모바일 (`md` 미만)**: `hidden md:contents` 전체가 숨겨지고, `md:hidden` 폴백(일반 `<Link>`)만 보인다.

Radix Popover의 `PopoverContent`는 기본적으로 lazy 마운트되므로 모바일 뷰포트에서도 실제 DOM 삽입은 발생하지 않는다. 번들 크기에만 기여한다.

### 8.4 `components/mdx/components.tsx` 업데이트

```tsx
import { KeywordLink } from '@/components/blog/KeywordLink'
import type { AnchorHTMLAttributes } from 'react'

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  'data-keyword-link'?: string
}

export const mdxComponents = {
  h1: /* 기존 */,
  a: ({ href, children, ...props }: AnchorProps) => {
    if (props['data-keyword-link'] === 'true' && typeof href === 'string') {
      return <KeywordLink href={href}>{children}</KeywordLink>
    }
    return (
      <a
        href={href}
        className="text-primary underline decoration-dotted underline-offset-4"
        {...props}
      >
        {children}
      </a>
    )
  },
}
```

---

## 9. 테스트 전략

### 9.1 `tests/keyword-matcher.test.ts` (~18 케이스)

**`hasBoundary`** (~8):
- 영문 키워드 앞 경계 성공/실패 (앞이 기호 vs 영문자)
- 영문 키워드 뒤 경계 성공/실패
- 한글 키워드 앞 경계 성공 (앞이 기호/영문) / 실패 (앞이 한글)
- 한글 키워드 뒤 경계 — 항상 성공 (완화 규칙)
- 혼합 키워드 (`"Kafka 컨슈머"`) 양쪽 경계 독립 판정
- 문자열 시작(`start === 0`) / 끝(`end === text.length`)

**`findMatches`** (~10):
- 빈 텍스트 / 빈 keywords
- 단일 영문 키워드 매치
- 단일 한글 키워드 매치 + 조사
- 다중 키워드, greedy 우선 (`"Kafka Consumer Group"` > `"Kafka"`)
- 이미 차지된 범위 겹침 회피
- 경계 실패 제외 (`"AB-Tree"`, `"재인덱싱"`)
- `excludeSlug` 제외 (자기 링크)
- 대소문자 무시 (`"kafka를"` 본문 + `"Kafka"` 키워드 → 매치, `keyword: "kafka"` 보존)
- 빈 매치 결과 (매칭 없음)
- 매치 결과 start 오름차순 정렬 확인

### 9.2 `tests/generate-keyword-map.test.ts` (~8)

**`buildMap`** (~5):
- 단일 글
- 여러 글 + 중복 없음
- `draft: true` 제외
- 충돌 감지 (2회)
- 충돌 누적 (3회 이상 — 동일 키워드 3파일)

**`serializeMap`** (~2):
- `KEYWORDS_BY_LENGTH`가 긴 것부터 정렬
- 특수 문자(따옴표, 백슬래시) 이스케이프

**`formatConflictError`** (~1):
- 충돌 1건 메시지에 키워드·파일 경로·slug 포함

### 9.3 `tests/remark-auto-link.test.ts` (~10)

`unified().use(remarkParse).use(remarkAutoLink, opts).use(remarkStringify).process(markdown)` 파이프라인:

- 단순 텍스트에서 키워드 치환
- 코드 블록 내부 키워드 보존 (` ```B-Tree``` `)
- 인라인 코드 내부 키워드 보존 (`` `B-Tree` ``)
- 이미 링크 안의 키워드 보존 (`[B-Tree](x)`)
- 중첩 구조: `**B-Tree**`에서 text 자식 노드 치환
- `currentSlug` 제외: `b-tree-structure.mdx` 본문의 `"B-Tree"` 보존
- 한 글에서 같은 키워드 첫 등장만 링크 (두 번째는 plain text)
- 여러 키워드 혼합 (`"B-Tree와 Kafka를..."`)
- 생성된 link 노드에 `data.hProperties['data-keyword-link'] === 'true'`
- 경계 실패 케이스 (`"AB-Tree"`)

### 9.4 `tests/velite-build.test.ts` 추가 (+2)

- 빌드된 `posts[*].body` 문자열에 `data-keyword-link="true"`가 포함되는 글 최소 1개 이상 존재
- `posts[*].body`에서 자기 slug로의 링크 부재 확인 (`/posts/<self-slug>` 패턴 미검출)

---

## 10. `package.json` 변경

```json
{
  "scripts": {
    "prebuild": "tsx scripts/generate-keyword-map.ts",
    "predev": "tsx scripts/generate-keyword-map.ts",
    "pretest": "tsx scripts/generate-keyword-map.ts",
    "generate-keyword-map": "tsx scripts/generate-keyword-map.ts",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "velite build && vitest run",
    "test:unit": "vitest run",
    "velite": "velite build",
    "velite:dev": "velite dev"
  },
  "devDependencies": {
    "tsx": "^4",
    "gray-matter": "^4"
  }
}
```

`tsx`와 `gray-matter`가 이미 들어가 있지 않으면 추가.

---

## 11. CLAUDE.md 업데이트 계획

Phase 3 완료 시점에:

- **§5 키워드 자동 링크 시스템**: 현재 설계 설명만 있는 내용을 실제 구현 경로(`lib/keyword-matcher.ts`, `plugins/remark-auto-link.ts`, `scripts/generate-keyword-map.ts`, `components/blog/KeywordLink.tsx`)로 구체화.
- **§12 작업 우선순위**: Phase 3을 완료로 표시, 태그 `phase-3-complete` 언급.
- **§15 (신규) Phase 3 구현 현황**: §13/§14와 같은 포맷으로 존재 파일 / 의사결정 / 명령어 / 미결 사항 / 태그 기록.

---

## 12. 구현 작업 순서 (6단계)

각 단계 끝에 `pnpm build` + `pnpm test` 녹색 유지.

### 1단계 — `lib/keyword-matcher.ts` (TDD)
1. `tests/keyword-matcher.test.ts` 작성 (18 케이스)
2. `lib/keyword-matcher.ts` 구현
3. Commit

### 2단계 — `scripts/generate-keyword-map.ts`
1. `pnpm add -D tsx gray-matter` (없으면)
2. 스크립트 구현 + 내부 순수 함수 export
3. `tests/generate-keyword-map.test.ts` 작성 (8 케이스)
4. `package.json` scripts 업데이트
5. 수동 실행 → `lib/generated/keyword-map.ts` 생성 확인
6. Commit

### 3단계 — `plugins/remark-auto-link.ts` (TDD)
1. 플러그인 구현
2. `tests/remark-auto-link.test.ts` 작성 (10 케이스)
3. `velite.config.ts`에 `remarkPlugins` 배열 추가
4. `currentSlug` 주입 방식 실측 (VFile data 또는 파일명)
5. `pnpm velite` → 컴파일된 body에 링크 포함 확인
6. `tests/velite-build.test.ts`에 2 케이스 추가
7. Commit

### 4단계 — shadcn Popover + `KeywordLink`
1. `pnpm dlx shadcn@latest add popover`
2. `components/blog/KeywordLink.tsx` 구현
3. `components/mdx/components.tsx` `a` 오버라이드 업데이트
4. `pnpm build` + type-check
5. Commit

### 5단계 — 검증용 `b-tree-structure.mdx` + hello-world 연동
1. `content/posts/b-tree-structure.mdx` 생성 (frontmatter `keywords: ["B-Tree"]`)
2. `hello-world.mdx`의 기존 frontmatter keywords에서 충돌 회피 (hello-world의 `"Hello World"` 키워드 그대로 유지, 본문에 `"B-Tree"` 텍스트 포함해서 링크 생성 대상이 되도록 조정)
3. `pnpm velite` → `posts[0].body`에 `/posts/b-tree-structure` 링크 포함 확인
4. `pnpm dev`로 데스크톱/모바일 뷰포트 수동 검증
5. Commit

### 6단계 — CLAUDE.md 업데이트 + `phase-3-complete` 태그
1. §5 실제 경로 반영
2. §12 Phase 3 완료 표시
3. §15 신규 섹션 작성
4. Commit
5. `git tag phase-3-complete`

---

## 13. 완료 기준 (DoD)

- [ ] `pnpm build` 성공
- [ ] `pnpm test` ~84 테스트 녹색
- [ ] `pnpm type-check` 에러 0
- [ ] `pnpm lint` 에러 0
- [ ] dev 서버 수동 검증:
  - `hello-world` 본문의 "B-Tree" 텍스트가 점선 밑줄 + 인디고 색
  - 데스크톱 호버 시 Popover (제목 + 요약) 표시
  - 모바일 뷰포트(375px)에서 Popover 없이 일반 링크처럼 동작
  - `b-tree-structure` 본문의 "B-Tree"는 링크되지 않음 (자기 링크 방지)
  - 코드 블록 내부의 "B-Tree"는 링크되지 않음
  - `"Kafka Consumer Group"` > `"Kafka"` greedy matching 동작
  - 라이트/다크 모드에서 `--keyword` 토큰 적용
- [ ] CLAUDE.md §5/§12/§15 업데이트
- [ ] `phase-3-complete` 태그 부여

---

## 14. Phase 이후로 이월

- HMR 지원 (dev 중 키워드 맵 자동 재생성) — Phase 6
- 키워드 변형/별칭 (`B-Tree` ↔ `B트리`) — Phase 5+
- Aho-Corasick 매칭 최적화 — 성능 문제 발생 시 Phase 6
- 키워드 역링크 표시 ("이 글을 참조하는 글들") — Phase 5 관련 글 추천에 흡수

---

## 15. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|---|---|---|
| `currentSlug`를 VFile data에서 못 읽음 | 플러그인 구현 지연 | 1단계 구현 초기에 실측. 실패 시 파일명 기반 폴백 즉시 적용 |
| Radix Popover가 모바일 번들 포함 | 번들 크기 증가 | 실측 후 8KB 내외면 수용. 문제 시 `dynamic import`로 데스크톱만 로드 |
| 한글 조사 완화 규칙의 오탐 | 의도치 않은 키워드 매치 | 작성자가 문제 있는 키워드는 별도 변형으로 분리. 최악 케이스도 독자 경험 파괴적이지 않음 |
| `lib/generated/keyword-map.ts` 커밋 시 diff 노이즈 | 키워드 변경 시마다 파일 변경 | 수용 — 히스토리 추적 가치가 더 큼 |
| greedy + claimed O(K×T) 최악 성능 | 장문 글에서 빌드 지연 | 실측 후 1초 미만이면 무시. 문제 시 Aho-Corasick 도입 |
| Velite 0.2의 `remarkPlugins` 지원 검증 부족 | 설정이 무시될 가능성 | 1단계 구현에서 실측 우선 확인 |
| `display: contents` hydration 이슈 | SSR/CSR 불일치 경고 | Next.js에서 검증된 패턴. 문제 시 `suppressHydrationWarning` 또는 단일 렌더 + JS 기반 분기로 전환 |
