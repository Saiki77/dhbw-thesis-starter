# LaTeX Review Companion

Two tools for writing and reviewing LaTeX documents: a PDF preview that follows
your cursor, and clickable evidence markers that link every citation to its source.

## PDF follows cursor

Moves the LaTeX Workshop PDF preview to the cursor whenever the cursor moves
(mouse click or arrow keys) in a `.tex` file. Toggle with **Cmd+Alt+W** or click
the status-bar eye. Skips programmatic moves (reverse sync) and unsaved buffers.

## Citation evidence links

Puts a small colored marker (default: blue ▷) after every citation in the built
PDF. Clicking it opens the cited source — a local PDF named `<citekey>.pdf`
served from your sources directory, opened at a per-key page anchor, or the bib
entry's `url` field when no PDF is on disk. Made for supervisors, reviewers, and
your own citation audits: every claim is one click from its evidence.

**Commands** (Command Palette):

| Command | What it does |
|---|---|
| `LaTeX Citations: Check citations against bibliography` | Reports broken cite keys (Error), duplicate bib keys (Warning), and never-cited entries (Info) in the Problems panel. |
| `LaTeX Citations: Enable evidence links` | Generates `citation-evidence.tex` + `citation-evidence-map.tex` next to the root `.tex`, offers to insert the `\input`, and starts the local PDF server. Run again to refresh the map after adding source PDFs. |
| `LaTeX Citations: Disable evidence links` | Removes the `\input` and stops the server — run before building the submission PDF. |
| `LaTeX Citations: Toggle evidence PDF server` | Starts/stops the local server (also via the status-bar link icon). |

**Setup**: put source PDFs named `<citekey>.pdf` into `sources/verified/` or
`sources/pdf/` (configurable). Optional per-key page anchors go into
`citation-evidence.json` next to the root `.tex`:

```json
{ "pages": { "grishman1996muc6": 3, "devlin2019bert": 4 } }
```

**Settings**:

| Setting | Default | Meaning |
|---|---|---|
| `latexCitations.port` | `8765` | Local server port. |
| `latexCitations.sourcesDirs` | `["sources/verified", "sources/pdf"]` | Where `<citekey>.pdf` files live, in priority order. |
| `latexCitations.markerSymbol` | `$\triangleright$` | LaTeX snippet rendered as the marker. |
| `latexCitations.markerColor` | `blue!70!black` | xcolor expression for the marker. |
| `latexCitations.backend` | `auto` | Citation package to wrap: `harvard`, `natbib`, or auto-detect. |

**Notes**: markers are pdfTeX `URI` link annotations, so they work in browser
viewers (pdf.js, the LaTeX Workshop viewer) and standard PDF readers. biblatex
is not supported yet. The generated files are marked as generated; add them to
`.gitignore` if you do not want them committed.
