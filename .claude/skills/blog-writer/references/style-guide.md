# Style Guide (Component Reference)

이 파일은 blog-writer 스킬이 MDX 본문을 작성할 때 사용 가능한 컴포넌트와 문법의 레퍼런스다. `quick-sort.mdx`가 실제 적용 예시를 제공하므로 새 MDX 작성 시 해당 파일을 함께 참조하라.

---

## 사용 가능한 MDX 컴포넌트

| 컴포넌트 | 파일 경로 | 용도 | 주요 props |
|---|---|---|---|
| `Callout` | `components/mdx/Callout.tsx` | info/warning/error/success 강조 박스 | `type`, `title?`, `children` |
| `RelatedPost` | `components/blog/RelatedPost.tsx` | 기존 글로의 교차 참조 카드 | `slug`, `type?`, `label?` |
| `QuickSort` | `components/visualizations/QuickSort.tsx` | (참고용) 일회성 시각화 패턴 | `initial?`, `description?` |

---

## Callout

**위치**: `components/mdx/Callout.tsx`

**props**:
- `type`: `'info' | 'warning' | 'error' | 'success'`
- `title?`: 선택. 기본값은 type별로 자동 결정 (`'참고'` / `'주의'` / `'경고'` / `'팁'`)
- `children`: 필수, React node

**색상**: CSS 변수 기반 (`globals.css`의 `--callout-<type>-bg/border/title/icon`). 라이트/다크 모드 자동 대응.

**사용 예 — info (글 서두 학습 목표)**:

````mdx
<Callout type="info" title="이 글의 학습 목표">
  1. X를 이해한다
  2. Y를 구분할 수 있다
  3. Z 선택 기준을 얻는다
</Callout>
````

**사용 예 — warning (Alternatives 섹션 직전)**:

````mdx
<Callout type="warning" title="No Silver Bullet 원칙">
  아래 N가지 전략 중 "정답"은 없습니다. 각 전략은 **서로 다른 가정**에 기대며...
</Callout>
````

**사용 예 — error (Root Cause 섹션 핵심 통찰)**:

````mdx
<Callout type="error" title="핵심 통찰: <한 줄 요약>">
  <가정 깨짐의 본질 설명>
</Callout>
````

**사용 예 — success (실무 팁)**:

````mdx
<Callout type="success" title="실무 팁">
  <검증된 패턴 또는 best practice>
</Callout>
````

---

## RelatedPost

**위치**: `components/blog/RelatedPost.tsx`

**props**:
- `slug`: 필수, string (기존 글의 slug)
- `type?`: `'prerequisite' | 'deep-dive' | 'parallel'`, 기본값 `'deep-dive'`
- `label?`: 선택, string. variant별 기본 라벨을 덮어쓸 때만 사용.

**3 variant 시각 차이**:

| type | 기본 라벨 | 시각 스타일 | 사용 시점 |
|---|---|---|---|
| `prerequisite` | "먼저 읽어야 할 글" | 좌측 4px primary 보더, 본문 흐름을 시각적으로 끊음 | "이 개념을 모르면 이해 어려움" |
| `deep-dive` | "더 깊이 알아보기" | 카드형, 자연스러운 흐름. keyword 색 아이콘 | "더 자세한 건 다른 글" |
| `parallel` | "함께 읽으면 좋은 글" | 약한 강조 (opacity-75 + bg-muted/40), 작은 느낌. muted 아이콘 | "같이 읽으면 좋은 글" |

**사용 예**:

````mdx
<RelatedPost slug="distributed-lock" type="prerequisite" />
````

````mdx
<RelatedPost slug="redis-pub-sub" type="deep-dive" label="Redis Pub/Sub 자세히" />
````

````mdx
<RelatedPost slug="kafka-consumer-group" type="parallel" />
````

**자동 데이터**: `slug`만 전달하면 `SLUG_TO_ENTRY`에서 `title`과 `summary`를 자동 조회. `label`은 variant별 기본값을 덮어쓸 때만 사용.

---

## QuickSort (시각화 참고 패턴)

**위치**: `components/visualizations/QuickSort.tsx`

**역할**: 일회성 시각화 컴포넌트의 참고 패턴. 신규 시각화를 만들 때 이 파일의 구조를 따라 작성.

**코드 구조 요약**:
- `'use client'` 선언 필수
- `useMemo`로 사전 계산된 스냅샷 배열 생성 (불변, 빌드 타임 계산)
- `useState`로 현재 스텝 인덱스 관리
- `useEffect` + `setTimeout`으로 auto-play 구현
- Prev / Next / Play / Reset 컨트롤 버튼
- 색상 시맨틱: amber=피벗, blue=비교 중, emerald=확정, muted=대기
- 상단 `figcaption`: 제목 + 설명
- 하단: 현재 step 설명 + 컨트롤 버튼 + 범례

