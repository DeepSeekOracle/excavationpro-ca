(() => {
  "use strict";
  const screen = document.getElementById("screen");
  const inner = document.getElementById("screen-inner");
  const osd = document.getElementById("osd");
  const osdCh = document.getElementById("osd-ch");
  const osdName = document.getElementById("osd-name");
  const noise = document.getElementById("noise");

  const fallback = [
    { n: "EXCAVATIONPRO RUMBLE", k: "iframe", u: "https://rumble.com/embed/v7b5p30/?pub=1th29y&autoplay=1" },
    { n: "EXCAVATIONPRO KICK", k: "iframe", u: "https://player.kick.com/excavationpro?autoplay=true" },
    { n: "EXCAVATIONPRO TWITCH", k: "iframe", u: "https://player.twitch.tv/?channel=excavationpro&parent=excavationpro.ca&autoplay=true&muted=true" },
    { n: "EXCAVATIONPRO YOUTUBE", k: "iframe", u: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCr2GPEJcl2lXu0lS9-0FjvA&autoplay=1&mute=1" },
    { n: "BLOOMBERG TV", k: "hls", u: "https://bloomberg.com/media-manifest/streams/eu.m3u8" },
    { n: "DW ENGLISH", k: "hls", u: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8" },
    { n: "FRANCE 24 ENGLISH", k: "hls", u: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8" },
    { n: "NASA TV", k: "hls", u: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8" }
  ];

  let channels = [];
  let index = 0;
  let hls = null;
  let video = null;
  let tuneToken = 0;
  let osdTimer = null;
  let userGesture = false;

  const pad = n => String(n).padStart(5, "0");

  function showOSD(suffix = "") {
    const ch = channels[index] || fallback[0];
    osdCh.textContent = "CH " + pad(index + 1);
    osdName.textContent = (ch.n || "PUBLIC CHANNEL") + suffix;
    osd.classList.add("show");
    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => osd.classList.remove("show"), 3400);
  }

  function clear() {
    if (hls) { try { hls.destroy(); } catch (_) {} hls = null; }
    if (video) {
      try { video.pause(); video.removeAttribute("src"); video.load(); } catch (_) {}
      video = null;
    }
    inner.replaceChildren();
    noise.classList.remove("on");
  }

  function fail(token) {
    if (token !== tuneToken) return;
    noise.classList.add("on");
    osdName.textContent = (channels[index]?.n || "CHANNEL") + " — NO SIGNAL";
    osd.classList.add("show");
  }

  function tune(gesture = false) {
    if (!channels.length) return;
    clear();
    const token = ++tuneToken;
    const ch = channels[index];
    showOSD();

    if (ch.k === "iframe") {
      const frame = document.createElement("iframe");
      frame.src = ch.u;
      frame.title = ch.n || "LYGO TV channel";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      inner.appendChild(frame);
      return;
    }

    video = document.createElement("video");
    video.autoplay = true;
    video.muted = !gesture;
    video.playsInline = true;
    video.controls = false;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    inner.appendChild(video);

    const start = () => {
      if (token !== tuneToken) return;
      video.play().catch(() => {});
    };

    if (ch.k === "video") {
      video.src = ch.u;
      video.addEventListener("loadedmetadata", start, { once: true });
      video.addEventListener("error", () => fail(token), { once: true });
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({ lowLatencyMode: true, enableWorker: true });
      hls.loadSource(ch.u);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, start);
      hls.on(window.Hls.Events.ERROR, (_e, data) => {
        if (!data || !data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          setTimeout(() => { if (token === tuneToken) tune(userGesture); }, 4500);
        } else {
          fail(token);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = ch.u;
      video.addEventListener("loadedmetadata", start, { once: true });
      video.addEventListener("error", () => fail(token), { once: true });
    } else {
      fail(token);
    }
  }

  function step(delta, gesture = true) {
    if (!channels.length) return;
    userGesture = gesture;
    index = (index + delta + channels.length) % channels.length;
    tune(userGesture);
  }

  document.querySelectorAll("[data-step]").forEach(el => {
    el.addEventListener("click", e => { e.stopPropagation(); step(Number(el.dataset.step)); });
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); step(Number(el.dataset.step)); }
    });
  });

  screen.addEventListener("click", e => {
    if (e.target.closest("iframe")) return;
    if (video) {
      video.muted = !video.muted;
      showOSD(video.muted ? " — SOUND OFF" : " — SOUND ON");
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); step(1); }
    if (e.key === " " && video) {
      e.preventDefault();
      video.muted = !video.muted;
      showOSD(video.muted ? " — SOUND OFF" : " — SOUND ON");
    }
    if (e.key === "Escape") window.location.href = "/LYGOTV/";
  });

  fetch("channels.json", { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(d => {
      channels = Array.isArray(d.channels) && d.channels.length ? d.channels : fallback;
      // Ensure every record has the compact fields this page uses.
      channels = channels.map((c, i) => ({ n: c.n || c.name || "PUBLIC CHANNEL", k: c.k || c.kind || "hls", u: c.u || c.url, i: c.i || i + 1 }))
        .filter(c => c.u && /^https:\/\//.test(c.u));
      start();
    })
    .catch(() => { channels = fallback; start(); });

  function start() {
    if (!channels.length) channels = fallback;
    osdCh.textContent = "CH 00001";
    osdName.textContent = "TUNING…";
    osd.classList.add("show");
    setTimeout(() => tune(false), 500);
  }
})();
