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
  const V = window.HavenDesk.store.veil;
  const out = {};

  // skip the note, take the desk
  doc.querySelector('.veil-first-paper').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  doc.getElementById('veil-first-word').value = 'FOUNDATION';
  [...doc.querySelectorAll('#veil-first button')].find(b => /PRESS IT IN/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);
  [...doc.querySelectorAll('#veil-first button')].find(b => /READ THE READ ME/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(250);

  // everything solved except the private room and the last room
  const ids = Object.keys(window.VEIL_DATA.days);
  ids.forEach(id => { V.unlocked[id] = true; if (id !== '1980-12-31' && id !== '2045-09-01') V.solved[id] = { at: 't', how: 'gate' }; });
  window.HavenDesk.save();

  // --- the private room: the candle choice ---
  window.VEIL_API.openDay('1980-12-31');
  await wait(350);
  const keep = [...doc.querySelectorAll('button')].find(b => /KEEP THE CANDLE LIT/.test(b.textContent));
  out.candleButton = !!keep;
  if (keep) { keep.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await wait(350); }
  out.candleSolved = !!V.solved['1980-12-31'];
  out.candleFlag = V.flags.birthdayChoice || null;

  // --- the last room: the portal sequence ---
  window.VEIL_API.openDay('2045-09-01');
  await wait(350);
  const keys = [...doc.querySelectorAll('.veil-portal-key')];
  out.portalKeys = keys.map(k => k.textContent.trim());
  const order = ['1969', '1980', '1998', '2026', '2038', '2045'];
  for (const year of order) {
    const k = [...doc.querySelectorAll('.veil-portal-key')].find(b => b.textContent.trim() === year);
    if (!k) { out.portalError = 'missing key ' + year; break; }
    k.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await wait(120);
  }
  out.portalSolved = !!V.solved['2045-09-01'];
  await wait(900);

  // --- the ending should be up ---
  out.ending = !!doc.getElementById('veil-final');
  out.indexComplete = !!V.flags.indexComplete;
  out.thread = (doc.querySelector('#veil-thread') || {}).textContent;
  out.jsErrors = errs.slice(0, 4);
  console.log(JSON.stringify(out, null, 1));
  dom.window.close();
})().catch(e => console.log('FAIL', e.message));