**신규 시각화 생성 시**: `QuickSort.tsx` 구조를 복사해서 주제에 맞게 각색. `computeSnapshots()` 함수를 주제별로 재작성하는 것이 핵심. `visualization-rules.md`의 유형 판단 기준을 먼저 확인.

---

## 코드 블록 문법

**기본**:

````mdx
```language
code content
```
````

**파일명 표기** (`title="..."` 속성):

````mdx
```typescript title="example.ts"
export function foo() { return 'bar' }
```
````

**라인 하이라이트** (Shiki transformer `// [!code highlight]` 주석):

````mdx
```python title="xfetch.py"
def x_fetch(key, beta=1.0):  // [!code highlight]
    value = cache.get(key)
    return value
```
````

해당 라인 끝에 `// [!code highlight]` 주석을 붙이면 primary 색 좌측 보더 + tint로 강조된다.

**지원 언어** (Shiki 기본):

| 언어 | identifier |
|---|---|
| TypeScript | `typescript`, `ts`, `tsx` |
| JavaScript | `javascript`, `js`, `jsx` |
| Python | `python`, `py` |
| Kotlin | `kotlin`, `kt` |
| Java | `java` |
| SQL | `sql` |
| Bash/Shell | `bash`, `sh` |
| JSON | `json` |
| YAML | `yaml`, `yml` |
| Rust | `rust`, `rs` |
| Go | `go` |
| C/C++/C# | `c`, `cpp`, `csharp` |

**4개 언어 예시**:

````mdx
```python title="quicksort.py"
def partition(arr, lo, hi):
    pivot = arr[hi]  // [!code highlight]
    ...
```
````

````mdx
```kotlin title="QuickSort.kt"
fun <T : Comparable<T>> quickSort(arr: MutableList<T>) {
    if (arr.size < 2) return
    ...
}
```
````

````mdx
```typescript title="quicksort.ts"
export function quickSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    ...
}
```
````

````mdx
```sql title="order_by_example.sql"
EXPLAIN ANALYZE
SELECT id, name FROM users
ORDER BY created_at DESC  // [!code highlight]
LIMIT 100;
```
````

---

## 키워드 자동 링크

**Phase 3 시스템**: `frontmatter`의 `keywords` 배열에 등록된 키워드가 본문에 등장하면 자동으로 해당 글로 링크된다.

**시각 효과**: 인디고 점선 밑줄 + 호버 시 Popover 프리뷰 (title/summary).

**작성자 주의 사항**:
- 수동 링크 필요 없음. frontmatter에 키워드만 등록하면 빌드 타임에 자동 처리.
- 자기 글의 자기 키워드는 링크되지 않음 (self-link 방지).
- 키워드는 대소문자 무시로 매칭 (`B-Tree` = `b-tree`).

**RelatedPost와의 차이**:

| 방식 | 강도 | 사용 기준 |
|---|---|---|
| 자동 링크 | 미묘한 인라인 링크. 독자가 무심히 지나갈 수 있음. 본문 흐름 유지. | "이 개념이 한 번만 언급되고 이해에 필수는 아니다" |
| `<RelatedPost />` | 카드형 강조. 독자 시선을 사로잡음. 본문 흐름을 의도적으로 끊음. | "독자가 이 개념을 모르면 이후 내용 이해 어려움" → prerequisite |

---

## 자주 쓰는 패턴

**"이 글의 학습 목표" 콜아웃** (글 서두 info):
모든 글의 첫 콜아웃. 3가지 학습 목표를 열거. Stage 3 자동 삽입 3종 중 첫 번째.

**"No Silver Bullet 원칙" 콜아웃** (Alternatives 섹션 warning):
대안 비교 표 직전에 배치. Stage 3 자동 삽입 3종 중 두 번째.

**"핵심 통찰" 콜아웃** (Root Cause 섹션 error):
가정 깨짐/근본 원리 강조. Stage 3 자동 삽입 3종 중 세 번째.

**"먼저 읽어야 할 글" RelatedPost prerequisite**:
개념 진입 직전 배치. "분산 락", "인덱스" 같은 사전 지식이 있는 기존 글로 연결.

**코드 블록 다국어 비교**:
같은 알고리즘을 Python (의사 코드) + Kotlin (실무 구현) + TypeScript (타입 안전 구현) 등 2~3개 언어로 비교. 차이가 명확한 라인만 `// [!code highlight]`로 강조.

**SVG 이미지 삽입**:
````mdx
![alt 텍스트](/images/<slug>-<descriptor>.svg)
````
`mdx` `img` override가 라운드 코너를 자동 적용.

**시각화 컴포넌트 삽입**:
Section 5 (How) 내에 `<ComponentName initial={...} />` 형태로 삽입. 제목/설명은 컴포넌트 내부 `figcaption`에서 처리.

**참고 자료 마무리**:
모든 글이 `## 참고 자료` 섹션으로 끝남. 논문 → 공식 문서 → 잘 쓰인 블로그 포스트 순으로 열거.
