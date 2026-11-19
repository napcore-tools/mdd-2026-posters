"""Generate content/{slug}.md from content/{slug}.pdf and content/index.csv.

Front matter comes from index.csv (tab separated), body is text extracted
from the PDF (pdftotext, falling back to OCR via pdftoppm + tesseract for
PDFs without a text layer). The body only serves full text search.

Usage: python3 scripts/pdf2md.py [content_dir]
"""

import csv
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def split_list(value: str, separators: str) -> list[str]:
    items = re.split(separators, value)
    return [item.strip() for item in items if item.strip()]


def pdf_text(pdf: Path) -> str:
    text = subprocess.run(
        ["pdftotext", "-enc", "UTF-8", str(pdf), "-"],
        capture_output=True, text=True, check=True,
    ).stdout
    if text.split():
        return text
    # No text layer: OCR the rendered pages.
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            ["pdftoppm", "-r", "200", "-png", str(pdf), f"{tmp}/page"],
            check=True,
        )
        pages = sorted(Path(tmp).glob("page*.png"))
        return "\n\n".join(
            subprocess.run(
                ["tesseract", str(page), "-", "-l", "eng"],
                capture_output=True, text=True, check=True,
            ).stdout
            for page in pages
        )


def clean_body(text: str) -> str:
    lines = [line.rstrip() for line in text.replace("\f", "\n").splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip() + "\n"


def yaml_value(value) -> str:
    # JSON strings and lists are valid YAML flow scalars/sequences.
    return json.dumps(value, ensure_ascii=False)


def front_matter(row: dict) -> str:
    fields = {
        "slug": row["slug"].strip(),
        "status": row["status"].strip(),
        "title": row["title"].strip(),
        "authors": split_list(row["authors"], r",|\band\b"),
        "topics": split_list(row["topics"], r"[;,]"),
        "keywords": split_list(
            row["keywords"], r";" if ";" in row["keywords"] else r","
        ),
        "annotation": row["annotation"].strip(),
        "email": row["e-mail"].strip(),
    }
    lines = [f"{key}: {yaml_value(value)}" for key, value in fields.items()]
    return "---\n" + "\n".join(lines) + "\n---\n"


def main(content_dir: Path) -> None:
    with open(content_dir / "index.csv", newline="", encoding="utf-8") as f:
        rows = {row["slug"].strip(): row for row in csv.DictReader(f, delimiter="\t")}

    for pdf in sorted(content_dir.glob("*.pdf")):
        row = rows.get(pdf.stem)
        if row is None:
            print(f"WARNING: {pdf.name} has no row in index.csv", file=sys.stderr)
            continue
        md = pdf.with_suffix(".md")
        md.write_text(front_matter(row) + "\n" + clean_body(pdf_text(pdf)), encoding="utf-8")
        print(f"wrote {md}")

    for slug in rows.keys() - {p.stem for p in content_dir.glob("*.pdf")}:
        print(f"WARNING: index.csv row {slug!r} has no PDF", file=sys.stderr)


if __name__ == "__main__":
    main(Path(sys.argv[1] if len(sys.argv) > 1 else "content"))
