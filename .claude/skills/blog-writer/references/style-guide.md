# Style Guide (Component Reference)

이 파일은 blog-writer 스킬이 MDX 본문을 작성할 때 사용 가능한 컴포넌트와 문법의 레퍼런스다. `quick-sort.mdx`가 실제 적용 예시를 제공하므로 새 MDX 작성 시 해당 파일을 함께 참조하라.

---

## 사용 가능한 MDX 컴포넌트

| 컴포넌트 | 파일 경로 | 용도 | 주요 props |
|---|---|---|---|
| `Callout` | `components/mdx/Callout.tsx` | info/warning/error/success 강조 박스 | `type`, `title?`, `children` |
| `RelatedPost` | `components/blog/RelatedPost.tsx` | 기존 글로의 교차 참조 카드 | `slug`, `type?`, `label?` |
| `QuickSort` | `components/visualizations/QuickSort.tsx` | (참고용) 인터랙티브 시각화 패턴 | `initial?`, `description?` |
| `CardinalitySpectrum` | `components/visualizations/CardinalitySpectrum.tsx` | (참고용) 정적 비교 바 차트 패턴 | — |
| `CardinalityTradeoff` | `components/visualizations/CardinalityTradeoff.tsx` | (참고용) 센티먼트 인디케이터 매트릭스 패턴 | — |

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
<Callout type="warning" title="이 글의 핵심 포인트">
  아래 N가지 전략은 각각 **서로 다른 상황**에서 유리합니다...
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

## 정적 시각화 참고 패턴 (CardinalitySpectrum / CardinalityTradeoff)

인터랙티브가 필요 없지만 **viz state 컬러 시스템**이 필요한 비교·트레이드오프 시각화의 참고 패턴. `vizStateClasses()` 헬퍼와 디자인 시스템 토큰을 직접 사용할 수 있어 다크/라이트 모드 대응이 자동이다. `'use client'` 불필요 (상태·이벤트 핸들러 없음).

### CardinalitySpectrum — 비교 바 차트

**위치**: `components/visualizations/CardinalitySpectrum.tsx`

**패턴**: 데이터 항목들을 viz state 색상으로 구분하고, 수평 막대의 길이로 상대적 크기 차이를 시각화. 각 행은 `vizStateClasses(state)`로 색상 코딩된 배지 + 바 + 텍스트 라벨 구성.

**사용 시점**:
- 같은 집합에서 항목별 수치 차이가 극적일 때 (예: 1건 vs 1억건)
- 마크다운 테이블의 숫자 칼럼만으로는 차이의 크기가 직관적으로 전달되지 않을 때
- 색상 코딩으로 "좋음 ↔ 나쁨" 같은 의미 축을 부여할 수 있을 때

**핵심 구조**:
```tsx
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

const DATA = [
  { column: 'id', barPct: 2, state: 'confirmed' as const },
  // ...barPct는 시각적 비례 (로그 스케일 기반 미적 값)
]
// VisualContainer로 감싸고 각 항목을 행으로 렌더
```

### CardinalityTradeoff — 센티먼트 인디케이터 매트릭스

**위치**: `components/visualizations/CardinalityTradeoff.tsx`

**패턴**: 트레이드오프 비교표의 각 셀에 컬러 도트(`positive`=초록, `negative`=빨강, `neutral`=회색)를 추가해 "이 조합이 유리한가?"를 스캔 가능하게 만듦. 하단에 범례(유리 / 주의 필요 / 조건부) 포함.

**사용 시점**:
- "높으면 좋은가? 낮으면 좋은가?"처럼 영역별로 유불리가 다른 비교표
- 마크다운 테이블만으로는 각 셀의 긍정/부정이 즉각 구분되지 않을 때
- 독자가 표를 빠르게 스캔해서 "내 상황에 해당하는 행"을 찾아야 할 때

**핵심 구조**:
```tsx
type Sentiment = 'positive' | 'negative' | 'neutral'
// 각 셀에 viz 컬러 도트 + 텍스트, VisualContainer로 감싸 범례 포함
```

**마크다운 테이블 vs 이 패턴 판단 기준**:

