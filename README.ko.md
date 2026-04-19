# DEEP

> *"기술 주제를 최대한 이해하기 쉽게 정리"*

DEEP은 **내부 동작 원리**, **기술이 필요한 이유**, **대안과의 트레이드오프**에 집중하는 개인 기술 블로그입니다.

- **운영 사이트**: <https://ing9990.com>
- **로컬 개발**: <http://blog.localhost:3010/>
- **English README**: [README.md](./README.md)

## Introduce

DEEP은 **공부가 먼저, 글이 나중**인 흐름으로 설계되어 있습니다. "블로그 글을 쓰자"가 아니라 "이걸 깊게 이해하자"로 시작하면, 그 세션의 결과로 글이 자연스럽게 떨어집니다.

1. **원하는 주제로 공부를 시작합니다.** 더 깊이 이해하고 싶은 무엇이든. B-Tree 내부 구조, JVM GC, CAP 정리, 무엇이든.
2. **모르는 건 질문합니다.** 헷갈리는 부분을 Claude Code에게 물어보세요. 개념이 잡힐 때까지 단계별로 파고들면 됩니다. 이 대화 자체가 공부 세션입니다.
3. **노트가 자동으로 형성됩니다.** 세션이 진행되는 동안 워크플로가 구조화된 노트를 누적합니다. 무엇을 물었고, 어떻게 정리됐고, 트레이드오프는 무엇이고, 어떤 다이어그램을 남길지가 쌓입니다.
4. **노트를 글로 변환합니다.** 주제가 일단락됐다고 느껴지면, 같은 워크플로가 노트를 `content/posts/` 하위의 MDX 포스트로 변환합니다.

목표는 "이미 아는 걸 쓴다"의 반대입니다. **소리 내어 배우고, 그 결과물을 그대로 발행**해서 다음 독자가 같은 경로를 따라올 수 있게 만듭니다.

## Requirement

1. **Node.js** (LTS 권장)
2. **Claude Code** — 글 작성 워크플로는 번들된 `blog-writer` 스킬로 Claude Code 내부에서 실행됩니다

## 시작하기

```bash
corepack enable          # 1회. package.json에 고정된 pnpm 버전을 가져옵니다
pnpm install
PORT=3010 pnpm dev
```

<http://blog.localhost:3010/> 에서 접속하세요.

> bare `blog`가 아닌 `blog.localhost`를 사용하세요. Safari는 bare `blog`를 검색어로 처리하고 HTTPS로 강제 승격합니다.

## 블로그 글 추가하는 법

**포스트는 손으로 직접 쓰지 않습니다.** 이 리포에서 Claude Code를 열고 *"블로그 써줘"*, *"quick sort 글 쓰자"*, *"cache stampede 포스트 만들어줘"* 같은 말로 시작하세요. `blog-writer` 스킬이 받아 3단계로 진행합니다.

### 1단계 — 학습 Q&A

주제에 대해 Claude와 주고받습니다. 헷갈리는 건 다 물어보세요. 내부 동작은 어떻게 되는지, 언제 쓰는지, 어떻게 망가지는지, 무엇과 경쟁하는지. 스킬은 **내부 메커니즘**, **이 기술이 왜 존재하는지**, **대안과의 트레이드오프** 쪽으로 편향되어 있습니다. 주제가 마무리됐다고 느낄 때까지 머무르세요.

### 2단계 — 노트

스킬이 Q&A를 구조화된 아웃라인으로 변환합니다. 섹션, 핵심 주장, 남길 코드 조각, 시각화할 가치가 있는 다이어그램. 무엇이 들어가고 무엇이 빠지는지 결정하는 단계입니다.

### 3단계 — MDX

스킬이 빌드 파이프라인이 요구하는 엄격한 frontmatter와 함께 `content/posts/<slug>.mdx` 단일 파일을 생성합니다.

```yaml
---
title:
  ko: "퀵 정렬"
  en: "Quick Sort"
slug: "quick-sort"
date: 2026-04-15
tags:
  - algorithm
  - cs
keywords:
  - Quick Sort
  - 퀵 정렬
summary:
  ko: "분할 정복 기반 비교 정렬 알고리즘…"
  en: "The classic divide-and-conquer comparison sort…"
category: computer-science
---
```

스킬이 함께 처리해주는 것:

- `pnpm generate-keyword-map` 자동 실행 — 새 `keywords`가 다른 포스트에서 자동 링크되도록.
- Emphasis 가드 — 불안정한 Markdown 패턴(`**"…"**`, `**(…)**`)을 차단.
- 수식(KaTeX), 코드(Shiki), `<Callout>`, `<Tabs>`, 그리고 포스트 옆에 사는 인터랙티브 React 시각화 렌더링.

파일이 작성되면 실행 중인 `pnpm dev`가 즉시 잡아내고, `http://blog.localhost:3010/posts/<slug>`에서 글이 라이브로 보입니다.

## 기여

브랜치 전략, 커밋 메시지, 포스트 작성 워크플로는 [CONTRIBUTING.ko.md](./CONTRIBUTING.ko.md) (English: [CONTRIBUTING.md](./CONTRIBUTING.md)) 참고.

## 라이선스

개인 블로그 — 콘텐츠 재사용 라이선스를 부여하지 않습니다. 코드는 참고용 구현으로 제공되며, 상당 부분을 재사용하려면 이슈를 먼저 열어주세요.
