/* Mini listen-portal radio. Toggle hides the panel; audio element stays in the DOM and keeps playing. Mute is volume, not pause. */
(() => {
  const HUB = "https://asiancoastline.com/listen.html";
  const DSP = {
    hub: "https://ffm.to/eovnvo9",
    spotify: "https://open.spotify.com/artist/6CkZ4bN2xu3WRKbjEL3u2S",
    apple: "https://music.apple.com/us/artist/excavationpro/1586588545",
    youtube: "https://music.youtube.com/channel/UCnCf9gjhMEfUFPvGkdlUabQ",
  };
  const DSP_HTML =
    '<a href="' + DSP.hub + '" target="_blank" rel="noopener noreferrer">Stream Excavationpro</a>' +
    ' · <a href="' + DSP.spotify + '" target="_blank" rel="noopener noreferrer">Spotify</a>' +
    ' · <a href="' + DSP.apple + '" target="_blank" rel="noopener noreferrer">Apple Music</a>' +
    ' · <a href="' + DSP.youtube + '" target="_blank" rel="noopener noreferrer">YouTube Music</a>';
  const PLAYLISTS = [
    "./radio.json",
    "https://asiancoastline.com/data/public_stream_playlist.json",
    "https://deepseekoracle.github.io/Excavationpro/data/public_stream_playlist.json"
  ];
  const $ = (id) => document.getElementById(id);
  const el = () => $("radioEl");

  const LS = "lygo-haven-radio-v1";
  const st = {
    tracks: [],
    i: 0,
    playing: false,
    muted: false,
    view: true,
    vol: 0.5,
    bag: [],
    userPaused: false,
    unlockArmed: false,
    fails: 0
  };

  function clamp(v, a, b) {
    v = Number(v);
    if (!isFinite(v)) return a;
    return v < a ? a : v > b ? b : v;
  }

  function loadPref() {
    try {
      const p = JSON.parse(localStorage.getItem(LS) || "null");
      if (!p || typeof p !== "object") return;
      if (p.vol != null && isFinite(Number(p.vol))) st.vol = clamp(Number(p.vol), 0, 1);
      if (p.muted != null) st.muted = !!p.muted;
    } catch (_) {}
  }

  function savePref() {
    try {
      localStorage.setItem(LS, JSON.stringify({ vol: st.vol, muted: st.muted }));
    } catch (_) {}
  }

  function normTrack(t) {
    const url = t.stream_url || t.url;
    const title = t.title || t.name || "Untitled";
    if (!url) return null;
    return { title, url };
  }

  function ingest(data) {
    const raw = Array.isArray(data) ? data : (data.tracks || []);
    const out = [];
    for (const t of raw) {
      const n = normTrack(t);
      if (n) out.push(n);
    }
    if (out.length) st.tracks = out;
  }

  async function loadPlaylists() {
    try {
      const local = await fetch("./radio.json", { cache: "no-cache" }).then((r) => r.json());
      ingest(local);
    } catch (_) {}
    for (const url of PLAYLISTS.slice(1)) {
      try {
        const data = await fetch(url, { mode: "cors" }).then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        });
        ingest(data);
        if (st.tracks.length > 40) break;
      } catch (_) { /* CORS or offline — local radio.json still works */ }
    }
    refill();
  }

  function refill() {
    st.bag = st.tracks.map((_, i) => i);
    for (let i = st.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [st.bag[i], st.bag[j]] = [st.bag[j], st.bag[i]];
    }
  }

  function volPct() { return String(Math.round(st.vol * 100)); }

  function bindVol(node) {
    if (!node || node.getAttribute("data-radio-bound") === "1") return;
    node.setAttribute("data-radio-bound", "1");
    node.addEventListener("input", function (e) {
      setVol(Number(e.target.value) / 100);
    });
  }

  function paint() {
    const title = $("radioTitle");
    const play = $("radioPlay");
    const mute = $("radioMute");
    const view = $("radioView");
    const dock = $("radioDock");
    const menuPlay = $("menuRadio");
    const pct = volPct();
    if (title) {
      const t = st.tracks[st.i];
      title.textContent = t
        ? (st.playing ? "▶ " : "❚❚ ") + t.title
        : "Loading listen portal…";
    }
    if (play) play.textContent = st.playing ? "Pause" : "Play";
    if (menuPlay) menuPlay.textContent = st.playing ? "Pause radio" : "Play radio";
    if (mute) mute.textContent = st.muted ? "Unmute" : "Mute";
    if (view) view.textContent = st.view ? "Hide" : "Radio";
    if (dock) dock.classList.toggle("collapsed", !st.view);
    ["radioVol", "menuRadioVol"].forEach(function (id) {
      const n = $(id);
      if (!n) return;
      bindVol(n);
      if (document.activeElement !== n) n.value = pct;
    });
    ["radioVolPct", "menuRadioVolPct"].forEach(function (id) {
      const n = $(id);
      if (n) n.textContent = pct + "%";
    });
    const a = el();
    if (a) {
      a.muted = st.muted;
      a.volume = st.vol;
    }
  }

  function setVol(v) {
    st.vol = clamp(Number(v), 0, 1);
    if (st.vol > 0 && st.muted) {
      st.muted = false;
      const a = el();
      if (a) a.muted = false;
    }
    savePref();
    paint();
  }

  function armUnlock() {
    if (st.unlockArmed) return;
    st.unlockArmed = true;
    const go = function () {
      document.removeEventListener("pointerdown", go, true);
      document.removeEventListener("keydown", go, true);
      st.unlockArmed = false;
      if (!st.userPaused && !st.playing) play();
    };
    document.addEventListener("pointerdown", go, true);
    document.addEventListener("keydown", go, true);
  }

  function loadIndex(i) {
    if (!st.tracks.length) return;
    st.i = ((i % st.tracks.length) + st.tracks.length) % st.tracks.length;
    const a = el();
    const t = st.tracks[st.i];
    if (!a || !t) return;
    a.src = t.url;
    a.volume = st.vol;
    a.muted = st.muted;
    paint();
  }

  function next() {
    if (!st.tracks.length) return;
    if (!st.bag.length) refill();
    const i = st.bag.pop();
    loadIndex(i == null ? Math.floor(Math.random() * st.tracks.length) : i);
    const a = el();
    if (st.playing && a) a.play().catch(function () {});
  }

  function play() {
    if (!st.tracks.length) return;
    st.userPaused = false;
    const a = el();
    if (!a) return;
    if (!a.src) next();
    if (!a.src) return;
    a.volume = st.vol;
    a.muted = st.muted;
    a.play().then(function () {
      st.playing = true;
      st.fails = 0;
      paint();
    }).catch(function (err) {
      if (err && err.name === "NotAllowedError") {
        st.playing = false;
        paint();
        armUnlock();
      }
    });
  }

  function pauseKeep() {
    const a = el();
    if (a) a.pause();
    st.playing = false;
    st.userPaused = true;
    paint();
  }

  function ensurePlay() {
    if (st.userPaused || st.playing) {
      paint();
      return;
    }
    play();
  }

  function ensureDsp() {
    if (document.querySelector(".radio-dsp")) return;
    const head = document.querySelector(".radio-head");
    if (head) {
      const p = document.createElement("p");
      p.className = "radio-dsp";
      p.innerHTML = DSP_HTML;
      head.appendChild(p);
      return;
    }
    const dock = $("radioDock");
    if (dock && !dock.classList.contains("radio-inline")) {
      const p = document.createElement("span");
      p.className = "radio-dsp";
      p.innerHTML = DSP_HTML;
      dock.appendChild(p);
    }
  }

  function bootRadio() {
    loadPref();
    ensureDsp();
    const a = el();
    if (a) {
      a.volume = st.vol;
      a.muted = st.muted;
      a.addEventListener("ended", () => { st.fails = 0; st.playing = true; next(); });
      a.addEventListener("error", () => {
        if (st.userPaused) return;
        if (st.fails > 12) { st.playing = false; paint(); return; }
        st.fails += 1;
        st.playing = true;
        next();
      });
    }
    loadPlaylists().then(function () {
      paint();
      ensurePlay();
    });
    const on = (id, fn) => { const n = $(id); if (n) n.onclick = fn; };
    on("radioPlay", () => { st.playing ? pauseKeep() : play(); });
    on("radioNext", () => { st.userPaused = false; st.playing = true; next(); });
    on("radioMute", () => {
      st.muted = !st.muted;
      if (el()) el().muted = st.muted;
      savePref();
      paint();
    });
    on("radioView", () => {
      st.view = !st.view;
      paint();
    });
    paint();
    window.HavenRadio = {
      play: play,
      pause: pauseKeep,
      ensurePlay: ensurePlay,
      setVol: setVol,
      vol: function () { return st.vol; },
      playing: function () { return st.playing; },
      paint: paint
    };
  }

  bootRadio();
})();
