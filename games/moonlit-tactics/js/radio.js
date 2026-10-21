const PLAYLISTS = [
  "https://asiancoastline.com/data/public_stream_playlist.json",
  "https://deepseekoracle.github.io/Excavationpro/data/public_stream_playlist.json"
];

let tracks = [];
let index = 0;
let started = false;
let volume = 0.6;

export function setVolume(value) {
  volume = Math.max(0, Math.min(1, Number(value) || 0));
  const audio = document.getElementById("radioEl");
  if (audio) audio.volume = volume;
}

function norm(data) {
  const raw = Array.isArray(data) ? data : (data.tracks || []);
  const out = [];
  for (const t of raw) {
    const url = t.stream_url || t.url;
    if (!url) continue;
    const title = t.title || t.name || "Excavationpro";
    if (/sfx|bass drop/i.test(title)) continue;
    out.push({ title, url });
  }
  return out;
}

async function load() {
  for (const url of PLAYLISTS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const list = norm(await res.json());
      if (list.length) {
        tracks = list;
        return;
      }
    } catch (_) { /* next mirror */ }
  }
}

function showTitle() {
  const el = document.getElementById("radio-title");
  if (!tracks.length) {
    el.textContent = "Listen portal quiet";
    return;
  }
  el.textContent = tracks[index].title.replace(/\s+/g, " ").slice(0, 72);
}

async function playCurrent() {
  const audio = document.getElementById("radioEl");
  if (!tracks.length) {
    showTitle();
    return;
  }
  audio.src = tracks[index].url;
  audio.volume = volume;
  showTitle();
  try { await audio.play(); } catch (_) { /* needs another gesture */ }
}

export async function bootRadio() {
  if (!started) {
    started = true;
    await load();
    const audio = document.getElementById("radioEl");
    audio.addEventListener("ended", () => {
      index = (index + 1) % Math.max(1, tracks.length);
      playCurrent();
    });
    document.getElementById("radio-toggle").addEventListener("click", () => {
      if (!tracks.length) {
        load().then(playCurrent);
        return;
      }
      if (audio.paused) playCurrent();
      else audio.pause();
    });
  }
  if (tracks.length) playCurrent();
  else showTitle();
}
