#!/usr/bin/env bash
# Choose the language of the thesis, once, before writing:
#   ./set-language.sh de    German (the skeleton as cloned)
#   ./set-language.sh en    English
# Sets \englischtrue/\englischfalse in thesis/dokumentation.tex and installs the
# skeleton of that language: chapters, cheat sheet, abstract, glossary,
# abbreviations, example bibliography. Title page, declaration, confidentiality
# notice, headings, quotes, citations and cross-references follow the switch.
# Afterwards lang/ is deleted, so the thesis exists in one language only.
set -euo pipefail
cd "$(dirname "$0")"
ROOT=thesis/dokumentation.tex

lang=${1:-}
case "$lang" in
  de|en) ;;
  *) echo "usage: ./set-language.sh de|en" >&2; exit 2 ;;
esac

current=de
if grep -q '^\\englischtrue' "$ROOT"; then current=en; fi

if [ ! -d lang ]; then
  if [ "$lang" = "$current" ]; then
    echo "The thesis language is already $lang."
    exit 0
  fi
  echo "The language was already chosen ($current) and the other skeleton removed." >&2
  echo "To switch anyway: set \\englisch$([ "$lang" = en ] && echo true || echo false) in $ROOT;" >&2
  echo "title page, headings and citations follow, the chapter text you translate yourself." >&2
  exit 1
fi

if [ "$lang" = en ]; then
  cp -R lang/en/. .
  # Switch, plus the English versions of the placeholders in the data block.
  # Values the user already filled in are left alone.
  perl -pi -e '
    BEGIN {
      %en = (
        "Titel der Arbeit"            => "Title of the Thesis",
        "Untertitel der Arbeit"       => "Subtitle of the Thesis",
        "Projektarbeit (T2000)"       => "Project Report (T2000)",
        "Vorname Nachname"            => "First Name Last Name",
        "Prof. Dr. Vorname Nachname"  => "Prof. Dr. First Name Last Name",
        "Informatik"                  => "Computer Science",
        "Angewandte Informatik"       => "Applied Computer Science",
        "12 Wochen"                   => "12 weeks",
        "01.09.2026"                  => "1 September 2026",
      );
    }
    s/^\\englischfalse\b/\\englischtrue/;
    s/^(\\newcommand\{\\\w+\})\{([^{}]*)\}/exists $en{$2} ? "$1\{$en{$2}\}" : $&/e;
  ' "$ROOT"
else
  perl -pi -e 's/^\\englischtrue\b/\\englischfalse/' "$ROOT"
fi
rm -rf lang

if [ "$lang" = en ]; then name=English; else name=German; fi
echo "Thesis language: $name. Next: fill in the block at the top of $ROOT, then ./build.sh"
