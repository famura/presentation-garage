---
name: revealjs-evaluate
description: Review a reveal.js presentation in this repository for visual quality and clarity. Use when the user wants
a design critique, a slide review, an overflow check, or when you are iterating slides yourself.
---

# Evaluate a reveal.js presentation

Provide feedback as a helpful but critical team member.

Do not hesitate to use tools such as

- [Playwright](https://playwright.dev/) for automated screenshots of the slides.
- [Decktape](https://github.com/astefanutti/decktape) for generating PDFs of the slides.
- [cheerio](https://cheerio.js.org/) for parsing and manipulating HTML and XML.

## Scope (hard rules)

Only look at one presentation in `presentations/<name>/`!
Delegate any changes or fixes to the `revealjs-create` skill!

## Look at the slides, do not guess

1. Serve the repository: `task serve` (or `python3 -m http.server 8000`). If port 8000 is taken, try another port.
2. Open `http://localhost:8000/presentations/<name>/` at 1920 x 1080, optionally at 2560 x 1440.
3. Step through every slide and screenshot it. Use browser tooling if available. A review written from the HTML alone
   is worth little — say so if that is all you have.

## Rubric

Score each slide, worst offenders first:

| Check       | Fails when                                                                       |
| ----------- | -------------------------------------------------------------------------------- |
| Overflow    | Content is cut off or scrolls; the presentation relies on the viewer zooming out |
| Density     | More than ≈80 words, more than ≈6 bullets, or paragraphs on a slide              |
| Hierarchy   | The eye cannot find the main point in two seconds                                |
| Contrast    | Body text below 4.5:1, or accent colors on a similar-value background            |
| Type        | Font sizes not in `pt`, body text below 16pt, more than two families             |
| Consistency | Margins, heading sizes, or accent colors drift between slides                    |
| Alignment   | Elements sit on no shared grid line; ragged left edges                           |
| Code        | More than ≈12 lines, unhighlighted, or below 14pt                                |
| Figures     | Blurry raster where SVG belongs, unlabeled axes, decorative stock imagery        |
| Fragments   | Reveals that add clicks without adding meaning                                   |
| Scope       | Assets referenced from outside the presentation folder, or unpinned CDN versions |

## Report

Answer three questions, in this order:

1. **Verdict** — one line: ship it, fix first, or rebuild?
2. **Findings** — ranked list, each `slide N — problem — the smallest fix`.
3. **Keep** — what already works, so it survives the next edit.

Be blunt about weak slides, e.g. "the message is unclear at slide 7", and be specific about fixes, e.g.
"cut the 4 sub-bullets".
Do not be vague, e.g. "improve visual balance".
Then offer to apply the fixes.