| 조건 | 선택 |
|---|---|
| 셀에 유불리 판단이 없음 (순수 데이터 비교) | 마크다운 테이블 |
| 셀마다 "좋다/나쁘다/조건부" 판단이 있음 | 센티먼트 매트릭스 |
| 영역별로 유불리가 뒤바뀜 (높으면 좋기도, 나쁘기도) | 센티먼트 매트릭스 |

---

## QuickSort (인터랙티브 시각화 참고 패턴)

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

**시각 효과**: `.keyword-link` 클래스 — 배경 틴트(`keyword-bg` 50% 투명도) + 호버 시 그라데이션 밑줄(가운데→양쪽 350ms 확장 애니메이션) + Popover 프리뷰 (title/summary). 일반 링크(`text-primary` + 밑줄)와 시각적으로 구분되는 고유 스타일. `decoration-dotted` 점선 밑줄은 폐기됨.

**작성자 주의 사항**:
- 수동 링크 필요 없음. frontmatter에 키워드만 등록하면 빌드 타임에 자동 처리.
- 자기 글의 자기 키워드는 링크되지 않음 (self-link 방지).
- 키워드는 대소문자 무시로 매칭 (`B-Tree` = `b-tree`).

**인라인 요소 3색 구분 체계**: 본문 내 인라인 요소는 색상으로 역할을 즉시 구분한다.

| 요소 | 색상 | CSS 변수 |
|---|---|---|
| 일반 링크 | blue | `--primary` |
| 키워드 자동 링크 | indigo | `--keyword` + `.keyword-link` 클래스 |
| 인라인 코드 | teal | `--code-inline-fg` (텍스트) + 10% 틴트 배경 |

**RelatedPost와의 차이**:

| 방식 | 강도 | 사용 기준 |
|---|---|---|
| 자동 링크 | 미묘한 인라인 링크. 독자가 무심히 지나갈 수 있음. 본문 흐름 유지. | "이 개념이 한 번만 언급되고 이해에 필수는 아니다" |
| `<RelatedPost />` | 카드형 강조. 독자 시선을 사로잡음. 본문 흐름을 의도적으로 끊음. | "독자가 이 개념을 모르면 이후 내용 이해 어려움" → prerequisite |

---

## 자주 쓰는 패턴

**"이 글의 학습 목표" 콜아웃** (글 서두 info):
모든 글의 첫 콜아웃. 3가지 학습 목표를 열거. Stage 3 자동 삽입 3종 중 첫 번째.

**"핵심 포인트" 콜아웃** (Alternatives 섹션 warning):
대안 비교 표 직전에 배치. Stage 3 자동 삽입 3종 중 두 번째.

**"핵심 통찰" 콜아웃** (Root Cause 섹션 error):
가정 깨짐/근본 원리 강조. Stage 3 자동 삽입 3종 중 세 번째.

**"먼저 읽어야 할 글" RelatedPost prerequisite**:
개념 진입 직전 배치. "분산 락", "인덱스" 같은 사전 지식이 있는 기존 글로 연결.

**"흔한 오해" / 반론 Callout** (warning):
독자가 가질 수 있는 잘못된 가정이나 흔한 오해를 다루는 단락은 일반 텍스트가 아니라 `warning` Callout으로 래핑한다. 스크롤 중 놓치기 쉬운 반론을 amber 배경으로 시각적으로 부각하는 장치다. 자동 삽입 3종과 달리 **필요한 위치에 추가하는 보조 콜아웃**이며, 한 글에 0~2개 정도가 적절하다.

```mdx
<Callout type="warning" title="카디널리티가 높으면 무조건 좋다?">
  그렇지 않습니다. 캐시 키의 카디널리티가 지나치게 높으면...
</Callout>
```

**코드 블록 다국어 비교**:
같은 알고리즘을 Python (의사 코드) + Kotlin (실무 구현) + TypeScript (타입 안전 구현) 등 2~3개 언어로 비교. 차이가 명확한 라인만 `// [!code highlight]`로 강조.

