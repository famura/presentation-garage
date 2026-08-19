#!/usr/bin/env python3
"""Rebuild garage.json from the folders under presentations/."""

import json
import re
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
PRESENTATIONS_DIR = ROOT_DIR / "presentations"


def meta(html: str, name: str) -> str:
    """Read the content of a named meta tag.

    Args:
        html: Markup of a presentation entry point.
        name: Value of the meta tag's `name` attribute, e.g. `description`.

    Returns:
        The tag's content, or an empty string if the tag is missing.
    """
    match = re.search(
        rf'<meta\s+name="{name}"\s+content="([^"]*)"', html, re.IGNORECASE
    )
    return match.group(1).strip() if match else ""


def title(html: str, fallback: str) -> str:
    """Read the document title.

    Args:
        html: Markup of a presentation entry point.
        fallback: Title to use when the document has no usable title tag.

    Returns:
        The whitespace-normalised title, or the fallback.
    """
    match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    return re.sub(r"\s+", " ", match.group(1)).strip() if match else fallback


def entry(index: Path) -> dict:
    """Describe one presentation for the landing page.

    Args:
        index: Path to a presentation's `index.html`.

    Returns:
        Manifest entry with name, title, description, url, and date, plus an
        `offline` path for PDF presentations. Bundles under dist/ are not
        listed here, they stay local and the landing page looks for them.
    """
    html = index.read_text(encoding="utf-8", errors="ignore")
    name = index.parent.name
    presentation = {
        "name": name,
        "title": title(html, name.replace("-", " ").replace("_", " ").title()),
        "description": meta(html, "description"),
        "url": f"presentations/{name}/",
        # <meta name="date"> wins over the file date, which a fresh clone resets
        "date": meta(html, "date")
        or datetime.fromtimestamp(index.stat().st_mtime).date().isoformat(),
    }
    pdf = next(iter(sorted(index.parent.glob("*.pdf"))), None)
    if pdf:
        # a PDF is already offline
        presentation["offline"] = f"presentations/{name}/{pdf.name}"
    return presentation


def main() -> None:
    """Write garage.json from every presentation folder that has an index.html."""
    presentations = [
        entry(index) for index in sorted(PRESENTATIONS_DIR.glob("*/index.html"))
    ]
    (ROOT_DIR / "garage.json").write_text(
        json.dumps(presentations, indent=2) + "\n", encoding="utf-8"
    )
    print(f"garage.json: {len(presentations)} presentation(s)")
    for presentation in presentations:
        print(f"  {presentation['name']}")


if __name__ == "__main__":
    main()
