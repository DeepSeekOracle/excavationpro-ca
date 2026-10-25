const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
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
  await wait(1600);
  const out = {};
  const V = window.HavenDesk.store.veil;

  // finish the note
  doc.querySelector('.veil-first-paper').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  doc.getElementById('veil-first-word').value = 'FOUNDATION';
  [...doc.querySelectorAll('#veil-first button')].find(b => /PRESS IT IN/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(400);

  // leave the note
  [...doc.querySelectorAll('#veil-first button')].find(b => /STAY|OPEN THE CALENDAR|READ THE READ ME/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);

  const iconIds = [...doc.querySelectorAll('.icon')].map(i => i.dataset.id);
  out.kooterIcon = iconIds.includes('kooter-card');
  window.HavenDesk.open('kooter-card');
  await wait(400);
  const kwin = doc.querySelector('#win-kooter-card .body');
  out.kooterBody = kwin ? kwin.textContent.replace(/\s+/g, ' ').slice(0, 90) : null;
  out.kooterImg = kwin ? !!kwin.querySelector('img') : false;

  // complete the index
  Object.keys(window.VEIL_DATA.days).forEach(id => { V.solved[id] = { at: 'test', how: 'gate' }; V.unlocked[id] = true; });
  window.HavenDesk.save();
  window.VEIL_START.thread();
  await wait(1200);
  out.ending = !!doc.getElementById('veil-final');
  out.indexComplete = !!V.flags.indexComplete;
  out.lastPageIcon = [...doc.querySelectorAll('.icon')].map(i => i.dataset.id).includes('lastpage');
  out.threadAfter = (doc.querySelector('#veil-thread') || {}).textContent;

  // read the last page
  window.HavenDesk.open('lastpage');
  await wait(400);
  const lp = doc.querySelector('#win-lastpage .body');
  out.lastPageText = lp ? lp.textContent.replace(/\s+/g, ' ').slice(0, 120) : null;
  out.lastPageWords = lp ? lp.textContent.split(/\s+/).filter(Boolean).length : 0;

  out.jsErrors = errs.slice(0, 4);
  console.log(JSON.stringify(out, null, 1));
  dom.window.close();
})().catch(e => console.log('FAIL', e.message, e.stack && e.stack.slice(0, 260)));
