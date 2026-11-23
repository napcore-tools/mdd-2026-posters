# AGENTS.md

Instructions for AI coding assistants. VitePress site indexing the posters of the NAPCORE Mobility Data Days 2026 Poster Corner. Read `README.md` first: it documents the content format, the commands, deployment, previews, search and the code layout. This file adds only what the README does not say.

## Content

- `content/` belongs to the colleagues collecting the posters. Do not edit poster metadata, PDFs or `topics.csv` unless asked; report content problems instead.
- The `.md` front matter is the source of the metadata. The body is PDF-extracted text for search only; never display it.
- New posters: `uv run scripts/pdf2md.py <slug>` creates the `.md` from `content/index.xlsx` and the PDF; without slugs it prints an overview. A new version of a PDF: `--text <slug>`, which keeps the front matter. Do not use `--force` unless asked: it rewrites the front matter from the index and loses edits made in the `.md`.
- Inspect `index.xlsx` with the script's overview or with openpyxl in normal mode; read-only mode trusts the stored sheet size and can skip the header row.
- New front matter fields need changes in `core/content.ts` (`Poster`, `readPoster`), `core/validation.ts`, the README field list and, if searchable, `theme/search.ts`.

## Checks

Before committing code changes run:

```sh
npm run type-check
npm run format
npm run build
```

`npm run build` also runs the content check; it must end without errors. Verify UI changes in the browser (`npm run dev`), in light and dark mode and at phone width (about 390 px).

## Conventions

- British English in UI text, comments and docs (`organisation`, `normalise`); `lang` is `en-GB`.
- Import local TypeScript files with the `.ts` extension (`./core/content.ts`).
- Files under `docs/.vitepress/core/` and the data loaders run in Node only; theme components run in the browser.
- URLs in `head` tags and in footer HTML need `withBase()` from `config.ts`; VitePress adds the base only to links it renders itself. Absolute URLs for link previews use `SITE_URL`.
- Scoped styles: do not use `:global(.dark) ...`, it compiles to a bare `.dark {}` rule that styles the whole page. Use `.dark .some-class :deep(...)` instead.
- Accessibility: text contrast at least 4.5:1 in both modes, visible focus outlines, respect `prefers-reduced-motion`.
- Commit messages: short, imperative, sentence case, no prefix (`Add search and topic filter to the home page`).
- Branch `main`. Pushing deploys the site to GitHub Pages; do not push unless asked.

## Windows notes

- `npm run preview` locks `docs/.vitepress/dist/`; stop it before `npm run build` (otherwise EPERM). It also indexes files at start, so restart it after each build.
- In Git Bash, `VITEPRESS_BASE=/mdd-2026-posters/` is rewritten to a Windows path; prefix the command with `MSYS_NO_PATHCONV=1`. Use the same base for `build` and `preview`.
- Generated preview images (`docs/public/previews/`) are gitignored; `npm run previews -- --force` renders all of them again.