**시각화 컴포넌트 삽입**:
모든 시각화는 React 컴포넌트([A-1] 인터랙티브 또는 [A-2] 정적)로 제작한다. 정적 SVG 이미지 삽입은 **폐기**. `<ComponentName initial={...} />` 형태로 삽입하며 제목/설명은 컴포넌트 내부 `figcaption`에서 처리한다.

**참고 자료 마무리**:
모든 글이 `## 참고 자료` 섹션으로 끝남. 논문 → 공식 문서 → 잘 쓰인 블로그 포스트 순으로 열거.

---

## KaTeX 수식 (`$...$`, `$$...$$`)

빌드 파이프라인: `remark-math` → `rehype-katex` (`velite.config.ts`). `katex/dist/katex.min.css`는 `app/layout.tsx`에서 전역 로드된다.

- **인라인**: `$O(n \log n)$`, `$x_i$`, `$\sum_{i=1}^{n} i$` — 문장 안에 자연스럽게 삽입.
- **블록**: `$$T(n) = 2T(n/2) + O(n)$$` — 독립 라인으로 중앙 정렬.
- 일반 텍스트로 `O(n log n)` 작성 금지. 반드시 `$O(n \log n)$`.
- 자주 쓰는 LaTeX: `\log`, `\sum`, `\frac{a}{b}`, `x^n`, `x_i`, `\leq`, `\geq`, `\infty`, `\in`, `\mathbb{R}`.
- **코드 블록 내부의 `$`는 영향받지 않음** — rehype-pretty-code가 rehype-katex 이전에 실행됨.

예:
```mdx
평균 시간 복잡도는 $O(n \log n)$, 최악은 $O(n^2)$이다.

점화식은 다음과 같다.

$$T(n) = 2T(n/2) + O(n)$$
```

---

## 테이블

일반 마크다운 테이블 문법을 그대로 쓴다. `components/mdx/components.tsx`의 `table` override가 빌드 시 자동으로 `<div class="table-wrapper">`로 감싸 카드 스타일 + 내부 가로 스크롤을 적용한다.

- 긴 테이블은 `.table-wrapper`의 `overflow-x: auto`로 페이지 전체가 아닌 테이블 내부만 스크롤.
- 숫자 칼럼 우측 정렬이 필요하면 셀에 `className="num"` 추가 (선택).
- 셀 내부에 인라인 코드, 링크, KaTeX 수식 모두 허용.

예:

```mdx
| 케이스 | 시간 복잡도 | 설명 |
|---|---|---|
| 최선 | $O(n \log n)$ | 피벗이 균등 분할 |
| 평균 | $O(n \log n)$ | 랜덤 피벗 |
| 최악 | $O(n^2)$ | 이미 정렬된 배열 |
```

---

## MDX 특수 문자 주의

### em-dash(`—`, U+2014) 전면 금지

본문, 콜아웃, 테이블 셀, 캡션, JSX 문자열 리터럴 (시각화 `note`, `aria-label`, 렌더링되는 모든 텍스트) 어디에서도 **em-dash(`—`, U+2014)를 사용하지 않는다**. 대화 응답(사용자에게 보내는 설명)도 동일 규칙.

**대체 방법** (문맥에 맞게 선택):

| 원래 의도 | 대체 |
|---|---|
| 동격 / 부연 설명 | 쉼표 `,` 또는 괄호 `()` |
| 인과 / 흐름 | `→` 화살표 |
| 나열 | 불릿 리스트 또는 테이블 |
| 강조 분리 | 문장 나누기, 코드 블록, bold |
| 범위 표기 | en-dash `–` (U+2013) — em-dash와 다름 |

```
❌ 멱등성은 설계 취향이 아니라 CS 제약의 강제 결과 — 이것이 핵심입니다.
✅ 멱등성은 설계 취향이 아니라 CS 제약의 강제 결과입니다. 이것이 핵심입니다.

❌ 서버: Keys 테이블에서 "${key}" 조회 — 없음 → 처리 진입.
✅ 서버: Keys 테이블에서 "${key}"를 조회합니다. 없으면 처리로 진입.
✅ 서버: Keys 테이블 조회 → 없음 → 처리 진입.

❌ 적용 필수 — 돈/재고가 걸린 상태 변경
✅ 적용 필수 (돈/재고가 걸린 상태 변경)
✅ ### 적용 필수
     돈/재고가 걸린 상태 변경 ...
```

