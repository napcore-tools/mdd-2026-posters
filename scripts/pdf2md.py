# /// script
# requires-python = ">=3.10"
# dependencies = ["openpyxl>=3.1", "pymupdf>=1.24"]
# ///
"""Create content/<slug>.md for new posters from content/index.xlsx and content/<slug>.pdf.

Front matter comes from the sheet "index" of content/index.xlsx, the body is
text extracted from the PDF with MuPDF, falling back to OCR with tesseract for
PDFs without a text layer. The body only serves full text search.

The .md files are the source of the poster metadata once created, so the
script never overwrites them unless asked to.

Usage, from the repository root:
  uv run scripts/pdf2md.py                   overview of the index, PDFs and .md files
  uv run scripts/pdf2md.py nlkf webstore     create the .md of new posters
  uv run scripts/pdf2md.py --text uvarbox    replace only the search text (after a new PDF)
  uv run scripts/pdf2md.py --clean --all     clean the current search text of all posters
  uv run scripts/pdf2md.py --force nlkf      rewrite the whole .md from the index;
                                             edits made in the .md are lost

The search text is cleaned up: odd characters, symbol-only tokens, stray
letters and repeated lines are removed, paragraphs are wrapped.
"""

import argparse
import io
import json
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unicodedata
from pathlib import Path

import openpyxl
import pymupdf

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


def ocr(image: Path) -> str:
    if not shutil.which("tesseract"):
        raise PosterError("the PDF has no text layer; install tesseract for OCR")
    return subprocess.run(
        ["tesseract", str(image), "-", "-l", "eng"], capture_output=True, encoding="utf-8", check=True
    ).stdout


def pdf_text(pdf: Path) -> str:
    """Text of the PDF, one paragraph per text block (blank line between blocks)."""
    with pymupdf.open(pdf) as doc:
        # Blocks are (x0, y0, x1, y1, text, block_no, block_type); type 0 is text
        text = "\n\n".join(block[4] for page in doc for block in page.get_text("blocks") if block[6] == 0)
        if text.split():
            return text
        # No text layer: OCR the rendered pages
        print(f"  {pdf.name} has no text layer, using OCR")
        with tempfile.TemporaryDirectory() as tmp:
            pages = []
            for number, page in enumerate(doc):
                image = Path(tmp) / f"page{number}.png"
                page.get_pixmap(dpi=200).save(image)
                pages.append(ocr(image))
            return "\n\n".join(pages)


# --- Cleanup of the extracted text -----------------------------------------
#
# The text serves search and the snippets shown with search results. The
# cleanup only removes what cannot be a search term; it does not check words
# against a dictionary, as posters are full of names, acronyms and standards
# (NeTEx, GTFS, Abzu) that no dictionary knows.

WRAP_WIDTH = 100

# Unicode categories removed: control and invisible formatting characters,
# private use (icon fonts), surrogates, unassigned, and symbols (⌘, ©, arrows)
DROP_CATEGORIES = {"Cc", "Cf", "Co", "Cs", "Cn", "So", "Sk"}


def clean_chars(text: str) -> str:
    # NFKC splits ligatures (ﬁ → fi) and turns special spaces into plain ones
    text = unicodedata.normalize("NFKC", text).replace("�", "")
    return "".join(ch for ch in text if ch == "\n" or unicodedata.category(ch) not in DROP_CATEGORIES)


def keep_token(token: str) -> bool:
    alnum = sum(ch.isalnum() for ch in token)
    if alnum == 0:  # punctuation only: — · › & =
        return False
    if alnum * 2 < len(token):  # mostly symbols: OCR noise
        return False
    return len(token) > 1 or token.isdigit() or token in {"a", "A", "I"}  # stray single letters


def clean_line(line: str) -> str:
    tokens = [token for token in line.split() if keep_token(token)]
    # A line of one or two tiny tokens is usually OCR noise from an icon ("K*", "kK")
    if len(tokens) <= 2 and all(sum(ch.isalnum() for ch in t) <= 2 and not t.isdigit() for t in tokens):
        return ""
    return " ".join(tokens)


