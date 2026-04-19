# DEEP

> *"Explaining technical topics as clearly as possible."*

DEEP is a personal technical blog focused on **how things work internally**, **why a technology exists**, and **trade-offs between alternatives**.

- **Live site**: <https://ing9990.com>
- **Local**: <http://blog.localhost:3010/>
- **한국어 README**: [README.ko.md](./README.ko.md)

## Introduce

DEEP is built around a **study-first writing flow**. You don't sit down and "write a blog post" — you sit down and **learn something**, and a post falls out of that session.

1. **Pick a topic and start studying.** Anything you want to understand more deeply: B-Tree internals, JVM GC, the CAP theorem, whatever.
2. **Ask whatever you don't get.** Talk to Claude Code about the parts you find confusing. Drill in step by step until the concept clicks. The conversation itself is the study session.
3. **Notes form automatically.** As the session progresses, the workflow accumulates a structured note: what you asked, what was clarified, the trade-offs, the diagrams worth keeping.
4. **Turn the note into a post.** When the topic feels closed, the same workflow converts the note into an MDX post under `content/posts/`, ready to publish.

The goal is the opposite of "write what you already know." The goal is **learn out loud, then publish the artifact** so the next reader can follow the same path.

## Requirement

1. **Node.js** (LTS recommended)
2. **Claude Code** — the post-writing workflow runs inside Claude Code via the bundled `blog-writer` skill

## Getting started

```bash
corepack enable          # one time, picks up the pinned pnpm version
pnpm install
PORT=3010 pnpm dev
```

Open <http://blog.localhost:3010/>.

> Use `blog.localhost`, not bare `blog`. Safari treats bare `blog` as a search query and forces HTTPS.

## How to add a blog post

**Posts are never written by hand.** Open Claude Code in this repo and say something like *"Let's write a blog post about <topic>"* (e.g., `블로그 써줘`, `quick sort 글 쓰자`, `write a post on cache stampede`). The `blog-writer` skill takes over and walks you through three stages.

### Stage 1 — Learning Q&A

You and Claude have a back-and-forth about the topic. Ask whatever is fuzzy: how it works internally, when to use it, how it fails, what it competes with. The skill is tuned to bias toward **internal mechanics**, **why this technology exists**, and **trade-offs vs alternatives**. Stay in this stage until you feel the topic is closed.

### Stage 2 — Note

The skill converts the Q&A into a structured outline: sections, key claims, code snippets to keep, diagrams worth visualizing. This is where you decide what makes the cut and what doesn't.

### Stage 3 — MDX

The skill emits a single MDX file under `content/posts/<slug>.mdx` with the strict frontmatter the build pipeline expects:

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

The skill also handles:

- Auto-running `pnpm generate-keyword-map` so your new `keywords` link from other posts.
- An emphasis guard that blocks unstable Markdown patterns (`**"…"**`, `**(…)**`).
- Rendering math (KaTeX), code (Shiki), `<Callout>`, `<Tabs>`, and the interactive React visualizations that live alongside posts.

Once the file is written, the running `pnpm dev` picks it up and the post is live at `http://blog.localhost:3010/posts/<slug>`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) (한국어: [CONTRIBUTING.ko.md](./CONTRIBUTING.ko.md)) for branch conventions, commit messages, and the post authoring workflow.

## License

Private personal blog — no license granted for content reuse. Code is provided as a reference implementation; please open an issue before reusing substantial portions.