**주의**: en-dash (`–`, U+2013)는 범위 표기(`4KB – 16KB`)에 계속 허용한다. em-dash(`—`)와 시각적으로 유사하지만 **다른 문자**다.

### 물결표(`~`) 범위 표기 금지

MDX(GFM)에서 `~`는 취소선(`~~text~~`) 문법의 일부다. **한 줄(또는 한 테이블 셀) 안에 `~`가 2개 이상** 있으면 파서가 그 사이를 `<del>`로 감싸 취소선이 된다. 다른 줄에 있더라도 같은 문단 안이면 위험하다.

**범위를 나타낼 때는 `–`(en dash, U+2013) 또는 자연어 표현을 사용한다.**

```
❌ 높이가 3~4입니다
❌ GDT-TS(0~100)로 매깁니다. 최고 점수는 약 60~70점에 머물렀고
❌ 결과 비율 ~15~25% 이상이면 유리
❌ 4KB ~ 16KB
✅ 높이가 3–4입니다
✅ GDT-TS(0에서 100점)로 매깁니다. 최고 점수는 약 60점에서 70점 사이에 머물렀고
✅ 결과 비율 15–25% 이상이면 유리
✅ 4KB – 16KB
```

**대체 치환 치트시트**:

| 원래 패턴 | 대체 |
|---|---|
| 숫자 범위 `0~100` | `0–100` (en-dash) 또는 `0에서 100` |
| 한글 범위 `수백~수천` | `수백에서 수천` 또는 `수백부터 수천` |
| 단계 참조 `1~4번` | `1번부터 4번까지` |
| 근사값 `~10ms` | `약 10ms` 또는 `10ms 내외` |

**자동 가드**: `scripts/check-mdx-tilde.ts`가 prebuild · predev · pretest에서 실행되며, **한 줄 또는 한 테이블 셀 안에 unescaped `~`가 2개 이상**이면 빌드 차단. 단일 `~`는 허용되므로 근사값(`~10ms`) 표기는 그대로 사용 가능. 상세 실행 위치는 `validation-loop.md` 참고.

**역사적 사고 예시 (2026-04-19)**:

AlphaFold 특허 포스트(`alphafold-patent.mdx`)에서 `정확도 점수는 GDT-TS(0~100)로 매깁니다. 2018년 CASP13까지 최고 점수는 약 60~70점에 머물렀고` 문장이 `0<del>100)로 매깁니다. 2018년 CASP13까지 최고 점수는 약 60</del>70점` 로 렌더링되어 취소선이 나타났다. 한 문장 안에 tilde가 4개(`0~100`과 `60~70` 각 2개)였고, remark-gfm이 이들을 `<del>` 페어로 해석했다. 이 사고를 계기로 prebuild 가드(`check-mdx-tilde.ts`)를 도입했다.

---

## 글 구조 패턴 — 가독성 · 가시성

### bold + 쌍따옴표 금지

`**"텍스트"**` 패턴은 MDX에서 bold가 적용되지 않는다. 쌍따옴표와 bold를 동시에 쓰지 않는다.

```
❌ **"이것은 중요한 문장입니다"**
✅ **이것은 중요한 문장입니다**
```

강조가 필요하면 bold만 쓰고, 인용이 필요하면 따옴표만 쓴다.

### 번호 + 소제목 구조

여러 원인/사례/단계를 나열할 때 **"첫째, 둘째"** 산문체를 금지한다. 대신 **번호 + 소제목 + 본문** 형태를 쓴다.

```
❌ 첫째, 인덱스를 쓸 수 없는 경우. 가장 흔한 원인입니다. ...
   둘째, 옵티마이저가 의도적으로 선택하는 경우. ...

✅ ### 1. 인덱스를 쓸 수 없는 경우
   가장 큰 원인입니다. ...

   ### 2. 옵티마이저가 의도적으로 선택하는 경우
   ...
```

