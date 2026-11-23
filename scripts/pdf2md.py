# /// script
# requires-python = ">=3.10"
# dependencies = ["openpyxl>=3.1"]
# ///
"""Create content/<slug>.md for new posters from content/index.xlsx and content/<slug>.pdf.

Front matter comes from the sheet "index" of content/index.xlsx, the body is
text extracted from the PDF (pdftotext, falling back to OCR via pdftoppm +
tesseract for PDFs without a text layer). The body only serves full text search.

The .md files are the source of the poster metadata once created, so the
script never overwrites them unless asked to.

Usage, from the repository root:
  uv run scripts/pdf2md.py                   overview of the index, PDFs and .md files
  uv run scripts/pdf2md.py nlkf webstore     create the .md of new posters
  uv run scripts/pdf2md.py --text uvarbox    replace only the search text (after a new PDF)
  uv run scripts/pdf2md.py --force nlkf      rewrite the whole .md from the index;
                                             edits made in the .md are lost
"""

import argparse
import io
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import openpyxl

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"
INDEX_FILE = "index.xlsx"
INDEX_SHEET = "index"
COLUMNS = ["slug", "status", "title", "authors", "topics", "keywords", "annotation", "e-mail"]


class PosterError(Exception):
    """A problem that stops the import of one poster or of all of them."""


# --- Index -----------------------------------------------------------------


def cell_text(value) -> str:
    text = "" if value is None else str(value).strip()
    # E-mail cells may hold a hyperlink target
    return text.removeprefix("mailto:")


def read_index(content_dir: Path) -> dict[str, dict[str, str]]:
    """Rows of the sheet "index" by slug; the first row holds the column names."""
    path = content_dir / INDEX_FILE
    if not path.exists():
        raise PosterError(f"{path} not found")
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    if INDEX_SHEET not in workbook.sheetnames:
        raise PosterError(f'{path.name} has no sheet "{INDEX_SHEET}" (sheets: {", ".join(workbook.sheetnames)})')
    sheet = workbook[INDEX_SHEET]
    sheet.reset_dimensions()  # the stored sheet size can be wrong and hide rows
    rows = sheet.iter_rows(values_only=True)

    header = [cell_text(c) for c in next(rows, ())]
    missing = [c for c in COLUMNS if c not in header]
    if missing:
        raise PosterError(
            f'the first row of sheet "{INDEX_SHEET}" must name the columns; missing: {", ".join(missing)}'
        )

    index: dict[str, dict[str, str]] = {}
    for values in rows:
        row = {name: cell_text(values[i]) if i < len(values) else "" for i, name in enumerate(header) if name}
        slug = row.get("slug", "")
        if not slug:
            continue
        if slug in index:
            print(f"WARNING: {slug} is in the index twice; the last row is used", file=sys.stderr)
        index[slug] = row
    return index


# --- Conversion ------------------------------------------------------------


def split_list(value: str, separators: str) -> list[str]:
    return [item.strip() for item in re.split(separators, value) if item.strip()]


def front_matter(row: dict[str, str]) -> str:
    fields = {
        "slug": row["slug"],
        "status": row["status"],
        "title": row["title"],
        "authors": split_list(row["authors"], r",|\band\b"),
        "topics": split_list(row["topics"], r"[;,]"),
        "keywords": split_list(row["keywords"], r";" if ";" in row["keywords"] else r","),
        "annotation": row["annotation"],
        "email": row["e-mail"],
    }
    # JSON strings and lists are valid YAML
    lines = [f"{key}: {json.dumps(value, ensure_ascii=False)}" for key, value in fields.items()]
    return "---\n" + "\n".join(lines) + "\n---\n"


def run(command: list[str]) -> str:
    if not shutil.which(command[0]):
        raise PosterError(f"{command[0]} not found; install poppler (pdftotext, pdftoppm) and tesseract for OCR")
    return subprocess.run(command, capture_output=True, encoding="utf-8", check=True).stdout


