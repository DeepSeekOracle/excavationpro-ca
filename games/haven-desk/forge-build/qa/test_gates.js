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
  const V = window.HavenDesk.store.veil;
  const D = window.VEIL_DATA;
  Object.keys(D.days).forEach(id => { V.unlocked[id] = true; });
  window.HavenDesk.save();
  const out = {};
  window.HavenDesk.open('calendar');
  await wait(500);

  // lights gate: click the cells the target wants, then send
  window.VEIL_API.openDay('2012-09-30');
  await wait(350);
  const lamps = [...doc.querySelectorAll('.veil-light')];
  const target = D.days['2012-09-30'].gate.target;
  out.lampCount = lamps.length;
  for (let i = 0; i < lamps.length; i++) {
    if (target[i] === '1') { lamps[i].dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await wait(30); }
  }
  [...doc.querySelectorAll('button')].find(b => /SEND PATTERN/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(300);
  out.lightsSolved = !!V.solved['2012-09-30'];

  // memory gate: repeat the sequence
  window.VEIL_API.openDay('2020-05-28');
  await wait(350);
  const seq = D.days['2020-05-28'].gate.sequence;
  for (const name of seq) {
    const pad = [...doc.querySelectorAll('.veil-memorypad')].find(b => b.textContent.trim() === name);
    if (!pad) { out.memoryError = 'missing pad ' + name; break; }
    pad.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await wait(60);
  }
  await wait(250);
  out.memorySolved = !!V.solved['2020-05-28'];

  // bits gate
  window.VEIL_API.openDay('1999-12-31');
  await wait(300);
  const bits = [...doc.querySelectorAll('.veil-bit')];
  const answer = D.days['1999-12-31'].gate.answer;
  for (let i = 0; i < bits.length && i < answer.length; i++) {
    if (answer[i] === '1') { bits[i].dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await wait(25); }
  }
  [...doc.querySelectorAll('button')].find(b => /SEND BYTE/.test(b.textContent))
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(250);
  out.bitsSolved = !!V.solved['1999-12-31'];

  // sequence gate
  window.VEIL_API.openDay('2007-01-09');
  await wait(300);
  for (const w of ['VOICE', 'BODY', 'ROOM']) {
    const b = [...doc.querySelectorAll('.veil-seq-btn')].find(x => x.textContent.trim() === w);
    if (b) { b.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await wait(60); }
  }
  await wait(250);
  out.sequenceSolved = !!V.solved['2007-01-09'];

  out.jsErrors = errs.slice(0, 3);
  console.log(JSON.stringify(out, null, 1));
  dom.window.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
