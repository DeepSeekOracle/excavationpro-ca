
(function () {
  const listEl = document.getElementById("list");
  const sheet = document.getElementById("sheet");
  const q = document.getElementById("q");
  const count = document.getElementById("count");
  const letters = document.getElementById("letters");
  const mappedHint = document.getElementById("mapped-hint");
  const audio = document.getElementById("audio");
  const nowTitle = document.getElementById("now-title");
  const nowState = document.getElementById("now-state");
  const btnPlay = document.getElementById("btn-play");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const icoPlay = document.getElementById("ico-play");
  const icoPause = document.getElementById("ico-pause");
  const seek = document.getElementById("seek");
  const vol = document.getElementById("vol");
  const full = document.getElementById("full-player");
  const LISTEN = "https://excavationpro.ca/music.html";

  const SVG_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  const SVG_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';
  const SVG_BARS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h2v8H5zM10 6h2v14h-2zM15 9h2v9h-2zM20 12h2v4h-2z" fill="currentColor"/></svg>';

  let songs = [];
  let mapBySlug = {};
  let mapped = [];
  let current = null;
  let playIdx = -1;
  let letterOn = "";
  let seeking = false;
  let lastShown = "";

  function vis() {
    const needle = (q.value || "").toLowerCase();
    return songs.filter(function (s) {
      if (letterOn) {
        const ch = (s.title[0] || "").toUpperCase();
        const bucket = /[A-Z]/.test(ch) ? ch : "#";
        if (bucket !== letterOn) return false;
      }
      return !needle || s.title.toLowerCase().indexOf(needle) >= 0;
    });
  }

  function streamFor(song) {
    if (!song) return null;
    const rec = mapBySlug[song.slug];
    return rec && rec.stream_url ? rec : null;
  }

  // State plainly what the listener is about to hear. Never dress a stand-in up as the mix.
  function matchLabel(rec) {
    if (!rec) return { short: "Lyrics only", long: "No audio mapped for this title yet." };
    switch (rec.match) {
      case "instrumental":
        return { short: "Instrumental of this title",
                 long: "The catalog holds the instrumental of this title. No vocal mix is public." };
      case "instrumental-fit":
        return { short: "Instrumental bed",
                 long: "The catalog holds no stream for this title, so the dock plays an instrumental chosen to fit these lyrics. It is a stand-in, not the mix." };
      case "near-title":
        return { short: "Catalog stream (nearest title)",
                 long: "Played from the catalog file whose title is nearest to this one." };
      default:
        return { short: "Catalog stream", long: "This title has its own file in the catalog." };
    }
  }

  function isThisPlaying(rec) {
    return !!(rec && audio.src && rec.stream_url === audio.currentSrc && !audio.paused);
  }

  function show(song) {
    current = song || null;
    if (!song) {
      sheet.innerHTML = "<p class='empty'>Choose a lyric.</p>";
      return;
    }
    document.querySelectorAll("#list a").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("href") === "#" + song.slug);
    });
    const h = document.createElement("h2");
    h.textContent = song.title;
    const meta = document.createElement("p");
    meta.className = "sheet-meta";
    const bits = [song.artist || "Excavationpro"];
    if (song.album) bits.push(song.album);
    meta.textContent = bits.join(" · ");

    const rec = streamFor(song);
    const lab = matchLabel(rec);

    const actions = document.createElement("div");
    actions.className = "sheet-actions";
    if (rec) {
      const playing = isThisPlaying(rec);
      const pb = document.createElement("button");
      pb.type = "button";
      pb.className = "sheet-play" + (playing ? " active" : "");
      pb.dataset.slug = song.slug;
      pb.innerHTML = (playing ? SVG_PAUSE : SVG_PLAY) + "<span>" + (playing ? "Pause" : "Play") + "</span>";
      pb.setAttribute("aria-label", (playing ? "Pause " : "Play ") + song.title);
      pb.addEventListener("click", function () { toggle(rec); });
      actions.appendChild(pb);
    }
    const note = document.createElement("p");
    note.className = "sheet-note";
    const shown = rec && (rec.display || rec.stream_title);
    note.textContent = lab.long + (shown ? " · " + shown : "");
    actions.appendChild(note);
    const fl = document.createElement("a");
    fl.className = "sheet-full";
    fl.href = LISTEN + "?q=" + encodeURIComponent(song.title);
    fl.textContent = "Open in full player ›";
    actions.appendChild(fl);
    const memeBtn = document.createElement("button");
    memeBtn.type = "button";
    memeBtn.textContent = "Meme this lyric";
    memeBtn.addEventListener("click", function () {
      applyPick(pickFromSong(song));
      const card = document.getElementById("vault-card");
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    actions.appendChild(memeBtn);
    const copyL = document.createElement("button");
    copyL.type = "button";
    copyL.textContent = "Copy lyric";
    copyL.addEventListener("click", function () {
      const text = (song.artist || "Excavationpro") + "\n" + song.title +
        (song.album ? "\n" + song.album : "") + "\n\n" + song.lyrics;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          copyL.textContent = "Copied";
          setTimeout(function () { copyL.textContent = "Copy lyric"; }, 1200);
        });
      }
    });
    actions.appendChild(copyL);

    const pre = document.createElement("pre");
    pre.className = "lyrics";
    pre.textContent = song.lyrics;

    sheet.innerHTML = "";
    sheet.appendChild(h);
    sheet.appendChild(meta);
    sheet.appendChild(actions);
    sheet.appendChild(pre);

    if (rec) {
      nowTitle.textContent = rec.display || rec.stream_title || rec.title;
      nowState.textContent = lab.short;
    } else {
      nowState.textContent = "Lyrics only · open full player for the catalog";
    }
    document.title = song.title + " — Lyrics Vault";
    if (song.slug !== lastShown) {
      lastShown = song.slug;
      maybeGate();
    }
  }

  function paintLetters(list) {
    const have = {};
    list.forEach(function (s) {
      const ch = (s.title[0] || "").toUpperCase();
      have[/[A-Z]/.test(ch) ? ch : "#"] = true;
    });
    letters.innerHTML = "";
    ["#"].concat("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")).forEach(function (L) {
      if (!have[L] && L !== letterOn) return;
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = L;
      b.className = letterOn === L ? "on" : "";
      b.addEventListener("click", function () {
        letterOn = letterOn === L ? "" : L;
        paint();
      });
      letters.appendChild(b);
    });
  }

  function paint() {
    const list = vis();
    listEl.innerHTML = "";
    count.textContent = list.length + " lyrics";
    paintLetters(songs);
    if (!list.length) {
      sheet.innerHTML = "<p class='empty'>No lyrics match that search.</p>";
      return;
    }
    list.forEach(function (s) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + s.slug;
      const rec = streamFor(s);
      const name = document.createElement("span");
      name.textContent = s.title;
      a.appendChild(name);
      if (rec) {
        const pb = document.createElement("button");
        pb.type = "button";
        pb.className = "row-play";
        pb.title = "Play · " + matchLabel(rec).short;
        pb.setAttribute("aria-label", "Play " + s.title);
        pb.innerHTML = isThisPlaying(rec) ? SVG_BARS : SVG_PLAY;
        pb.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          if (location.hash === "#" + s.slug) {
            toggle(rec);
          } else {
            location.hash = s.slug;
            playRecord(rec);
          }
        });
        a.appendChild(pb);
      } else {
        const dot = document.createElement("span");
        dot.className = "dot off";
        dot.title = "No audio mapped";
        a.appendChild(dot);
      }
      li.appendChild(a);
      listEl.appendChild(li);
    });
    const slug = (location.hash || "").replace(/^#/, "");
    const cur = list.filter(function (s) { return s.slug === slug; })[0] || list[0];
    show(cur);
  }

  function setPlaying(on) {
    icoPlay.classList.toggle("hide", on);
    icoPause.classList.toggle("hide", !on);
    btnPlay.setAttribute("aria-label", on ? "Pause" : "Play");
    // every play button reflects the transport, not just the dock
    document.querySelectorAll(".sheet-play").forEach(function (b) {
      const mine = current && b.dataset.slug === current.slug && isThisPlaying(streamFor(current));
      b.classList.toggle("active", !!mine);
      b.innerHTML = (mine ? SVG_PAUSE : SVG_PLAY) + "<span>" + (mine ? "Pause" : "Play") + "</span>";
    });
    document.querySelectorAll("#list a").forEach(function (a, i) {
      const s = vis()[i];
      const pb = a.querySelector(".row-play");
      if (pb && s) pb.innerHTML = isThisPlaying(streamFor(s)) ? SVG_BARS : SVG_PLAY;
    });
  }

  function playRecord(rec) {
    if (!rec || !rec.stream_url) return;
    playIdx = mapped.findIndex(function (m) { return m.slug === rec.slug; });
    audio.src = rec.stream_url;
    audio.play().catch(function () {});
    nowTitle.textContent = rec.display || rec.stream_title || rec.title;
    nowState.textContent = matchLabel(rec).short + " · LYGO mini player";
    full.href = LISTEN + "?q=" + encodeURIComponent(rec.title);
    setPlaying(true);
  }

  function toggle(rec) {
    if (!rec) return;
    if (audio.src && rec.stream_url === audio.currentSrc) {
      if (audio.paused) audio.play().catch(function () {});
      else audio.pause();
      return;
    }
    playRecord(rec);
  }

  function playOffset(dir) {
    if (!mapped.length) return;
    if (playIdx < 0) playIdx = 0;
    playIdx = (playIdx + dir + mapped.length) % mapped.length;
    playRecord(mapped[playIdx]);
    location.hash = mapped[playIdx].slug;
  }

  btnPlay.addEventListener("click", function () {
    if (!audio.src) {
      const st = streamFor(current) || mapped[0];
      playRecord(st);
      return;
    }
    if (audio.paused) audio.play().catch(function () {});
    else audio.pause();
  });
  btnPrev.addEventListener("click", function () { playOffset(-1); });
  btnNext.addEventListener("click", function () { playOffset(1); });
  audio.addEventListener("play", function () { setPlaying(true); });
  audio.addEventListener("pause", function () { setPlaying(false); });
  audio.addEventListener("ended", function () { playOffset(1); });
  audio.addEventListener("error", function () {
    nowState.textContent = "Stream missed · try full player";
    setPlaying(false);
  });
  audio.addEventListener("timeupdate", function () {
    if (seeking || !audio.duration) return;
    seek.value = String(Math.floor((audio.currentTime / audio.duration) * 1000));
  });
  seek.addEventListener("pointerdown", function () { seeking = true; });
  seek.addEventListener("pointerup", function () { seeking = false; });
  seek.addEventListener("input", function () {
    if (!audio.duration) return;
    audio.currentTime = (parseInt(seek.value, 10) / 1000) * audio.duration;
  });
  vol.addEventListener("input", function () {
    audio.volume = parseInt(vol.value, 10) / 100;
  });
  audio.volume = 0.85;

  document.addEventListener("keydown", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.code === "Space") {
      e.preventDefault();
      btnPlay.click();
    } else if (e.key === "ArrowLeft") playOffset(-1);
    else if (e.key === "ArrowRight") playOffset(1);
    else if (e.key === "/") {
      e.preventDefault();
      q.focus();
    }
  });

  Promise.all([
    fetch("songs.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("stream-map.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
  ]).then(function (pair) {
    songs = pair[0];
    const sm = pair[1] || {};
    (sm.tracks || []).forEach(function (t) {
      mapBySlug[t.slug] = t;
      if (t.stream_url) mapped.push(t);
    });
    mappedHint.textContent = mapped.length + " playable";
    const sn = document.getElementById("stat-n");
    const smEl = document.getElementById("stat-m");
    if (sn) sn.textContent = String(songs.length);
    if (smEl) smEl.textContent = String(mapped.length);
    paintHighlight();
    paint();
  });
  q.addEventListener("input", paint);
  window.addEventListener("hashchange", paint);

  const SHEET_BASE = "https://excavationpro.ca/lyrics/";
  const TAG_CORE = ["#Excavationpro", "#JustinHelmer", "#Lyrics"];
  const TAG_POOL = [
    "#NewMusic", "#LiveMusic", "#UndergroundMusic", "#Rap", "#RapMusic",
    "#RockMusic", "#HipHop", "#MusicVideo", "#NewMusicAlert", "#Radio",
    "#IndependentMusic", "#OriginalMusic", "#NowPlaying", "#UnsignedArtist",
    "#LyricsVault", "#ReactionVideos", "#NewMusicFriday"
  ];
  let memePick = null;

  function lyricLines(song) {
    return (song.lyrics || "").split("\n").map(function (l) {
      return l.trim();
    }).filter(function (l) {
      if (!l || l.charAt(0) === "[") return false;
      if (/^(EXCAVATIONPRO|KENZIE JADE|YUKI|NOVA RAYNE|DOBLE FILO)\.?$/i.test(l)) return false;
      if (l.length < 12 || l.length > 140) return false;
      if (/https?:|style:|gemini|thought for/i.test(l)) return false;
      return true;
    });
  }

  function pickFromSong(song) {
    const lines = lyricLines(song);
    if (lines.length < 2) {
      return { song: song, line1: song.title, line2: song.artist || "Excavationpro" };
    }
    const i = Math.floor(Math.random() * (lines.length - 1));
    return { song: song, line1: lines[i], line2: lines[i + 1] };
  }

  function pickHighlight(avoid) {
    const pool = songs.filter(function (s) {
      return s.slug !== avoid && lyricLines(s).length >= 2;
    });
    const song = pool[Math.floor(Math.random() * pool.length)] || songs[0];
    return pickFromSong(song);
  }

  function applyPick(pick) {
    pick.draft = pick.draft || buildDraft(pick);
    memePick = pick;
    const quoteEl = document.getElementById("vault-quote");
    const citeEl = document.getElementById("vault-cite");
    const linkEl = document.getElementById("vault-link");
    const urlEl = document.getElementById("vault-url");
    if (!quoteEl) return;
    quoteEl.innerHTML = "";
    quoteEl.appendChild(document.createTextNode(pick.line1));
    quoteEl.appendChild(document.createElement("br"));
    quoteEl.appendChild(document.createTextNode(pick.line2));
    citeEl.textContent = pick.song.title + (pick.song.album ? " · " + pick.song.album : "");
    linkEl.href = "#" + pick.song.slug;
    if (urlEl) urlEl.textContent = sheetUrl(pick.song.slug).replace(/^https:\/\//, "");
    paintTags(pick.draft.tags);
    showDraft("x");
    drawMeme(pick);
  }

  function sheetUrl(slug) {
    return SHEET_BASE + "#" + slug;
  }

  function clip(s, n) {
    s = String(s || "");
    return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
  }

  function shuffleTags() {
    const rest = TAG_POOL.slice();
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = rest[i];
      rest[i] = rest[j];
      rest[j] = t;
    }
    return TAG_CORE.concat(rest);
  }

  function fitTags(prefix, tags, max) {
    let out = "";
    for (let i = 0; i < tags.length; i++) {
      const next = out ? out + " " + tags[i] : tags[i];
      if ((prefix + next).length > max) break;
      out = next;
    }
    return out || TAG_CORE.join(" ");
  }

  function buildDraft(pick, tags) {
    tags = tags || shuffleTags();
    const quote = "“" + pick.line1 + "\n" + pick.line2 + "”";
    const by = "— " + pick.song.title + "\nJustin Helmer / Excavationpro";
    const url = sheetUrl(pick.song.slug);
    const listen = "Listen: https://excavationpro.ca/music.html\nhttps://ffm.to/eovnvo9";
    const tagStr = tags.join(" ");
    const x = "@grok make a cinematic photo meme of this lyric. No watermark.\n\n" +
      quote + "\n\n" + tagStr + "\n\n" + by + "\n" + url + "\n" + listen;
    const bskyHead = quote + "\n\n";
    const bskyTags = fitTags(bskyHead, tags, 220);
    let bsky = bskyHead + bskyTags + "\n" + by + "\n" + url;
    if (bsky.length > 300) bsky = bskyHead + bskyTags + "\n" + url;
    if (bsky.length > 300) bsky = quote + "\n" + fitTags(quote + "\n", tags, 300);
    return { x: x, bsky: bsky, tags: tags };
  }

  function captionEl() {
    return document.getElementById("meme-caption");
  }

  function showDraft(kind) {
    const ta = captionEl();
    if (!ta || !memePick || !memePick.draft) return;
    ta.value = kind === "bsky" ? memePick.draft.bsky : memePick.draft.x;
  }

  const paperImg = new Image();
  paperImg.src = "paper.jpg";
  paperImg.onload = function () { if (memePick) drawMeme(memePick); };

  function drawMeme(pick) {
    const canvas = document.getElementById("meme-canvas");
    if (!canvas || !pick) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#efe6d6";
    ctx.fillRect(0, 0, w, h);
    if (paperImg.complete && paperImg.naturalWidth) {
      ctx.globalAlpha = 0.55;
      ctx.drawImage(paperImg, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "rgba(28,25,20,0.08)";
    ctx.fillRect(0, 0, w, 140);
    ctx.fillRect(0, h - 160, w, 160);
    ctx.fillStyle = "#1c1914";
    ctx.font = "500 26px Georgia, serif";
    ctx.fillText("EXCAVATIONPRO  ·  LYRIC VAULT", 72, 88);
    ctx.font = "italic 500 52px Georgia, serif";
    function wrap(text, y, size) {
      ctx.font = size;
      const words = String(text).split(" ");
      let line = "";
      const lines = [];
      words.forEach(function (word) {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > w - 144) {
          if (line) lines.push(line);
          line = word;
        } else line = test;
      });
      if (line) lines.push(line);
      const lh = size.indexOf("52px") >= 0 ? 64 : 36;
      const shown = lines.slice(0, 5);
      shown.forEach(function (ln, i) { ctx.fillText(ln, 72, y + i * lh); });
      return y + shown.length * lh;
    }
    let y = wrap("“" + pick.line1, 260, "italic 500 52px Georgia, serif");
    y = wrap(pick.line2 + "”", y + 12, "italic 500 52px Georgia, serif");
    ctx.fillStyle = "#5c564c";
    y = wrap(pick.song.title, y + 56, "500 28px Georgia, serif");
    ctx.font = "500 24px Georgia, serif";
    ctx.fillText("Justin Helmer / Excavationpro", 72, y + 40);
    ctx.font = "22px Georgia, serif";
    ctx.fillText("excavationpro.ca/lyrics", 72, h - 88);
    ctx.fillText("#" + pick.song.slug, 72, h - 56);
  }

  function paintHighlight(forceNew) {
    if (!songs.length) return;
    const slug = (location.hash || "").replace(/^#/, "");
    const fromHash = !forceNew && slug && songs.filter(function (s) { return s.slug === slug; })[0];
    const last = sessionStorage.getItem("vaultHighlightSlug") || "";
    const pick = fromHash && lyricLines(fromHash).length >= 2
      ? pickFromSong(fromHash)
      : pickHighlight(forceNew || last ? last : "");
    applyPick(pick);
    sessionStorage.setItem("vaultHighlightSlug", pick.song.slug);
    setMemeStatus("X posts ping @grok. Paste the photo with Ctrl+V after the composer opens.");
  }

  function paintTags(tags) {
    const row = document.getElementById("tag-row");
    if (!row) return;
    row.innerHTML = "";
    (tags || []).slice(0, 10).forEach(function (t) {
      const s = document.createElement("span");
      s.textContent = t;
      row.appendChild(s);
    });
  }

  const shuffleBtn = document.getElementById("vault-shuffle");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      paintHighlight(true);
    });
  }
  function setMemeStatus(msg) {
    const el = document.getElementById("meme-status");
    if (el) el.textContent = msg || "";
  }

  function copyImage(blob) {
    if (!navigator.clipboard || !window.ClipboardItem) {
      return Promise.resolve(false);
    }
    return navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(function () {
      return true;
    }).catch(function () {
      return false;
    });
  }

  function openCompose(kind, pick) {
    if (!pick || !pick.draft) return;
    const forX = kind !== "bsky";
    const ta = captionEl();
    const text = forX && ta && ta.value.trim() ? ta.value.trim() : (forX ? pick.draft.x : pick.draft.bsky);
    const href = forX
      ? "https://x.com/intent/post?text=" + encodeURIComponent(text)
      : "https://bsky.app/intent/compose?text=" + encodeURIComponent(text);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function downloadBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function shareMeme(kind) {
    if (!memePick) return;
    if (!memePick.draft) memePick.draft = buildDraft(memePick);
    if (kind === "x" || kind === "bsky") {
      showDraft(kind);
      openCompose(kind, memePick);
    }
    drawMeme(memePick);
    const canvas = document.getElementById("meme-canvas");
    canvas.toBlob(function (blob) {
      if (!blob) return;
      const name = (memePick.song.slug || "lyric") + "-vault.png";
      copyImage(blob).then(function (ok) {
        if (kind === "png") {
          downloadBlob(blob, name);
          setMemeStatus(ok
            ? "Photo downloaded and copied. Post to X or Bluesky, then paste (Ctrl+V)."
            : "Photo downloaded. Attach the PNG in the composer.");
          return;
        }
        setMemeStatus(ok
          ? "Composer opened with caption and tags. Paste the photo (Ctrl+V)."
          : "Composer opened. Attach the downloaded PNG if paste is blocked.");
      });
    }, "image/png");
  }

  const xBtn = document.getElementById("share-x");
  const bskyBtn = document.getElementById("share-bsky");
  const pngBtn = document.getElementById("share-png");
  const shuffleTagsBtn = document.getElementById("shuffle-tags");
  const copyCaptionBtn = document.getElementById("copy-caption");
  if (xBtn) xBtn.addEventListener("click", function () { shareMeme("x"); });
  if (bskyBtn) bskyBtn.addEventListener("click", function () { shareMeme("bsky"); });
  if (pngBtn) pngBtn.addEventListener("click", function () { shareMeme("png"); });
  if (shuffleTagsBtn) {
    shuffleTagsBtn.addEventListener("click", function () {
      if (!memePick) return;
      memePick.draft = buildDraft(memePick, shuffleTags());
      paintTags(memePick.draft.tags);
      showDraft("x");
      setMemeStatus("Tags shuffled into the caption.");
    });
  }
  if (copyCaptionBtn) {
    copyCaptionBtn.addEventListener("click", function () {
      const ta = captionEl();
      if (!ta || !ta.value) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(function () {
          setMemeStatus("Caption copied. Paste it, then paste the photo.");
        }).catch(function () {});
      }
    });
  }

  const gate = document.getElementById("gate");
  const gatePass = document.getElementById("gate-pass");
  let sheetOpens = 0;
  let gateTimer = 0;

  function hideGate() {
    if (!gate) return;
    gate.hidden = true;
    sessionStorage.setItem("vaultGateAt", String(Date.now()));
  }

  function showGate() {
    if (!gate || !current) return;
    gate.hidden = false;
    if (gatePass) gatePass.focus();
  }

  function maybeGate() {
    sheetOpens += 1;
    window.clearTimeout(gateTimer);
    const last = parseInt(sessionStorage.getItem("vaultGateAt") || "0", 10);
    const cooling = Date.now() - last < 7 * 60 * 1000;
    if (sheetOpens === 1) {
      gateTimer = window.setTimeout(showGate, 8000);
      return;
    }
    if (!cooling && sheetOpens % 3 === 0) showGate();
  }

  if (gatePass) gatePass.addEventListener("click", hideGate);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && gate && !gate.hidden) hideGate();
  });
})();
