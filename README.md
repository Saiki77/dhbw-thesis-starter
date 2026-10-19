# DHBW thesis starter

LaTeX skeleton for DHBW theses in German or in English, with an Overleaf-style setup on your own Mac: VS Code shows the PDF beside the source, rebuilds two seconds after you stop typing, and scrolls to the sentence under your cursor. Double-click in the PDF to jump back to the source.

You pick the language once; title page, declaration, headings, citations and bibliography all follow it.

Unofficial and not affiliated with the DHBW: check your Studiengang's requirements for the title page, declaration and layout.

## Set up with Claude Code

Open Claude Code in the folder where the thesis should live (for example `~/Projects`; not Documents, Desktop or iCloud) and paste:

> Clone https://github.com/Saiki77/dhbw-thesis-starter into my-thesis, then follow "First-time setup" in my-thesis/CLAUDE.md.

Afterwards, start Claude Code inside `my-thesis`, so it reads `CLAUDE.md` on its own.

## Set up by hand (macOS)

1. `git clone https://github.com/Saiki77/dhbw-thesis-starter.git my-thesis && cd my-thesis && git remote remove origin`
2. `./setup.sh`, and do what it prints until it says `Ready`
3. `./set-language.sh de` for German or `./set-language.sh en` for English
4. Fill in the block at the top of `thesis/dokumentation.tex`
5. `open -a "Visual Studio Code" .`, open `thesis/dokumentation.tex`, press Cmd+Alt+V

No git? On this page, Code → Download ZIP, and unzip it to `~/Projects/my-thesis`.

Writing, styles, the extension and troubleshooting: [CLAUDE.md](CLAUDE.md).

## License

Apache License 2.0 ([LICENSE](LICENSE)). Credits for the original DHBW template and the parts that keep their own terms: [NOTICE](NOTICE).