def collapse_repeats(text: str, max_words: int = 8) -> str:
    """Remove a phrase repeated right after itself: "index for assistants index for assistants"."""
    out: list[str] = []
    for token in text.split():
        out.append(token)
        for n in range(1, min(max_words, len(out) // 2) + 1):
            if [t.casefold() for t in out[-n:]] == [t.casefold() for t in out[-2 * n : -n]]:
                del out[-n:]
                break
    return " ".join(out)


def join_lines(lines: list[str]) -> str:
    text = lines[0]
    for line in lines[1:]:
        # A word hyphenated across a line break: "interop-" + "erability"
        if re.search(r"[^\W\d_]-$", text) and line[:1].islower():
            text = text[:-1] + line
        else:
            text += " " + line
    return text


def clean_body(text: str) -> str:
    """Clean extracted text: paragraphs wrapped at WRAP_WIDTH, no repeated lines. Idempotent."""
    paragraphs: list[list[str]] = [[]]
    seen: set[str] = set()
    for raw in clean_chars(text).splitlines():
        line = clean_line(raw)
        if not line:
            paragraphs.append([])  # a blank line ends the paragraph
            continue
        # Repeated lines add nothing to search; some posters even draw all
        # their text twice on top of itself (a design effect)
        key = line.casefold()
        if key in seen:
            continue
        seen.add(key)
        paragraphs[-1].append(line)
    wrapped = [
        textwrap.fill(collapse_repeats(join_lines(lines)), WRAP_WIDTH, break_long_words=False, break_on_hyphens=False)
        for lines in paragraphs
        if lines
    ]
    return "\n\n".join(wrapped) + "\n"


def split_front_matter(md_text: str) -> str:
    """The front matter of a .md file, including both --- lines."""
    match = re.match(r"---\n.*?\n---\n", md_text, re.DOTALL)
    if not match:
        raise PosterError("no front matter found")
    return match.group(0)


# --- Commands --------------------------------------------------------------


def update_body(slug: str, content_dir: Path, *, from_pdf: bool) -> None:
    """Replace the search text of an existing .md (from the PDF, or by cleaning the current text)."""
    md = content_dir / f"{slug}.md"
    if not md.exists():
        raise PosterError(f"{md.name} not found; create it first")
    head = split_front_matter(md.read_text(encoding="utf-8"))
    if from_pdf:
        pdf = content_dir / f"{slug}.pdf"
        if not pdf.exists():
            raise PosterError(f"{pdf.name} not found")
        body = pdf_text(pdf)
    else:
        body = md.read_text(encoding="utf-8")[len(head) :]
    new = head + "\n" + clean_body(body)
    if new == md.read_text(encoding="utf-8"):
        print(f"{slug}: unchanged")
        return
    md.write_text(new, encoding="utf-8", newline="\n")
    print(f"{slug}: search text {'replaced' if from_pdf else 'cleaned'}, front matter kept")


def create_poster(slug: str, index: dict, content_dir: Path, *, force: bool) -> None:
    pdf = content_dir / f"{slug}.pdf"
    md = content_dir / f"{slug}.md"
    if not pdf.exists():
        raise PosterError(f"{pdf.name} not found")
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
    mode.add_argument("--text", action="store_true", help="replace only the search text, extracted again from the PDF")
    mode.add_argument("--clean", action="store_true", help="clean the current search text, without reading the PDF")
    mode.add_argument("--force", action="store_true", help="rewrite existing .md files from the index")
    parser.add_argument("--all", action="store_true", help="with --text or --clean: all posters with a .md file")
    parser.add_argument("--content", type=Path, default=CONTENT_DIR, help="content folder (default: %(default)s)")
    args = parser.parse_args()
    if args.all:
        if not (args.text or args.clean) or args.slugs:
            parser.error("--all goes with --text or --clean, without slugs")
        args.slugs = sorted(p.stem for p in args.content.glob("*.md"))
    if (args.text or args.clean) and not args.slugs:
        parser.error("--text and --clean need the slugs of the posters, or --all")
    # Windows consoles default to a legacy code page; names and titles need UTF-8
    for stream in (sys.stdout, sys.stderr):
        if isinstance(stream, io.TextIOWrapper):
            stream.reconfigure(encoding="utf-8")

    index = {}
    if not (args.text or args.clean):
        try:
            index = read_index(args.content)
        except PosterError as err:
            print(f"ERROR: {err}", file=sys.stderr)
            return 1

    if not args.slugs:
        overview(index, args.content)
        return 0

    failed = 0
    for slug in args.slugs:
        try:
            if args.text or args.clean:
                update_body(slug, args.content, from_pdf=args.text)
            else:
                create_poster(slug, index, args.content, force=args.force)
        except (PosterError, subprocess.CalledProcessError) as err:
            print(f"ERROR {slug}: {err}", file=sys.stderr)
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
