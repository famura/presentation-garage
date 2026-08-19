# Presentation Garage 🏍️

A place to create, store, and show your presentations, based on GitHub pages.
Every presentation is one folder with its own design, and the landing page collects them automatically.

Currently, only **reveal.js** and **PDF** presentations are supported.

👉 Have a look at https://famura.github.io/presentation-garage/

## Get started

1. Fork this repository (this way you get your own GitHub pages space).
2. Clone your fork.
3. Install [Task](https://taskfile.dev/) — either `brew install go-task` (macOS) or `sudo snap install task --classic`
   (Linux).
4. Run `task setup` — installs the project's skills, and **tries to** enable GitHub pages for your fork which needs the
   `gh` CLI. If that fails, you need to activate GitHub pages in your fork's settings manually.
5. Run `task open` — opens the presentation garage published on GitHub pages. You should see the demo presentations.

### Local deployment (optional)

Run `task serve` to open the presentation garage locally at <http://localhost:8000>.

Run `task bundle` to get a self-contained HTML copy of each reaveal-js presentation in `dist/`.
This step in-lines every asset.
Then you can `serve` that.

### Using a different branch for Github pages deployment (optional)

GitHub pages can publish any branch you like, the default is `main`.
To publish on a different branch, run `task setup -- <branch>` and change the `branches:` list in
`.github/workflows/manifest.yaml` and `.github/workflows/sync-labels.yaml` to match.

## Create your own

Add a presentation by creating `presentations/<name>/index.html` and running `task manifest`.
The landing page reads the title, `<meta name="description">`, and `<meta name="date">` from it.

> Optional: remove the two demo presentations once you have your own presentations, then run `task manifest`.

## Commands

| Command                  | What it does                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `task setup -- <branch>` | Install the project's skills, and tru to enable GitHub pages for your fork (no branch = `main`)         |
| `task open`              | Open the presentation garage on GitHub pages                                                            |
| `task manifest`          | Rebuild `garage.json` from the folders under `presentations/`                                           |
| `task serve`             | Open the presentation garage locally on your machine                                                    |
| `task bundle -- <name>`  | Write one self-contained HTML file per presentation to `dist/<name>.html` (no name = all presentations) |
| `task --list`            | Show all available tasks with oneline description                                                       |

During `task bundle`, the PDF presentations are skipped because the PDF is already self-contained.
That command also installs `monolith` first if it is missing.

`dist/` is git-ignored, so bundles stay on your machine and never reach GitHub pages.
Serve the garage locally with `task serve` and each bundled presentation offers an "offline copy" download.
PDF presentations are published with their PDF, so their download works on GitHub pages too.

## Rules of the repo

- One folder per presentation under `presentations/`, containing an `index.html`.
- No shared theme: CSS, fonts, images, and the favicon live inside the presentation folder.
- reveal.js and plugins load from a pinned CDN version, so there is nothing to install.
- A PDF presentation is shipped via an `index.html` (a pdf.js viewer) plus the PDF file, see `presentations/demo-pdf/`.

## Agent skills

The skills in `.agents/skills/` help you write, review, and port presentations.

- **`revealjs-create`** — interviews you briefly, then writes a new presentation with its own design.
- **`revealjs-evaluate`** — reviews presentation slides and reports what to fix.
- **`revealjs-port`** — copies over an existing reveal js presentation to the garage without any content changes.

They are intentionally all restricted to the folder of the presentation they work on.

`task setup` links `.claude/skills/` or `.copilot/skills/` to the repo's `.agents/skills` to make the custom skills
discoverable.
