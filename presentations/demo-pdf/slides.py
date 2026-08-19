#!/usr/bin/env python3
"""Render slides.pdf for PDF demo presentation (only)."""

import numpy as np
from matplotlib import pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import FancyBboxPatch

PAPER, INK, MUTED, ACCENT, DEEP, CODE_BG = (
    "#f4f1de",
    "#2c2c2c",
    "#6b6b6b",
    "#e07a5f",
    "#3d5a55",
    "#23272e",
)
plt.rcParams.update(
    {
        "font.serif": ["Fraunces", "Georgia", "DejaVu Serif"],
        "font.sans-serif": ["Inter", "Helvetica Neue", "DejaVu Sans"],
        "font.monospace": ["Menlo", "DejaVu Sans Mono"],
        "pdf.fonttype": 42,
    }
)


def slide(dark: bool = False):
    """Open a 16:9 page and return its full-bleed axes."""
    figure = plt.figure(figsize=(13.333, 7.5))
    axes = figure.add_axes([0, 0, 1, 1])
    axes.set_axis_off()
    axes.set_xlim(0, 1)
    axes.set_ylim(0, 1)
    if dark:
        gradient = np.add.outer(np.linspace(1, 0, 64), np.linspace(0, 1, 64))
        axes.imshow(
            gradient,
            extent=(0, 1, 0, 1),
            aspect="auto",
            interpolation="bicubic",
            cmap=LinearSegmentedColormap.from_list("garage", [DEEP, INK, ACCENT]),
            vmin=0,
            vmax=2.6,
        )
    else:
        axes.set_facecolor(PAPER)
        figure.patch.set_facecolor(PAPER)
    return axes


def text(axes, x, y, body, size=22, color=INK, family="sans-serif", **kwargs):
    return axes.text(
        x, y, body, size=size, color=color, family=family, va="top", **kwargs
    )


def heading(axes, body):
    text(axes, 0.08, 0.86, body, size=40, color=DEEP, family="serif")
    axes.plot([0.08, 0.17], [0.78, 0.78], color=ACCENT, lw=4, solid_capstyle="round")


def card(axes, x, width, title, body, accent=False):
    axes.add_patch(
        FancyBboxPatch(
            (x, 0.30),
            width,
            0.30,
            boxstyle="round,pad=0.018,rounding_size=0.02",
            facecolor=ACCENT if accent else "white",
            edgecolor=DEEP if accent else "#dcd6c2",
            alpha=0.95,
            lw=1.5,
        )
    )
    text(
        axes,
        x + 0.03,
        0.57,
        title,
        size=22,
        color="white" if accent else DEEP,
        family="serif",
    )
    text(
        axes,
        x + 0.03,
        0.495,
        body,
        size=16,
        color="white" if accent else INK,
        linespacing=1.6,
    )


def footer(axes, number, total=5, light=False):
    tint = "#b8ada4" if light else MUTED
    text(
        axes, 0.08, 0.08, "presentation garage", size=11, color=tint, family="monospace"
    )
    text(
        axes,
        0.92,
        0.08,
        f"{number} / {total}",
        size=11,
        color=tint,
        family="monospace",
        ha="right",
    )


def title_slide(axes, eyebrow, title, subtitle, meta=None):
    if eyebrow:
        text(axes, 0.08, 0.56, eyebrow, size=13, color=ACCENT, family="monospace")
    text(axes, 0.08, 0.52, title, size=52, color=PAPER, family="serif")
    text(axes, 0.08, 0.36, subtitle, size=22, color="#e8e2cf")
    if meta:
        text(axes, 0.08, 0.26, meta, size=14, color="#a8a293")


with PdfPages("slides.pdf") as pdf:
    axes = slide(dark=True)
    title_slide(
        axes,
        "PRESENTATION GARAGE",
        "PDF Demo",
        "Five slides, one folder, nothing to render at runtime",
        "Delete this folder once you have your own presentations",
    )
    footer(axes, 1, light=True)
    pdf.savefig(plt.gcf())

    axes = slide()
    heading(axes, "How a presentation works")
    for index, line in enumerate(
        [
            "One folder under presentations/ with an index.html.",
            "Here index.html is a pdf.js viewer; the slides live in slides.pdf.",
            "Design is baked into the PDF, so there is no CSS to ship.",
            "task manifest picks the folder up for the landing page.",
        ]
    ):
        y = 0.66 - index * 0.11
        axes.plot(0.085, y - 0.012, marker="s", ms=8, color=ACCENT)
        text(axes, 0.12, y, line, size=21)
    text(
        axes,
        0.12,
        0.19,
        "Different from reveal.js: no fragments, no speaker notes — a PDF page is all-or-nothing.",
        size=15,
        color=MUTED,
    )
    footer(axes, 2)
    pdf.savefig(plt.gcf())

    axes = slide()
    heading(axes, "Two columns")
    card(
        axes,
        0.09,
        0.36,
        "Online",
        "GitHub pages serves the repository\nas-is. Push to your published branch\nand the viewer streams the PDF.",
    )
    card(
        axes,
        0.545,
        0.36,
        "Offline",
        "Nothing to bundle: hand someone\nslides.pdf and any reader on earth\nopens it.",
        accent=True,
    )
    footer(axes, 3)
    pdf.savefig(plt.gcf())

    axes = slide()
    heading(axes, "Code and math")
    axes.add_patch(
        FancyBboxPatch(
            (0.09, 0.45),
            0.8,
            0.2,
            boxstyle="round,pad=0.015,rounding_size=0.02",
            facecolor=CODE_BG,
            edgecolor="none",
        )
    )
    text(
        axes,
        0.115,
        0.62,
        "python3 slides.py       # re-render this presentation\ntask serve              # local garage at :8000",
        size=16,
        color="#d8dee9",
        family="monospace",
        linespacing=1.8,
    )
    text(
        axes,
        0.09,
        0.34,
        r"$\mathrm{slides} = \mathrm{content} \times \mathrm{contrast}^{2}$",
        size=30,
        color=DEEP,
    )
    text(
        axes,
        0.09,
        0.21,
        "Different from reveal.js: syntax highlighting and KaTeX run at export time, not in the browser.",
        size=15,
        color=MUTED,
    )
    footer(axes, 4)
    pdf.savefig(plt.gcf())

    axes = slide(dark=True)
    title_slide(
        axes,
        None,
        "Your turn",
        "Drop any exported PDF next to an index.html — Beamer, Keynote, this script",
    )
    footer(axes, 5, light=True)
    pdf.savefig(plt.gcf())

plt.close("all")
print("slides.pdf: 5 pages")
