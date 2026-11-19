# MDD 2026 Posters

This repository serves a page or website with index of posters in Poster Corner as planned for NAPCORE Mobility Data Days 2026 in Athens (mdd-2026).

The site is built with [VitePress](https://vitepress.dev/) and uses the NAPCORE branding from the [Awesome NAPCORE](https://github.com/napcore-tools/web-awesome_napcore_tools) site.

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

Pushing to `master` builds the site and deploys it to GitHub Pages (`.github/workflows/deploy.yml`). Without a custom domain the workflow sets `VITEPRESS_BASE=/mdd-2026-posters/`. To preview a build with that base locally, set the same variable for both `build` and `preview`.

Link previews (`og:image` and friends) need absolute URLs. They use `SITE_URL`, which defaults to `https://napcore-tools.github.io/mdd-2026-posters`; with a custom domain the workflow sets it.

### Poster previews

`scripts/build-previews.mjs` renders the first page of every `content/<slug>.pdf` into `docs/public/previews/<slug>-600.jpg` and `<slug>-1200.jpg` with [MuPDF](https://mupdf.com/) (the `mupdf` npm package, WebAssembly, no system dependencies). The images are generated, not committed. Previews newer than their PDF are kept, so only new or changed posters are rendered. A poster without a preview shows a stand-in with its title.

The `mupdf` package is licensed AGPL-3.0. It is used only as a build tool and is not part of the published site.

## Adding a poster

All poster content lives in `content/`:

- `content/<slug>.pdf`: the printed poster, published unchanged at `/posters/<slug>.pdf`
- `content/<slug>.md`: metadata in the front matter (see [Poster metadata](#poster-metadata)); the body is text extracted from the PDF, used for full text search only and never shown
- `content/topics.csv`: the predefined topics (tab separated: `slug`, `label`, `description`)
- `content/index.csv`: the metadata table that `scripts/pdf2md.py` turns into the `.md` files

The site builds a page `/posters/<slug>` for every poster with `status: ready`. The slug is the file name.

## Concepts

Each poster has:

- a slug
- a PDF (of A2 size)
- metadata

## Poster metadata

One poster will have one sidecar file with name `{slug}.md`. Metadata in front matter,

- slug: short textual identifier of the poster
- title: text, can include subtitle
- authors: list of author names, no e-mail
- topics: we will created set of pre-defined topics, posters will relate to that set. We will have to propose the topics.
- keywords: free set of keywords. An array.
- annotation: up to 50 words. Just one paragraph of text.
- contact e-mail: can be empty. If provided, we can publish that.
- body: actually body of mardkown file created by exporting the PDF into markdown or text. The only purpose is to provide textual content for full text search, not to be presented on web presentation (as it can be messy).

The metadata are initially provided in Excel file (not yet curated): <https://rupprechtconsultde.sharepoint.com/:x:/r/sites/NAPCORE-Xallpartners254/Shared%20Documents/WG5%20-%20Data%20Provision%20and%20Use/Task%205.2%20Tools/Mobility%20Data%20Days%202026/Posters/MDD%202026%20Posters.xlsx?d=w3d9563bbedda4b3da8eb995bbc198f3b&csf=1&web=1&e=GTUBpa>

## Required functionality

- repository: <https://github.com:napcore-tools/mdd-2026-posters>
- URL (GH Pages): <https://napcore-tools.github.io/mdd-2026-posters/>

### Show index of posters

### Show details about one poster

### Allow download of single poster (as PDF)

The PDF is actual poster which gets printed and presented at the event. We shall allow downloading the poster.

Note: We do not generate the PDF, it is provided as a file.

### full text search

The search shall take into account each field from metadata.

### Show topics

Allow to show only entries related to selected topic. For this, we need to have a list of topics, present them, and show list of posters related to them.
