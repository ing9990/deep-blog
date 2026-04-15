# Blog Writer Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a project-local Claude Code skill at `.claude/skills/blog-writer/` that makes blog post creation a structured 3-stage workflow (Q&A learning → note compilation → MDX generation) and becomes the sole entry point for creating files in `content/posts/`.

**Architecture:** Thin `SKILL.md` entry point (~150 lines) + 8 reference files in `references/` loaded on-demand via progressive disclosure. Pre-requisite: `RelatedPost` UI component must exist in the repo before the skill ships, plus a `.gitignore` exception so `.claude/skills/` is tracked while other `.claude/` files stay ignored.

**Tech Stack:** Markdown documentation (skill + references), TypeScript/React for the supporting `RelatedPost` component, lucide-react icons, existing Phase 3 keyword-map system as the data source for cross-references.

**Spec:** `docs/superpowers/specs/2026-04-15-blog-writer-skill-design.md` (commit `3d5ccba`).

---

## CRITICAL: Read Before Implementing Any Task

**The implementer (subagent or human) MUST read the spec file before starting any task.** The plan below specifies file structure, required sections, and key paragraphs, but the spec is the canonical source for substance:

- `docs/superpowers/specs/2026-04-15-blog-writer-skill-design.md` — full design with all decisions, examples, and edge cases

The plan provides the **skeleton and structural requirements**; the spec provides the **substance** that fills the skeleton.

---

## File Structure

### Files to create (skill itself)

```
.claude/
└── skills/
    └── blog-writer/
        ├── SKILL.md                    [Task 4]
        └── references/
            ├── philosophy.md            [Task 5]
            ├── stage-1-learning.md      [Task 6]
            ├── stage-2-note.md          [Task 7]
            ├── stage-3-mdx.md           [Task 8]
            ├── frontmatter-rules.md     [Task 9]
            ├── visualization-rules.md   [Task 10]
            ├── validation-loop.md       [Task 11]
            └── style-guide.md           [Task 12]
```

### Files to create (supporting code)

```
components/blog/RelatedPost.tsx         [Task 1]
```

### Files to modify

```
components/mdx/components.tsx           [Task 2]  (register RelatedPost)
.gitignore                              [Task 3]  (exception for .claude/skills/)
```

### Verification

```
[Task 13] End-to-end build verification + skill discovery test
```

---

## Stage 1 — Pre-skill Foundation (Tasks 1-3)

These three tasks set up the prerequisites that the skill assumes exist.

### Task 1: Create `RelatedPost` component

