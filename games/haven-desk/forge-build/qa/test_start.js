const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const fs = require('fs');
const dir = 'C:/Users/justi/source/chatagent/games/haven-desk/';
const wait = ms => new Promise(r => setTimeout(r, ms));
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => { const s = String(e); if (!/Could not load img|Not implemented|parse CSS|iframe/i.test(s)) errs.push(s.slice(0, 160)); });

(async () => {
  const dom = await JSDOM.fromFile(path.join(dir, 'index.html'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc
  });
  const { window } = dom; const doc = window.document;
  await wait(1800);
  const out = {};
  const V = window.HavenDesk.store.veil;

  out.overlay = !!doc.getElementById('veil-first');
  out.beforeSolved = !!(V.solved && V.solved['1998-03-14']);
  out.desktopStaged = doc.getElementById('desktop').className;
  out.noteHead = (doc.querySelector('.veil-first-head') || {}).textContent;
  out.noteChars = (doc.querySelector('.veil-first-paper') || { textContent: '' }).textContent.length;

  // skip the typewriter
  const paper = doc.querySelector('.veil-first-paper');
  if (paper) paper.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(200);
  out.noteFull = (doc.querySelector('.veil-first-paper') || { textContent: '' }).textContent.slice(0, 120);

  const input = doc.getElementById('veil-first-word');
  const press = [...doc.querySelectorAll('#veil-first button')].find(b => /PRESS IT IN/.test(b.textContent));
  out.hasInput = !!input; out.hasPress = !!press;

  // wrong word
  input.value = 'PASSWORD';
  press.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(150);
  out.wrongMsg = (doc.querySelector('.veil-first-msg') || {}).textContent;

  // right word
  input.value = 'foundation';
  press.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);
  out.solvedAfter = !!(V.solved && V.solved['1998-03-14']);
  out.unlocked = ['1969-07-20', '1989-11-09', '1999-12-31', '2007-01-09'].filter(id => V.unlocked[id]);
  out.sheetHead = (doc.querySelector('.veil-first-head') || {}).textContent;
  out.doneTitle = (doc.querySelector('.veil-first-done h2') || {}).textContent;
  out.stagedAfter = doc.getElementById('desktop').className;

  // open the calendar from the note
  const goCal = [...doc.querySelectorAll('#veil-first button')].find(b => /OPEN THE CALENDAR/.test(b.textContent));
  goCal.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(700);
  out.overlayGone = !doc.getElementById('veil-first');
  out.nodes = doc.querySelectorAll('.veil-node').length;
  const next = doc.querySelector('.veil-node.is-next');
  out.nextNode = next ? next.dataset.day : null;
  out.thread = (doc.querySelector('#veil-thread') || {}).textContent;
  out.threadLabel = (doc.querySelector('#veil-thread') || { dataset: {} }).dataset.label;

  // follow the thread: click it
  const go = doc.querySelector('.veil-thread-go');
  if (go) { go.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await wait(600); }
  const prose = [...doc.querySelectorAll('p.veil-prose')].map(n => n.textContent.trim()).filter(Boolean);
  out.openedTitle = (doc.querySelector('.veil-hero h1') || {}).textContent;
  out.openedWords = prose.join(' ').split(/\s+/).filter(Boolean).length;
  out.jsErrors = errs.slice(0, 4);

  console.log(JSON.stringify(out, null, 1));
  dom.window.close();
})().catch(e => console.log('FAIL', e.message, e.stack && e.stack.slice(0, 300)));
