# MDD 2026 Posters

This repository serves a page or website with index of posters in Poster Corner as planned for NAPCORE Mobility Data Days 2026 in Athens (mdd-2026).

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
