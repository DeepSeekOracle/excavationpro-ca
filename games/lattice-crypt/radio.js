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

  const SAVE_RADIO = "lygo_lattice_crypt_radio";
  const st = {
    tracks: [],
    i: 0,
    playing: false,
    muted: false,
    view: true,
    vol: 0.55,
    bag: []
  };
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_RADIO) || "{}");
    if (typeof s.vol === "number") st.vol = Math.max(0, Math.min(1, s.vol));
    if (s.muted) st.muted = true;
  } catch (_) {}
  function saveRadio() {
    try { localStorage.setItem(SAVE_RADIO, JSON.stringify({ vol: st.vol, muted: st.muted })); } catch (_) {}
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

  function paint() {
    const title = $("radioTitle");
    const play = $("radioPlay");
    const mute = $("radioMute");
    const view = $("radioView");
    const dock = $("radioDock");
    if (title) {
      const t = st.tracks[st.i];
      title.textContent = t
        ? (st.playing ? "▶ " : "❚❚ ") + t.title
        : "Loading listen portal…";
    }
    if (play) play.textContent = st.playing ? "Pause" : "Play";
    if (mute) mute.textContent = st.muted ? "Unmute" : "Mute";
    if (view) view.textContent = st.view ? "Hide" : "Radio";
    if (dock) dock.classList.toggle("collapsed", !st.view);
    document.querySelectorAll("[data-radio-vol]").forEach(function (inp) {
      bindVol(inp);
      const v = Math.round(st.vol * 100);
      if (document.activeElement !== inp) inp.value = String(v);
    });
    const a = el();
    if (a) {
      a.muted = st.muted;
      a.volume = st.vol;
    }
  }
  function setVol(n) {
    st.vol = Math.max(0, Math.min(1, +n || 0));
    if (st.vol > 0 && st.muted) {
      st.muted = false;
      const a = el();
      if (a) a.muted = false;
    }
    saveRadio();
    paint();
  }
  function bindVol(node) {
    if (!node || node._radioVol) return;
    node._radioVol = true;
    node.addEventListener("click", function (e) { e.stopPropagation(); });
    node.addEventListener("input", function (e) {
      e.stopPropagation();
      setVol(Number(e.target.value) / 100);
    });
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
    if (!st.bag.length) refill();
    const i = st.bag.pop();
    loadIndex(i == null ? Math.floor(Math.random() * st.tracks.length) : i);
    if (st.playing) el().play().catch(() => {});
  }

  function play() {
    st.wantPlay = true;
    if (!st.tracks.length) return;
    const a = el();
    if (!a.src) next();
    a.play().then(() => { st.playing = true; paint(); }).catch(() => {
      if (st.tracks.length > 1) next();
    });
  }

  function pauseKeep() {
    el().pause();
    st.playing = false;
    paint();
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
    ensureDsp();
    loadPlaylists().then(function () {
      paint();
      if (st.wantPlay) play();
    });
    const a = el();
    a.addEventListener("ended", () => { st.playing = true; next(); });
    a.addEventListener("error", () => { if (st.playing) next(); });
    const on = (id, fn) => { const n = $(id); if (n) n.onclick = fn; };
    on("radioPlay", () => { st.playing ? pauseKeep() : play(); });
    on("radioNext", () => { st.playing = true; next(); });
    on("radioMute", () => {
      st.muted = !st.muted;
      el().muted = st.muted;
      saveRadio();
      paint();
    });
    on("radioView", () => {
      st.view = !st.view;
      paint();
    });
    document.querySelectorAll("[data-radio-vol]").forEach(bindVol);
    paint();
  }

  window.LatticeRadio = {
    play: play,
    pause: pauseKeep,
    playing: function () { return st.playing; },
    setVol: setVol,
    vol: function () { return st.vol; },
    bindVol: bindVol,
    muted: function () { return st.muted; }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootRadio);
  else bootRadio();
})();