def pdf_text(pdf: Path) -> str:
    text = run(["pdftotext", "-enc", "UTF-8", str(pdf), "-"])
    if text.split():
        return text
    # No text layer: OCR the rendered pages
    print(f"  {pdf.name} has no text layer, using OCR")
    with tempfile.TemporaryDirectory() as tmp:
        run(["pdftoppm", "-r", "200", "-png", str(pdf), f"{tmp}/page"])
        return "\n\n".join(
            run(["tesseract", str(page), "-", "-l", "eng"]) for page in sorted(Path(tmp).glob("page*.png"))
        )


def clean_body(text: str) -> str:
    lines = [line.rstrip() for line in text.replace("\f", "\n").splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip() + "\n"


def split_front_matter(md_text: str) -> str:
    """The front matter of a .md file, including both --- lines."""
    match = re.match(r"---\n.*?\n---\n", md_text, re.DOTALL)
    if not match:
        raise PosterError("no front matter found")
    return match.group(0)


# --- Commands --------------------------------------------------------------


def import_poster(slug: str, index: dict, content_dir: Path, *, text_only: bool, force: bool) -> None:
    pdf = content_dir / f"{slug}.pdf"
    md = content_dir / f"{slug}.md"
    if not pdf.exists():
        raise PosterError(f"{pdf.name} not found")

    if text_only:
        if not md.exists():
            raise PosterError(f"{md.name} not found; create it first without --text")
        head = split_front_matter(md.read_text(encoding="utf-8"))
        md.write_text(head + "\n" + clean_body(pdf_text(pdf)), encoding="utf-8", newline="\n")
        print(f"{slug}: search text replaced, front matter kept")
        return

    if slug not in index:
        raise PosterError(f"no row in {INDEX_FILE}")
    if md.exists() and not force:
        raise PosterError(
            f"{md.name} exists and is the source of the metadata; "
            "use --text to replace only the search text, or --force to rewrite it from the index"
        )
    row = index[slug]
    md.write_text(front_matter(row) + "\n" + clean_body(pdf_text(pdf)), encoding="utf-8", newline="\n")
    print(f"{slug}: {'rewritten' if force else 'created'} {md.name}")
    if not row["topics"]:
        print(f"  no topics in the index: add them to {md.name} (slugs from topics.csv)")
    if row["status"] != "ready":
        print(f'  status is "{row["status"]}": the poster is published only with status "ready"')


def overview(index: dict, content_dir: Path) -> None:
    pdfs = {p.stem for p in content_dir.glob("*.pdf")}
    mds = {p.stem for p in content_dir.glob("*.md")}
    print(f"{'slug':30} {'index status':16} state")
    for slug, row in index.items():
        if slug in pdfs and slug in mds:
            state = "imported"
        elif slug in pdfs:
            state = f"PDF without .md: uv run scripts/pdf2md.py {slug}"
        elif slug in mds:
            state = ".md without PDF"
        else:
            state = "waiting for the PDF"
        print(f"{slug:30} {row['status']:16} {state}")
    for slug in sorted((pdfs | mds) - index.keys()):
        print(
            f"{slug:30} {'(not in index)':16} {'PDF' if slug in pdfs else ''} {'.md' if slug in mds else ''}".rstrip()
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("slugs", nargs="*", help="posters to import; without slugs, show an overview")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--text", action="store_true", help="replace only the search text of existing .md files")
    mode.add_argument("--force", action="store_true", help="rewrite existing .md files from the index")
    parser.add_argument("--content", type=Path, default=CONTENT_DIR, help="content folder (default: %(default)s)")
    args = parser.parse_args()
    if args.text and not args.slugs:
        parser.error("--text needs the slugs of the posters")
    # Windows consoles default to a legacy code page; names and titles need UTF-8
    for stream in (sys.stdout, sys.stderr):
        if isinstance(stream, io.TextIOWrapper):
            stream.reconfigure(encoding="utf-8")

    try:
        index = {} if args.text else read_index(args.content)
    except PosterError as err:
        print(f"ERROR: {err}", file=sys.stderr)
        return 1

    if not args.slugs:
        overview(index, args.content)
        return 0

    failed = 0
    for slug in args.slugs:
        try:
            import_poster(slug, index, args.content, text_only=args.text, force=args.force)
        except (PosterError, subprocess.CalledProcessError) as err:
            print(f"ERROR {slug}: {err}", file=sys.stderr)
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
