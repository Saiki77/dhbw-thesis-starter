# Source PDFs (optional)

Put the PDF of each cited source here, named after its BibTeX key:
`knuth1984texbook.pdf`, `vaswani2017attention.pdf`, ...

The LaTeX Review Companion extension then adds a small blue ▷ after every
citation in the built PDF; clicking it opens that source, at a page you can
set per key in `thesis/citation-evidence.json`:

```json
{ "pages": { "knuth1984texbook": 42 } }
```

Turn it on with the Command Palette: `LaTeX Citations: Enable evidence links`.
Turn it off before you submit: `LaTeX Citations: Disable evidence links`.

PDFs are git-ignored (`*.pdf` in `.gitignore`): papers are usually
copyrighted, so they stay on your machine.
