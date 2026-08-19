---
name: revealjs-create
description: Create a reveal.js presentation in this repository. Use when the user asks for a new presentation,
slides, or a talk. Runs one short interview round, then writes presentations/<name>/index.html plus its own CSS.
---

# Create a reveal.js presentation

You are a skilled designer and front-end developer, working together with the user to create a polished reveal.js
presentation.

Do not hesitate to use tools such as:

- [cheerio](https://cheerio.js.org/) for parsing and manipulating HTML and XML.
- [D3](https://d3js.org/) as a default for generating animations and interactive visualizations.
- [manim](https://github.com/ManimCommunity/manim) as a specialized tool for generating math-focused animations.

## Scope (hard rules)

Write only inside `presentations/<name>/`!
Never touch the landing page, `Taskfile.yml`, `scripts/`, other presentations, or any file at the repository root!
The only allowed outside action is running `task manifest`, which regenerates `garage.json`!

Every asset the presentation needs, e.g. CSS, images, fonts, favicon, data, lives inside its own folder.
There is no shared template and no shared theme.

## Interview (one round, then build)

Ask these questions one-by-one, while showing the user the option to answer "No more questions, you decide the rest"
at every turn.
If that option is chosen, fill in the rest of the answers with your best judgment and move on to build.

The questions are:

1. What is the topic and title of the presentation (will be used as folder name)?
2. Who is the audience and what is the setting (conference, team review, defense, report, etc.)?
3. What is the topic and the one message the audience should leave with?
4. How long should the presentation be (10 slides, 30min, etc.)?
5. What is the visual direction? Can you point to a reference presentation or palette?
6. Do you already have a draft you can point to?
7. Is there anything you want to add or emphasize?

Store the questions and answers in a temporary file, so you can refer to them while building the presentation.

Then briefly state your design choices and start building.

## Build

Start by creating `presentations/<name>/index.html` from this template:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="One sentence, shown on the landing page."
    />
    <meta name="date" content="YYYY-MM-DD" />
    <title>Presentation title</title>
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>...</svg>"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reset.css"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css"
    />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="reveal">
      <div class="slides">
        <section>...</section>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.js"></script>
    <script>
      Reveal.initialize({ hash: true, plugins: [RevealNotes] });
    </script>
  </body>
</html>
```

You may deviate from this, e.g. update versions, add plugins, or change the favicon, etc. depending on the user's needs.

### Rules that keep the presentation working in this garage

- Pin every CDN version, e.g. `@5.1.0`, not `@latest`
- Plugins must come from the same reveal version.
- Add `plugin/highlight/highlight.js` for code and `plugin/math/math.js` (`RevealMath.KaTeX`) for formulas, but only
  do so when the presentation needs them.
- Favicon and backgrounds belong to the presentation: inline SVG data URI, CSS gradient, or an image file inside the
  presentation folder. Never reference anything outside the folder.
- Keep `<meta name="description">` and `<meta name="date">` accurate, as the landing page reads them.
- Leave reveal's `postMessage` default on, so the landing page can auto-advance the preview.

### Rules to write `presentations/<name>/styles.css`

- Colors, type, and spacing in CSS variables at the top.
- Font sizes in `pt` — slides are fixed-size, `pt` behaves like PowerPoint.
- Google Fonts via `@import` if the design needs them.
- Style the presentation yourself on top of `reveal.css`. As a fallback you can load a stock reveal theme.

## Slide craft (can be overridden by the user's explicit wishes)

- By default, the slides are created at 1920 x 1080, optionally at 2560 x 1440.
- One idea per slide, roughly 60 words maximum, short bullets over paragraphs.
- Adjust the style to the target audience, e.g. scientific, business, or casual.
- Strive for visual consistency, e.g. margins, font sizes, colors, and alignment should not drift between slides.
- Read `color_palette.md` for guidance on choosing a color palette.
- Vary the layout when appropriate, e.g. bullets, two columns, a full-bleed statement, a card grid, or on rare occasions
  a quote or a background image.
- Create animations to explain important concepts. Leverage 3rd party libraries, such as the tools described above.
- Use `<section class="fragment">`-style reveals for sequence, e.g. when showing the full slide at once would overload
  the audience. Do not overuse.
- Highlight key points using `<strong>` and/or a very limited set of highlight colors which are the same per
  presentation.
- When using math, make sure that the font size matches the body text.
- Use icons from [Font Awesome](https://fontawesome.com/) or [Material Symbols](https://fonts.google.com/icons) for
  small, simple graphics. The frequency and style of icons should match the audience and tone of the presentation.
- Use the `revealjs-evaluate` skill for intermediate visual quality checks, and apply fixes and optionally iterate
  before presenting the final version.
- You can find the reveal.js documentation at https://revealjs.com/, and it's source code at https://github.com/hakimel/reveal.js/.

## Finish

1. Check if the hard rules under "Scope" are satisfied. If not, fix that first, then iterate.
2. Run `task manifest`.
3. Tell the user to run `task serve` and open the presentation.
4. Use the `revealjs-evaluate` skill for a visual review to ensure the presentation meets the quality standards.
