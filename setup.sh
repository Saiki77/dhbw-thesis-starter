#!/usr/bin/env bash
# One-time setup on macOS: checks TeX and VS Code, installs the two VS Code
# extensions, and test-builds the PDF. Safe to re-run: it only installs what is
# missing. It needs no password; steps that do are printed for you to run.
#   ./setup.sh
set -uo pipefail
cd "$(dirname "$0")"

todo=()
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
miss() { printf '  \033[31m✗\033[0m %s\n' "$*"; todo+=("$*"); }

has_brew=0
command -v brew >/dev/null 2>&1 && has_brew=1

echo "1/4 System"
if [ "$(uname)" != "Darwin" ]; then
  echo "  setup.sh is for macOS. On Windows or Linux, follow 'Windows and Linux' in CLAUDE.md."
  exit 1
fi
ok "macOS $(sw_vers -productVersion)"
# Non-ASCII names are stored decomposed on disk while VS Code uses composed
# paths; LaTeX Workshop then loses track of the PDF viewer.
if LC_ALL=C grep -q '[^ -~]' <<<"$PWD"; then
  warn "the folder path contains ä/ö/ü or similar; the PDF preview can lose track of the file. Move the folder to a plain ASCII path."
fi
case "$PWD" in
  "$HOME/Documents"*|"$HOME/Desktop"*|*"Mobile Documents"*)
    warn "the folder is in Documents, Desktop or iCloud; sync and macOS privacy prompts can get in the way of builds. ~/Projects is safer." ;;
esac

echo "2/4 TeX"
if [ -d /Library/TeX/texbin ]; then
  export PATH="/Library/TeX/texbin:$PATH"
fi
if [ $has_brew = 1 ]; then
  mactex="brew install --cask mactex-no-gui   (asks for your password, about 6 GB)"
else
  mactex="download and run the installer from https://tug.org/mactex/"
fi
if command -v latexmk >/dev/null 2>&1 && command -v pdflatex >/dev/null 2>&1; then
  ok "$(pdflatex --version | head -1)"
  missing=()
  for f in scrreprt.cls harvard.sty agsm.bst glossaries.sty acronym.sty csquotes.sty \
           ngerman.ldf tikz.sty adjustbox.sty listings.sty palatino.sty eurosym.sty \
           footmisc.sty comment.sty example-image.pdf; do
    kpsewhich "$f" >/dev/null 2>&1 || missing+=("$f")
  done
  command -v makeglossaries >/dev/null 2>&1 || missing+=("makeglossaries")
  if [ ${#missing[@]} -eq 0 ]; then
    ok "all LaTeX packages the template needs are installed"
  else
    miss "LaTeX packages missing (${missing[*]}); install the full MacTeX in a terminal: $mactex"
  fi
else
  miss "MacTeX is not installed; in a terminal: $mactex"
fi

echo "3/4 VS Code and extensions"
CODE=""
if command -v code >/dev/null 2>&1; then
  CODE=$(command -v code)
elif [ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
  CODE="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
fi
if [ -z "$CODE" ]; then
  if [ $has_brew = 1 ]; then
    miss "VS Code is not installed: brew install --cask visual-studio-code"
  else
    miss "VS Code is not installed: download it from https://code.visualstudio.com"
  fi
else
  ver=$("$CODE" --version 2>/dev/null | head -1)
  ok "VS Code $ver"
  # Before 1.95 the viewer's CSS collapses unrendered pages to 0 px, so
  # forward sync lands in the front matter.
  if [ "$(printf '%s\n' 1.95.0 "$ver" | sort -V | head -1)" != "1.95.0" ]; then
    miss "VS Code $ver is too old for the PDF preview; update it: Code > Check for Updates"
  fi
  have=$("$CODE" --list-extensions --show-versions 2>/dev/null)
  # LaTeX Workshop: install if missing, never touch an existing install.
  if grep -q '^james-yu\.latex-workshop@' <<<"$have"; then
    ok "LaTeX Workshop already installed"
  elif "$CODE" --install-extension james-yu.latex-workshop >/dev/null 2>&1; then
    ok "LaTeX Workshop installed"
  else
    miss "LaTeX Workshop could not be installed: code --install-extension james-yu.latex-workshop"
  fi
  # LaTeX Review Companion: install the bundled .vsix unless that version is in.
  vsix=$(ls tools/latex-review-companion-*.vsix 2>/dev/null | sort -V | tail -1)
  vsix_ver=${vsix##*-}; vsix_ver=${vsix_ver%.vsix}
  if [ -z "$vsix" ]; then
    miss "tools/latex-review-companion-*.vsix is missing from the repo"
  elif grep -qx "local\.latex-review-companion@$vsix_ver" <<<"$have"; then
    ok "LaTeX Review Companion $vsix_ver already installed"
  elif "$CODE" --install-extension "$vsix" --force >/dev/null 2>&1; then
    ok "LaTeX Review Companion $vsix_ver installed (PDF follows cursor)"
  else
    miss "LaTeX Review Companion could not be installed: code --install-extension $vsix"
  fi
fi

echo "4/4 Test build"
if command -v latexmk >/dev/null 2>&1; then
  if out=$(./build.sh 2>&1); then
    ok "thesis/dokumentation.pdf built: $(tail -1 <<<"$out")"
  else
    miss "the test build failed; run ./build.sh and fix the errors it lists"
    tail -12 <<<"$out" | sed 's/^/      /'
  fi
else
  warn "skipped until MacTeX is installed"
fi

echo
if [ ${#todo[@]} -eq 0 ]; then
  echo "Ready. Open the project with:  code \"$PWD\""
  echo "then open thesis/dokumentation.tex and press Cmd+Alt+V for the PDF preview."
else
  echo "Still to do, then run ./setup.sh again:"
  for t in "${todo[@]}"; do echo "  - $t"; done
  exit 1
fi
