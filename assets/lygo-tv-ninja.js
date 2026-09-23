/* LYGO TV Ninja — rooms first (Rumble default), then public catalog. No terms gate. */
(function () {
  "use strict";
  const TV_PAGE = "https://chatagent.ca/sources/";
  const HLS_SRC = "https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js";
  const DEFAULT_ID = "rumble_live";
  const POOL_MAX = 12000;
  const MAX_BYTES = 8000000;
  const EMBED = { youtube: 1, rumble: 1, twitch: 1, kick: 1 };
  const ROOMS = [
    { id: "rumble_live", title: "Excavationpro Rumble LIVE", kind: "rumble",
      url: "https://rumble.com/embed/v7b5p30/?pub=1th29y", https: true },
    { id: "kick_live", title: "Excavationpro on Kick", kind: "kick",
      url: "https://player.kick.com/excavationpro?autoplay=true", https: true },
    { id: "twitch_live", title: "Excavationpro on Twitch", kind: "twitch",
      channel: "excavationpro", https: true },
    { id: "yt_justin_live", title: "Justin Helmer YouTube LIVE", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCIbGSxMpDaj5ivh6mP_-k-A", https: true },
    { id: "yt_excav_live", title: "Excavationpro YouTube LIVE", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCr2GPEJcl2lXu0lS9-0FjvA", https: true },
    { id: "rumble_radio", title: "Excavationpro Rumble radio", kind: "rumble",
      url: "https://rumble.com/embed/v7anxls/?pub=1th29y", https: true },
    { id: "yt_justin_videos", title: "Justin Helmer YouTube videos", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUIbGSxMpDaj5ivh6mP_-k-A", https: true },
    { id: "yt_excav_videos", title: "Excavationpro YouTube videos", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUr2GPEJcl2lXu0lS9-0FjvA", https: true }
  ];

  let hlsLib = null;
  let hlsLibLoading = null;

  function loadHls(cb) {
    if (window.Hls) { cb(null); return; }
    if (hlsLibLoading) { hlsLibLoading.push(cb); return; }
    hlsLibLoading = [cb];
    const s = document.createElement("script");
    s.src = HLS_SRC;
    s.async = true;
    s.onload = function () {
      const q = hlsLibLoading || [];
      hlsLibLoading = null;
      q.forEach(function (fn) { fn(null); });
    };
    s.onerror = function () {
      const q = hlsLibLoading || [];
      hlsLibLoading = null;
      q.forEach(function (fn) { fn(new Error("hls")); });
    };
    document.head.appendChild(s);
  }

  function withParam(url, key, val) {
    if (!url) return url;
    try {
      const u = new URL(url);
      u.searchParams.set(key, val);
      return u.toString();
    } catch (e) {
      const join = url.indexOf("?") >= 0 ? "&" : "?";
      return url + join + encodeURIComponent(key) + "=" + encodeURIComponent(val);
    }
  }

  function kindOfUrl(url) {
    const u = String(url || "").toLowerCase().split("?")[0];
    if (u.indexOf("youtube.com") !== -1 || u.indexOf("youtube-nocookie.com") !== -1) return "youtube";
    if (u.indexOf("rumble.com") !== -1) return "rumble";
    if (u.indexOf("twitch.tv") !== -1 || u.indexOf("player.twitch.tv") !== -1) return "twitch";
    if (u.indexOf("kick.com") !== -1 || u.indexOf("player.kick.com") !== -1) return "kick";
    return "hls";
  }

  function isAdult(title, group, bouquetId) {
    const t = String(title || "").toLowerCase();
    const g = String(group || "").toLowerCase();
    const hay = t + " " + g + " " + String(bouquetId || "").toLowerCase();
    if (bouquetId === "mature_18" || bouquetId === "mature" || bouquetId === "xxx") return true;
    if (/^(xxx|adult|18\+|nsfw|porn|porno)$/.test(g)) return true;
    if (/\bxxx\b|\bnsfw\b|\bporn\b|\bporno\b|\bhentai\b|\b18\s*\+/.test(hay)) return true;
    if (/\badult\b/.test(hay) && !/\badult swim\b/.test(hay)) return true;
    return false;
  }

  function embed(ch) {
    if (ch.kind === "twitch" || (ch.url && String(ch.url).indexOf("player.twitch.tv") !== -1)) {
      return "https://player.twitch.tv/?channel=" + encodeURIComponent(ch.channel || "excavationpro") +
        "&parent=" + encodeURIComponent(location.hostname) + "&autoplay=true&muted=true";
    }
    let url = ch.url || "";
    if (ch.kind === "rumble" || url.indexOf("rumble.com") !== -1) return withParam(url, "autoplay", "2");
    if (ch.kind === "youtube" || url.indexOf("youtube") !== -1) {
      url = withParam(url, "autoplay", "1");
      return withParam(url, "mute", "1");
    }
    if (ch.kind === "kick" || url.indexOf("kick.com") !== -1) {
      url = withParam(url, "autoplay", "true");
      return withParam(url, "muted", "true");
    }
    return url;
  }

  function portalHref(ch) {
    if (ch.id && EMBED[ch.kind]) return TV_PAGE + "#channel/" + encodeURIComponent(ch.id);
    if (ch.bouquetId) return TV_PAGE + "#fast/" + encodeURIComponent(ch.bouquetId);
    return TV_PAGE + "#channel/" + DEFAULT_ID;
  }

  function parseM3U(text, bouquetId) {
    const lines = String(text || "").split(/\r?\n/);
    const out = [];
    let title = "";
    let group = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.indexOf("#EXTINF") === 0) {
        const comma = line.lastIndexOf(",");
        title = comma >= 0 ? line.slice(comma + 1).trim() : "Channel";
        const gm = line.match(/group-title="([^"]+)"/i);
        group = gm ? gm[1] : "";
        continue;
      }
      if (line.charAt(0) === "#") continue;
      let href = "";
      try { href = new URL(line).href; } catch (e) { title = ""; group = ""; continue; }
      if (href.indexOf("https://") !== 0) { title = ""; group = ""; continue; }
      if (isAdult(title, group, bouquetId)) { title = ""; group = ""; continue; }
      out.push({
        title: title || href,
        url: href,
        https: true,
        kind: kindOfUrl(href),
        group: group,
        bouquetId: bouquetId
      });
      title = "";
      group = "";
      if (out.length >= 3500) break;
    }
    return out;
  }

  function rumbleIndex(list) {
    const i = list.findIndex(function (c) { return c.id === DEFAULT_ID; });
    return i >= 0 ? i : 0;
  }

  function mount(host) {
    if (!host || host.getAttribute("data-lygo-ready")) return;
    host.setAttribute("data-lygo-ready", "1");
    host.classList.add("lygo-tv-ninja");
    host.innerHTML =
      '<div class="tv-top">' +
        '<p class="tv-kicker">LYGO TV</p>' +
        '<a class="tv-open" target="_blank" rel="noopener noreferrer" href="' + TV_PAGE + "#channel/" + DEFAULT_ID + '">Open player</a>' +
      "</div>" +
      '<div class="tv-screen">' +
        '<iframe title="LYGO TV channel" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>' +
        '<video playsinline muted autoplay></video>' +
      "</div>" +
      '<div class="tv-bar">' +
        '<button type="button" class="tv-zap" data-dir="-1" aria-label="Previous channel">Prev</button>' +
        '<p class="tv-meta">Channel</p>' +
        '<button type="button" class="tv-zap" data-dir="1" aria-label="Next channel">Next</button>' +
      "</div>";

    const list = ROOMS.slice();
    const seen = {};
    list.forEach(function (c) { if (c.url) seen[c.url] = 1; });
    let i = rumbleIndex(list);
    let hls = null;
    const frame = host.querySelector("iframe");
    const video = host.querySelector("video");
    const meta = host.querySelector(".tv-meta");
    const open = host.querySelector(".tv-open");

    function stopHls() {
      if (hls) { try { hls.destroy(); } catch (e) {} hls = null; }
      video.pause();
      video.removeAttribute("src");
      video.load();
    }

    function playHls(url) {
      frame.hidden = true;
      frame.removeAttribute("src");
      video.hidden = false;
      video.muted = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.play().catch(function () {});
        return;
      }
      loadHls(function (err) {
        if (err || !window.Hls || !window.Hls.isSupported()) return;
        stopHls();
        video.hidden = false;
        hls = new window.Hls({ enableWorker: true, xhrSetup: function (xhr) { xhr.withCredentials = false; } });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
      });
    }

    function play(n) {
      if (!list.length) return;
      i = (n + list.length) % list.length;
      const ch = list[i];
      meta.textContent = ch.title + " · " + (i + 1) + " / " + list.length;
      open.href = portalHref(ch);
      if (EMBED[ch.kind]) {
        stopHls();
        video.hidden = true;
        frame.hidden = false;
        frame.src = embed(ch);
        frame.title = ch.title;
        return;
      }
      playHls(ch.url);
    }

    function merge(chs) {
      if (!chs || !chs.length) return;
      for (let n = 0; n < chs.length; n++) {
        const c = chs[n];
        if (!c || !c.url || seen[c.url]) continue;
        if (!c.https && !EMBED[c.kind]) continue;
        seen[c.url] = 1;
        list.push(c);
        if (list.length >= POOL_MAX) break;
      }
      const ch = list[i];
      if (ch) meta.textContent = ch.title + " · " + (i + 1) + " / " + list.length;
    }

    host.querySelectorAll(".tv-zap").forEach(function (btn) {
      btn.addEventListener("click", function () {
        play(i + parseInt(btn.getAttribute("data-dir"), 10));
      });
    });
    video.hidden = true;
    play(i);

    fetch(TV_PAGE + "catalog.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (cat) {
      if (!cat) return;
      merge((cat.live || []).map(function (ch) {
        ch.https = true;
        ch.kind = ch.kind || kindOfUrl(ch.url);
        return ch;
      }));
      const bouquets = cat.bouquets || [];
      let q = bouquets.slice();
      function one() {
        const b = q.shift();
        if (!b) return;
        if (!b.url || String(b.url).indexOf("https://") !== 0) { one(); return; }
        if (isAdult("", "", b.id)) { one(); return; }
        const ctrl = new AbortController();
        const t = window.setTimeout(function () { ctrl.abort(); }, 14000);
        fetch(b.url, { signal: ctrl.signal, credentials: "omit", cache: "no-store" })
          .then(function (res) { return res.ok ? res.arrayBuffer() : null; })
          .then(function (buf) {
            if (!buf || buf.byteLength > MAX_BYTES) return;
            const text = new TextDecoder("utf-8").decode(buf);
            merge(parseM3U(text, b.id));
          })
          .catch(function () {})
          .then(function () {
            window.clearTimeout(t);
            one();
          });
      }
      one();
      one();
      one();
    }).catch(function () {});
  }

  function boot() {
    document.querySelectorAll("[data-lygo-tv]").forEach(mount);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
