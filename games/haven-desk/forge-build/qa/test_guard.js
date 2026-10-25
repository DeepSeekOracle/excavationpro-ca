const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const dir = 'C:/Users/justi/source/chatagent/games/haven-desk/';
const wait = ms => new Promise(r => setTimeout(r, ms));
const vc = new VirtualConsole();
vc.on('jsdomError', () => {});

(async () => {
  const dom = await JSDOM.fromFile(path.join(dir, 'index.html'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc
  });
  const { window } = dom; const doc = window.document;
  await wait(1500);
  doc.querySelector('.veil-first-paper').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  doc.getElementById('veil-first-word').value = 'FOUNDATION';
  [...doc.querySelectorAll('#veil-first button')].find(b => /PRESS IT IN/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);
  const afterSuccess = !!doc.getElementById('veil-first');

  // leave via the note's own button
  [...doc.querySelectorAll('#veil-first button')].find(b => /READ THE READ ME/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);
  const closed = !doc.getElementById('veil-first');

  // a returning caller must not get the note again
  window.VEIL_START.begin(function () {});
  await wait(200);
  const reopenedByBegin = !!doc.getElementById('veil-first');

  // an explicit reopen must bring it back
  window.VEIL_START.reopen(function () {});
  await wait(200);
  const reopenedExplicitly = !!doc.getElementById('veil-first');

  console.log(JSON.stringify({ afterSuccess, closed, reopenedByBegin, reopenedExplicitly }));
  dom.window.close();
})().catch(e => console.log('FAIL', e.message));
