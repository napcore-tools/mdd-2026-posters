# MDD 2026 Posters

Index of the posters in the Poster Corner of the NAPCORE Mobility Data Days 2026 in Athens, 25–26 November 2026.

- Site: <https://napcore-tools.github.io/mdd-2026-posters/>
- Repository: <https://github.com/napcore-tools/mdd-2026-posters>

The site is built with [VitePress](https://vitepress.dev/) and uses the NAPCORE branding from the [Awesome NAPCORE](https://github.com/napcore-tools/web-awesome_napcore_tools) site.

## Features

- Home page with all posters as tiles, showing a preview of the poster, title, authors and topics
- Full text search over all metadata and the text of the posters
- Filter by topic; search and topic are kept in the URL, so a filtered view can be linked
- A page per poster with preview, annotation, topics, keywords, contact e-mail and the PDF to open or download
- Link previews (title, annotation, poster image) when a poster page is shared

## Poster content

All poster content lives in `content/`:

- `content/<slug>.pdf`: the printed poster (A2), published unchanged at `/posters/<slug>.pdf`
- `content/<slug>.md`: the poster metadata (see below)
- `content/topics.csv`: the predefined topics, tab separated: `slug`, `label`, `description`
- `content/index.csv`: the initial metadata table, not used by the site (see below)

The slug is the file name. The site builds a page `/posters/<slug>` for every poster with `status: ready`.

### Poster metadata

The `.md` files are the source of the poster metadata: to change a title, authors, topics or any other field, edit the front matter of `content/<slug>.md`.

```yaml
---
slug: "chimera"
status: "ready"
title: "Chimera: Interoperable and AI-ready Mobility (Meta)Data Leveraging Knowledge Graphs"
authors: ["Mario Scrocca", "Marco Comerio", "Marco Grassi", "Alessio Carenini (Cefriel)"]
topics: ["interoperability", "innovation"]
keywords: ["knowledge graphs", "semantic interoperability", "mobility data"]
annotation: "Chimera is a modular and configurable solution ..."
email: "mario.scrocca@cefriel.com"
---
Text extracted from the PDF ...
```

- `slug`: short identifier, the same as the file name
- `status`: only posters with `ready` are published
- `title`: the poster title, can include a subtitle
- `authors`: list of author names, optionally with organisation; no e-mails
- `topics`: slugs of topics from `content/topics.csv`
- `keywords`: list of free keywords
- `annotation`: one paragraph, up to 200 words, shown in full on the poster page
- `email`: contact e-mail, optional; published on the poster page if given
- body: text extracted from the PDF. It is used only for full text search and never shown, as extracted text can be messy.

### Initial import from index.csv

The metadata were first collected in an [Excel file on SharePoint](https://rupprechtconsultde.sharepoint.com/:x:/r/sites/NAPCORE-Xallpartners254/Shared%20Documents/WG5%20-%20Data%20Provision%20and%20Use/Task%205.2%20Tools/Mobility%20Data%20Days%202026/Posters/MDD%202026%20Posters.xlsx?d=w3d9563bbedda4b3da8eb995bbc198f3b&csf=1&web=1&e=GTUBpa) and exported to `content/index.csv`.

The site never reads `content/index.csv`. It is used only by `scripts/pdf2md.py`, which is run manually to generate `.md` files from it and the PDFs, for example for a new poster (requires Python and poppler's `pdftotext`; tesseract for PDFs without a text layer). The script rewrites the `.md` file of every PDF that has a row in `index.csv`, so edits made in the `.md` files since are lost; keep only the files you want regenerated with `git diff` / `git checkout` before committing.

### Content check

Every build and dev server start checks `content/` (`docs/.vitepress/core/validation.ts`).

Errors stop `npm run build`, so a broken poster is never deployed: unreadable front matter, a `slug` that differs from the file name, a missing title or PDF, a topic not in `topics.csv`, a duplicate or unlabelled topic.

Warnings are only printed: an annotation over 200 words, missing authors, keywords, topics or annotation, an invalid e-mail, a PDF without `.md`, a missing preview, a poster that is not `ready`. The dev server prints errors too but keeps running.

## Development

Requires Node.js 22.12+ or 24+.

```sh
npm install
npm run dev        # development server at http://localhost:5173
npm run build      # static site in docs/.vitepress/dist
npm run preview    # serve the built site
npm run type-check
npm run format     # check formatting (format:fix to apply)
npm run previews   # render poster previews (runs before dev and build; -- --force to redo all)
```

### Deployment

Pushing to `main` builds the site and deploys it to GitHub Pages (`.github/workflows/deploy.yml`). Without a custom domain the workflow sets `VITEPRESS_BASE=/mdd-2026-posters/`. To preview a build with that base locally, set the same variable for both `build` and `preview`.

Link previews (`og:image` and friends) need absolute URLs. They use `SITE_URL`, which defaults to `https://napcore-tools.github.io/mdd-2026-posters`; with a custom domain the workflow sets it.

### Poster previews

`scripts/build-previews.mjs` renders the first page of every `content/<slug>.pdf` into `docs/public/previews/<slug>-600.jpg` and `<slug>-1200.jpg` with [MuPDF](https://mupdf.com/) (the `mupdf` npm package, WebAssembly, no system dependencies). The images are generated, not committed. Previews newer than their PDF are kept, so only new or changed posters are rendered. A poster without a preview shows a stand-in with its title.

The `mupdf` package is licensed AGPL-3.0. It is used only as a build tool and is not part of the published site.

### Search

The home page searches in the browser with [MiniSearch](https://lucaong.github.io/minisearch/) (`docs/.vitepress/theme/search.ts`). Matches in title, keywords and authors rank highest; terms match as prefixes, with small typos and without accents. Search and topic are kept in the URL, e.g. `/?topic=data-quality` or `/?q=datex`.

### Code layout

- `docs/.vitepress/config.ts`: site configuration, PDF publishing, content check
- `docs/.vitepress/core/`: reading and checking `content/` (Node only)
- `docs/.vitepress/data/`: data loaders for posters and topics
- `docs/.vitepress/theme/`: NAPCORE theme, components, search
- `docs/posters/[slug].md`, `[slug].paths.ts`: one page per published poster
- `scripts/`: preview rendering, `.md` generation from `index.csv`
