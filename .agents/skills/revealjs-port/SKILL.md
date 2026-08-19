---
name: revealjs-port
description: Port over an existing reveal.js presentation to the presentation garage repository. Do not alter any
content or the visual appearance.
---

# Port a reveal.js presentation

Your only task is to copy the given presentation into the `presentations/<name>/` folder, so it can be served and
published by the presentation garage.
Use the `revealjs-create` skill to make any changes and the `revealjs-evaluate` skill to assess how well the ported
presentation matches the original.

## Scope (hard rules)

The ultimate goal is a perfect copy!
You do not make any decisions on content or visual appearance!
Try to preserve the original structure of the resources!
If the original presentation requires custom software to be installed, escalate this information to the user together
with a suggestion to run the installation!

## The procedure

1. Ask the user for a pointer to the original presentation, e.g. a GitHub repository or a local folder.
2. Copy everything into `presentations/<name>/`, including the `index.html` and any referenced assets.
3. Check if the original presentation uses custom software or libraries. Do not port over libraries that can be loaded
   from a CDN, e.g. reveal.js, MathJax, or highlight.js. Use the CDN versions instead. If the visual appearance of the ported presentation is different from the original, you are allowed to change the `index.html` to make them match.
4. Ensure that the the presentation has the same number of slides and the same content per slide as the original.
5. Ensure that all references, e.g. hyperlinks, images, videos, PDFs, are correct.
6. Ensure that animations, transitions, and fragments work as in the original.
7. Make sure the presentation can be served locally with `task serve` and is visible in a browser.
8. Once you are confident that the ported presentation is identical to the original, ask the user to sign off.
