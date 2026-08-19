#!/usr/bin/env python3
"""Bundle presentations into single offline files under dist/."""

import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
PRESENTATIONS_DIR = ROOT_DIR / "presentations"
DIST_DIR = ROOT_DIR / "dist"


def bundle(presentation: Path) -> None:
    """Write a self-contained copy of one presentation to dist/.

    reveal.js presentations are inlined into a single HTML file by monolith.
    PDF presentations are left alone, because the PDF already works offline.

    Args:
        presentation: Path to a presentation folder under `presentations/`.

    Raises:
        SystemExit: If the presentation needs monolith and it is not installed.
        subprocess.CalledProcessError: If monolith fails.
    """
    index = presentation / "index.html"
    pdf = next(iter(sorted(presentation.glob("*.pdf"))), None)
    if pdf and "Reveal.initialize" not in index.read_text(
        encoding="utf-8", errors="ignore"
    ):
        print(
            f"{presentation.name}: {pdf.name} is already self-contained, nothing to bundle"
        )
        return
    if not shutil.which("monolith"):
        sys.exit(
            "The monolith package was not found! Install it https://github.com/Y2Z/monolith"
        )
    subprocess.run(
        ["monolith", str(index), "-o", str(DIST_DIR / f"{presentation.name}.html")],
        check=True,
    )
    print(f"dist/{presentation.name}.html")


def main() -> None:
    """Bundle the presentations named on the command line, or all of them.

    Raises:
        SystemExit: If an argument does not match a presentation folder.
    """
    presentations = sorted(
        index.parent for index in PRESENTATIONS_DIR.glob("*/index.html")
    )
    names = sys.argv[1:]
    if names:
        unknown = set(names) - {presentation.name for presentation in presentations}
        if unknown:
            sys.exit(f"Unknown presentation(s): {', '.join(sorted(unknown))}")
        presentations = [
            presentation for presentation in presentations if presentation.name in names
        ]

    DIST_DIR.mkdir(exist_ok=True)
    for presentation in presentations:
        bundle(presentation)


if __name__ == "__main__":
    main()
