const { JSDOM, VirtualConsole } = require('jsdom');
const dir = 'C:/Users/justi/source/chatagent/games/haven-desk/';
const wait = ms => new Promise(r => setTimeout(r, ms));
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => { const s = String(e); if (!/Could not load img|Not implemented|parse CSS|iframe/i.test(s)) errs.push(s.slice(0, 140)); });

(async () => {
  const dom = await JSDOM.fromFile(dir + 'index.html', {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc
  });
  const { window } = dom; const doc = window.document;
  await wait(1600);
  const V = window.HavenDesk.store.veil;
  const out = {};

  // --- A. focus trap + aria on the note ---
  out.deskAriaHidden = doc.getElementById('desk').getAttribute('aria-hidden');
  const focusables = [...doc.querySelectorAll('#veil-first button, #veil-first input')];
  out.focusableCount = focusables.length;
  focusables[focusables.length - 1].focus();
  doc.getElementById('veil-first').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  out.wrappedToFirst = doc.activeElement === focusables[0];

  // finish the note
  doc.querySelector('.veil-first-paper').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  doc.getElementById('veil-first-word').value = 'FOUNDATION';
  [...doc.querySelectorAll('#veil-first button')].find(b => /PRESS IT IN/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);
  [...doc.querySelectorAll('#veil-first button')].find(b => /READ THE READ ME/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);
  out.deskAriaAfterClose = doc.getElementById('desk').getAttribute('aria-hidden');

  // --- B. the private-date dead end ---
  const ids = Object.keys(window.VEIL_DATA.days);
  ids.forEach(id => {
    if (id === '1980-12-31') { delete V.solved[id]; delete V.unlocked[id]; return; }
    V.solved[id] = { at: 't', how: 'gate' }; V.unlocked[id] = true;
  });
  window.HavenDesk.save();
  window.VEIL_START.thread();
  await wait(200);
  const bar = doc.querySelector('#veil-thread');
  out.threadLabel = bar && bar.dataset.label;
  out.threadKicker = bar && (bar.querySelector('.veil-thread-kicker') || {}).textContent;

  const go = doc.querySelector('.veil-thread-go');
  if (go) { go.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await wait(700); }
  const input = doc.querySelector('input[aria-label="personal date recovery"]');
  out.recoveryFocused = !!input && doc.activeElement === input;

  out.jsErrors = errs.slice(0, 4);
  console.log(JSON.stringify(out, null, 1));
  dom.window.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
