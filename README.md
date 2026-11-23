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
- `content/index.xlsx`: the table of submitted posters, used only to create the `.md` of new posters (see below); the site does not read it

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

### Adding or updating posters

The posters are collected in an [Excel file on SharePoint](https://rupprechtconsultde.sharepoint.com/:x:/r/sites/NAPCORE-Xallpartners254/Shared%20Documents/WG5%20-%20Data%20Provision%20and%20Use/Task%205.2%20Tools/Mobility%20Data%20Days%202026/Posters/MDD%202026%20Posters.xlsx?d=w3d9563bbedda4b3da8eb995bbc198f3b&csf=1&web=1&e=GTUBpa). A copy of it is kept as `content/index.xlsx`: sheet `index`, the first row naming the columns `slug`, `status`, `title`, `authors`, `topics`, `keywords`, `annotation`, `e-mail`.

`scripts/pdf2md.py` creates the `.md` of a new poster from its row in `index.xlsx` and the text of its PDF. Once created, the `.md` is the source of the metadata and the script does not overwrite it. It needs [uv](https://docs.astral.sh/uv/), which installs the Python dependencies, and `pdftotext` from poppler; `pdftoppm` and tesseract only for PDFs without a text layer.

```sh
uv run scripts/pdf2md.py                  # overview: which posters have a PDF and a .md
uv run scripts/pdf2md.py nlkf webstore    # create the .md of new posters
uv run scripts/pdf2md.py --text uvarbox   # new version of a PDF: replace only the search text
uv run scripts/pdf2md.py --force nlkf     # rewrite the .md from the index; edits in the .md are lost
```

To add a poster:

1. Copy the updated Excel file from SharePoint to `content/index.xlsx` and the PDF to `content/<slug>.pdf`.
2. Run `uv run scripts/pdf2md.py <slug>`.
3. Check the front matter of `content/<slug>.md`; add the topics if the index has none.
4. Run `npm run build` to check the content, then commit.

Changes to the metadata of an existing poster go directly into its `.md` file.

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

`scripts/build-previews.mjs` renders the first page of every `content/<slug>.pdf` into `docs/public/previews/<slug>-600.jpg` and `<slug>-1200.jpg` with [MuPDF](https://mupdf.com/) (the `mupdf` npm package, WebAssembly, no system dependencies). The images are generated, not committed. Previews newer than their PDF are kept, so only new or changed posters are rendered. After changing the rendering itself (widths or JPEG quality in the script), run `npm run previews -- --force` to render all previews again. A poster without a preview shows a stand-in with its title.

The `mupdf` package is licensed AGPL-3.0. It is used only as a build tool and is not part of the published site.

### Search

The home page searches in the browser with [MiniSearch](https://lucaong.github.io/minisearch/) (`docs/.vitepress/theme/search.ts`). Matches in title, keywords and authors rank highest; terms match as prefixes, with small typos and without accents. Search and topic are kept in the URL, e.g. `/?topic=data-quality` or `/?q=datex`.

### Code layout

- `docs/.vitepress/config.ts`: site configuration, PDF publishing, content check
- `docs/.vitepress/core/`: reading and checking `content/` (Node only)
- `docs/.vitepress/data/`: data loaders for posters and topics
- `docs/.vitepress/theme/`: NAPCORE theme, components, search
- `docs/posters/[slug].md`, `[slug].paths.ts`: one page per published poster
- `scripts/`: preview rendering, `.md` creation from `index.xlsx`
