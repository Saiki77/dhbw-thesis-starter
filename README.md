# DHBW thesis starter

LaTeX skeleton for DHBW theses with an Overleaf-style setup on your own Mac: VS Code shows the PDF beside the source, rebuilds two seconds after you stop typing, and scrolls to the sentence under your cursor. Double-click in the PDF to jump back to the source.

## Set up with Claude Code

You need access to this repo and the GitHub CLI logged in (`brew install gh`, then `gh auth login`).
Open Claude Code in the folder where the thesis should live (for example `~/Projects`; not Documents, Desktop or iCloud) and paste:

> Clone the private repo Saiki77/dhbw-thesis-starter with `gh repo clone Saiki77/dhbw-thesis-starter my-thesis`, then follow "First-time setup" in my-thesis/CLAUDE.md.

Afterwards, start Claude Code inside `my-thesis`, so it reads `CLAUDE.md` on its own.

No GitHub CLI? On this page, Code → Download ZIP, unzip it to `~/Projects/my-thesis`, start Claude Code there and ask it to follow "First-time setup" in `CLAUDE.md`.

## Set up by hand (macOS)

1. `gh repo clone Saiki77/dhbw-thesis-starter my-thesis && cd my-thesis && git remote remove origin`
2. `./setup.sh`, and do what it prints until it says `Ready`
3. Fill in the block at the top of `thesis/dokumentation.tex`
4. `open -a "Visual Studio Code" .`, open `thesis/dokumentation.tex`, press Cmd+Alt+V

Writing, styles, the extension and troubleshooting: [CLAUDE.md](CLAUDE.md).