**Files:**
- Create: `components/blog/RelatedPost.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
// components/blog/RelatedPost.tsx
import Link from 'next/link'
import { ArrowRight, BookOpen, Compass, Layers } from 'lucide-react'
import { SLUG_TO_ENTRY } from '@/lib/generated/keyword-map'
import { cn } from '@/lib/utils'

type RelatedPostType = 'prerequisite' | 'deep-dive' | 'parallel'

interface RelatedPostProps {
  slug: string
  type?: RelatedPostType
  label?: string
}

const VARIANTS: Record<
  RelatedPostType,
  {
    icon: typeof BookOpen
    defaultLabel: string
    surfaceClass: string
    iconClass: string
  }
> = {
  prerequisite: {
    icon: BookOpen,
    defaultLabel: '먼저 읽어야 할 글',
    surfaceClass: 'border-l-4 border-l-primary',
    iconClass: 'text-primary',
  },
  'deep-dive': {
    icon: Compass,
    defaultLabel: '더 깊이 알아보기',
    surfaceClass: '',
    iconClass: 'text-keyword',
  },
  parallel: {
    icon: Layers,
    defaultLabel: '함께 읽으면 좋은 글',
    surfaceClass: '',
    iconClass: 'text-muted-foreground',
  },
}

export function RelatedPost({ slug, type = 'deep-dive', label }: RelatedPostProps) {
  const entry = SLUG_TO_ENTRY.get(slug)
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[RelatedPost] No entry found for slug "${slug}". Component will not render.`)
    }
    return null
  }

  const variant = VARIANTS[type]
  const Icon = variant.icon
  const displayLabel = label ?? variant.defaultLabel

  return (
    <Link
      href={`/posts/${slug}`}
      className={cn(
        'group my-6 flex items-start gap-4 rounded-[14px] border border-border bg-background p-5 transition-colors hover:border-border-strong hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        variant.surfaceClass,
      )}
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 flex-shrink-0', variant.iconClass)}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {displayLabel}
        </p>
        <p className="mt-1.5 text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">
          {entry.title}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {entry.summary}
        </p>
      </div>
      <ArrowRight
        className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`

Expected: exit 0.

- [ ] **Step 3: Build to verify the component compiles**

Run: `pnpm build`

Expected: exit 0. The component is not yet used anywhere so build will succeed without rendering it.

- [ ] **Step 4: Commit**

```bash
git add components/blog/RelatedPost.tsx
git commit -m "feat(blog): add RelatedPost component with 3 cross-reference variants

Pre-skill foundation for blog-writer. Three variants:
- prerequisite (강조 박스, 본문 흐름 중단): 먼저 읽어야 할 글
- deep-dive (카드형, 자연스러운 흐름): 더 깊이 알아보기
- parallel (작은 카드, 약한 강조): 함께 읽으면 좋은 글

Reads SLUG_TO_ENTRY from the Phase 3 generated keyword-map so title
and summary come from the target post's frontmatter automatically.
Returns null if the slug is unknown (dev-mode warning).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 2: Register `RelatedPost` in MDX components

**Files:**
- Modify: `components/mdx/components.tsx`

- [ ] **Step 1: Read current file**

```bash
cat components/mdx/components.tsx
```

- [ ] **Step 2: Add the RelatedPost import and registration**

Add this import near the top of the file (after the existing imports):

```tsx
import { RelatedPost } from '@/components/blog/RelatedPost'
```

In the `mdxComponents` object, add `RelatedPost` as a key alongside the other components (Callout, QuickSort, etc.):

```tsx
export const mdxComponents = {
  // ... existing entries (h1, a, img, Callout, QuickSort)
  RelatedPost,
}
```

- [ ] **Step 3: Verify type-check and build**

```bash
pnpm type-check
pnpm build
```

Both must exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/mdx/components.tsx
git commit -m "feat(mdx): register RelatedPost in mdxComponents

Allows MDX authors (and blog-writer skill) to use <RelatedPost slug=...
type=... /> directly in markdown body."
```

### Task 3: Update `.gitignore` to track `.claude/skills/`

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Read current file**

```bash
cat .gitignore
```

The file currently ends with `.claude/` which ignores everything inside.

- [ ] **Step 2: Add exception lines after `.claude/`**

Append these lines to the bottom of `.gitignore`:

```
# Allow project-local skills even though .claude/ is ignored.
# This keeps settings.local.json and other personal state ignored
# while making the blog-writer skill (and any future skills) trackable.
!.claude/skills/
!.claude/skills/**
```

- [ ] **Step 3: Verify gitignore behavior**

```bash
mkdir -p .claude/skills/blog-writer
touch .claude/skills/blog-writer/test.md
git status .claude/skills/
```

Expected: `git status` shows `.claude/skills/blog-writer/test.md` as a new untracked file (not ignored).

```bash
rm -rf .claude/skills/blog-writer
```

(Cleanup — Task 4 will recreate it properly.)

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "build: allow .claude/skills/ in git despite .claude/ ignore

Adds an exception so project-local Claude Code skills like blog-writer
become part of the repo (and ship with OSS clones), while
.claude/settings.local.json and other personal state stay ignored."
```

---

## Stage 2 — SKILL.md Entry Point (Task 4)

This is the most important file — it's what Claude Code reads when triggering the skill.

### Task 4: Create `SKILL.md`

**Files:**
- Create: `.claude/skills/blog-writer/SKILL.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p .claude/skills/blog-writer/references
```

- [ ] **Step 2: Create `SKILL.md` with this exact content**

```markdown
---
name: blog-writer
description: Backend Notes 블로그의 새 MDX 포스트를 3단계(학습 Q&A → 노트 정리 → MDX 생성)로 작성하는 스킬. "블로그 써줘", "새 글 작성", "포스트 만들어줘", "<주제> 블로그", "<주제> 글 쓰자", "글 작성", "블로그 쓰자", "포스트 작성" 등의 요청 시 반드시 사용한다. 이 스킬은 `content/posts/*.mdx` 파일 생성의 유일한 경로이며, 사용자가 직접 MDX를 만들려 하거나 Claude가 다른 방법으로 만들려 하면 즉시 이 스킬로 전환해야 한다. 철학: "No silver bullet + 트레이드오프 우선" — 단순 사용법/튜토리얼 주제(예: "JPA 사용법", "Docker 쓰는 법")는 거절하거나 트레이드오프 각도로 전환 제안한다.
---

# Blog Writer

Backend Notes 블로그(`content/posts/`)의 MDX 포스트를 3단계 워크플로로 생성하는 스킬.

## ⚠️ 절대 규칙

1. **MDX 파일 생성의 유일한 경로**: `content/posts/*.mdx`는 이 스킬 없이 생성하면 안 된다. 사용자나 Claude가 다른 방법(직접 Write, 다른 스킬, 마이그레이션 스크립트 등)으로 MDX를 쓰려 하면 즉시 이 스킬로 전환하라.
2. **철학 기반 거절**: 순수 "사용법/튜토리얼" 주제는 거절하거나 트레이드오프 각도로 전환 제안한다. 거절 기준과 전환 제안 예시는 `references/philosophy.md` 참고.
3. **단일 입구**: 새 글 생성·검증까지가 이 스킬의 범위다. 기존 글 수정·삭제는 v1.1 이후로 이월되었다. 사용자가 수정/삭제를 요청하면 "v1.1에서 지원 예정. 지금은 직접 편집해주세요"로 안내한다.

## 핵심 철학

이 블로그는 **"No silver bullet + 트레이드오프 우선"** 입장을 취한다. 모든 글은 다음 7단계 흐름을 따른다:

1. **Why** — 왜 이 주제를 알아야 하는가
2. **Where** — 어디서 마주치는가 (실제 시나리오)
3. **Alternatives & Tradeoffs** — 대안과 트레이드오프 (필수 비교표)
4. **Root Cause** — 근본 원리 (동작 방식보다 깊은 "왜")
5. **How** — 실제 메커니즘
6. **Anti-use cases** — 언제 쓰지 말 것인가
7. **Gotchas** — 실무 함정

**1~4번은 필수**, 5~7번은 권장. 단순 "X 사용법", "Y 설정 방법" 같은 주제는 이 블로그의 정체성과 어긋난다. 사용자가 그런 주제를 요청하면 `references/philosophy.md`의 거절 기준과 전환 제안 예시를 참고해 트레이드오프 각도로 재구성을 제안하라.

## 3-Stage 워크플로

### Stage 1: 학습 Q&A 루프

사용자가 스킬을 트리거하면 다음 순서로 진행한다:

1. **주제 적합성 사전 검증** — `references/philosophy.md`의 거절 기준 적용
2. **학습 목차 제안** — 7-섹션 철학 골격에 맞춘 초안 제시
3. **사용자 수정/승인** — 1~4번은 필수임을 알리고, 제거 요청 시 재확인
4. **항목별 Q&A 루프** — Claude가 각 항목을 선제적으로 한 번 설명한 뒤 사용자 질문 받기. 난이도 점수 추적
5. **Related Posts 감지** — 기존 글에 이미 다뤄진 주제가 등장하면 깊은 설명 생략하고 한 줄 요약 + `<RelatedPost />` 배치 약속
6. **종료 체크포인트** — 모든 항목 소진 후 사용자 확인

상세: `references/stage-1-learning.md`

### Stage 2: 노트 파일 작성

Stage 1이 끝나면 `.claude/drafts/<slug>-notes.md`에 학습 노트를 저장한다. 7-섹션 철학 구조 + Q&A 로그 + 난이도 점수 + Related Posts 목록 + MDX 구성 계획이 포함된다. 사용자에게 리뷰 체크포인트를 제공한 뒤 Stage 3로 진입한다. `.claude/drafts/`는 `.gitignore` 처리되어 로컬 전용 학습 자산으로 보존된다.

상세: `references/stage-2-note.md`

### Stage 3: MDX 생성 + 자산 생성 + 검증

노트를 입력으로 실제 MDX 파일, 필요 시 신규 시각화 컴포넌트, SVG 자산을 생성한다. 자동 콜아웃 3종(학습 목표 / No silver bullet / 핵심 통찰)과 `<RelatedPost />` 교차 참조를 정해진 위치에 배치한다. 마지막으로 검증 루프(`generate-keyword-map` → `velite` → `type-check` → `build`)를 실행해 완성도를 보장한다.

상세: `references/stage-3-mdx.md`, `references/frontmatter-rules.md`, `references/visualization-rules.md`, `references/validation-loop.md`

## 스킬 레퍼런스 (when to read)

| 파일 | 언제 읽는가 |
|---|---|
| `references/philosophy.md` | **매 트리거 시작 시점** — 주제 적합성 검증에 필수 |
| `references/stage-1-learning.md` | Stage 1 진입 시 |
| `references/stage-2-note.md` | Stage 1 → Stage 2 전환 시 |
| `references/stage-3-mdx.md` | Stage 2 → Stage 3 전환 시 |
| `references/frontmatter-rules.md` | Stage 3 진입 직후 frontmatter 초안 생성 시 |
| `references/visualization-rules.md` | Stage 3 중 시각화 필요성 감지 시 |
| `references/validation-loop.md` | Stage 3 후반 검증 단계 진입 시 |
| `references/style-guide.md` | MDX 본문 작성 중 컴포넌트/코드블록 문법 확인 필요 시 |

레퍼런스는 **on-demand**로 읽는다. 모든 파일을 미리 읽지 말고, 해당 스테이지에 진입할 때 Read 도구로 그때그때 로드하라. 이는 Anthropic 공식 progressive disclosure 패턴을 따른다.

## 출력 파일 요약

이 스킬이 성공적으로 완료되면 다음이 생성/수정된다:

- **필수**: `content/posts/<slug>.mdx` (검증 후 `draft: false`로 확정)
- **필수**: `lib/generated/keyword-map.ts` (재생성)
- **선택**: `components/visualizations/<Name>.tsx` (시각화 필요 시 신규)
- **선택**: `public/images/<slug>-<descriptor>.svg` (정적 다이어그램 필요 시)
- **선택**: `components/mdx/components.tsx` (신규 시각화 컴포넌트 등록 시)
- **보존**: `.claude/drafts/<slug>-notes.md` (학습 노트, 자동 삭제 안 함)

## 금지 사항 (안티패턴)

- ❌ "사용법" 주제를 받아들이고 그대로 진행 — 철학 전환 제안을 건너뛰지 말 것
- ❌ Stage 1을 건너뛰고 곧바로 MDX 작성 — 학습 기반이 없으면 글 품질이 무너짐
- ❌ 기존 글이 있는 개념을 또다시 깊게 설명 — 중복. 반드시 `<RelatedPost />`로 대체
- ❌ 자동 수정 루프를 3회 이상 반복 — 무한 루프 위험. 2회 실패 시 사용자에게 에러 노출
- ❌ 사용자 승인 없이 frontmatter 확정 — 키워드 충돌 위험. 반드시 표 형태로 제시 후 "OK" 대기
- ❌ 검증 루프 생략 — 생성 완료 선언 전에 반드시 `pnpm build`까지 녹색 확인
- ❌ Git commit/push — 사용자 영역. 스킬은 작성과 검증까지만
- ❌ `pnpm dev` 자동 실행 — 사용자 영역
- ❌ 기존 글 수정/삭제 — v1.1 이월. v1.0에서는 거절하고 사용자에게 직접 편집 안내

## 사용자에게 진입 시 보이는 첫 메시지 (참고)

스킬이 트리거되면 다음 형태로 시작:

```
[blog-writer 스킬 진입]

주제: <사용자가 말한 주제>

이 블로그는 "No silver bullet + 트레이드오프 우선" 철학을 따릅니다.
주제가 이 철학과 맞는지 먼저 확인합니다...

[philosophy.md 로드 후 주제 적합성 검증 진행]
```
```

- [ ] **Step 3: Verify the file is valid markdown with YAML frontmatter**

```bash
head -3 .claude/skills/blog-writer/SKILL.md
```

Expected: starts with `---`, has `name: blog-writer`, has `description:` line.

- [ ] **Step 4: Verify file is tracked by git**

```bash
git status .claude/skills/blog-writer/SKILL.md
```

Expected: file shows as untracked (new file). NOT shown as ignored.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/blog-writer/SKILL.md
git commit -m "feat(skill): add blog-writer SKILL.md entry point

Thin entry point (~150 lines) defining the 3-stage workflow,
absolute rules, philosophy reminder, and pointers to references/
files for stage-specific detail. Follows Anthropic's progressive
disclosure pattern."
```

---

## Stage 3 — Philosophy + Stage 1/2 References (Tasks 5-7)

These three files cover the philosophical foundation and the first two stages of the workflow.

### Task 5: Create `references/philosophy.md`

**Files:**
- Create: `.claude/skills/blog-writer/references/philosophy.md`

**Required structure** (use exact H2/H3 headings):

- `# Philosophy` (H1)
- `## No Silver Bullet 원칙`
- `## 7-섹션 골격`
- `## 거절 기준 (Topic Suitability Rejection)`
  - `### 거절 대상 1: 순수 사용법 / 튜토리얼`
  - `### 거절 대상 2: 단편 팁 / 치트시트`
  - `### 거절 대상 3: 개인 회고 / 경력 일기`
- `## 전환 제안 템플릿`
- `## 거절의 강도`

**Required content** (from spec §10):

1. **No Silver Bullet 원칙 섹션**: 한 문단으로 "이 블로그는 '정답'을 가르치지 않고 '트레이드오프'를 가르친다"는 선언. 모든 글이 어떤 가정에서 출발하는지 명시해야 한다는 점.

2. **7-섹션 골격 섹션**: 7단계 항목을 표로 나열. 1~4번은 필수, 5~7번은 권장임을 명시. 표 컬럼: 순서 / 섹션 / 필수 여부 / 핵심 질문.

3. **거절 대상 1 (튜토리얼)**: 
   - 정의: "X 사용법", "Y 설정 방법", "Z 시작하기" 패턴
   - 예시 5개 이상: "JPA 사용법", "Docker compose 쓰는 법", "Spring Security 설정 방법", "GraphQL 시작하기", "Redis 캐시 도입하기"
   - 왜 거절하는가: 트레이드오프가 없는 설명서는 공식 문서로 충분, 블로그가 추가 가치 못 줌

4. **거절 대상 2 (치트시트)**:
   - 정의: 사용 빈도 높은 명령어/단축키 모음
   - 예시: "VS Code 단축키 모음", "Git 자주 쓰는 명령어 10개"
   - 왜 거절하는가: gist/노션 노트로 충분, 블로그 형식이 부적절

5. **거절 대상 3 (개인 회고)**:
   - 정의: 경력/학습 회고
   - 예시: "개발자 1년 차 회고", "이직 준비하면서 느낀 점"
   - 왜 거절하는가: 포트폴리오 영역, 다른 도구 안내 (`portfolio-writer` 스킬)

6. **전환 제안 템플릿**: 사용자가 거절 대상 주제를 가져왔을 때 Claude가 응답할 정확한 템플릿. 다음 4가지 케이스 예시 포함:
   - "JPA 사용법" → "JPA N+1 문제와 3가지 해결 전략의 트레이드오프", "ORM vs Native SQL", "JPA Dirty Checking의 비용", "JPA 영속성 컨텍스트가 해결하는 문제와 대가"
   - "Docker 쓰는 법" → "Docker vs LXC vs Firecracker — 격리 vs 성능 트레이드오프", "Docker volume vs bind mount", "멀티 스테이지 빌드의 가정"
   - "Redis 시작하기" → "Redis vs Memcached", "Redis 영속성 옵션 비교", "Redis Cluster vs Sentinel"
   - "Kafka 사용법" → "Kafka vs RabbitMQ", "Kafka Consumer Group의 리밸런싱 비용", "Kafka의 at-least-once vs exactly-once 보장"

7. **거절의 강도 섹션**: 부드러운 경고 + 사용자 결정 존중 정책. 사용자가 명시적으로 "그래도 사용법으로"라고 하면 진행하되, 한 번만 재확인 후 따른다. 강제 거절은 안 한다.

- [ ] **Step 1: Read the spec section §10 for canonical content**

```bash
sed -n '/## 10. 철학 강제 메커니즘/,/## 11/p' docs/superpowers/specs/2026-04-15-blog-writer-skill-design.md
```

- [ ] **Step 2: Write the file**

Use the structure and required content above. Each section should have at least 2-3 substantive paragraphs (not just bullet points). Total target: ~150 lines.

- [ ] **Step 3: Verify the file**

```bash
wc -l .claude/skills/blog-writer/references/philosophy.md
grep -c '^## ' .claude/skills/blog-writer/references/philosophy.md
```

Expected: ~150 lines, at least 6 H2 sections.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/blog-writer/references/philosophy.md
git commit -m "feat(skill): add philosophy reference (no-silver-bullet, rejection criteria)"
```

### Task 6: Create `references/stage-1-learning.md`

**Files:**
- Create: `.claude/skills/blog-writer/references/stage-1-learning.md`

**Required structure**:

- `# Stage 1: Learning Loop`
- `## 흐름 5단계`
- `## 1. 주제 적합성 사전 검증`
- `## 2. 학습 목차 제안`
- `## 3. 사용자 수정/승인`
- `## 4. 항목별 Q&A 루프`
  - `### Claude의 선제 설명 패턴`
  - `### 사용자 질문 처리`
  - `### 난이도 추적`
- `## 5. Related Posts 감지`
- `## 6. 종료 조건`
- `## 대화 예시 (전체 흐름)`

**Required content** (from spec §5):

1. **흐름 5단계**: 다이어그램 형태로 5단계 나열 (적합성 검증 → 목차 제안 → 사용자 승인 → Q&A 루프 → 종료 체크포인트).

2. **주제 적합성 사전 검증**: `philosophy.md`를 참조한다고 명시. 거절 케이스 발생 시 거기로 점프.

3. **학습 목차 제안**: 정확한 템플릿 (7개 항목, 1~4 필수 / 5~7 권장). 사용자에게 보여주는 메시지의 정확한 wording을 코드 블록으로 제공. 

4. **사용자 수정/승인**: 사용자가 1~4번 항목 제거 요청 시 재확인 메시지 템플릿.

5. **항목별 Q&A 루프**:
   - Claude의 선제 설명 패턴: 매 항목 시작 시 Claude가 한 번 설명한다는 규칙. 너무 길지 않게(3~5문단). 그 후 "질문 있으시면 말씀해주세요. 없으면 '다음'이라고 하면 [N+1번]로 넘어갑니다" 형태.
   - 사용자 질문 처리: 후속 질문은 자유 형식. Claude가 답변 후 "더 궁금한 게 있나요? 없으면 '다음'"으로 마무리.
   - 난이도 추적: 0~1 (쉬움) / 2~3 (보통) / 4+ (어려움). 측정: 재질문 수 + 오해 교정 횟수 + Claude 자발적 부가 설명 횟수. 점수는 컨텍스트 내 메타 정보로 추적.

6. **Related Posts 감지**: Stage 1 시작 시 `lib/generated/keyword-map.ts`를 Read 도구로 읽어 SLUG_TO_ENTRY/KEYWORD_MAP 파악. Q&A 중 사용자 질문이 기존 키워드와 매칭되면 깊은 설명 생략 + 한 줄 요약 + Stage 3에서 `<RelatedPost />` 배치 약속.

7. **종료 조건**: 정상 종료 (모든 항목 소진), 조기 종료 (사용자 요청 — 1~4번 미진행 시 재확인), 강제 종료 (휴리스틱 기반: 한 항목 5회 재질문 또는 전체 30회 라운드 도달 시 사용자에게 Stage 2 전환 제안).

8. **대화 예시**: 캐시 스탬피드 주제로 학습 목차 제안부터 1~2개 항목 Q&A 후 다음으로 넘어가는 흐름의 대화 스크립트. 약 30~50줄.

- [ ] **Step 1: Read spec section §5 for canonical content**

```bash
sed -n '/## 5. Stage 1/,/## 6. Stage 2/p' docs/superpowers/specs/2026-04-15-blog-writer-skill-design.md
```

- [ ] **Step 2: Write the file**

Target: ~200 lines.

- [ ] **Step 3: Verify and commit**

```bash
wc -l .claude/skills/blog-writer/references/stage-1-learning.md
git add .claude/skills/blog-writer/references/stage-1-learning.md
git commit -m "feat(skill): add stage-1-learning reference (Q&A loop, difficulty tracking, RelatedPost detection)"
```

### Task 7: Create `references/stage-2-note.md`

**Files:**
- Create: `.claude/skills/blog-writer/references/stage-2-note.md`

**Required structure**:

- `# Stage 2: Note Artifact`
- `## 파일 위치`
- `## 노트 파일 전체 템플릿`
- `## 각 섹션 작성 지침`
  - `### 1. Why`
  - `### 2. Where`
  - `### 3. Alternatives & Tradeoffs`
  - `### 4. Root Cause`
  - `### 5. How`
  - `### 6. Anti-use cases`
  - `### 7. Gotchas`
- `## Stage 1 Q&A 로그 포맷`
- `## Stage 2 정리: MDX 구성 계획`
- `## 사용자 리뷰 체크포인트`

**Required content** (from spec §6):

1. **파일 위치**: `.claude/drafts/<slug>-notes.md`. 디렉토리가 없으면 자동 생성. `.gitignore`에 포함되어 로컬 전용.

2. **노트 파일 전체 템플릿**: spec §6.2의 템플릿을 그대로 코드 블록으로 제공. 7개 섹션 + 메타 섹션 + Q&A 로그 + Stage 2 정리 계획.

3. **각 섹션 작성 지침** (1~7번 각각):
   - **Why**: "독자가 모르는 것과 알아야 할 것 사이의 gap을 정의". 흔한 오해, 실무 영향, 글을 다 읽으면 이해하는 것 (3~5개 항목)
   - **Where**: "구체적 시나리오 3개 이상". 이름 있는 사례(회사명, 사건명) 우선
   - **Alternatives & Tradeoffs**: "표 형식 필수". 컬럼: 접근 / 핵심 아이디어 / 장점 / 단점 / 적합한 상황. 각 행 끝에 "이 접근의 가정"을 한 줄로 명시. **No silver bullet 강조 단락 필수**
   - **Root Cause**: "동작 방식보다 깊은 '왜'". 어떤 가정이 깔려 있는지, 왜 직관적 해결책이 실패하는지. 가능하면 수학적 본질이나 모델링의 gap 언급
   - **How**: 단계별 메커니즘. 어려운 부분은 ⚠️ 마크
   - **Anti-use cases**: 언제 쓰지 말아야 하는가. 대안이 더 적합한 상황
   - **Gotchas**: 실무 함정, 자주 하는 실수, 모니터링/관찰의 함정

4. **Stage 1 Q&A 로그 포맷**: 각 섹션별로 `**Q**:` / `**A**:` 쌍을 나열. 섹션 제목 옆에 `난이도 N` 표기. 난이도 4 이상에 ⚠️ 마크.

5. **Stage 2 정리: MDX 구성 계획** (spec §6.2 메타 섹션):
   - 가장 강조할 3가지
   - 난이도 높았던 부분 (시각화/콜아웃 대상)
   - 사용할 MDX 요소 (콜아웃 종류, 코드블록 언어, 시각화 컴포넌트 후보, SVG 후보)
   - **교차 참조 (Related Posts)** — Stage 1에서 감지된 기존 글 목록 + 배치 위치 + 타입(prerequisite/deep-dive/parallel) + 근거
   - 사용할 키워드 (frontmatter 초안)

6. **사용자 리뷰 체크포인트**: Stage 3 진입 전 사용자에게 보여주는 메시지 템플릿. "노트를 .claude/drafts/<slug>-notes.md에 저장했습니다. 확인하시고 수정할 게 있으면 알려주세요. OK라고 하면 Stage 3로 진행합니다."

- [ ] **Step 1: Read spec section §6 for canonical content**

```bash
sed -n '/## 6. Stage 2/,/## 7. Stage 3/p' docs/superpowers/specs/2026-04-15-blog-writer-skill-design.md
```

- [ ] **Step 2: Write the file**

Target: ~250 lines.

- [ ] **Step 3: Verify and commit**

```bash
wc -l .claude/skills/blog-writer/references/stage-2-note.md
git add .claude/skills/blog-writer/references/stage-2-note.md
git commit -m "feat(skill): add stage-2-note reference (note template + section guidelines + checkpoint)"
```

---

## Stage 4 — Stage 3 + Operational References (Tasks 8-10)

### Task 8: Create `references/stage-3-mdx.md`

**Files:**
- Create: `.claude/skills/blog-writer/references/stage-3-mdx.md`

**Required structure**:

- `# Stage 3: MDX Generation`
- `## 본문 구조 매핑`
- `## Hook Paragraph 작성법`
- `## 자동 삽입 콜아웃 3종`
  - `### 1. info — 학습 목표 (글 서두)`
  - `### 2. warning — No Silver Bullet (Alternatives 섹션)`
  - `### 3. error — 핵심 통찰 (Root Cause 섹션)`
- `## 섹션별 시각화 배치`
- `## 코드 블록 작성 규칙`
- `## RelatedPost 컴포넌트 배치`
- `## 마무리 / 참고 자료 섹션`
- `## 전체 MDX 골격 예시`

**Required content** (from spec §7):

1. **본문 구조 매핑**: Stage 2 노트의 7-섹션을 MDX 본문 H2 섹션으로 그대로 매핑. 한국어 헤딩 사용 (예: "## 왜 이 주제를 알아야 하는가 (Why)"). H2 제목은 한국어 + 영문 키워드 병기.

2. **Hook Paragraph 작성법**: 2~3 문장. 독자의 관심을 끌고 본문 진입 동기 부여. "이 글을 읽으면 무엇을 얻는가" 관점. 학습 목표 콜아웃 직전에 위치.

3. **자동 삽입 콜아웃 3종 — 각각 정확한 위치, 정확한 문구 템플릿, 코드 예시 제공**:
   - **info (학습 목표)**: Hook 직후. 정확한 형식: `<Callout type="info" title="이 글의 학습 목표">` + bullet list 3개 (노트의 Why 섹션에서 추출).
   - **warning (No Silver Bullet)**: Alternatives 섹션 상단, 비교표 직전. 정확한 형식: `<Callout type="warning" title="No Silver Bullet 원칙">` + 본문은 spec §3.5의 템플릿 사용.
   - **error (핵심 통찰)**: Root Cause 섹션 시작 부근. 정확한 형식: `<Callout type="error" title="핵심 통찰: ...">` + 가정 깨짐의 핵심 한 문장.

4. **섹션별 시각화 배치**:
   - Section 4 (Root Cause)에 SVG 다이어그램 권장 (가정 시각화)
   - Section 5 (How)에 React 컴포넌트 권장 (동적 동작)
   - Section 6 (Anti-use cases)는 시각화 거의 안 씀
   - 시각화 결정은 `visualization-rules.md` 참조

5. **코드 블록 작성 규칙**:
   - Shiki 라인 하이라이트 ` // [!code highlight] ` 적극 사용
   - `title="..."` 속성으로 파일명 표기
   - 동일 알고리즘을 여러 언어로 비교 시 차이가 명확한 부분만 highlight
   - 언어 선택: 가능한 백엔드/CS 친화적 (Python/Kotlin/TypeScript/SQL/Go)

6. **RelatedPost 컴포넌트 배치**:
   - `prerequisite`: Section 시작 부분, 본문 진입 전 (독자가 모르면 이해 어려운 경우)
   - `deep-dive`: 본문 흐름 안에서 "더 자세한 건..." 위치
   - `parallel`: 글 끝부분, 마무리 직전 ("같이 읽으면 좋은 글")
   - 한 글 안에 같은 slug 중복 금지

7. **마무리 / 참고 자료 섹션**:
   - **마무리**: 핵심 메시지 재강조. 1~2 문단. 철학적 닫음 ("정답은 없다, 가정을 정의하라")
   - **참고 자료**: 외부 링크 (논문, 공식 문서, 참고 서적). bullet list

8. **전체 MDX 골격 예시**: spec §7.1의 골격을 그대로 코드 블록으로 제공. quick-sort.mdx와 같은 수준의 완성도 예시.

- [ ] **Step 1: Read spec sections §7 and §3.5 for canonical content**

```bash
sed -n '/## 7. Stage 3/,/## 8/p' docs/superpowers/specs/2026-04-15-blog-writer-skill-design.md
```

- [ ] **Step 2: Write the file**

Target: ~300 lines. Include the full MDX skeleton example.

- [ ] **Step 3: Verify and commit**

```bash
wc -l .claude/skills/blog-writer/references/stage-3-mdx.md
git add .claude/skills/blog-writer/references/stage-3-mdx.md
git commit -m "feat(skill): add stage-3-mdx reference (body structure, auto-callouts, RelatedPost placement)"
```

### Task 9: Create `references/frontmatter-rules.md`

**Files:**
- Create: `.claude/skills/blog-writer/references/frontmatter-rules.md`

**Required structure**:

- `# Frontmatter Rules`
- `## 자동 생성 필드`
- `## 각 필드 로직`
  - `### title`
  - `### slug`
  - `### date`
  - `### tags`
  - `### keywords`
  - `### summary`
- `## draft:true 충돌 방지 전략`
- `## 사용자 승인 흐름`
- `## 신규 태그 경고`
- `## 키워드 충돌 해결`

**Required content** (from spec §8.1-8.4):

1. **자동 생성 필드**: 6개 필드 나열 (title, slug, date, tags, keywords, summary). 모두 자동 생성 + 사용자 1회 승인.

2. **각 필드 로직**:
   - **title**: 사용자 첫 턴 주제 + 부제. 부제는 노트의 한 줄 주제에서 추출. 예: "캐시 스탬피드: 캐시가 DB를 폭격할 때"
   - **slug**: 소문자 + 하이픈만. 한글 → 영문 대표어 변환. 모호하면 사용자에게 확인. 예: "cache-stampede"
   - **date**: 오늘 날짜 `YYYY-MM-DD`
   - **tags**: 
     - 기존 사용 태그 우선 (`content/posts/`를 스캔해 추출)
     - 카테고리 상위 태그(`Backend`, `Database`, `Infrastructure`, `CS`, `DevOps`, `Architecture`) 1개 이상 필수
     - 2~5개
     - 신규 태그 생성 시 명시적 경고
   - **keywords**:
     - 영문 대표어 + 한글 + 동의어 1개
     - `lib/generated/keyword-map.ts`와 충돌 체크 (대소문자 정규화 후)
     - 충돌 시 사용자 결정 요청
   - **summary**:
     - 노트 Why 섹션 첫 문단 기반
     - "무엇을 이해하게 되는가" 관점으로 재작성 ("X를 설명합니다" ❌ → "X를 이해할 수 있습니다" ⭕)
     - 10~300자 (Velite schema 제약)

3. **draft:true 충돌 방지 전략** (spec §8.3):
   - frontmatter 초안 확정 → MDX 파일을 `draft: true`로 `content/posts/<slug>.mdx`에 저장
   - `pnpm generate-keyword-map` 실행 (draft 제외되므로 충돌 없음)
   - 사용자 승인 + 검증 루프 성공 → `draft: false`로 전환
   - `pnpm generate-keyword-map` 재실행 (정식 등록)

4. **사용자 승인 흐름**: 표 형태로 모든 필드를 한 번에 제시. 정확한 메시지 템플릿 제공:
   ```
   Frontmatter 초안을 준비했습니다. 검토해주세요:
     title:    [...]
     slug:     [...]
     ...
   수정할 항목이 있나요?
   ```
   사용자 응답 패턴: "OK" / "summary만 다시" / "태그 변경: ..." 등.

5. **신규 태그 경고**: 정확한 메시지 템플릿:
   ```
   ⚠️ 신규 태그 N개를 만들려 합니다: [태그1, 태그2]
      기존 태그 M개 중 K개 재사용, N개 신규.
      진행할까요? (또는 기존 태그로 대체 요청)
   ```

6. **키워드 충돌 해결**: 충돌 발생 시 사용자에게 제시하는 옵션 3개:
   - (1) 더 구체화 ("Cache" → "Cache Stampede")
   - (2) 기존 글에서 해당 키워드 이전
   - (3) 이 키워드 제외

- [ ] **Step 1: Read spec section §8.1-8.4**

```bash
sed -n '/### 8.1 Frontmatter/,/### 8.5/p' docs/superpowers/specs/2026-04-15-blog-writer-skill-design.md
```

- [ ] **Step 2: Write the file**

Target: ~150 lines.

- [ ] **Step 3: Verify and commit**

```bash
wc -l .claude/skills/blog-writer/references/frontmatter-rules.md
git add .claude/skills/blog-writer/references/frontmatter-rules.md
git commit -m "feat(skill): add frontmatter-rules reference (auto generation + draft:true conflict avoidance)"
```

### Task 10: Create `references/visualization-rules.md`

**Files:**
- Create: `.claude/skills/blog-writer/references/visualization-rules.md`

**Required structure**:

- `# Visualization Rules`
- `## 감지 휴리스틱 (시각화 필요 신호)`
- `## 제안 단계 (Stage 3 진입 직전)`
- `## 기본값 판단 기준 (React vs SVG vs 건너뜀)`
- `## 신규 React 컴포넌트 규약`
- `## 신규 SVG 규약`
- `## 중복 검사`
- `## Phase 4 프레임워크 준비`

**Required content** (from spec §8.5-8.7):

1. **감지 휴리스틱** (Stage 2 노트 작성 시 자동 감지):
   - "동작 방식", "상태 변화", "시간 순서", "동시 실행", "단계별 진행" 키워드 3회 이상
   - Q&A 로그 난이도 3 이상
   - "race condition", "타이밍", "병렬", "락" 키워드
   - 사용자의 명시적 시각화 요청

2. **제안 단계 메시지 템플릿**:
   ```
   노트 분석 결과 시각화 후보를 발견했습니다:
     1. "<주제 1>" (Section N) — 난이도 X
        기존 컴포넌트: [있음/없음]
        [A] 신규 컴포넌트 생성
        [B] 정적 SVG로 대체
        [C] 건너뜀
     2. ...
   선택: "1-A, 2-B" 또는 "기본값으로"
   ```

3. **기본값 판단 기준** (spec §8.5 보강):
   - **[A] React 컴포넌트**: 시간 변화, 단계 진행, 동시 실행, 사용자 조작 → 알고리즘 단계, Lock 경합 타임라인, GC 마킹 과정, Isolation Level playground
   - **[B] 정적 SVG**: 관계도, 구조도, 함수 곡선, 트레이드오프 매트릭스 → 캐시 스탬피드 타임라인, β 파라미터 곡선, B-Tree 노드 구조
   - **[C] 건너뜀**: 텍스트와 코드만으로 충분, 또는 시각화가 오히려 혼란

4. **신규 React 컴포넌트 규약**:
   - 경로: `components/visualizations/<PascalCase>.tsx`
   - `'use client'` 필수
   - 패턴: `useState` 스텝 인덱스 + `useMemo` 사전 계산 스냅샷 + Prev/Next/Play/Reset 컨트롤
   - QuickSort.tsx 참조 (실제 예시)
   - 색상 시맨틱 (CLAUDE.md §6.4): amber=피벗/키, blue=비교/대기, emerald=확정, red=충돌
   - 상단 주석: `// Phase 4 preview — will be refactored with VisualContainer/StepController`
   - 자동으로 `components/mdx/components.tsx`에 등록

5. **신규 SVG 규약**:
   - 경로: `public/images/<slug>-<descriptor>.svg`
   - viewBox 600×200 내외
   - `role="img"` + `aria-label` 필수
   - 색상은 globals.css의 CSS 변수에 대응하는 hex 사용 (light/dark 두 모드 모두 고려)
   - MDX에서 `![alt text](/images/...)` 마크다운 이미지로 삽입

6. **중복 검사**: 컴포넌트 생성 전 `components/visualizations/` 디렉토리 스캔. 정확 매치 → 재사용. 유사 매치 → 사용자 확인. 매치 없음 → 신규 생성.

7. **Phase 4 프레임워크 준비**: 모든 신규 컴포넌트는 v1에서 일회성으로 생성되지만, Phase 4의 `VisualContainer`/`StepController`/`SpeedSlider` 도입 시 리팩토링 대상이 됨을 컴포넌트 상단 주석으로 표시.

- [ ] **Step 1: Read spec sections §8.5-8.7**

```bash
sed -n '/### 8.5 시각화/,/### 8.8/p' docs/superpowers/specs/2026-04-15-blog-writer-skill-design.md
```

- [ ] **Step 2: Write the file**

Target: ~180 lines.

- [ ] **Step 3: Verify and commit**

```bash
wc -l .claude/skills/blog-writer/references/visualization-rules.md
git add .claude/skills/blog-writer/references/visualization-rules.md
git commit -m "feat(skill): add visualization-rules reference (detection, options, component conventions)"
```

---

## Stage 5 — Validation + Style Guide References (Tasks 11-12)

### Task 11: Create `references/validation-loop.md`

**Files:**
- Create: `.claude/skills/blog-writer/references/validation-loop.md`

**Required structure**:

- `# Validation Loop`
- `## 4-단계 검증 흐름`
- `## 단계 1: pnpm generate-keyword-map`
- `## 단계 2: pnpm velite`
- `## 단계 3: pnpm type-check`
- `## 단계 4: pnpm build`
- `## 자동 수정 한계`
- `## 자동 수정 가능 케이스`
- `## 자동 수정 불가능 케이스`
- `## 최종 보고 템플릿`

**Required content** (from spec §8.8-8.9, §4.5):

1. **4-단계 검증 흐름**: 다이어그램 형태로 4단계 + 실패 시 분기 (재시도/사용자 알림).

2. **각 단계** (1~4):
   - **단계 1 (generate-keyword-map)**: 키워드 충돌 감지 → 충돌 시 에러 출력 → 사용자 해결 옵션 → 재실행 (최대 2회). 충돌 에러 메시지 파싱 방법 제시.
   - **단계 2 (velite)**: Velite schema 위반 감지 → frontmatter 필드 수정 → 재실행 (최대 2회). 흔한 위반: summary 길이 / slug 형식 / tags 빈 배열.
   - **단계 3 (type-check)**: TypeScript 에러 → 컴포넌트 import 누락 등 수정 → 재실행 (최대 2회). 빠른 실패 피드백 목적 (5초 vs build의 30초).
   - **단계 4 (build)**: Next 빌드 → 최종 검증. 실패 시 원인 분석 후 수정 또는 중단.

3. **자동 수정 한계**: 각 단계 최대 2회. 2회 실패 시 사용자 개입 요청. 3회 이상 시도 절대 금지 (무한 루프 방지).

4. **자동 수정 가능 케이스**:
   - `summary` 길이 초과/미달 → 재작성
   - `slug` 형식 오류 (대문자) → 소문자 변환
   - `tags` 빈 배열 → 노트 재참조 후 기본 태그 삽입
   - 컴포넌트 import 누락 → `components/mdx/components.tsx`에 추가

5. **자동 수정 불가능 케이스**:
   - 키워드 충돌 + 사용자 결정 필요
   - Velite의 unexpected schema 위반
   - 알 수 없는 webpack 에러
   - 신규 컴포넌트 코드의 런타임 오류

6. **최종 보고 템플릿** (spec §8.9): 전체 생성된 파일 목록 + 검증 결과 + 다음 단계 안내(사용자 영역).

- [ ] **Step 1: Read spec sections §8.8-8.9 and §4.5**

```bash
sed -n '/### 8.8 검증/,/## 9/p' docs/superpowers/specs/2026-04-15-blog-writer-skill-design.md
```

- [ ] **Step 2: Write the file**

Target: ~120 lines.

- [ ] **Step 3: Verify and commit**

```bash
wc -l .claude/skills/blog-writer/references/validation-loop.md
git add .claude/skills/blog-writer/references/validation-loop.md
git commit -m "feat(skill): add validation-loop reference (4-step verification + auto-fix limits)"
```

### Task 12: Create `references/style-guide.md`

**Files:**
- Create: `.claude/skills/blog-writer/references/style-guide.md`

**Required structure**:

- `# Style Guide (Component Reference)`
- `## 사용 가능한 MDX 컴포넌트`
- `## Callout`
- `## RelatedPost`
- `## QuickSort (참고용)`
- `## 코드 블록 문법`
- `## 키워드 자동 링크`
- `## 자주 쓰는 패턴`

**Required content**:

1. **사용 가능한 MDX 컴포넌트**: 표 형식으로 나열. 컬럼: 컴포넌트 / 파일 경로 / 용도 / props.

2. **Callout**:
   - 위치: `components/mdx/Callout.tsx`
   - props: `type` ('info' | 'warning' | 'error' | 'success'), `title?` (string), `children`
   - 4 variant 색상: light/dark 모두 globals.css에 정의된 `--callout-<type>-<slot>` 토큰 사용
   - 사용 예 4개 (각 type 하나씩):
     ```mdx
     <Callout type="info" title="이 글의 학습 목표">
       내용
     </Callout>
     ```

3. **RelatedPost**:
   - 위치: `components/blog/RelatedPost.tsx`
   - props: `slug` (string, 필수), `type?` ('prerequisite' | 'deep-dive' | 'parallel', 기본 'deep-dive'), `label?` (string)
   - 3 variant 시각 차이 설명
   - 사용 예 3개

4. **QuickSort (참고용)**:
   - 위치: `components/visualizations/QuickSort.tsx`
   - 일회성 시각화 컴포넌트의 참고 패턴
   - 신규 시각화 생성 시 이 패턴을 따를 것
   - 코드 구조 요약 (useState 스텝, useMemo 스냅샷, Prev/Next/Play/Reset)

5. **코드 블록 문법**:
   - 기본: ` ```language `
   - 파일명: ` ```language title="path/to/file.ext" `
   - 라인 하이라이트: 코드 라인 끝에 `// [!code highlight]`
   - 지원 언어: TypeScript/JavaScript/Python/Kotlin/Java/SQL/Bash/JSON/YAML/Rust/Go/C/C++ 등 (Shiki 기본 지원)
   - 4개 언어 예시 (Python, Kotlin, TypeScript, SQL)

6. **키워드 자동 링크**:
   - Phase 3 시스템 — frontmatter `keywords` 배열에 등록된 키워드가 본문에 등장하면 자동으로 해당 글로 링크
   - 인디고 점선 밑줄 + 호버 시 Popover 프리뷰
   - **수동으로 링크할 필요 없음** — frontmatter에 키워드만 등록하면 자동
   - 자기 글의 자기 키워드는 링크 안 됨 (self-link 방지)

7. **자주 쓰는 패턴**:
   - "이 글의 학습 목표" 콜아웃 (글 서두 info)
   - "No Silver Bullet 원칙" 콜아웃 (Alternatives 섹션)
   - "핵심 통찰" 콜아웃 (Root Cause 섹션)
   - "먼저 읽어야 할 글" RelatedPost prerequisite (개념 진입 전)
   - 코드 블록 다국어 비교 (같은 알고리즘 Python + Kotlin + TypeScript)

- [ ] **Step 1: Read quick-sort.mdx as the canonical example**

```bash
cat content/posts/quick-sort.mdx
```

- [ ] **Step 2: Read components for prop signatures**

```bash
cat components/mdx/Callout.tsx
cat components/blog/RelatedPost.tsx
cat components/visualizations/QuickSort.tsx
```

- [ ] **Step 3: Write the file**

Target: ~200 lines. Include actual MDX code blocks for each component example.

- [ ] **Step 4: Verify and commit**

```bash
wc -l .claude/skills/blog-writer/references/style-guide.md
git add .claude/skills/blog-writer/references/style-guide.md
git commit -m "feat(skill): add style-guide reference (component catalog + MDX patterns + quick-sort example)"
```

---

## Stage 6 — Verification (Task 13)

### Task 13: Verify skill discovery + smoke build

**Files:**
- None modified

- [ ] **Step 1: Verify all skill files exist**

```bash
ls -la .claude/skills/blog-writer/
ls -la .claude/skills/blog-writer/references/
```

Expected: `SKILL.md` + `references/` directory with 8 files (philosophy.md, stage-1-learning.md, stage-2-note.md, stage-3-mdx.md, frontmatter-rules.md, visualization-rules.md, validation-loop.md, style-guide.md).

- [ ] **Step 2: Verify file line counts are within target**

```bash
wc -l .claude/skills/blog-writer/SKILL.md .claude/skills/blog-writer/references/*.md
```

Expected (approximate):
- `SKILL.md`: 150 ± 30
- `philosophy.md`: 150 ± 30
- `stage-1-learning.md`: 200 ± 40
- `stage-2-note.md`: 250 ± 50
- `stage-3-mdx.md`: 300 ± 50
- `frontmatter-rules.md`: 150 ± 30
- `visualization-rules.md`: 180 ± 40
- `validation-loop.md`: 120 ± 30
- `style-guide.md`: 200 ± 40

- [ ] **Step 3: Verify SKILL.md frontmatter validity**

```bash
head -5 .claude/skills/blog-writer/SKILL.md
```

Expected: starts with `---`, has `name:` and `description:` keys, ends with `---`.

- [ ] **Step 4: Verify all skill files are tracked by git**

```bash
git ls-files .claude/skills/blog-writer/
```

Expected: 9 files listed.

- [ ] **Step 5: Verify settings.local.json is still ignored**

```bash
git check-ignore .claude/settings.local.json
```

Expected: outputs `.claude/settings.local.json` (still ignored).

- [ ] **Step 6: Run full project verification**

```bash
pnpm build
pnpm type-check
pnpm test
```

All three must exit 0. Tests should still be 87 (no test changes).

- [ ] **Step 7: Verify quick-sort.mdx still renders correctly (no regression from RelatedPost addition)**

```bash
node -e "const p=require('./.velite/posts.json'); console.log('quick-sort body length:', p.find(x=>x.slug==='quick-sort').body.length);"
```

Expected: non-zero length.

- [ ] **Step 8: Final commit (if any cleanup needed)**

If no further changes needed, this task has no commit. Otherwise commit any cleanup.

---

## Definition of Done

- [ ] `components/blog/RelatedPost.tsx` exists with 3 variants (prerequisite/deep-dive/parallel)
- [ ] `components/mdx/components.tsx` exports `RelatedPost` in `mdxComponents`
- [ ] `.gitignore` allows `.claude/skills/**` while keeping `.claude/settings.local.json` ignored
- [ ] `.claude/skills/blog-writer/SKILL.md` exists with valid YAML frontmatter
- [ ] All 8 reference files exist under `.claude/skills/blog-writer/references/`
- [ ] Total skill content is ~1,700 lines (within ±20%)
- [ ] `pnpm build` succeeds
- [ ] `pnpm type-check` exits 0
- [ ] `pnpm test` shows 87 passing
- [ ] Skill files are tracked by git (visible in `git ls-files .claude/skills/blog-writer/`)
- [ ] No regression in existing posts (quick-sort.mdx, b-tree-structure.mdx, etc. still render)

## What's NOT in this plan

- **End-to-end skill test** (running the actual skill on a sample topic to generate a real blog post). This is execution territory — the skill files just need to exist and be valid; whether the skill produces good output requires running it, which is the user's first usage.
- **Dispatch fix** for Velite/Next.js incompatibilities. Not expected.
- **Phase 4 visualization framework**. Out of scope.
- **Updating CLAUDE.md** to reference this new skill. Optional follow-up.

## Rollback Notes

Each task commits independently. If a later task fails, roll back to the previous task's commit:

```bash
git log --oneline
git reset --hard <commit-sha>
```

Reference files are markdown documentation with no runtime impact, so even partial completion (e.g., 5/8 references done) leaves the repo in a buildable state. The pre-skill foundation tasks (1-3) ARE runtime impacting, so verify the build passes after Task 3 before proceeding to Task 4.
