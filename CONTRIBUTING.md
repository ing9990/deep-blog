# Contributing to DEEP

Thank you for your interest. DEEP is a personal blog, so external code contributions are limited in scope, but typo fixes, content corrections, and small bug fixes are welcome. This document covers the local workflow, branch strategy, and post authoring rules.

> 한국어 버전: [CONTRIBUTING.ko.md](./CONTRIBUTING.ko.md)

## Code of conduct

Be respectful in issues and pull requests. Critique ideas, not people.

## Local setup

See [README.md](./README.md#getting-started) for prerequisites and bootstrap commands. The short version:

```bash
corepack enable
pnpm install
PORT=3010 pnpm dev   # open http://blog.localhost:3010/
```

## Branch strategy

This repository follows a `develop → feature → main` flow:

| Branch | Purpose |
| --- | --- |
| `main` | Production (deployed to <https://ing9990.com>). Updated only via reviewed PRs from `develop`. |
| `develop` | Integration branch. Merged into `main` when a release is ready. |
| `feature/<topic>` | One unit of work per branch. Squash-merged into `develop`. |

- Branch off `develop` for feature work: `git checkout -b feature/<short-topic>`.
- Keep branches short-lived. Rebase on `develop` if it moves significantly.
- **Never force-push to `main` or `develop`.** Force-push only on your own feature branch, and only when nobody else is collaborating on it.

## Commit messages

Use the existing convention (`type(scope): subject`). Recent examples from `git log`:

```
fix(header,mobile): move post TOC out of header into a right-edge clip FAB
fix(css,mobile): clip horizontal overflow at html, not just body
docs(claude-md): document emphasis guard and tag taxonomy invariants
fix(mdx,ci): enforce bold+punctuation emphasis guard via prebuild
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`.

- Keep the subject under ~72 chars.
- Use the body to explain **why**, not what — the diff already shows what.
- One logical change per commit. Don't bundle unrelated edits.

## Pre-submit checklist

Before opening a PR, run locally:

```bash
pnpm type-check        # tsc --noEmit
pnpm lint              # next lint + stylelint (token rules)
pnpm test              # velite build + vitest run
pnpm build             # full production build, if your change is large
```

If you touched MDX frontmatter, also run:

```bash
pnpm generate-keyword-map
```

…and commit the regenerated `lib/generated/keyword-map.ts`.

If you touched UI, do a manual pass:

- Light + dark theme
- Mobile width (375px) — use the browser device toolbar
- Keyword link Popovers still open
- No new errors in the dev server log (`BashOutput` of the background `pnpm dev`)

## Pull requests

- One topic per PR. If your branch grew, split it before requesting review.
- Title: same convention as commit subjects.
- Description: a short summary, the motivation, and a test plan (commands you ran, manual checks performed).
- Link the related issue if one exists.

## Authoring posts

> **All new MDX posts under `content/posts/` are created via the `blog-writer` skill.** Direct file `Write` is not the supported path — the skill enforces frontmatter, validation, and visualization rules.

If you are submitting a content correction (typo, dead link, factual fix) to an existing post, edit the MDX directly — that is fine. For *new* posts, please open an issue first to discuss the topic.

The post pipeline is:

1. **Frontmatter validation** — `velite.config.ts` Zod schema (titles/summaries as `{ ko, en }`, lowercase-hyphen `tags`, valid `category`).
2. **Emphasis guard** — `scripts/check-mdx-emphasis.ts` blocks `**"…"**` and `**(…)**` patterns in `predev` / `prebuild` / `pretest`. Move punctuation outside the bold: `"**X**"`, `**X**(Y)`.
3. **Keyword map regeneration** — `scripts/generate-keyword-map.ts` builds `lib/generated/keyword-map.ts` from every post's `keywords`. **One keyword maps to exactly one post**; collisions abort the build. The generated file is committed.
4. **Velite build** — compiles MDX into typed collections under `.velite/`.
5. **Auto-link** — `plugins/remark-auto-link.ts` rewrites keyword mentions into `<KeywordLink>` Popovers at MDX compile time. Self-links are prevented by matching the file basename against the current slug, so the filename must equal the `slug` field.

### Available MDX components

- `<Callout type="info|warning|note">…</Callout>`
- `<Tabs group?="lang">` with `<Tab label="…">…</Tab>` children. The `<Tabs>` wrapper is a Server Component and `<TabsView>` is the Client Component — do **not** add `'use client'` to `Tabs.tsx` (it breaks RSC streaming for Shiki blocks).
- Interactive visualizations under `components/visualizations/`. Add a new one by creating a Client Component there and registering it in `components/mdx/components.tsx`.
- KaTeX (`$inline$`, `$$block$$`) and Shiki fenced code blocks with line-highlight comments (`// [!code highlight]`).

### Style hard-codes are blocked

ESLint and Stylelint reject hard-coded design values. If you need a new constant, define it as a CSS variable in `app/globals.css` (primitive in `@theme inline`, semantic alias in `:root`), document it in [`docs/design-tokens.md`](./docs/design-tokens.md), and use the variable in your component. The full ban list is in `CLAUDE.md` §5 / §6 and the rules live in `.eslintrc.json` and `.stylelintrc.json`.

## Reporting issues

Open an issue with:

- A short title.
- Steps to reproduce (URL of the affected page, browser, viewport size).
- Expected vs actual behavior.
- A screenshot or recording when relevant.

For security issues, email the maintainer instead of filing a public issue.

## Questions

If something here is unclear, open a discussion or an issue tagged `question`.
