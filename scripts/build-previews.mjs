/**
 * Renders the first page of every content/<slug>.pdf into preview images:
 *
 *   docs/public/previews/<slug>-600.jpg    tiles on the home page
 *   docs/public/previews/<slug>-1200.jpg   poster page, high-density screens, link previews
 *
 * Previews newer than their PDF are kept; previews of removed PDFs are deleted.
 * Runs before `npm run dev` and `npm run build`. Use --force to render everything again.
 *
 * Usage: node scripts/build-previews.mjs [--force]
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as mupdf from 'mupdf';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = join(ROOT, 'content');
const PREVIEW_DIR = join(ROOT, 'docs', 'public', 'previews');

/** Image widths in pixels and their JPEG quality */
const SIZES = [
  { width: 600, quality: 75 },
  { width: 1200, quality: 80 },
];

const force = process.argv.includes('--force');

const mtime = (file) => {
  try {
    return statSync(file).mtimeMs;
  } catch {
    return 0;
  }
};

const previewFile = (slug, width) => join(PREVIEW_DIR, `${slug}-${width}.jpg`);

function render(pdfFile, slug) {
  const doc = mupdf.Document.openDocument(readFileSync(pdfFile), 'application/pdf');
  try {
    if (doc.countPages() > 1) console.warn(`  ${slug}: ${doc.countPages()} pages, only the first is shown`);
    const page = doc.loadPage(0);
    const [x0, y0, x1, y1] = page.getBounds();
    if (x1 - x0 > y1 - y0) console.warn(`  ${slug}: landscape page, the preview will be cropped`);
    for (const { width, quality } of SIZES) {
      const scale = width / (x1 - x0);
      const pixmap = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true);
      writeFileSync(previewFile(slug, width), pixmap.asJPEG(quality));
      pixmap.destroy();
    }
    page.destroy();
  } finally {
    doc.destroy();
  }
}

mkdirSync(PREVIEW_DIR, { recursive: true });

const slugs = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith('.pdf'))
  .map((f) => basename(f, '.pdf'));

let rendered = 0;
let failed = 0;
const started = performance.now();

for (const slug of slugs) {
  const pdf = join(CONTENT_DIR, `${slug}.pdf`);
  const upToDate = SIZES.every(({ width }) => mtime(previewFile(slug, width)) >= mtime(pdf));
  if (upToDate && !force) continue;
  try {
    render(pdf, slug);
    rendered++;
  } catch (err) {
    // A broken PDF must not stop the build; the site shows a stand-in instead
    failed++;
    console.error(`  ${slug}: rendering failed: ${err instanceof Error ? err.message : err}`);
  }
}

// Remove previews of posters that no longer exist
let removed = 0;
for (const file of readdirSync(PREVIEW_DIR)) {
  const match = file.match(/^(.+)-\d+\.jpg$/);
  if (match && !slugs.includes(match[1])) {
    rmSync(join(PREVIEW_DIR, file));
    removed++;
  }
}

const seconds = ((performance.now() - started) / 1000).toFixed(1);
console.log(
  `Previews: ${rendered} rendered, ${slugs.length - rendered - failed} up to date` +
    (removed ? `, ${removed} removed` : '') +
    (failed ? `, ${failed} failed` : '') +
    ` (${seconds} s)`
);
