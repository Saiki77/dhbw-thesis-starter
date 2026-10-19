#!/usr/bin/env bash
# Overleaf-equivalent local build of the thesis.
#   ./build.sh           -> build thesis/dokumentation.pdf, then list errors
#                           and undefined references from the log
#   ./build.sh open      -> build, then open the PDF
#   ./build.sh watch     -> rebuild on every save (Ctrl-C to stop)
#   ./build.sh clean     -> delete aux files (keeps the PDF)
#   ./build.sh distclean -> as clean, but also deletes the PDF
set -euo pipefail

# MacTeX first, in case another TeX install (e.g. TinyTeX) shadows it on PATH.
if [ -d /Library/TeX/texbin ]; then
  export PATH="/Library/TeX/texbin:$PATH"
fi

cd "$(dirname "$0")/thesis"
DOC=dokumentation

# Errors and unresolved references from the last run, so nothing scrolls past.
report() {
  [ -f "$DOC.log" ] || return 0
  local errors refs
  errors=$(grep -E '^(! |\./.*:[0-9]+: )' "$DOC.log" | sort -u | head -20 || true)
  refs=$(grep -E 'LaTeX Warning: (Reference|Citation) .* undefined' "$DOC.log" | sort -u | head -20 || true)
  if [ -n "$errors" ]; then printf '\nErrors:\n%s\n' "$errors"; fi
  if [ -n "$refs" ]; then printf '\nUndefined references or citations:\n%s\n' "$refs"; fi
  if [ -z "$errors$refs" ]; then echo "no errors, no undefined references"; fi
}

case "${1:-build}" in
  clean)
    # -c, not -C: -C deletes the PDF, and deleting the file that VS Code's
    # preview is watching orphans the watcher, so the pane freezes on a stale
    # render until you close and reopen the tab. -c keeps the PDF in place.
    latexmk -c "$DOC.tex"
    echo "clean: aux files removed (PDF kept)"
    ;;
  distclean)
    # Full wipe including the PDF. Expect to reopen the preview tab afterwards.
    latexmk -C "$DOC.tex"
    echo "distclean: aux files and PDF removed"
    ;;
  watch)
    # -pvc = preview continuously: rebuilds on every save
    latexmk -pdf -pvc "$DOC.tex"
    ;;
  open)
    status=0
    latexmk -pdf "$DOC.tex" || status=$?
    report
    open "$DOC.pdf" 2>/dev/null || xdg-open "$DOC.pdf"
    exit "$status"
    ;;
  build)
    status=0
    latexmk -pdf "$DOC.tex" || status=$?
    echo "built: $(pwd)/$DOC.pdf"
    report
    exit "$status"
    ;;
  *)
    echo "usage: ./build.sh [open|watch|clean|distclean]" >&2
    exit 2
    ;;
esac
