# DHBW thesis starter

LaTeX skeleton for a DHBW thesis (Projektarbeit, Studienarbeit, Bachelorarbeit) in German or in English, one language per thesis, built locally with latexmk and written in VS Code with an Overleaf-style live preview: the PDF sits beside the source, rebuilds about 2 s after typing stops, and scrolls to the sentence under the cursor.
The bundled VS Code extension **LaTeX Review Companion** (`tools/`) adds "PDF follows cursor", clickable citation evidence links and a citation check.

## First-time setup

Claude: do this when the user asks to set up the project.
About 5 minutes, plus a 10–20 minute MacTeX download if TeX is missing.
macOS only; on Windows or Linux follow [Windows and Linux](#windows-and-linux) instead of step 2.

1. **Detach from the starter repo.** If `git remote -v` shows `Saiki77/dhbw-thesis-starter`, run `git remote remove origin`, so the thesis is never pushed there.
2. **Install.** Run `./setup.sh`. It checks MacTeX and VS Code, installs LaTeX Workshop and the companion extension, and test-builds the PDF. It is safe to re-run and needs no password. For each item it reports missing, pass its fix on to the user: commands that install software run in the user's own terminal (the MacTeX installer asks for their password; never ask for it or type it yourself), and a VS Code update happens in VS Code itself. Steps 3 to 5 only need MacTeX, so continue with them while VS Code items are open, and re-run `./setup.sh` until it prints `Ready`.
3. **Language.** Ask whether the thesis will be written in German or in English, then run `./set-language.sh de` or `./set-language.sh en`. It sets the switch in `thesis/dokumentation.tex` and installs that language's skeleton: chapters, cheat sheet, abstract, glossary, abbreviations, example bibliography. Title page, declaration, confidentiality notice, headings, quotation marks, citations, bibliography wording and cross-references follow the switch. It deletes `lang/`, so the thesis exists in one language only. Talk to the user in the language they write to you in, whichever the thesis uses.
4. **Personalize.** Ask the user, in one message, for the data below and fill in the block `DEINE ANGABEN / YOUR DATA` at the top of `thesis/dokumentation.tex`, with values in the thesis language (e.g. Studiengang `Computer Science` for an English thesis):
   - title, subtitle (optional), type of work, e.g. `Bachelorarbeit (T3300)` or `Bachelor Thesis (T3300)`
   - name, Matrikelnummer, Kurs, Studiengang, Studienrichtung (optional), DHBW location
   - company and its address, supervisor at the company, reviewer at the DHBW (if known)
   - Bearbeitungszeitraum, submission date and place
   - Sperrvermerk wanted? (default yes; `\sperrvermerkfalse` removes the page)
   - company logo: a PNG saved as `thesis/images/logo.png`; for none, delete that file

   Write `&` as `\&`. An empty field (`\newcommand{\gutachter}{}`) drops its row from the title page.
5. **Build and commit.** `./build.sh` must end with `no errors, no undefined references`. Then `git add -A && git commit -m "Personalize thesis"` (run `git init` first if the folder came from a ZIP download), and offer the user a private repo of their own as backup: `gh repo create <name> --private --source . --push`.
6. **Open.** Run `open -a "Visual Studio Code" .` yourself. Then the user opens `thesis/dokumentation.tex` and presses Cmd+Alt+V. Show them the keys under [Daily use](#daily-use) and the one-sentence-per-line rule, and suggest starting Claude Code inside this folder from now on, so this file is read automatically.

## Daily use

| Do this | Effect |
|---|---|
| Cmd+Alt+V | open the PDF preview beside the source |
| stop typing for 2 s | autosave and rebuild (about 3 s); the PDF jumps to the sentence under the cursor |
| Cmd+S | save and rebuild now |
| click or arrow keys in a `.tex` file | the PDF follows the cursor; Cmd+Alt+W or the eye in the status bar toggles this |
| double-click in the PDF | jump to that line in the source |
| Cmd+Alt+J | scroll the PDF to the cursor once |
| Cmd+Alt+B, Cmd+Alt+C | build, delete aux files |

Terminal: `./build.sh` builds and lists errors and undefined references; also `./build.sh open`, `watch`, `clean`, `distclean`.
PyCharm: run configurations Build, Watch and Clean are in `.idea/runConfigurations/`.

**Write one sentence per line.**
SyncTeX maps PDF positions to source lines; with a whole paragraph on one line, the preview can only land on paragraph starts.
A blank line starts a new paragraph; a single line break does not show in the PDF.

## Where things are

```
setup.sh, build.sh              one-time setup; build with error summary
set-language.sh, lang/en/       choose German or English once; English skeleton (deleted after)
thesis/dokumentation.tex        DEINE ANGABEN / YOUR DATA block on top, then the order of all parts
thesis/ads/header.tex           every style setting, in numbered sections (§1–§10)
thesis/ads/                     deckblatt, sperrvermerk, erklaerung, abstract, glossary, acronyms
thesis/content/                 chapters 01–06, beispiele.tex (cheat sheet), anhang.tex
thesis/literatur.bib            bibliography (BibTeX); agsm-de.bst = German bibliography wording
thesis/images/                  figures; logo.png = company logo, dhbw.png
thesis/sources/                 optional source PDFs for evidence links (git-ignored)
tools/                          LaTeX Review Companion: .vsix and its source
.vscode/settings.json           build recipe, live preview, SyncTeX
```

## Writing

- **New chapter:** create `thesis/content/07-name.tex` starting with `%!TEX root = ../dokumentation.tex` and `\chapter{Title}\label{ch:name}`, then add `\input{content/07-name}` to `dokumentation.tex`.
- **Cheat sheet:** `content/beispiele.tex` shows every element once: citations, figure, TikZ diagram, table, listing, equation, footnote, abbreviation, glossary term, draft note. Copy from it; delete its `\input` line when it is no longer needed.
- **Cite:** `\citep{key}` → (Author, 2020); `\citep[S.~12]{key}` (English: `[p.~12]`) adds the page; `\citet{key}` → Author (2020). Entries go into `literatur.bib`; only cited ones are printed.
- **Cross-reference:** `\label{fig:x}` after `\caption`, then `\autoref{fig:x}` → "Abbildung 3.1" / "Figure 3.1". Prefixes: `ch:` `sec:` `fig:` `tab:` `lst:` `eq:` `app:`.
- **Abbreviations:** define in `ads/acronyms.tex`, write `\ac{API}`; the first use is spelled out. Only used ones appear in the list.
- **Glossary:** define in `ads/glossary.tex`, link with `\gls{key}`; all entries are printed.
- **Draft notes:** `\begin{notiz} … \end{notiz}` prints red; `\excludecomment{notiz}` in `header.tex` §7 hides all of them.
- Special characters in text: `\&` `\%` `\_` `\#` `\$`. Quotation marks: `\enquote{…}`.

## Adjusting styles

Almost everything is in `thesis/ads/header.tex`, in numbered sections (§).

| Want | Where | Change |
|---|---|---|
| Language | `./set-language.sh de` or `en` | once, before writing; afterwards `\englischtrue` / `\englischfalse` in `dokumentation.tex` still switches title page, headings, declaration, quotation marks, citations and bibliography wording, but not text already written |
| Font | header §2 | replace `\usepackage{palatino}` with one of the listed alternatives |
| Serif headings | header §2 | uncomment `\addtokomafont{disposition}{\rmfamily}` |
| Font size | class options in `dokumentation.tex` | `12pt` → `11pt` |
| Margins | header §1 | replace `fullpage` with the `geometry` line |
| Line spacing | header §1 | `onehalfspacing` → `singlespacing`, or `\setstretch{1.3}` |
| Paragraph gap or indent | class options | `parskip=half` → `parskip=full`; `parskip=false` indents instead |
| Link color | header §4 | `LinkColor`; no colored links: `colorlinks=false, hidelinks` in §8 |
| Diagram color | header §4 | `\colorlet{akzent}{blue!60!black}` recolors every TikZ diagram |
| Diagram shapes | header §5 | the `\tikzset` styles `fio`, `fstage`, `fkey`, `fmuted`, `fgate`, … |
| Table spacing | header §5 | `\tabcolsep`, `\arraystretch`; they apply to all tables, including the title page |
| Code listings | header §6 | `\lstset`; per listing `[language=Java]` |
| Citation look | header §9 | `\citationmode`, `\harvardand`; bibliography style in `dokumentation.tex`: `agsm` (English) and `agsm-de` (German); other English-only options: `dcu`, `kluwer`, `jmr`, `apsr`, `nederlands`, `jphysicsB` |
| Title page | `ads/deckblatt.tex` | layout, and labels as `\deen{deutsch}{english}`; the data comes from `dokumentation.tex` |
| Table of contents depth | `dokumentation.tex` | `\setcounter{tocdepth}{2}` |
| Order of front and back matter | `dokumentation.tex` | move the `\input` blocks; pages are Roman (front), Arabic (text), roman (back) |
| Glossary layout | `dokumentation.tex` | `\printglossary[style=altlist]` → `list`, `long`, `super`, … |
| List of listings | `dokumentation.tex` | uncomment the `\lstlistoflistings` block |

Colored code via `minted` needs Python's Pygments and `-shell-escape` in both `thesis/.latexmkrc` and the `args` in `.vscode/settings.json`; the template uses `listings` to avoid that.

## LaTeX Review Companion

Our own VS Code extension, not on the marketplace; source in `tools/latex-review-companion/`. Commands are in the Command Palette.

- **PDF follows cursor:** every cursor move in a saved `.tex` file scrolls the PDF there. Cmd+Alt+W toggles it (status bar: `PDF follows cursor` / `PDF follow off`). It ignores programmatic moves, so a double-click in the PDF does not bounce back, and unsaved files, whose SyncTeX data is stale until the autosave build lands. Cmd+Alt+P opens the preview in VS Code's Simple Browser instead, a fallback.
- **Citation check:** `LaTeX Citations: Check citations against bibliography` lists unknown keys (error), duplicate entries (warning) and never-cited entries (info) in the Problems panel.
- **Evidence links:** `LaTeX Citations: Enable evidence links` puts a blue ▷ after every citation in the PDF that opens the cited source: `thesis/sources/<key>.pdf` (see the README there) or else the entry's `url`. It writes `citation-evidence*.tex` next to `dokumentation.tex` and inserts `\input{citation-evidence}`; `LaTeX Citations: Disable evidence links` removes it again.
- **Settings:** `latexCitations.*` (server port 8765, `sourcesDirs`, marker symbol and color).
- **Reinstall:** `code --install-extension tools/latex-review-companion-0.4.0.vsix`, then run `Developer: Reload Window`. If `code` is not found: Command Palette → `Shell Command: Install 'code' command in PATH`.
- **After changing its source:** bump `version` in its `package.json`, run `npx @vscode/vsce package` in that folder, move the new `.vsix` to `tools/`, install it.

## Troubleshooting

- **PDF pane stops updating:** the viewer lost its connection; the PDF on disk is current. Close the PDF tab and press Cmd+Alt+V again. Check: `pdftotext thesis/dokumentation.pdf - | grep -c "a phrase you just typed"` above 0 means the build is fine.
- **Preview jumps to page 1 or the table of contents:** VS Code older than 1.95 (update it); a folder path with ä/ö/ü (macOS stores such names differently from VS Code, so the viewer loses the file; move to an ASCII path); or `latex-workshop.synctex.path` not pointing at a real `synctex`.
- **Build never stops:** `latex-workshop.latex.autoBuild.run` must stay `onSave`; `onFileChange` reacts to the build's own aux files.
- **"Missing $ inserted":** an unescaped `_`, `%`, `&` or `#` in the text. URLs in `literatur.bib` are fine as they are.
- **Citation shows as a key or `?`:** the key has a typo or the entry is missing; run the citation check.
- **Abbreviation list is empty:** only abbreviations used with `\ac{}` are listed.
- **Preview stays blank while another LaTeX project is open:** both use viewer port 51342; change `latex-workshop.view.pdf.internal.port` in one of them.

## Before submitting

1. `LaTeX Citations: Disable evidence links`, if they were enabled.
2. Uncomment `\excludecomment{notiz}` in `header.tex` §7.
3. Delete the `\input{content/beispiele}` line.
4. Check the wording in `ads/erklaerung.tex` against the current Prüfungsordnung (some programs also require a statement on AI tools), and whether the Sperrvermerk is wanted.
5. `./build.sh` → `no errors, no undefined references`.
6. For print: black links via `LinkColor` in §4.

## Rules for Claude

- After editing any `.tex` or `.bib` file, run `./build.sh` and fix everything it lists before reporting done.
- The thesis has one language, the one set by `\englischtrue` / `\englischfalse`: write new chapters, captions, glossary entries and abbreviations in it. In a German thesis, page numbers are `S.~12` and editions `edition = {2}`; in an English one `p.~12` and `{2nd}`.
- Keep `content/` and `ads/abstract.tex` at one sentence per line.
- Put new packages into the matching `header.tex` section; packages that need hyperref go after §8.
- Never invent bibliography entries, page numbers or quotes. Add entries only from sources the user gives you or that you have checked, and cite the published page numbers, not PDF sheet numbers.
- Change the wording of `ads/erklaerung.tex` and `ads/sperrvermerk.tex` only when the user asks.
- Do not edit generated files: `*.aux`, `*.bbl`, `*.log`, `citation-evidence-map.tex`.
- Do not add `-shell-escape` unless the user wants `minted`.

## Windows and Linux

`setup.sh` and the paths in `.vscode/settings.json` are macOS-specific. Elsewhere:

1. Install TeX: on Linux the full TeX Live (`sudo apt install texlive-full` on Debian/Ubuntu); on Windows TeX Live or MiKTeX, plus Strawberry Perl, because latexmk and makeglossaries are Perl scripts.
2. In `.vscode/settings.json`: set the tool's `"command"` to `"latexmk"`, delete its `"env"` block, and delete the `latex-workshop.synctex.path` line.
3. Install the extensions: `code --install-extension james-yu.latex-workshop`, then `code --install-extension tools/latex-review-companion-0.4.0.vsix`.
4. Build with `./build.sh` (Linux, or Git Bash on Windows), or `cd thesis && latexmk -pdf dokumentation.tex`.
5. Keys use Ctrl where macOS uses Cmd.

## Credits

Template: DHBW LaTeX template by Tobias Dreher, Yves Fischer and Michael Gruben, Apache License 2.0 (`thesis/LICENSE`), changed in 2026: local build, VS Code setup, German or English, data block, bug fixes. `harvard.sty` and `agsm.bst` come with TeX Live; `thesis/agsm-de.bst` is `agsm.bst` with German wording, renamed as its license requires.
