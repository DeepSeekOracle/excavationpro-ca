const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const dir = 'C:/Users/justi/source/chatagent/games/haven-desk/';
const wait = ms => new Promise(r => setTimeout(r, ms));
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => { const s = String(e); if (!/Could not load img|Not implemented|parse CSS|iframe/i.test(s)) errs.push(s.slice(0, 120)); });

(async () => {
  const dom = await JSDOM.fromFile(path.join(dir, 'index.html'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc
  });
  const { window } = dom; const doc = window.document;
  await wait(1600);
  const out = {};

  // take the note quickly
  doc.querySelector('.veil-first-paper').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  doc.getElementById('veil-first-word').value = 'FOUNDATION';
  [...doc.querySelectorAll('#veil-first button')].find(b => /PRESS IT IN/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);
  [...doc.querySelectorAll('#veil-first button')].find(b => /OPEN THE CALENDAR/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(700);

  out.allNodes = doc.querySelectorAll('.veil-node').length;
  const f1 = doc.querySelector('.veil-filter');
  out.filterLabel1 = f1 && f1.textContent;
  f1.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(400);
  out.openNodes = doc.querySelectorAll('.veil-node').length;
  const f2 = doc.querySelector('.veil-filter');
  out.filterLabel2 = f2 && f2.textContent;
  f2.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(400);
  out.backToAll = doc.querySelectorAll('.veil-node').length;
  out.jsErrors = errs.slice(0, 3);
  console.log(JSON.stringify(out, null, 1));
  dom.window.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
