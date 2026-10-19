// Citation evidence: ▷ markers in the built PDF that link every citation to its
// source PDF (served locally) or to the bib entry's URL — plus a bibliography
// integrity check (cited-but-missing, never-cited, duplicate keys).
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ---------------------------------------------------------------- pure helpers

// Keys of every real entry in a .bib file, with the line each starts on.
function parseBibKeys(bibText) {
  const keys = [];
  const re = /^\s*@(\w+)\s*\{\s*([^,\s}]+)/gm;
  let m;
  while ((m = re.exec(bibText))) {
    const type = m[1].toLowerCase();
    if (type === 'string' || type === 'comment' || type === 'preamble') continue;
    keys.push({ key: m[2], line: bibText.slice(0, m.index).split('\n').length - 1 });
  }
  return keys;
}

// url = {...} fields per key, for entries whose PDF is not on disk.
function parseBibUrls(bibText) {
  const urls = {};
  const blocks = bibText.split(/^(?=@)/m);
  for (const block of blocks) {
    const k = block.match(/^@\w+\s*\{\s*([^,\s}]+)/);
    const u = block.match(/^\s*url\s*=\s*[{"]([^}"]+)[}"]/mi);
    if (k && u) urls[k[1]] = u[1];
  }
  return urls;
}

// Every \cite-like call in a .tex source, with its keys and position.
function parseCites(texText) {
  const cites = [];
  const lines = texText.split('\n');
  const re = /\\[A-Za-z]*[Cc]ite[A-Za-z]*\*?\s*(?:\[[^\]]*\]\s*)*\{([^}]*)\}/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/(^|[^\\])%.*$/, '$1'); // drop comments
    let m;
    while ((m = re.exec(line))) {
      for (const raw of m[1].split(',')) {
        const key = raw.trim();
        if (key) cites.push({ key, line: i, col: m.index });
      }
    }
  }
  return cites;
}

function detectBackend(rootTexText) {
  if (/\\usepackage[^{]*\{[^}]*harvard[^}]*\}/.test(rootTexText)) return 'harvard';
  if (/\\usepackage[^{]*\{[^}]*natbib[^}]*\}/.test(rootTexText)) return 'natbib';
  if (/\\usepackage[^{]*\{[^}]*biblatex[^}]*\}/.test(rootTexText)) return 'biblatex';
  return 'natbib';
}

// ------------------------------------------------------------- config helpers

const cfg = () => vscode.workspace.getConfiguration('latexCitations');

function findRootTex() {
  const active = vscode.window.activeTextEditor?.document.uri.fsPath;
  const folders = vscode.workspace.workspaceFolders || [];
  const candidates = [];
  for (const f of folders) {
    const stack = [f.uri.fsPath];
    while (stack.length) {
      const dir = stack.pop();
      let entries = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
      for (const e of entries) {
        if (e.isDirectory() && !/^(node_modules|\.git|_minted)/.test(e.name)) stack.push(path.join(dir, e.name));
        else if (e.name.endsWith('.tex')) {
          const p = path.join(dir, e.name);
          let head = '';
          try { head = fs.readFileSync(p, 'utf8').slice(0, 4096); } catch { continue; }
          if (/\\documentclass/.test(head)) candidates.push(p);
        }
      }
    }
  }
  candidates.sort((a, b) => {
    const ina = active && active.startsWith(path.dirname(a)) ? 0 : 1;
    const inb = active && active.startsWith(path.dirname(b)) ? 0 : 1;
    return ina - inb;
  });
  return candidates[0];
}

function findBibFiles(rootTex) {
  const dir = path.dirname(rootTex);
  const text = fs.readFileSync(rootTex, 'utf8');
  const named = [];
  const re = /\\(?:bibliography|addbibresource)\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(text))) for (const b of m[1].split(',')) {
    const name = b.trim().endsWith('.bib') ? b.trim() : b.trim() + '.bib';
    const p = path.resolve(dir, name);
    if (fs.existsSync(p)) named.push(p);
  }
  if (named.length) return named;
  return fs.readdirSync(dir).filter(f => f.endsWith('.bib')).map(f => path.join(dir, f));
}

