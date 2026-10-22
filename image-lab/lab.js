/* Creative Lab — self-contained ASCII and Resonance modules.
   Images are read with FileReader/object URLs and never uploaded. */
(function () {
  'use strict';

  function $(id, root) { return (root || document).getElementById(id); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }
  function setStatus(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.className = 'lab-status' + (kind ? ' ' + kind : '');
  }
  function initTabs() {
    var tabs = document.querySelectorAll('[data-lab-tab]');
    if (!tabs.length) return;
    function pick(name) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-lab-tab') === name;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      document.querySelectorAll('[data-lab-panel]').forEach(function (p) {
        p.hidden = p.getAttribute('data-lab-panel') !== name;
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { pick(t.getAttribute('data-lab-tab')); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(t.getAttribute('data-lab-tab')); }
      });
    });
    pick('ascii');
  }

  /* ------------------------------------------------------------------ ASCII */
  function initAscii() {
    var drop = $('asciiDrop'), file = $('asciiFile'), customWrap = $('asciiCustomWrap');
    if (!drop || !file) return;
    var img = $('asciiSourceImg'), work = $('asciiWork'), thumbSrc = $('asciiThumbSrc');
    var out = $('asciiOut'), stage = $('asciiStage'), empty = $('asciiEmpty');
    var meta = $('asciiMeta'), status = $('asciiStatus');
    var charset = $('asciiCharset'), custom = $('asciiCustom');
    var cols = $('asciiCols'), bri = $('asciiBrightness'), con = $('asciiContrast');
    var fontSize = $('asciiFont'), colorMode = $('asciiColor');
    var invert = $('asciiInvert'), edges = $('asciiEdges'), dither = $('asciiDither'), mirror = $('asciiMirror');
    var btnCopy = $('asciiCopy'), btnTxt = $('asciiTxt'), btnPng = $('asciiPng'), btnClear = $('asciiClear');
    var lastPlain = '', lastRows = null, timer = null;
    var CHARSETS = {
      standard: '@%#*+=-:. ', simple: '@#*+=-:. ', blocks: '█▓▒░ ',
      binary: '10 ', dots: '●•· ', lygo: '█ΞΔΦλ9#*+=-· ', matrix: 'アカサタナハマヤラワ012345789.: '
    };
    function ramp() {
      if (charset.value === 'custom') return custom.value || '@%#*+=-:. ';
      return CHARSETS[charset.value] || CHARSETS.simple;
    }
    function labels() {
      var c = $('asciiColsVal'); if (c) c.textContent = cols.value;
      var b = $('asciiBriVal'); if (b) b.textContent = bri.value;
      var k = $('asciiConVal'); if (k) k.textContent = (Number(con.value) / 100).toFixed(2);
      var f = $('asciiFontVal'); if (f) f.textContent = fontSize.value + 'px';
      if (out) out.style.fontSize = fontSize.value + 'px';
      if (custom) custom.hidden = charset.value !== 'custom';
      if (customWrap) customWrap.hidden = charset.value !== 'custom';
    }
    function load(fileObj) {
      if (!fileObj || !/^image\//.test(fileObj.type || '')) {
        setStatus(status, 'Need an image file (JPG, PNG, WebP, GIF, BMP).', 'err'); return;
      }
      var url = URL.createObjectURL(fileObj);
      img.onload = function () {
        URL.revokeObjectURL(url);
        drawThumb(img);
        setStatus(status, 'Image loaded — rendering in your browser.', 'ok');
        render();
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        setStatus(status, 'That image could not be decoded.', 'err');
      };
      img.src = url;
    }
    function drawThumb(source) {
      if (!thumbSrc) return;
      var ctx = thumbSrc.getContext('2d');
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, thumbSrc.width, thumbSrc.height);
      var sw = source.naturalWidth || source.width, sh = source.naturalHeight || source.height;
      if (!sw || !sh) return;
      var s = Math.min(thumbSrc.width / sw, thumbSrc.height / sh);
      ctx.drawImage(source, (thumbSrc.width - sw * s) / 2, (thumbSrc.height - sh * s) / 2, sw * s, sh * s);
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(render, 90); }
    function render() {
      if (!img.naturalWidth) return;
      var w = Math.max(20, Number(cols.value) || 100);
      var h = Math.max(8, Math.round((img.naturalHeight / img.naturalWidth) * w * 0.55));
      var chars = ramp(), n = chars.length;
      var contrast = (Number(con.value) || 100) / 100, bright = Number(bri.value) || 0;
      work.width = w; work.height = h;
      var ctx = work.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      if (mirror.checked) { ctx.translate(w, 0); ctx.scale(-1, 1); }
      ctx.drawImage(img, 0, 0, w, h);
      if (mirror.checked) ctx.setTransform(1, 0, 0, 1, 0, 0);
      var data = ctx.getImageData(0, 0, w, h), px = data.data;
      for (var i = 0; i < px.length; i += 4) {
        px[i] = clamp((px[i] - 128) * contrast + 128 + bright, 0, 255);
        px[i + 1] = clamp((px[i + 1] - 128) * contrast + 128 + bright, 0, 255);
        px[i + 2] = clamp((px[i + 2] - 128) * contrast + 128 + bright, 0, 255);
      }
      if (edges.checked) {
        var gray = new Float32Array(w * h), x, y;
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
          var q = (y * w + x) * 4;
          gray[y * w + x] = 0.299 * px[q] + 0.587 * px[q + 1] + 0.114 * px[q + 2];
        }
        for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) {
          var gx = -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)] +
            -2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)] +
            -gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)];
          var gy = -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)] +
            gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)];
          var mag = Math.min(255, Math.hypot(gx, gy)), k = (y * w + x) * 4;
          px[k] = clamp(px[k] * 0.55 + mag * 0.45, 0, 255);
          px[k + 1] = clamp(px[k + 1] * 0.55 + mag * 0.45, 0, 255);
          px[k + 2] = clamp(px[k + 2] * 0.55 + mag * 0.45, 0, 255);
        }
      }
      var lum = new Float32Array(w * h);
      for (var j = 0; j < w * h; j++) {
        var p = j * 4;
        lum[j] = invert.checked ? 255 - (0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2]) :
          0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2];
      }
      if (dither.checked) {
        for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
          var idx = yy * w + xx, old = lum[idx], qv = Math.round((old / 255) * (n - 1));
          var nv = (qv / (n - 1)) * 255, err = old - nv;
          lum[idx] = nv;
          if (xx + 1 < w) lum[idx + 1] += err * 7 / 16;
          if (yy + 1 < h && xx > 0) lum[(yy + 1) * w + xx - 1] += err * 3 / 16;
          if (yy + 1 < h) lum[(yy + 1) * w + xx] += err * 5 / 16;
          if (yy + 1 < h && xx + 1 < w) lum[(yy + 1) * w + xx + 1] += err / 16;
        }
      }
      var lines = [], colors = [], rows = [];
      var mode = colorMode.value;
      for (y = 0; y < h; y++) {
        var line = '', crow = [], rrow = [];
        for (x = 0; x < w; x++) {
          var pos = y * w + x, L = clamp(lum[pos], 0, 255), t = L / 255;
          var ci = clamp(Math.floor(t * (n - 1) + 1e-6), 0, n - 1);
          line += chars[n - 1 - ci];
          var pi = pos * 4, r = px[pi], g = px[pi + 1], b = px[pi + 2];
          if (mode === 'mono') { crow.push('#cfe8ff'); }
          else if (mode === 'phosphor') { crow.push('rgb(' + Math.round(r * 0.2) + ',' + Math.round(g * 1.15) + ',' + Math.round(b * 0.4) + ')'); }
          else if (mode === 'lygo') {
            var hue = (230 + (1 - t) * 95) % 360;
            crow.push('hsl(' + hue.toFixed(0) + ',95%,' + (48 + t * 30).toFixed(0) + '%)');
          } else { crow.push('rgb(' + r + ',' + g + ',' + b + ')'); }
        }
        lines.push(line); colors.push(crow); rows.push(line);
      }
      lastPlain = rows.join('\n'); lastRows = { lines: lines, colors: colors, cols: w, rows: h };
      out.style.fontSize = fontSize.value + 'px';
      out.hidden = false; stage.classList.remove('is-empty'); if (empty) empty.hidden = true;
      if (mode === 'mono') { out.textContent = lastPlain; }
      else {
        out.textContent = '';
        var frag = document.createDocumentFragment();
        lines.forEach(function (line, y) {
          var row = document.createElement('span');
          for (var x = 0; x < line.length; x++) {
            var s = document.createElement('span'); s.style.color = colors[y][x]; s.textContent = line[x]; row.appendChild(s);
          }
          row.appendChild(document.createTextNode('\n')); frag.appendChild(row);
        });
        out.appendChild(frag);
      }
      if (meta) meta.textContent = (img.naturalWidth || 0) + '×' + (img.naturalHeight || 0) + ' → ' + w + '×' + h + ' chars · ' + chars.length + '-glyph ramp · local';
      setStatus(status, 'Rendered locally — ' + w + ' columns × ' + h + ' rows.', 'ok');
    }
    function copy() {
      if (!lastPlain) return setStatus(status, 'Render an image first.', 'err');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lastPlain).then(function () { setStatus(status, 'Copied ASCII text.', 'ok'); },
          function () { setStatus(status, 'Clipboard was blocked; use Download .txt.', 'err'); });
      } else setStatus(status, 'Clipboard unavailable; use Download .txt.', 'err');
    }
    function txt() {
      if (!lastPlain) return setStatus(status, 'Render an image first.', 'err');
      downloadBlob(new Blob([lastPlain], { type: 'text/plain;charset=utf-8' }), 'lygo-ascii-art.txt');
      setStatus(status, 'Downloaded .txt.', 'ok');
    }
    function png() {
      if (!lastRows) return setStatus(status, 'Render an image first.', 'err');
      var fs = Number(fontSize.value) || 8, lh = fs * 1.05, pad = 12;
      var width = Math.max(1, Math.ceil(lastRows.cols * fs * 0.62 + pad * 2));
      var height = Math.max(1, Math.ceil(lastRows.rows * lh + pad * 2));
      var c = document.createElement('canvas'); c.width = width; c.height = height;
      var cx = c.getContext('2d'); cx.fillStyle = '#02040a'; cx.fillRect(0, 0, width, height);
      cx.font = fs + 'px "Courier New", monospace'; cx.textBaseline = 'top';
      for (var y = 0; y < lastRows.lines.length; y++) {
        cx.fillStyle = colorMode.value === 'mono' ? '#cfe8ff' : '#e6f3ff';
        cx.fillText(lastRows.lines[y], pad, pad + y * lh);
      }
      c.toBlob(function (b) { downloadBlob(b, 'lygo-ascii-art.png'); setStatus(status, 'Downloaded .png.', 'ok'); }, 'image/png');
    }
    function clear() {
      lastPlain = ''; lastRows = null; out.textContent = ''; out.hidden = true;
      stage.classList.add('is-empty'); if (empty) empty.hidden = false;
      img.removeAttribute('src'); if (meta) meta.textContent = 'No image loaded';
      setStatus(status, 'Cleared.', '');
    }
    file.addEventListener('change', function () { load(file.files[0]); file.value = ''; });
    drop.addEventListener('click', function () { file.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-drag'); }); });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) load(f); });
    document.addEventListener('paste', function (e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) if (items[i].type.indexOf('image/') === 0) {
        var f = items[i].getAsFile(); if (f) { load(f); e.preventDefault(); break; }
      }
    });
    [charset, custom, cols, bri, con, fontSize, colorMode, invert, edges, dither, mirror].forEach(function (el) {
      el.addEventListener('input', function () { labels(); schedule(); });
      el.addEventListener('change', function () { labels(); schedule(); });
    });
    btnCopy.addEventListener('click', copy); btnTxt.addEventListener('click', txt); btnPng.addEventListener('click', png); btnClear.addEventListener('click', clear);
    labels();
  }

  /* -------------------------------------------------------------- Resonance */
  function initResonance() {
    var drop = $('resDrop'), file = $('resFile'), img = $('resSourceImg'), preview = $('resPreview');
    if (!drop || !file) return;
    var analyzeBtn = $('resAnalyze'), playBtn = $('resPlay'), stopBtn = $('resStop'), wavBtn = $('resWav'), jsonBtn = $('resJson');
    var status = $('resStatus'), empty = $('resEmpty'), emptyPanel = $('resEmptyPanel'), content = $('resContent');
    var metrics = $('resMetrics'), dna = $('resDna'), prompts = $('resPrompts');
    var current = null, audioCtx = null, active = [], timer = null;
    var KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
    var NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

    function load(f) {
      if (!f || !/^image\//.test(f.type || '')) return setStatus(status, 'Need an image file.', 'err');
      var url = URL.createObjectURL(f);
      img.onload = function () {
        URL.revokeObjectURL(url); drawPreview(); empty.hidden = true; if (emptyPanel) emptyPanel.hidden = true; content.hidden = false;
        analyze();
      };
      img.onerror = function () { URL.revokeObjectURL(url); setStatus(status, 'Image could not be decoded.', 'err'); };
      img.src = url;
    }
    function drawPreview() {
      if (!preview) return;
      var pw = preview.width || 640, ph = preview.height || 360;
      preview.width = pw; preview.height = ph;
      var c = preview.getContext('2d'); c.fillStyle = '#02040a'; c.fillRect(0, 0, pw, ph);
      var iw = img.naturalWidth, ih = img.naturalHeight, s = Math.min(pw / iw, ph / ih);
      c.drawImage(img, (pw - iw * s) / 2, (ph - ih * s) / 2, iw * s, ih * s);
    }
    function analyze() {
      if (!img.naturalWidth) return setStatus(status, 'Load an image first.', 'err');
      var max = 360, scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      var sw = Math.max(2, Math.round(img.naturalWidth * scale)), sh = Math.max(2, Math.round(img.naturalHeight * scale));
      var c = document.createElement('canvas'); c.width = sw; c.height = sh;
      var cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0, sw, sh);
      var data = cx.getImageData(0, 0, sw, sh).data, n = sw * sh;
      var gray = new Float32Array(n), hueSum = 0, satSum = 0, briSum = 0, colSum = 0, rgSum = 0, ybSum = 0;
      for (var i = 0; i < n; i++) {
        var p = i * 4, r = data[p] / 255, g = data[p + 1] / 255, b = data[p + 2] / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        var h = 0;
        if (d > 1e-6) {
          if (mx === r) h = ((g - b) / d) % 6;
          else if (mx === g) h = (b - r) / d + 2;
          else h = (r - g) / d + 4;
          h *= 60; if (h < 0) h += 360;
        }
        var s = mx === 0 ? 0 : d / mx;
        hueSum += h; satSum += s; briSum += mx;
        gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
        rgSum += r - g; ybSum += 0.5 * (r + g) - b;
      }
      var meanRg = rgSum / n, meanYb = ybSum / n, varRg = 0, varYb = 0;
      for (i = 0; i < n; i++) { var q = i * 4; var rg = data[q] / 255 - data[q + 1] / 255 - meanRg; var yb = 0.5 * (data[q] / 255 + data[q + 1] / 255) - data[q + 2] / 255 - meanYb; varRg += rg * rg; varYb += yb * yb; }
      var colorfulness = Math.sqrt(varRg / n + varYb / n) + 0.3 * Math.sqrt(meanRg * meanRg + meanYb * meanYb);
      var meanGray = 0; for (i = 0; i < n; i++) meanGray += gray[i]; meanGray /= n;
      var variance = 0; for (i = 0; i < n; i++) { var dv = gray[i] - meanGray; variance += dv * dv; }
      var contrast = Math.sqrt(variance / n);
      var edge = new Uint8Array(n), edgeCount = 0;
      for (var y = 1; y < sh - 1; y++) for (var x = 1; x < sw - 1; x++) {
        var k = y * sw + x;
        var gx = -gray[k - sw - 1] + gray[k - sw + 1] - 2 * gray[k - 1] + 2 * gray[k + 1] - gray[k + sw - 1] + gray[k + sw + 1];
        var gy = -gray[k - sw - 1] - 2 * gray[k - sw] - gray[k - sw + 1] + gray[k + sw - 1] + 2 * gray[k + sw] + gray[k + sw + 1];
        if (Math.hypot(gx, gy) > 0.28) { edge[k] = 1; edgeCount++; }
      }
      var seen = new Uint8Array(n), components = 0;
      for (i = 0; i < n; i++) if (edge[i] && !seen[i]) {
        components++; var stack = [i]; seen[i] = 1;
        while (stack.length) {
          var v = stack.pop(), vx = v % sw, vy = (v / sw) | 0;
          for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) {
            var nx = vx + ox, ny = vy + oy;
            if (nx >= 0 && ny >= 0 && nx < sw && ny < sh) {
              var ni = ny * sw + nx;
              if (edge[ni] && !seen[ni]) { seen[ni] = 1; stack.push(ni); }
            }
          }
        }
      }
      var corners = 0;
      for (y = 1; y < sh - 1; y++) for (x = 1; x < sw - 1; x++) {
        var kk = y * sw + x;
        var ix = gray[kk + 1] - gray[kk - 1], iy = gray[kk + sw] - gray[kk - sw];
        if (Math.abs(ix) > 0.12 && Math.abs(iy) > 0.12) corners++;
      }
      var areaRatio = (img.naturalWidth * img.naturalHeight) / (sw * sh);
      var chaos = Math.round(corners * Math.min(2.2, Math.sqrt(areaRatio) / 4));
      var avgHue = hueSum / n, sat = satSum / n, brightness = briSum / n;
      var edgeDensity = edgeCount / n;
      var structureIndex = Math.min(components / 80, 1);
      var features = {
        source_image: (file.files && file.files[0] && file.files[0].name) || 'pasted image',
        color: { average_rgb: null, average_hue: Math.round(avgHue * 100) / 100, average_saturation: Math.round(sat * 1000) / 1000, average_brightness: Math.round(brightness * 1000) / 1000, colorfulness: Math.round(colorfulness * 1000) / 1000 },
        structure: { edge_density: Math.round(edgeDensity * 10000) / 10000, contrast: Math.round(contrast * 1000) / 1000, structure_index: Math.round(structureIndex * 10000) / 10000, chaos_keypoints: chaos }
      };
      var keyIdx = Math.floor(avgHue / 30) % 12;
      var rootKey = KEYS[keyIdx] + (brightness < 0.48 ? ' Minor' : ' Major');
      var bpm = Math.round(clamp(82 + edgeDensity * 920 + Math.min(chaos / 1800, 0.6) * 25 + (brightness - 0.5) * 12, 78, 178));
      var genre, texture, energy;
      if (chaos > 650 && brightness < 0.38) { genre = 'Industrial Dubstep / Dark Phonk'; texture = 'Heavy distortion, aggressive stutters, deep sub-bass, metallic textures'; energy = 'High-aggression'; }
      else if (edgeDensity > 0.065 && contrast > 0.18) { genre = 'Emo Rap / Modern Trap'; texture = 'Crisp hi-hats, melancholic melodies, heavy 808s, emotional vocal layers'; energy = 'Mid-High emotional'; }
      else if (chaos > 420 && brightness > 0.55) { genre = 'Experimental / Glitch Hop'; texture = 'Glitchy percussion, chopped vocals, atmospheric synths, rhythmic complexity'; energy = 'High chaotic'; }
      else if (edgeDensity < 0.035 && brightness > 0.6) { genre = 'West Coast G-Funk / Smooth Instrumental'; texture = 'Laid-back grooves, warm analog bass, melodic leads, nostalgic atmosphere'; energy = 'Mid relaxed'; }
      else { genre = 'Dark Alternative / Cinematic Rap'; texture = 'Atmospheric pads, punchy drums, moody synths, introspective energy'; energy = 'Mid cinematic'; }
      var core, lyric, vocal;
      if (brightness < 0.42 && edgeDensity > 0.055) {
        core = 'Survival, betrayal, lone wolf resilience, moving in silence';
        lyric = 'Write raw, introspective lyrics about being the last one standing after betrayal. Focus on trust issues, a very small circle of ride-or-die people, and the cold satisfaction of outlasting everyone who counted you out.';
        vocal = 'Raspy melodic rap or gritty sung-rap hybrid';
      } else if (chaos > 550) {
        core = 'Breaking chains, system resistance, unchained personal power';
        lyric = 'Write aggressive yet intelligent lyrics about breaking free from systems that tried to define you. Emphasize resilience, moving in silence, and turning pain into unstoppable momentum.';
        vocal = 'Assertive rap with melodic moments or distorted vocal processing';
      } else {
        core = 'Observation, loyalty, navigating a cold modern world with quiet edge';
        lyric = 'Write clever, slightly dark observational lyrics with dry humor about modern life, loyalty, and staying true to your own code while everything around you feels artificial.';
        vocal = 'Deadpan to melodic rap delivery, slightly introspective';
      }
      var musicPrompt = 'Create a ' + genre + ' track at ' + bpm + ' BPM in the key of ' + rootKey + '. The overall energy should feel ' + energy.toLowerCase() + '. Sound design and texture: ' + texture + '. Lyrical themes should center around ' + core + '.';
      current = {
        name: features.source_image,
        features: features,
        profile: {
          LYGO_PROFILE: {
            version: 'browser-1.0', generated_at: new Date().toISOString(), source: features.source_image,
            mathematics: features,
            musical_dna: { root_key: rootKey, bpm: bpm, energy_level: energy, suggested_genre: genre, texture_description: texture, vocal_style: vocal },
            lyrical_framework: { core_theme: core, ai_lyric_prompt: lyric },
            ai_music_prompt: musicPrompt,
            production_notes: 'High contrast and structural complexity suggest strong dynamic range. Consider heavy low-end support and atmospheric layers to match the visual weight.'
          }
        }
      };
      metrics.innerHTML = '';
      [['Hue', Math.round(avgHue) + '°'], ['Brightness', (brightness * 100).toFixed(0) + '%'], ['Saturation', (sat * 100).toFixed(0) + '%'], ['Edge density', (edgeDensity * 100).toFixed(1) + '%'], ['Contrast', contrast.toFixed(2)], ['Chaos', String(chaos)]].forEach(function (pair) {
        var d = document.createElement('div'); d.className = 'res-metric';
        d.innerHTML = '<b>' + pair[1] + '</b><span>' + pair[0] + '</span>'; metrics.appendChild(d);
      });
      dna.innerHTML = '';
      [['Root key', rootKey], ['BPM', String(bpm)], ['Genre', genre], ['Energy', energy], ['Vocal', vocal], ['Texture', texture]].forEach(function (pair) {
        var d = document.createElement('div'); d.className = 'res-cell' + (pair[0] === 'Texture' || pair[0] === 'Vocal' ? ' wide' : '');
        d.innerHTML = '<span>' + pair[0] + '</span><strong></strong>'; d.querySelector('strong').textContent = pair[1]; dna.appendChild(d);
      });
      prompts.innerHTML = '';
      [['AI music prompt', musicPrompt], ['Lyric prompt', lyric], ['Core theme', core]].forEach(function (pair) {
        var d = document.createElement('div'); d.className = 'res-prompt';
        var h = document.createElement('header'); h.innerHTML = '<span>' + pair[0] + '</span>';
        var b = document.createElement('button'); b.type = 'button'; b.className = 'res-copy'; b.textContent = 'Copy'; b.setAttribute('data-copy', pair[1]);
        h.appendChild(b); var p = document.createElement('p'); p.textContent = pair[1]; d.appendChild(h); d.appendChild(p); prompts.appendChild(d);
      });
      prompts.querySelectorAll('[data-copy]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () { setStatus(status, 'Copied to clipboard.', 'ok'); });
        });
      });
      if (emptyPanel) emptyPanel.hidden = true;
      if (playBtn) playBtn.disabled = false; if (wavBtn) wavBtn.disabled = false; if (jsonBtn) jsonBtn.disabled = false;
      setStatus(status, 'Profile ready — browser analysis, not the Python engine.', 'ok');
    }
    function rootFrequency(key) {
      var note = key.split(' ')[0], midi = NOTE[note]; if (midi == null) midi = 0;
      return 440 * Math.pow(2, (midi - 9) / 12);
    }
    function buildGraph(ctx, profile, duration) {
      var dna = profile.LYGO_PROFILE.musical_dna, m = profile.LYGO_PROFILE.mathematics;
      var root = rootFrequency(dna.root_key), bpm = dna.bpm, edge = m.structure.edge_density, chaos = m.structure.chaos_keypoints, bright = m.color.average_brightness;
      var when = (ctx.currentTime || 0) + 0.04;
      var master = ctx.createGain(); master.gain.setValueAtTime(0.55, when); master.connect(ctx.destination);
      var comp = ctx.createDynamicsCompressor(); comp.threshold.setValueAtTime(-18, when); comp.ratio.setValueAtTime(4, when); master.disconnect(); master.connect(comp); comp.connect(ctx.destination);
      var noiseBuf = ctx.createBuffer(1, Math.min(ctx.sampleRate * 2, ctx.sampleRate * 2), ctx.sampleRate);
      var nd = noiseBuf.getChannelData(0);
      for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      var noise = ctx.createBufferSource(); noise.buffer = noiseBuf; noise.loop = true;
      var nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.setValueAtTime(500 + edge * 4000, when);
      var ng = ctx.createGain(); ng.gain.setValueAtTime(0.015 + edge * 0.18, when); ng.gain.linearRampToValueAtTime(0.0001, when + duration);
      noise.connect(nf); nf.connect(ng); ng.connect(master); noise.start(when); noise.stop(when + duration);
      [1, 1.5, 2].forEach(function (mult, n) {
        var osc = ctx.createOscillator(); osc.type = n === 0 ? 'sawtooth' : 'sine'; osc.frequency.setValueAtTime(root * mult, when);
        var g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime((0.012 + m.structure.structure_index * 0.028) / (n + 1), when + 0.8); g.gain.linearRampToValueAtTime(0.0001, when + duration);
        var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(500 + bright * 1800, when);
        osc.connect(f); f.connect(g); g.connect(master); osc.start(when); osc.stop(when + duration);
      });
      var scale = dna.root_key.indexOf('Minor') >= 0 ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
      var noteCount = 14, step = duration / noteCount;
      for (var j = 0; j < noteCount; j++) {
        var t = when + j * step, osc2 = ctx.createOscillator(); osc2.type = 'sine';
        var deg = scale[(j * 3 + Math.floor(chaos / 220)) % scale.length] + (j % 4 === 0 ? 12 : 0);
        osc2.frequency.setValueAtTime(root * Math.pow(2, deg / 12), t);
        var g2 = ctx.createGain(); g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(0.035 + bright * 0.025, t + 0.02); g2.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.9, step * 1.6));
        osc2.connect(g2); g2.connect(master); osc2.start(t); osc2.stop(t + Math.min(1.2, step * 2));
      }
      var glitches = Math.max(3, Math.min(14, Math.round(chaos / 120)));
      for (var k = 0; k < glitches; k++) {
        var gt = when + (k + 1) * (duration / (glitches + 1)) + Math.random() * 0.12;
        var gs = ctx.createBufferSource(); gs.buffer = noiseBuf;
        var gf = ctx.createBiquadFilter(); gf.type = 'bandpass'; gf.frequency.setValueAtTime(900 + Math.random() * 2400, gt); gf.Q.setValueAtTime(8, gt);
        var gg = ctx.createGain(); gg.gain.setValueAtTime(0.08 + edge * 0.25, gt); gg.gain.exponentialRampToValueAtTime(0.0001, gt + 0.09);
        gs.connect(gf); gf.connect(gg); gg.connect(master); gs.start(gt); gs.stop(gt + 0.1);
      }
      return duration;
    }
    function stopAudio() {
      clearTimeout(timer);
      active.forEach(function (n) { try { n.stop(); } catch (e) {} });
      active = [];
      if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; }
      if (playBtn) playBtn.disabled = false; if (stopBtn) stopBtn.disabled = true;
      setStatus(status, 'Preview stopped.', '');
    }
    function play() {
      if (!current) return setStatus(status, 'Analyze an image first.', 'err');
      if (!window.AudioContext && !window.webkitAudioContext) return setStatus(status, 'Web Audio is not available in this browser.', 'err');
      stopAudio();
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      buildGraph(audioCtx, current.profile, 12);
      if (playBtn) playBtn.disabled = true; if (stopBtn) stopBtn.disabled = false;
      setStatus(status, 'Playing a 12-second browser soundscape preview.', 'ok');
      timer = setTimeout(function () { stopAudio(); }, 12500);
    }
    function wav() {
      if (!current) return setStatus(status, 'Analyze an image first.', 'err');
      var Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!Offline) return setStatus(status, 'Offline audio rendering is not available in this browser.', 'err');
      var sr = 44100, dur = 12, oc = new Offline(2, sr * dur, sr);
      buildGraph(oc, current.profile, dur);
      setStatus(status, 'Rendering a 12-second WAV locally…', '');
      if (wavBtn) wavBtn.disabled = true;
      oc.startRendering().then(function (buf) {
        var blob = audioBufferToWav(buf);
        downloadBlob(blob, 'lygo-resonance-preview.wav');
        setStatus(status, 'Downloaded WAV. Full Python engine is linked below.', 'ok');
        if (wavBtn) wavBtn.disabled = false;
      }).catch(function () { setStatus(status, 'WAV render failed in this browser.', 'err'); if (wavBtn) wavBtn.disabled = false; });
    }
    function audioBufferToWav(buffer) {
      var channels = buffer.numberOfChannels, length = buffer.length, sr = buffer.sampleRate;
      var bytes = 44 + length * channels * 2, ab = new ArrayBuffer(bytes), view = new DataView(ab);
      function str(off, s) { for (var i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); }
      str(0, 'RIFF'); view.setUint32(4, bytes - 8, true); str(8, 'WAVE'); str(12, 'fmt ');
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true); view.setUint32(24, sr, true); view.setUint32(28, sr * channels * 2, true); view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, bytes - 44, true);
      var off = 44, data = [];
      for (var c = 0; c < channels; c++) data.push(buffer.getChannelData(c));
      for (var i = 0; i < length; i++) for (c = 0; c < channels; c++) { var s = clamp(data[c][i], -1, 1); view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2; }
      return new Blob([ab], { type: 'audio/wav' });
    }
    function json() {
      if (!current) return setStatus(status, 'Analyze an image first.', 'err');
      downloadBlob(new Blob([JSON.stringify(current.profile, null, 2)], { type: 'application/json' }), 'lygo-resonance-profile.json');
      setStatus(status, 'Downloaded profile JSON.', 'ok');
    }
    file.addEventListener('change', function () { load(file.files[0]); file.value = ''; });
    drop.addEventListener('click', function () { file.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-drag'); }); });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) load(f); });
    if (wavBtn) wavBtn.disabled = true; if (jsonBtn) jsonBtn.disabled = true;
    analyzeBtn.addEventListener('click', analyze);
    playBtn.addEventListener('click', play); stopBtn.addEventListener('click', stopAudio); wavBtn.addEventListener('click', wav); jsonBtn.addEventListener('click', json);
    setStatus(status, 'Load an image to analyze locally.');
  }

  function start() {
    initTabs(); initAscii(); initResonance();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
