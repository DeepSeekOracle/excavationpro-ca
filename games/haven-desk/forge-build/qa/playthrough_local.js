const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const fs = require('fs');
const dir = 'C:/Users/justi/source/chatagent/games/haven-desk/';
const wait = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { const s = String(e); if (!/Could not load img|Not implemented|parse CSS/i.test(s)) errors.push(s.slice(0, 140)); });

(async () => {
  const dom = await JSDOM.fromFile(path.join(dir, 'index.html'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc
  });
  const { window } = dom; const doc = window.document;
  await wait(2500);

  const V = window.HavenDesk.store.veil;
  Object.keys(window.VEIL_DATA.days).forEach(id => { V.unlocked[id] = true; V.solved[id] = { at: 'playthrough', how: 'gate' }; });
  window.HavenDesk.save();

  window.HavenDesk.open('calendar');
  await wait(700);
  const sit = [...doc.querySelectorAll('#win-calendar .body button')].find(b => /SIT DOWN/i.test(b.textContent));
  sit.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(700);

  const order = [...doc.querySelectorAll('.veil-node')].map(n => n.dataset.day);
  const rows = [];
  for (let i = 0; i < order.length; i++) {
    const nodes = [...doc.querySelectorAll('.veil-node')];
    const node = nodes[i];
    if (!node) { rows.push({ date: order[i], error: 'node missing' }); continue; }
    node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await wait(55);
    const prose = [...doc.querySelectorAll('p.veil-prose')].map(n => n.textContent.trim()).filter(Boolean);
    rows.push({
      date: node.dataset.day,
      title: ((doc.querySelector('.veil-hero h1') || {}).textContent || '').trim(),
      paragraphs: prose.length,
      words: prose.join(' ').split(/\s+/).filter(Boolean).length
    });
    const back = doc.querySelector('.veil-back');
    if (back) { back.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await wait(55); }
  }

  const good = rows.filter(r => r.words >= 700 && r.paragraphs >= 8);
  const bad = rows.filter(r => !(r.words >= 700 && r.paragraphs >= 8));
  const out = {
    routed: rows.length,
    passed: good.length,
    failed: bad.length,
    minWords: Math.min(...rows.map(r => r.words || 0)),
    maxWords: Math.max(...rows.map(r => r.words || 0)),
    totalWords: rows.reduce((a, r) => a + (r.words || 0), 0),
    duplicateDates: rows.length - new Set(rows.map(r => r.date)).size,
    bad: bad.slice(0, 6),
    jsErrors: errors.slice(0, 5),
    rows
  };
  fs.writeFileSync('C:/Users/justi/AppData/Local/hermes/cache/scratch/playthrough-report.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ ...out, rows: undefined }, null, 1));
  dom.window.close();
})().catch(e => console.log('FAIL', e.message));