function texFilesUnder(rootTex) {
  const out = [];
  const stack = [path.dirname(rootTex)];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.isDirectory() && !/^(node_modules|\.git|_minted)/.test(e.name)) stack.push(path.join(dir, e.name));
      else if (e.name.endsWith('.tex') && !/^citation-evidence/.test(e.name)) out.push(path.join(dir, e.name));
    }
  }
  return out;
}

// ------------------------------------------------------------ evidence server

let server, serverStatus;

function stopServer() {
  if (server) { server.close(); server = undefined; }
  paintServerStatus();
}

function startServer(rootDir) {
  stopServer();
  const port = cfg().get('port', 8765);
  const dirs = cfg().get('sourcesDirs', ['sources/verified', 'sources/pdf'])
    .map(d => path.resolve(rootDir, d)).filter(d => fs.existsSync(d));
  if (!dirs.length) {
    vscode.window.showWarningMessage(`Citation evidence: none of the sources directories exist under ${rootDir}.`);
    return;
  }
  server = http.createServer((req, res) => {
    const name = path.basename(decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]));
    if (!name.endsWith('.pdf')) { res.writeHead(404); res.end(); return; }
    for (const d of dirs) {
      const p = path.join(d, name);
      if (fs.existsSync(p)) {
        res.writeHead(200, { 'Content-Type': 'application/pdf' });
        fs.createReadStream(p).pipe(res);
        return;
      }
    }
    res.writeHead(404); res.end();
  });
  server.on('error', e => {
    vscode.window.showErrorMessage(`Citation evidence server failed on port ${port}: ${e.message}`);
    server = undefined; paintServerStatus();
  });
  server.listen(port, '127.0.0.1', paintServerStatus);
}

function paintServerStatus() {
  if (!serverStatus) return;
  const port = cfg().get('port', 8765);
  serverStatus.text = server ? `$(link) evidence :${port}` : '$(link) evidence off';
  serverStatus.tooltip = 'Citation evidence PDF server — click to toggle';
  serverStatus.show();
}

// ------------------------------------------------------- generated LaTeX glue

function markerMacro() {
  const symbol = cfg().get('markerSymbol', '$\\triangleright$');
  const color = cfg().get('markerColor', 'blue!70!black');
  return `\\newif\\ifevidence
\\evidencetrue
\\input{citation-evidence-map}
\\makeatletter
\\def\\ev@first#1,#2\\ev@end{#1}
\\newcommand{\\evmark}[1]{\\ifevidence
  \\edef\\ev@key{\\ev@first#1,\\ev@end}%
  \\ifcsname ev@\\ev@key\\endcsname
    \\hspace{1pt}\\pdfstartlink attr{/Border[0 0 0] /H/I} user{/Subtype/Link/A<</Type/Action/S/URI/URI(\\csname ev@\\ev@key\\endcsname)>>}\\hspace{2pt}\\raisebox{0.45ex}{\\scriptsize\\textcolor{${color}}{${symbol}}}\\hspace{2pt}\\pdfendlink%
  \\fi\\fi}`;
}

function wrapperFor(backend) {
  if (backend === 'harvard') return `${markerMacro()}
\\renewcommand{\\citep}[2][]{\\if\\relax\\detokenize{#1}\\relax\\cite{#2}\\else\\cite[#1]{#2}\\fi\\evmark{#2}}
\\renewcommand{\\citet}[2][]{\\if\\relax\\detokenize{#1}\\relax\\citeasnoun{#2}\\else\\citeasnoun[#1]{#2}\\fi\\evmark{#2}}
\\makeatother`;
  if (backend === 'natbib') return `${markerMacro()}
\\NewCommandCopy\\evx@citep\\citep
\\NewCommandCopy\\evx@citet\\citet
\\RenewDocumentCommand{\\citep}{s o o m}{\\IfBooleanTF{#1}{\\evx@citep*}{\\evx@citep}\\IfValueT{#2}{[#2]}\\IfValueT{#3}{[#3]}{#4}\\evmark{#4}}
\\RenewDocumentCommand{\\citet}{s o o m}{\\IfBooleanTF{#1}{\\evx@citet*}{\\evx@citet}\\IfValueT{#2}{[#2]}\\IfValueT{#3}{[#3]}{#4}\\evmark{#4}}
\\makeatother`;
  return undefined; // biblatex: unsupported in v1
}

