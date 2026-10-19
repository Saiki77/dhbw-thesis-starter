const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// LaTeX Workshop's own URL encoding for its viewer (server.js: encodePathWithPrefix).
function viewerUrl(pdfUri, port) {
  const s = encodeURIComponent(pdfUri.toString(true));
  const b64 = Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `http://127.0.0.1:${port}/viewer.html?file=pdf..${b64}`;
}

// Root PDF = the .pdf sitting next to a .tex that contains \documentclass.
let cachedPdf;
async function findRootPdf(activeFile) {
  if (cachedPdf && fs.existsSync(cachedPdf.fsPath)) return cachedPdf;
  const texes = await vscode.workspace.findFiles('**/*.tex', '**/{node_modules,_minted-*}/**', 300);
  const candidates = [];
  for (const t of texes) {
    let head = '';
    try { const fd = fs.openSync(t.fsPath, 'r'); const b = Buffer.alloc(4096); const n = fs.readSync(fd, b, 0, 4096, 0); fs.closeSync(fd); head = b.toString('utf8', 0, n); } catch { continue; }
    if (!/\\documentclass/.test(head)) continue;
    const pdf = t.fsPath.replace(/\.tex$/, '.pdf');
    if (fs.existsSync(pdf)) candidates.push(pdf);
  }
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => {
    const ina = activeFile && activeFile.startsWith(path.dirname(a)) ? 0 : 1;
    const inb = activeFile && activeFile.startsWith(path.dirname(b)) ? 0 : 1;
    return ina - inb;
  });
  cachedPdf = vscode.Uri.file(candidates[0]);
  return cachedPdf;
}

async function closeLatexWorkshopPdfTabs() {
  const toClose = [];
  for (const g of vscode.window.tabGroups.all) for (const t of g.tabs) {
    const inp = t.input;
    const isWebview = inp instanceof vscode.TabInputWebview;
    const vt = isWebview ? inp.viewType : '';
    console.log(`[latexFollow] tab "${t.label}" input=${inp ? inp.constructor.name : 'none'} viewType=${vt}`);
    const lwPanel = isWebview && /latex-workshop-pdf/i.test(vt);
    const pdfNonText = /\.pdf$/i.test(t.label) && !(inp instanceof vscode.TabInputText) && !(inp instanceof vscode.TabInputText) && !/simple ?browser/i.test(vt);
    if (lwPanel || pdfNonText) toClose.push(t);
  }
  console.log(`[latexFollow] closing ${toClose.length} LaTeX Workshop pdf tab(s)`);
  if (!toClose.length) return true;
  try { return await vscode.window.tabGroups.close(toClose, true); }
  catch (e) { console.log('[latexFollow] close failed: ' + e); return false; }
}

// Opens the LaTeX Workshop viewer inside VS Code's Simple Browser (a plain web page,
// where forward sync scrolls correctly) instead of LW's own webview panel (which
// lands on the wrong page). LW must have "created" the viewer once so its server
// accepts the Simple Browser as a sync client; that is what the latex-workshop.view
// call below does, and its own tab is closed again afterwards.
async function openPreview(silent) {
  const ed = vscode.window.activeTextEditor;
  const pdf = await findRootPdf(ed && ed.document.uri.fsPath);
  if (!pdf) { if (!silent) vscode.window.showWarningMessage('PDF follow: no built PDF found next to a \\documentclass file yet.'); return; }
  const port = vscode.workspace.getConfiguration('latex-workshop').get('view.pdf.internal.port');
  if (!port) { vscode.window.showWarningMessage('PDF follow: set "latex-workshop.view.pdf.internal.port" to a fixed port first.'); return; }
  await vscode.commands.executeCommand('latex-workshop.view');     // registers the PDF with LW's server
  await sleep(1800);
  await vscode.commands.executeCommand('simpleBrowser.api.open', viewerUrl(pdf, port),
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true });
  await sleep(2500);                                                 // let the Simple Browser client connect
  await closeLatexWorkshopPdfTabs();
  if (ed) await vscode.window.showTextDocument(ed.document, ed.viewColumn, false);
  await sleep(300);
  await vscode.commands.executeCommand('latex-workshop.synctex');
  await sleep(800);
  await closeLatexWorkshopPdfTabs();
}

function activate(context) {
  let enabled = context.globalState.get('latexFollow.enabled', true);
  let lastLine = -1;
  let timer;
  let autoOpened = false;

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
  status.command = 'latexFollow.toggle';
  const paint = () => {
    status.text = enabled ? '$(eye) PDF follows cursor' : '$(eye-closed) PDF follow off';
    status.tooltip = 'Cmd+Alt+W toggles follow · Cmd+Alt+P (re)opens the preview';
    status.show();
  };
  paint();

  const maybeAutoOpen = async ed => {
    if (autoOpened || !ed || ed.document.languageId !== 'latex') return;
    autoOpened = true;
    await sleep(2500);                                   // give LaTeX Workshop time to find the root file
    await openPreview(true);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('latexFollow.toggle', () => {
      enabled = !enabled;
      context.globalState.update('latexFollow.enabled', enabled);
      paint();
      vscode.window.setStatusBarMessage(enabled ? 'PDF follows cursor: on' : 'PDF follows cursor: off', 1500);
      if (enabled) vscode.commands.executeCommand('latex-workshop.synctex');
    }),
    vscode.commands.registerCommand('latexFollow.openPreview', () => openPreview(false)),
    vscode.window.onDidChangeTextEditorSelection(e => {
      if (!enabled) return;
      const ed = e.textEditor;
      if (!ed || ed.document.languageId !== 'latex') return;
      const K = vscode.TextEditorSelectionChangeKind;
      if (e.kind !== K.Mouse && e.kind !== K.Keyboard) return;   // ignore programmatic moves (reverse sync)
      if (ed.document.isDirty) return;                             // .synctex.gz is stale until autosave+build
      const line = e.selections[0].active.line;
      if (line === lastLine) return;
      lastLine = line;
      clearTimeout(timer);
      timer = setTimeout(() => vscode.commands.executeCommand('latex-workshop.synctex'), 250);
    }),
    status
  );
  // Auto-open of the Simple Browser preview is off: LaTeX Workshop's own viewer
  // works once its trimming CSS is patched. Cmd+Alt+P still opens the fallback.

  require('./citations').activate(context);
}
function deactivate() {}
module.exports = { activate, deactivate };