**이유**: 스캔이 쉽고 각 항목이 독립 블록으로 인식돼 시각적 계층이 명확하다.

### 리스트 → 테이블 전환

`- 항목 — 설명` 형태의 불릿 리스트가 3개 이상이고 모든 항목이 동일한 "키 — 값" 구조를 따르면, **2열 테이블**로 전환한다. 테이블이 시각적 계층을 명확히 하고 스캔 속도를 높인다.

```
❌ - `id` (PK) — 행마다 다름. 카디널리티 = 행 수
   - `email` — 사용자마다 고유
   - `UUID` — 설계상 중복 불가
   - `created_at` (타임스탬프) — 밀리초 단위면 거의 고유

✅ | 컬럼 | 설명 |
   |---|---|
   | `id` (PK) | 행마다 다름. 카디널리티 = 행 수 |
   | `email` | 사용자마다 고유 |
   | `UUID` | 설계상 중복 불가 |
   | `created_at` (타임스탬프) | 밀리초 단위면 거의 고유 |
```

**판단 기준**: 항목이 "이름 — 설명", "기술 — 특징", "조건 — 결과" 같은 이항 구조이면 테이블. 항목이 독립적 문장(나열 순서가 중요하거나 항목 간 구조가 다름)이면 리스트 유지.

### 공유 예시 테이블 (Shared Example)

개념 설명 글(특히 Knowledge 카테고리)은 **글 초반에 예시 테이블/데이터를 도입**하고, 이후 모든 섹션에서 그 예시를 재사용한다.

구성 원칙:
- 테이블 구조는 간략하게 (4~6 컬럼)
- **실제 레코드 4~5건**을 보여줘 구조를 직관적으로 이해시킨다
- "... 총 N건" 형태로 전체 규모를 암시한다
- 이후 섹션에서 "위 orders 테이블에서..." 형태로 반복 참조한다

```mdx
| id | user_id | status | amount | created_at |
|---|---|---|---|---|
| 1 | 1042 | `PAID` | 32,000 | 2026-01-15 |
| 2 | 2981 | `PENDING` | 8,500 | 2026-02-03 |
| 3 | 1042 | `PAID` | 15,200 | 2026-03-22 |
| 4 | 5520 | `CANCELLED` | 41,000 | 2026-04-01 |
| 5 | 3301 | `PAID` | 22,800 | 2026-04-10 |
| ... | ... | ... | ... | ... |
| **총 2억 건** | | | | |
```

**이유**: 매 섹션마다 새 예시를 도입하면 독자가 컨텍스트 스위칭해야 한다. 하나의 공유 예시를 반복 참조하면 인지 부하가 줄어든다.

### 전제 지식 콜아웃

본문에서 독자가 모를 수 있는 용어(옵티마이저, 버퍼 풀, WAL 등)를 처음 언급할 때, **Callout으로 한 줄 정의**를 제공한다.

```mdx
<Callout type="info" title="옵티마이저란?">
  옵티마이저(Optimizer)는 SQL 쿼리를 실행하기 전에 여러 실행 계획을 비교하고
  가장 비용이 낮은 계획을 선택하는 데이터베이스 내부 모듈입니다.
</Callout>
```

**적용 기준**: 해당 용어가 글의 핵심 흐름에 필수이고, Knowledge 카테고리 독자(기초 지식 습득 목적)가 모를 가능성이 있을 때. 이미 같은 글에서 설명한 용어는 중복 콜아웃 금지.

---

## Mermaid `<Diagram>`

정적 다이어그램(플로우, 시퀀스, 상태 머신)은 `<Diagram>` 래퍼 안에 Mermaid 문법을 넣는다. 인터랙티브가 필요한 주제는 Diagram이 아니라 별도 React 시각화 컴포넌트를 쓴다 (`visualization-rules.md` 참고).

```mdx
<Diagram>
graph TD
    A[Query] --> B{Index Exists?}
    B -->|Yes| C[Index Scan]
    B -->|No| D[Full Table Scan]
</Diagram>
```
