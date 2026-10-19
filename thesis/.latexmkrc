# Overleaf-equivalent build for the thesis (used by ./build.sh and VS Code).
# Overleaf runs: pdflatex -> bibtex -> makeglossaries -> pdflatex xN
# latexmk does the same, but only reruns what actually changed.

$pdf_mode = 1;   # pdflatex

# -synctex=1 gives click-to-jump between editor and PDF.
# No -shell-escape: the template uses listings, not minted (see CLAUDE.md).
$pdflatex = 'pdflatex -synctex=1 -interaction=nonstopmode -file-line-error %O %S';

# harvard.sty + agsm.bst are BibTeX, not biber.
$bibtex_use = 2;
$bibtex = 'bibtex %O %B';

# Like Overleaf: keep going after errors so a PDF is always produced.
$force_mode = 1;

# --- glossaries support (\makeglossaries + \printglossary) -------------
add_cus_dep('acn', 'acr', 0, 'makeglossaries');
add_cus_dep('glo', 'gls', 0, 'makeglossaries');
sub makeglossaries {
    my ($base_name, $path) = fileparse( $_[0] );
    pushd $path;
    my $return = system "makeglossaries", $base_name;
    popd;
    return $return;
}

# --- cleanup (latexmk -c / -C) -----------------------------------------
$clean_ext .= ' acn acr alg glg glo gls glsdefs ist lol run.xml synctex.gz bbl cut';
push @generated_exts, 'glo', 'gls', 'glg', 'acn', 'acr', 'alg';

# PDF viewer for `./build.sh watch` on macOS: Skim if installed, else the default.
$pdf_previewer = 'open -a Skim' if -d '/Applications/Skim.app';