function buildMap(rootDir, bibFiles) {
  const port = cfg().get('port', 8765);
  const dirs = cfg().get('sourcesDirs', ['sources/verified', 'sources/pdf']).map(d => path.resolve(rootDir, d));
  let pages = {};
  const pagesFile = path.join(rootDir, 'citation-evidence.json');
  if (fs.existsSync(pagesFile)) {
    try { pages = JSON.parse(fs.readFileSync(pagesFile, 'utf8')).pages || {}; } catch { /* ignore */ }
  }
  const lines = ['% generated by LaTeX Citation Evidence -- do not edit by hand'];
  let local = 0, web = 0;
  for (const bib of bibFiles) {
    const text = fs.readFileSync(bib, 'utf8');
    const urls = parseBibUrls(text);
    for (const { key } of parseBibKeys(text)) {
      const pdf = dirs.map(d => path.join(d, key + '.pdf')).find(p => fs.existsSync(p));
      let target;
      if (pdf) { target = `http://127.0.0.1:${port}/${key}.pdf\\#page=${pages[key] || 1}`; local++; }
      else if (urls[key]) { target = urls[key].replace(/#/g, '\\#').replace(/%/g, '\\%'); web++; }
      if (target) lines.push(`\\expandafter\\gdef\\csname ev@${key}\\endcsname{${target}}`);
    }
  }
  return { text: lines.join('\n') + '\n', local, web };
}

// ------------------------------------------------------------------- commands

async function enableEvidence() {
  const rootTex = findRootTex();
  if (!rootTex) { vscode.window.showWarningMessage('Citation evidence: no .tex with \\documentclass found.'); return; }
  const rootDir = path.dirname(rootTex);
  const rootText = fs.readFileSync(rootTex, 'utf8');
  const backendSetting = cfg().get('backend', 'auto');
  const backend = backendSetting === 'auto' ? detectBackend(rootText) : backendSetting;
  const wrapper = wrapperFor(backend);
  if (!wrapper) { vscode.window.showErrorMessage(`Citation evidence: the ${backend} backend is not supported yet (harvard and natbib are).`); return; }

  const bibFiles = findBibFiles(rootTex);
  if (!bibFiles.length) { vscode.window.showWarningMessage('Citation evidence: no .bib file found.'); return; }
  const map = buildMap(rootDir, bibFiles);
  fs.writeFileSync(path.join(rootDir, 'citation-evidence-map.tex'), map.text);
  fs.writeFileSync(path.join(rootDir, 'citation-evidence.tex'), wrapper + '\n');

  if (!/\\input\{citation-evidence\}/.test(rootText)) {
    const pick = await vscode.window.showInformationMessage(
      `Evidence files written (${map.local} local PDFs, ${map.web} web links, backend: ${backend}). Insert \\input{citation-evidence} after \\begin{document}?`,
      'Insert', 'I\u2019ll do it myself');
    if (pick === 'Insert') {
      const updated = rootText.replace(/(\\begin\{document\})/, '$1\n\\input{citation-evidence}');
      fs.writeFileSync(rootTex, updated);
    }
  } else {
    vscode.window.showInformationMessage(`Evidence map refreshed: ${map.local} local PDFs, ${map.web} web links (backend: ${backend}).`);
  }
  startServer(rootDir);
}

async function disableEvidence() {
  const rootTex = findRootTex();
  if (rootTex) {
    const text = fs.readFileSync(rootTex, 'utf8');
    if (/^.*\\input\{citation-evidence\}.*$/m.test(text)) {
      fs.writeFileSync(rootTex, text.replace(/^.*\\input\{citation-evidence\}.*\n?/m, ''));
      vscode.window.showInformationMessage('Citation evidence disabled — \\input removed. Rebuild to drop the markers.');
    }
  }
  stopServer();
}

function checkCitations(diagnostics) {
  const rootTex = findRootTex();
  if (!rootTex) { vscode.window.showWarningMessage('Citation check: no .tex with \\documentclass found.'); return; }
  const bibFiles = findBibFiles(rootTex);
  const bibKeys = new Map(); // key -> {file, line, count}
  for (const bib of bibFiles) {
    const text = fs.readFileSync(bib, 'utf8');
    for (const { key, line } of parseBibKeys(text)) {
      if (bibKeys.has(key)) bibKeys.get(key).dupes.push({ file: bib, line });
      else bibKeys.set(key, { file: bib, line, dupes: [] });
    }
  }
  diagnostics.clear();
  const perFile = new Map();
  const cited = new Set();
  let citeCount = 0;
  for (const tex of texFilesUnder(rootTex)) {
    const cites = parseCites(fs.readFileSync(tex, 'utf8'));
    for (const c of cites) {
      citeCount++;
      cited.add(c.key);
      if (!bibKeys.has(c.key)) {
        const list = perFile.get(tex) || [];
        list.push(new vscode.Diagnostic(
          new vscode.Range(c.line, c.col, c.line, c.col + c.key.length),
          `Citation key "${c.key}" is not in the bibliography.`, vscode.DiagnosticSeverity.Error));
        perFile.set(tex, list);
      }
    }
  }
  for (const [key, info] of bibKeys) {
    for (const d of info.dupes) {
      const list = perFile.get(d.file) || [];
      list.push(new vscode.Diagnostic(new vscode.Range(d.line, 0, d.line, 1),
        `Duplicate bibliography key "${key}".`, vscode.DiagnosticSeverity.Warning));
      perFile.set(d.file, list);
    }
    if (!cited.has(key)) {
      const list = perFile.get(info.file) || [];
      list.push(new vscode.Diagnostic(new vscode.Range(info.line, 0, info.line, 1),
        `Bibliography entry "${key}" is never cited.`, vscode.DiagnosticSeverity.Information));
      perFile.set(info.file, list);
    }
  }
  for (const [file, list] of perFile) diagnostics.set(vscode.Uri.file(file), list);
  const broken = [...perFile.values()].flat().filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
  const orphans = [...bibKeys.keys()].filter(k => !cited.has(k)).length;
  vscode.window.showInformationMessage(
    `Citations: ${citeCount} calls, ${bibKeys.size} bib entries — ${broken} broken, ${orphans} never cited. Details in the Problems panel.`);
}

// ------------------------------------------------------------------- activate

function activate(context) {
  const diagnostics = vscode.languages.createDiagnosticCollection('latex-citations');
  serverStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 49);
  serverStatus.command = 'latexCitations.toggleServer';
  paintServerStatus();

  context.subscriptions.push(
    diagnostics,
    serverStatus,
    vscode.commands.registerCommand('latexCitations.check', () => checkCitations(diagnostics)),
    vscode.commands.registerCommand('latexCitations.enableEvidence', enableEvidence),
    vscode.commands.registerCommand('latexCitations.disableEvidence', disableEvidence),
    vscode.commands.registerCommand('latexCitations.toggleServer', () => {
      if (server) stopServer();
      else {
        const rootTex = findRootTex();
        if (rootTex) startServer(path.dirname(rootTex));
      }
    }),
    { dispose: stopServer }
  );
}

module.exports = { activate, parseBibKeys, parseBibUrls, parseCites, detectBackend };
