/* LYGO TV — pick a list, click a channel, watch. */
(function () {
  "use strict";
  const G = window.LYGO_SRC_GUARD;
  const HLS_SRC = "https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js";
  const MAX_PLAYLIST = 3500;
  const MAX_BYTES = 8000000;
  const SKIP_MAX = 4;
  const CAT_VER = "1.18.0";
  const BM_KEY = "lygo_tv_bm_ok";
  const PLAYER_URL = "https://excavationpro.ca/sources/";
  const TERMS_KEY = "lygo_tv_terms_ok";
  const NUDGE_KEY = "lygo_tv_nudge_at";
  const NUDGE_MS = 30 * 60 * 1000;
  const SID_KEY = "lygo_tv_sid";
  const MQTT_SRC = "https://cdn.jsdelivr.net/npm/mqtt@4.3.7/dist/mqtt.min.js";
  const MQTT_URLS = [
    "wss://broker.hivemq.com:8884/mqtt",
    "wss://broker.emqx.io:8084/mqtt"
  ];
  const MQTT_TOPIC = "lygo/tv/pulse/chatagent/sources/";
  const FAV_KEY = "lygo_tv_favs";
  const LAST_KEY = "lygo_tv_last";
  const AGE_KEY = "lygo_tv_18";
  const EMBED_KINDS = { youtube: 1, rumble: 1, twitch: 1, kick: 1 };
  const ROOM_CHIP = {
    kick_live: "Kick",
    rumble_live: "Rumble LIVE",
    twitch_live: "Twitch",
    yt_justin_live: "YT Justin LIVE",
    yt_excav_live: "YT Excav LIVE",
    rumble_radio: "Rumble radio",
    yt_justin_videos: "YT Justin videos",
    yt_excav_videos: "YT Excav videos"
  };

  const TABS = [
    { id: "channel", label: "Channel" },
    { id: "all", label: "All wired" },
    { id: "fast", label: "FAST" },
    { id: "lists", label: "Lists" },
    { id: "topics", label: "Topics" },
    { id: "places", label: "Places" },
    { id: "langs", label: "Languages" },
    { id: "saved", label: "Saved" }
  ];
  const FAST_IDS = {
    mjh_raw: 1, mjh_radio: 1, plex_fast: 1, plex_all: 1, rw1986: 1,
    ftv_usa: 1, ftv_uk: 1, ftv_news: 1, ftv_docs: 1, ftv_music: 1,
    tubi_fast: 1, distro_fast: 1, vizio_fast: 1, rakuten_uk: 1, lg_us: 1,
    xumo_fast: 1, firetv_fast: 1, tcl_fast: 1,
    src_stirr: 1, src_firetv: 1, src_roku: 1, src_samsung: 1,
    cineverse: 1, zeasn: 1, rok_fast: 1, vidaa_fast: 1, whale_fast: 1, tablo_fast: 1,
    ssung_au: 1, ssung_br: 1, ssung_nz: 1, ssung_sg: 1, ssung_ph: 1, ssung_th: 1,
    src_ukrak: 1, src_uksams: 1,
    src_cineverse: 1, src_plex: 1, src_tubi: 1, src_klowd: 1, src_sofast: 1, src_30a: 1,
    src_derak: 1, src_esrak: 1, src_firak: 1, src_ausams: 1, src_itsams: 1,
    xumo_gh: 1, plex_gb: 1, plex_ca: 1, plex_au: 1, localnow: 1
  };
  const LIST_IDS = {
    worldtv: 1, freetv: 1, all: 1, fanming: 1, brazil_fta: 1,
    ftv_france: 1, ftv_germany: 1, ftv_italy: 1, ftv_spain: 1,
    pbs_src: 1, bbc_src: 1,
    ftv_canada: 1, ftv_australia: 1, ftv_ireland: 1, ftv_netherlands: 1,
    ftv_japan: 1, ftv_india: 1, ftv_mexico: 1, ftv_poland: 1, ftv_sweden: 1,
    ftv_austria: 1, ftv_portugal: 1, ftv_belgium: 1, ftv_brazil: 1,
    ftv_finland: 1, ftv_norway: 1, ftv_denmark: 1, ftv_greece: 1, ftv_czech: 1,
    ftv_croatia: 1, ftv_hungary: 1, ftv_romania: 1, ftv_turkey: 1,
    ftv_chile: 1, ftv_argentina: 1, ftv_egypt: 1, ftv_taiwan: 1, ftv_israel: 1,
    ftv_albania: 1, ftv_bosnia: 1, ftv_bulgaria: 1, ftv_china: 1, ftv_cr: 1,
    ftv_estonia: 1, ftv_georgia: 1, ftv_hk: 1, ftv_iran: 1, ftv_iceland: 1,
    ftv_slovakia: 1, ftv_ukraine: 1, ftv_serbia: 1,
    src_stingray: 1, src_3abn: 1, src_abcnews: 1, src_cbsn: 1,
    src_local: 1, src_bfm: 1,
    ftv_az: 1, ftv_by: 1, ftv_iq: 1, ftv_kr: 1, ftv_lb: 1, ftv_mn: 1,
    ftv_ng: 1, ftv_mk: 1, ftv_qa: 1, ftv_ru: 1, ftv_ve: 1
  };
  const TOPIC_IDS = {
    culture: 1, documentary: 1, public: 1, legislative: 1, education: 1,
    outdoor: 1, religious: 1, relax: 1, general: 1, science: 1,
    music: 1, sports: 1, weather: 1,
    cooking: 1, travel: 1, lifestyle: 1, family: 1, business: 1, auto: 1,
    news: 1, kids: 1, movies: 1, entertainment: 1, shop: 1,
    mature_18: 1
  };
  const LANG_IDS = {
    ara: 1, fas: 1, kur: 1, rus: 1, ukr: 1, zho: 1, spa: 1, por: 1,
    tur: 1, hin: 1, urd: 1, ben: 1, tam: 1, swa: 1, amh: 1, heb: 1,
    eng: 1, fra: 1, deu: 1, ita: 1, nld: 1, jpn: 1, kor: 1, pol: 1,
    hun: 1, ron: 1, ell: 1, tha: 1, vie: 1, ind: 1, mal: 1, tel: 1,
    cat: 1, srp: 1, kaz: 1,
    bul: 1, ces: 1, est: 1, fin: 1, gle: 1, hrv: 1, isl: 1, lav: 1, lit: 1, slk: 1
  };

  const $ = function (id) { return document.getElementById(id); };
  const st = {
    catalog: null,
    tab: "watch",
    bouquet: "",
    channels: [],
    pool: [],
    poolBusy: false,
    current: null,
    i: -1,
    filter: "",
    group: "",
    sortAz: false,
    hls: null,
    hlsReady: false,
    skip: 0,
    httpSkipped: 0,
    audience: "all",
    ageOk: false,
    gateCb: null,
    termsOk: false
  };

  function esc(s) { return G ? G.esc(s) : String(s || ""); }

  function termsOk() {
    if (st.termsOk) return true;
    try { return sessionStorage.getItem(TERMS_KEY) === "1"; } catch (e) { return false; }
  }

  function paintTerms() {
    const el = $("terms");
    if (!el) return;
    const need = !termsOk() && st.tab !== "channel" && st.tab !== "watch";
    el.hidden = !need;
  }

  function acceptTerms() {
    const box = $("terms-box");
    if (!box || !box.checked) {
      setStatus("Tick the box to agree to the Terms of Use.", "bad");
      return;
    }
    st.termsOk = true;
    try { sessionStorage.setItem(TERMS_KEY, "1"); } catch (e) {}
    paintTerms();
    paintTabs();
    paintChips();
    setStatus("Terms accepted for this session. Public lists unlocked. Loading all channels…", "ok");
    fillPool();
  }

  function needTerms() {
    setStatus("Agree to the Terms of Use to open public TV lists. Channel rooms stay open.", "bad");
    paintTerms();
  }

  function groupOf(id) {
    if (id === "live") return "channel";
    if (FAST_IDS[id]) return "fast";
    if (LIST_IDS[id]) return "lists";
    if (TOPIC_IDS[id]) return "topics";
    if (LANG_IDS[id]) return "langs";
    return "places";
  }

  function setStatus(msg, kind) {
    const el = $("status");
    el.textContent = msg || "";
    el.style.color = kind === "ok" ? "#34d399" : kind === "bad" ? "#fb923c" : "#8b9bb4";
  }

  function setIdle(on) {
    const el = $("idle");
    if (el) el.hidden = !on;
  }

  function setSpin(on) {
    const el = $("spin");
    if (el) el.hidden = !on;
  }

  function rateChannel(title, group, bouquetId) {
    const t = String(title || "").toLowerCase();
    const g = String(group || "").toLowerCase().trim();
    const hay = t + " " + g + " " + String(bouquetId || "").toLowerCase();
    const adultGroup = /^(xxx|adult|18\+|nsfw|porn|porno)$/.test(g);
    const adultWords = /\bxxx\b|\bnsfw\b|\bporn\b|\bporno\b|\bhentai\b|\b18\s*\+/.test(hay) ||
      (/\badult\b/.test(hay) && !/\badult swim\b/.test(hay));
    if (bouquetId === "mature_18" || bouquetId === "mature") return "adult";
    if (bouquetId === "xxx" || adultGroup || adultWords) return "adult";
    if (bouquetId === "kids") return "kids";
    if (/^(kids|children|children'?s|infantil|ninos|niños)$/.test(g)) return "kids";
    if (/\bkids\b|\bchildren'?s\b|\bpbs kids\b|\bcbeebies\b|\bnick jr\b|\bnickjr\b/.test(hay)) return "kids";
    return "all";
  }

  function ratingOf(c) {
    return (c && c.rating) || "all";
  }

  function adultAllowed() {
    if (st.ageOk) return true;
    try { return localStorage.getItem(AGE_KEY) === "1"; } catch (e) { return false; }
  }

  function setAdultAllowed(on) {
    st.ageOk = !!on;
    try {
      if (on) localStorage.setItem(AGE_KEY, "1");
      else localStorage.removeItem(AGE_KEY);
    } catch (e) {}
  }

  function openGate(cb) {
    st.gateCb = cb;
    const el = $("gate");
    if (el) el.hidden = false;
  }

  function closeGate(ok) {
    const el = $("gate");
    if (el) el.hidden = true;
    const cb = st.gateCb;
    st.gateCb = null;
    if (cb) cb(!!ok);
  }

  function paintAudience() {
    ["all", "kids", "adult"].forEach(function (id) {
      const el = $("aud-" + id);
      if (!el) return;
      const on = st.audience === id;
      el.className = "aud" + (on ? " on" : "");
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setAudience(kind, after) {
    if (kind === "adult" && !adultAllowed()) {
      openGate(function (ok) {
        if (!ok) {
          st.audience = "all";
          paintAudience();
          paintList();
          setStatus("Staying on All ages. Adult shelf stays gated.");
          if (after) after(false);
          return;
        }
        setAdultAllowed(true);
        st.audience = "adult";
        paintAudience();
        paintList();
        setStatus("Adult shelf — gated. Labeled Adult, not XXX.");
        if (after) after(true);
      });
      return;
    }
    st.audience = kind === "kids" || kind === "adult" ? kind : "all";
    paintAudience();
    paintList();
    if (st.audience === "kids") setStatus("Kids shelf — metadata hint, not a child lock. Supervise minors.");
    else if (st.audience === "adult") setStatus("Adult shelf — gated. Labeled Adult, not XXX.");
    else setStatus("All ages — unlabeled public channels.");
    if (after) after(true);
  }

  function kindOfUrl(url) {
    const u = String(url || "").toLowerCase().split("?")[0];
    if (u.indexOf("youtube.com") !== -1 || u.indexOf("youtube-nocookie.com") !== -1) return "youtube";
    if (u.indexOf("rumble.com") !== -1) return "rumble";
    if (u.indexOf("twitch.tv") !== -1 || u.indexOf("player.twitch.tv") !== -1) return "twitch";
    if (u.indexOf("kick.com") !== -1 || u.indexOf("player.kick.com") !== -1) return "kick";
    if (/\.(mp3|ogg|wav|m4a|aac)$/.test(u)) return "audio";
    if (/\.(mp4|webm|ogv)$/.test(u)) return "video";
    if (/\.m3u8?$/.test(u) || u.indexOf(".m3u") !== -1) return "hls";
    return "hls";
  }

  function parseM3U(text, baseHref, bouquetId) {
    const lines = String(text || "").split(/\r?\n/);
    const out = [];
    let title = "";
    let logo = "";
    let group = "";
    let httpSkipped = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.indexOf("#EXTINF") === 0) {
        const comma = line.lastIndexOf(",");
        title = comma >= 0 ? line.slice(comma + 1).trim() : "Channel";
        const lm = line.match(/tvg-logo="([^"]+)"/i);
        logo = lm ? lm[1] : "";
        const gm = line.match(/group-title="([^"]+)"/i);
        group = gm ? gm[1] : "";
        continue;
      }
      if (line.charAt(0) === "#") continue;
      const parsed = G.parseStream(line, baseHref);
      if (!parsed) continue;
      if (parsed.protocol !== "https:") {
        httpSkipped += 1;
        title = "";
        logo = "";
        group = "";
        continue;
      }
      out.push({
        title: title || parsed.hostname,
        url: parsed.href,
        https: true,
        kind: kindOfUrl(parsed.href),
        logo: logo && logo.indexOf("https://") === 0 ? logo : "",
        group: group,
        rating: rateChannel(title, group, bouquetId)
      });
      title = "";
      logo = "";
      group = "";
      if (out.length >= MAX_PLAYLIST) break;
    }
    st.httpSkipped = httpSkipped;
    return out;
  }

  function loadFavs() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavs(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list.slice(0, 200))); } catch (e) {}
  }

  function isFav(url) {
    return loadFavs().some(function (x) { return x.url === url; });
  }

  function toggleFav(ch) {
    if (!ch || !ch.url) return;
    const list = loadFavs();
    const i = list.findIndex(function (x) { return x.url === ch.url; });
    if (i >= 0) list.splice(i, 1);
    else list.unshift({ title: ch.title, url: ch.url, kind: ch.kind, logo: ch.logo || "", group: ch.group || "", rating: ch.rating || "" });
    saveFavs(list);
    paintList();
    paintFavBtn();
  }

  function remember(bouquet) {
    try { localStorage.setItem(LAST_KEY, JSON.stringify({ tab: st.tab, bouquet: bouquet })); } catch (e) {}
  }

  function hashSet() {
    let h;
    if (st.tab === "channel" && st.channels[st.i] && st.channels[st.i].id) {
      h = "#channel/" + encodeURIComponent(st.channels[st.i].id);
    } else {
      h = st.bouquet ? ("#" + st.tab + "/" + encodeURIComponent(st.bouquet)) : ("#" + st.tab);
    }
    if (location.hash !== h) history.replaceState(null, "", h);
  }

  function visible() {
    const q = st.filter.toLowerCase();
    let list = st.channels.filter(function (c) {
      if (!c.https && !EMBED_KINDS[c.kind]) return false;
      if (st.audience === "all" && ratingOf(c) !== "all") return false;
      if (st.audience === "kids" && ratingOf(c) !== "kids") return false;
      if (st.audience === "adult" && ratingOf(c) !== "adult") return false;
      if (st.group && (c.group || "") !== st.group) return false;
      if (!q) return true;
      const hay = ((c.title || "") + " " + (c.group || "")).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    if (st.sortAz) {
      list = list.slice().sort(function (a, b) {
        return (a.title || "").localeCompare(b.title || "");
      });
    }
    return list;
  }

  function walkable() {
    const src = st.pool.length ? st.pool : st.channels;
    return src.filter(function (c) {
      if (!c.https && !EMBED_KINDS[c.kind]) return false;
      if (ratingOf(c) === "adult" && !adultAllowed()) return false;
      return true;
    });
  }

  function mergePool(chs) {
    if (!chs || !chs.length) return;
    const POOL_MAX = 12000;
    if (st.pool.length >= POOL_MAX) {
      paintZap();
      return;
    }
    const seen = {};
    let i;
    for (i = 0; i < st.pool.length; i++) {
      if (st.pool[i].url) seen[st.pool[i].url] = 1;
    }
    for (i = 0; i < chs.length; i++) {
      const c = chs[i];
      if (!c || !c.url || seen[c.url]) continue;
      if (!c.https && !EMBED_KINDS[c.kind]) continue;
      seen[c.url] = 1;
      st.pool.push(c);
      if (st.pool.length >= POOL_MAX) break;
    }
    if (st.tab === "all") {
      st.channels = st.pool.slice();
      paintList();
    }
    paintZap();
  }

  function fillPool() {
    if (st.poolBusy || !st.catalog) return;
    mergePool(st.channels);
    if (!termsOk()) return;
    const bouquets = st.catalog.bouquets || [];
    if (!bouquets.length) return;
    st.poolBusy = true;
    const q = bouquets.slice();
    const savedSkip = st.httpSkipped;
    function one() {
      const b = q.shift();
      if (!b) {
        st.httpSkipped = savedSkip;
        st.poolBusy = false;
        paintZap();
        return;
      }
      if (!b.url || (G && !G.allowFetch(b.url))) {
        one();
        return;
      }
      const ctrl = new AbortController();
      const t = window.setTimeout(function () { ctrl.abort(); }, 14000);
      fetch(b.url, { signal: ctrl.signal, credentials: "omit", cache: "no-store", redirect: "follow" })
        .then(function (res) {
          if (!res.ok) return null;
          return res.arrayBuffer();
        })
        .then(function (buf) {
          if (!buf || buf.byteLength > MAX_BYTES) return;
          const text = new TextDecoder("utf-8").decode(buf);
          mergePool(parseM3U(text, b.url, b.id));
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
  }

  function groupsInList() {
    const seen = {};
    const out = [];
    st.channels.forEach(function (c) {
      if (!c.group || seen[c.group]) return;
      seen[c.group] = 1;
      out.push(c.group);
    });
    out.sort(function (a, b) { return a.localeCompare(b); });
    return out;
  }

  function loadHls(cb) {
    if (st.hlsReady || window.Hls) { st.hlsReady = true; cb(); return; }
    const s = document.createElement("script");
    s.src = HLS_SRC;
    s.onload = function () { st.hlsReady = true; cb(); };
    s.onerror = function () { cb(new Error("hls.js missing")); };
    document.head.appendChild(s);
  }

  function stopMedia() {
    const v = $("vid");
    const a = $("aud");
    const yt = $("yt");
    if (st.hls) { try { st.hls.destroy(); } catch (e) {} st.hls = null; }
    v.pause(); a.pause();
    v.removeAttribute("src"); a.removeAttribute("src");
    v.crossOrigin = null;
    v.load(); a.load();
    v.hidden = false;
    a.hidden = true;
    yt.hidden = true;
    yt.removeAttribute("src");
    setSpin(false);
  }

  function tryPlay(el) {
    const p = el.play();
    if (p && p.catch) {
      p.catch(function () {
        el.muted = true;
        el.play().catch(function () {});
      });
    }
  }

  function skipOrStop(why) {
    setStatus(why, "bad");
    setSpin(false);
    if (st.skip >= SKIP_MAX) {
      setStatus(why + " Click another channel.", "bad");
      setIdle(true);
      return;
    }
    st.skip += 1;
    window.setTimeout(function () { next(1, true); }, 350);
  }

  function embedUrl(ch) {
    if (ch.kind === "twitch") {
      const chan = ch.channel || "excavationpro";
      return "https://player.twitch.tv/?channel=" + encodeURIComponent(chan) +
        "&parent=" + encodeURIComponent(location.hostname) + "&autoplay=true";
    }
    return ch.url;
  }

  function paintOpen(ch) {
    const el = $("open");
    if (!el) return;
    const href = ch && ch.watch ? G.safeHref(ch.watch) : "";
    if (!href) {
      el.hidden = true;
      el.removeAttribute("href");
      return;
    }
    el.hidden = false;
    el.href = href;
    const labels = { kick: "Open on Kick", rumble: "Open on Rumble", twitch: "Open on Twitch", youtube: "Open on YouTube" };
    el.textContent = labels[ch.kind] || "Open room";
  }

  function playHls(url) {
    const v = $("vid");
    v.hidden = false;
    setIdle(false);
    setSpin(true);
    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = url;
      tryPlay(v);
      setSpin(false);
      setStatus("Playing.", "ok");
      return;
    }
    loadHls(function (err) {
      if (err || !window.Hls || !window.Hls.isSupported()) {
        skipOrStop("This browser cannot play this stream.");
        return;
      }
      if (st.hls) { try { st.hls.destroy(); } catch (e2) {} }
      st.hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: function (xhr) { xhr.withCredentials = false; }
      });
      st.hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        st.skip = 0;
        setIdle(false);
        setSpin(false);
        setStatus("Playing.", "ok");
        tryPlay(v);
      });
      st.hls.on(window.Hls.Events.ERROR, function (_e, data) {
        if (data && data.fatal) skipOrStop("This channel is blocked here — next…");
      });
      st.hls.loadSource(url);
      st.hls.attachMedia(v);
    });
  }

  function playAt(i, fromSkip, list) {
    if (!fromSkip) st.skip = 0;
    list = list || visible();
    if (!list.length) {
      setStatus("No playable channels in this list. Try another list.");
      setIdle(true);
      return;
    }
    if (i < 0) i = list.length - 1;
    if (i >= list.length) i = 0;
    const ch = list[i];
    if (ratingOf(ch) === "adult" && (st.audience !== "adult" || !adultAllowed())) {
      if (fromSkip) {
        skipOrStop("Skipped Adult listing — not on the All ages shelf.");
        return;
      }
      setAudience("adult", function (ok) {
        if (!ok) return;
        const idx = visible().indexOf(ch);
        if (idx >= 0) playAt(idx, false);
      });
      return;
    }
    st.current = ch;
    st.i = st.channels.indexOf(ch);
    $("now").textContent = ch.title;
    paintZap();
    paintList();
    paintFavBtn();
    paintChips();
    hashSet();
    stopMedia();
    setIdle(false);
    paintOpen(ch);
    if (EMBED_KINDS[ch.kind]) {
      $("vid").hidden = true;
      $("yt").src = embedUrl(ch);
      $("yt").hidden = false;
      $("yt").title = ch.title || "Live room";
      setStatus(ch.kind === "youtube" && /live_stream/.test(ch.url)
        ? "YouTube live embed — if offline, try the videos room or Open."
        : "Playing.", "ok");
      return;
    }
    if (!ch.https) {
      skipOrStop("HTTP stream skipped (this page is HTTPS).");
      return;
    }
    if (ch.kind === "audio") {
      $("aud").hidden = false;
      $("aud").src = ch.url;
      tryPlay($("aud"));
      setStatus("Playing.", "ok");
      return;
    }
    playHls(ch.url);
  }

  function next(dir, fromSkip) {
    const list = walkable();
    if (!list.length) return;
    const cur = st.current || st.channels[st.i];
    let idx = list.indexOf(cur);
    if (idx < 0) idx = 0;
    else idx = idx + dir;
    playAt(idx, fromSkip, list);
  }

  function retry() {
    if (!st.current && (st.i < 0 || !st.channels[st.i])) return;
    const list = visible();
    const idx = list.indexOf(st.current || st.channels[st.i]);
    if (idx >= 0) playAt(idx, false);
  }

  function paintTabs() {
    const box = $("tabs");
    box.innerHTML = "";
    TABS.forEach(function (t) {
      const el = document.createElement("button");
      el.type = "button";
      const locked = !termsOk() && t.id !== "channel";
      el.className = "tab" + (st.tab === t.id ? " on" : "") + (locked ? " lock" : "");
      el.dataset.tab = t.id;
      el.textContent = t.label;
      el.setAttribute("aria-pressed", st.tab === t.id ? "true" : "false");
      el.title = locked ? "Agree to Terms to open public lists" : t.label;
      el.addEventListener("click", function () {
        if (t.id === "all") { showAll(); return; }
        st.tab = t.id;
        paintTabs();
        paintChips();
        paintTerms();
        if (t.id === "saved") {
          if (!termsOk()) needTerms();
          else loadSaved();
          return;
        }
        if (t.id !== "channel" && !termsOk()) needTerms();
      });
      box.appendChild(el);
    });
  }

  function paintChips() {
    const box = $("chips");
    box.innerHTML = "";
    if (st.tab === "all") return;
    if (st.tab === "saved") {
      const n = loadFavs().length;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip on";
      chip.dataset.chip = "saved";
      chip.textContent = n ? (n + " saved") : "None saved";
      chip.addEventListener("click", loadSaved);
      box.appendChild(chip);
      return;
    }
    if (st.tab === "channel" || st.tab === "watch") {
      (st.catalog.live || []).forEach(function (room) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip chip-room" + (st.current && st.current.id === room.id ? " on" : "");
        chip.dataset.room = room.id;
        chip.textContent = ROOM_CHIP[room.id] || room.group || room.title;
        chip.title = room.title;
        chip.addEventListener("click", function () { playRoom(room.id); });
        box.appendChild(chip);
      });
      return;
    }
    (st.catalog.bouquets || []).forEach(function (b) {
      if (groupOf(b.id) !== st.tab) return;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "chip" + (st.bouquet === b.id ? " on" : "");
      el.dataset.chip = b.id;
      el.textContent = b.title;
      el.addEventListener("click", function () { loadBouquet(b, false); });
      box.appendChild(el);
    });
  }

  function paintGroups() {
    const sel = $("grp");
    if (!sel) return;
    const groups = groupsInList();
    sel.innerHTML = "<option value=\"\">All groups</option>";
    groups.forEach(function (g) {
      const o = document.createElement("option");
      o.value = g;
      o.textContent = g;
      if (g === st.group) o.selected = true;
      sel.appendChild(o);
    });
    sel.hidden = groups.length < 2 || st.tab === "channel" || st.tab === "watch";
  }

  function paintFavBtn() {
    const btn = $("fav");
    if (!btn) return;
    const ch = st.current || st.channels[st.i];
    if (!ch) { btn.textContent = "☆ Save"; return; }
    btn.textContent = isFav(ch.url) ? "★ Saved" : "☆ Save";
  }

  function paintList() {
    const ul = $("channels");
    ul.innerHTML = "";
    const list = visible();
    const nAll = st.channels.filter(function (c) { return ratingOf(c) === "all"; }).length;
    const nKids = st.channels.filter(function (c) { return ratingOf(c) === "kids"; }).length;
    const nAdult = st.channels.filter(function (c) { return ratingOf(c) === "adult"; }).length;
    const extra = st.httpSkipped ? (" · " + st.httpSkipped + " HTTP skipped") : "";
    const shelf = st.audience === "kids" ? "Kids shelf" : (st.audience === "adult" ? "Adult shelf" : "All ages");
    $("count").textContent = list.length + " on " + shelf + " · " + nAll + " all ages · " + nKids + " Kids · " + nAdult + " Adult held" + extra
      + " · " + st.pool.length + " wired";
    paintZap();
    list.forEach(function (ch, n) {
      const li = document.createElement("li");
      const rowClass = [];
      if ((st.current || st.channels[st.i]) === ch) rowClass.push("on");
      if (ch.rating === "adult") rowClass.push("adult-row");
      if (ch.rating === "kids") rowClass.push("kids-row");
      if (ch.kind && EMBED_KINDS[ch.kind]) rowClass.push("kind-" + ch.kind);
      li.className = rowClass.join(" ");
      const logo = ch.logo
        ? "<img class=\"logo\" alt=\"\" loading=\"lazy\" src=\"" + esc(ch.logo) + "\">"
        : "<span class=\"logo blank\"></span>";
      const star = isFav(ch.url) ? " ★" : "";
      const mark = ch.rating === "adult"
        ? "<span class=\"badge adult\">Adult</span>"
        : (ch.rating === "kids" ? "<span class=\"badge kids\">Kids</span>" : "");
      const grp = ch.group ? "<span class=\"g\">" + esc(ch.group) + "</span>" : "";
      const kindTag = (!ch.group && EMBED_KINDS[ch.kind])
        ? "<span class=\"g kind\">" + esc(ch.kind) + "</span>"
        : "";
      const tags = (grp || kindTag) ? "<span class=\"tags\">" + grp + kindTag + "</span>" : "";
      const showLogo = ch.rating === "adult" && !adultAllowed()
        ? "<span class=\"logo blank\"></span>"
        : logo;
      li.innerHTML = "<span class=\"num\">" + (n + 1) + "</span>" + showLogo +
        "<span class=\"meta\"><span class=\"t\">" + esc(ch.title) + star + mark + "</span>" + tags + "</span>";
      li.addEventListener("click", function () {
        playAt(list.indexOf(ch), false);
      });
      ul.appendChild(li);
    });
    paintGroups();
  }

  function playRoom(id) {
    st.filter = "";
    st.group = "";
    if ($("q")) $("q").value = "";
    if (st.bouquet !== "live") {
      loadLive(id);
      return;
    }
    const ch = st.channels.filter(function (c) { return c.id === id; })[0];
    if (!ch) {
      loadLive(id);
      return;
    }
    playAt(visible().indexOf(ch), false);
  }

  function loadSaved() {
    if (!termsOk()) {
      st.tab = "saved";
      paintTabs();
      paintChips();
      needTerms();
      return;
    }
    st.tab = "saved";
    st.bouquet = "saved";
    st.httpSkipped = 0;
    st.group = "";
    st.channels = loadFavs().map(function (x) {
      return {
        title: x.title,
        url: x.url,
        https: true,
        kind: x.kind || kindOfUrl(x.url),
        logo: x.logo || "",
        group: x.group || "",
        rating: x.rating || rateChannel(x.title, x.group, "")
      };
    });
    st.i = -1;
    paintTabs();
    paintChips();
    paintAudience();
    paintList();
    hashSet();
    if (!st.channels.length) {
      setStatus("Star a channel to save it on this device.", "bad");
      setIdle(true);
      return;
    }
    setStatus("Saved on this device — click a channel.");
    setIdle(true);
  }

  function showAll() {
    if (!termsOk()) {
      st.tab = "all";
      paintTabs();
      needTerms();
      return;
    }
    st.tab = "all";
    st.bouquet = "all";
    st.group = "";
    st.filter = "";
    st.audience = "all";
    if ($("q")) $("q").value = "";
    st.channels = st.pool.slice();
    st.i = st.current ? st.channels.indexOf(st.current) : -1;
    paintTabs();
    paintChips();
    paintAudience();
    paintList();
    hashSet();
    setStatus(st.pool.length + " wired channels loaded. Use Next or the list.");
    fillPool();
  }

  function loadLive(preferId) {
    st.bouquet = "live";
    st.tab = "channel";
    st.httpSkipped = 0;
    st.group = "";
    st.channels = (st.catalog.live || []).map(function (x) {
      return {
        id: x.id,
        title: x.title,
        url: x.url,
        https: true,
        kind: x.kind || kindOfUrl(x.url),
        logo: x.logo || "",
        group: x.group || "",
        watch: x.watch || "",
        channel: x.channel || "",
        rating: "all"
      };
    });
    st.i = -1;
    st.audience = "all";
    paintTabs();
    paintChips();
    paintAudience();
    paintList();
    remember("live");
    hashSet();
    paintTerms();
    setStatus(termsOk()
      ? "Excavationpro Channel — Kick, Rumble, Twitch, YouTube."
      : "Channel rooms are open. Agree to Terms to unlock public TV lists.");
    let start = 0;
    const wanted = preferId || "rumble_live";
    const foundWanted = st.channels.findIndex(function (c) { return c.id === wanted; });
    if (foundWanted >= 0) start = foundWanted;
    if (preferId) {
      const found = st.channels.findIndex(function (c) { return c.id === preferId; });
      if (found >= 0) start = found;
    }
    if (st.channels.length) playAt(start, false);
    mergePool(st.channels);
    fillPool();
    fetch("/data/rumble-live.json?t=" + Date.now(), { cache: "no-store", credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.embed_url) return;
        const href = G.safeHref(j.embed_url);
        const rumble = st.channels.filter(function (c) { return c.id === "rumble_live"; })[0];
        if (!href || !rumble) return;
        rumble.url = href;
        if (st.current === rumble) playAt(visible().indexOf(rumble), false);
        else paintList();
      })
      .catch(function () {});
  }

  async function loadBouquet(b, autoplay) {
    if (!termsOk()) {
      st.tab = groupOf(b.id);
      paintTabs();
      paintChips();
      needTerms();
      return;
    }
    if (!G.allowFetch(b.url)) { setStatus("That list URL is blocked.", "bad"); return; }
    st.bouquet = b.id;
    st.tab = groupOf(b.id);
    st.group = "";
    paintTabs();
    paintChips();
    setStatus("Loading " + b.title + "…");
    setSpin(true);
    remember(b.id);
    hashSet();
    const ctrl = new AbortController();
    const t = window.setTimeout(function () { ctrl.abort(); }, 20000);
    try {
      const res = await fetch(b.url, { signal: ctrl.signal, credentials: "omit", redirect: "follow", cache: "no-store" });
      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_BYTES) throw new Error("playlist too large");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = new TextDecoder("utf-8").decode(buf);
      st.channels = parseM3U(text, b.url, b.id);
      st.i = -1;
      if (b.id === "kids") st.audience = "kids";
      else if (st.audience === "kids" && b.id !== "kids") { /* keep Kids shelf for this list */ }
      paintAudience();
      paintList();
      const vis = visible();
      if (!vis.length) {
        setStatus(b.title + " — no HTTPS channels. Try another list.", "bad");
        setIdle(true);
        setSpin(false);
        return;
      }
      mergePool(st.channels);
      const skip = st.httpSkipped ? (" " + st.httpSkipped + " HTTP skipped.") : "";
      setStatus(b.title + " — " + vis.length + " HTTPS channels." + skip + " Click a channel.");
      fillPool();
      setIdle(true);
      setSpin(false);
      if (autoplay) playAt(0, false);
    } catch (e) {
      setStatus("Could not load that list. Try another.", "bad");
      setIdle(true);
      setSpin(false);
    } finally {
      window.clearTimeout(t);
    }
  }

  function toggleFs() {
    const box = document.querySelector(".player-box");
    if (!box) return;
    if (!document.fullscreenElement) {
      const req = box.requestFullscreen || box.webkitRequestFullscreen;
      if (req) req.call(box).catch(function () {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  function toggleMute() {
    const v = $("vid");
    const a = $("aud");
    const el = !v.hidden ? v : a;
    el.muted = !el.muted;
    setStatus(el.muted ? "Muted." : "Unmuted.", "ok");
  }

  function togglePip() {
    const v = $("vid");
    if (!document.pictureInPictureEnabled || v.hidden) {
      setStatus("Picture-in-picture not available.", "bad");
      return;
    }
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(function () {});
      return;
    }
    v.requestPictureInPicture().catch(function () {
      setStatus("Picture-in-picture failed.", "bad");
    });
  }

  function paintZap() {
    const meta = $("zap-meta");
    if (!meta) return;
    const list = walkable();
    const cur = st.current || st.channels[st.i];
    const idx = list.indexOf(cur);
    const n = list.length;
    const title = cur && cur.title ? cur.title : "—";
    if (!n) {
      meta.textContent = "No channels in this list";
      return;
    }
    meta.textContent = (idx >= 0 ? (idx + 1) : "—") + " / " + n + " · " + title
      + (st.poolBusy ? " (loading more…)" : "");
  }
  $("prev").addEventListener("click", function () { next(-1, false); });
  $("next").addEventListener("click", function () { next(1, false); });
  if ($("zap-prev")) $("zap-prev").addEventListener("click", function () { next(-1, false); });
  if ($("zap-next")) $("zap-next").addEventListener("click", function () { next(1, false); });
  $("fs").addEventListener("click", function () { toggleFs(); });
  $("stop").addEventListener("click", function () {
    stopMedia();
    setIdle(true);
    paintOpen(null);
    setStatus("Stopped.");
  });
  $("retry").addEventListener("click", function () { retry(); });
  $("mute").addEventListener("click", function () { toggleMute(); });
  $("pip").addEventListener("click", function () { togglePip(); });
  $("fav").addEventListener("click", function () {
    if (st.i >= 0 && st.channels[st.i]) toggleFav(st.channels[st.i]);
  });
  $("sort").addEventListener("click", function () {
    st.sortAz = !st.sortAz;
    $("sort").textContent = st.sortAz ? "A–Z on" : "A–Z";
    paintList();
  });
  $("grp").addEventListener("change", function () {
    st.group = $("grp").value || "";
    paintList();
  });
  ["all", "kids", "adult"].forEach(function (id) {
    const el = $("aud-" + id);
    if (!el) return;
    el.addEventListener("click", function () { setAudience(id); });
  });
  $("gate-yes").addEventListener("click", function () { closeGate(true); });
  $("gate-no").addEventListener("click", function () { closeGate(false); });
  $("q").addEventListener("input", function () {
    st.filter = $("q").value || "";
    paintList();
  });
  $("add").addEventListener("click", function () {
    if (!termsOk()) { needTerms(); return; }
    const href = G.safeHref($("custom").value);
    if (!href) { setStatus("Need a public https:// URL.", "bad"); return; }
    const customTitle = $("custom").value.split("/").pop() || href;
    st.channels.unshift({
      title: customTitle,
      url: href,
      https: true,
      kind: kindOfUrl(href),
      logo: "",
      group: "Custom",
      rating: rateChannel(customTitle, "Custom", "")
    });
    $("custom").value = "";
    paintList();
    playAt(0, false);
  });
  $("custom").addEventListener("keydown", function (e) {
    if (e.key === "Enter") $("add").click();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $("gate") && !$("gate").hidden) {
      e.preventDefault();
      closeGate(false);
      return;
    }
    if (e.key === "Escape" && $("nudge") && !$("nudge").hidden) {
      e.preventDefault();
      hideNudge();
      return;
    }
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "ArrowLeft") { e.preventDefault(); next(-1, false); }
    if (e.key === "ArrowRight") { e.preventDefault(); next(1, false); }
    if (e.key === "f" || e.key === "F") { e.preventDefault(); toggleFs(); }
    if (e.key === "/") { e.preventDefault(); $("q").focus(); }
    if (e.key === " ") { e.preventDefault(); const v = $("vid"); if (!v.hidden) { if (v.paused) v.play(); else v.pause(); } }
    if (e.key === "m" || e.key === "M") { e.preventDefault(); toggleMute(); }
    if (e.key === "r" || e.key === "R") { e.preventDefault(); retry(); }
    if (e.key === "s" || e.key === "S") { e.preventDefault(); stopMedia(); setIdle(true); setStatus("Stopped."); }
    if (e.key === "p" || e.key === "P") { e.preventDefault(); togglePip(); }
  });

  function sessionId() {
    try {
      let s = sessionStorage.getItem(SID_KEY);
      if (!s) {
        s = (crypto.randomUUID && crypto.randomUUID()) || ("lygo" + Date.now() + Math.random().toString(16).slice(2));
        sessionStorage.setItem(SID_KEY, s);
      }
      return s;
    } catch (e) {
      return "lygo" + Date.now();
    }
  }

  function paintWatchers(n, ok) {
    const wrap = $("watchers");
    const el = $("watch-n");
    if (!wrap || !el) return;
    wrap.className = "watchers" + (ok ? "" : " off");
    if (!ok) {
      el.textContent = n || "Live count offline";
      return;
    }
    const c = Math.max(1, n | 0);
    el.textContent = c === 1 ? "1 person here now" : c + " people here now";
  }

  function startPulse() {
    const sid = sessionId();
    const heard = {};
    heard[sid] = Date.now();
    let broker = 0;
    let client = null;
    let mqttOk = false;

    function liveN() {
      const cut = Date.now() - 75000;
      let n = 0;
      Object.keys(heard).forEach(function (k) {
        if (heard[k] >= cut) n += 1;
        else delete heard[k];
      });
      return n;
    }

    function tickView() {
      if (mqttOk) paintWatchers(liveN(), true);
    }

    function loadMqtt(cb) {
      if (window.mqtt) { cb(); return; }
      const s = document.createElement("script");
      s.src = MQTT_SRC;
      s.onload = function () { cb(); };
      s.onerror = function () { paintWatchers("Live count offline", false); };
      document.head.appendChild(s);
    }

    function connect() {
      if (!window.mqtt || broker >= MQTT_URLS.length) {
        paintWatchers("Live count offline", false);
        return;
      }
      try {
        if (client) { try { client.end(true); } catch (e) {} }
        client = window.mqtt.connect(MQTT_URLS[broker], {
          clientId: ("l" + sid.replace(/[^a-zA-Z0-9]/g, "")).slice(0, 23),
          keepalive: 30,
          reconnectPeriod: 8000,
          clean: true,
          connectTimeout: 8000
        });
        client.on("connect", function () {
          mqttOk = true;
          client.subscribe(MQTT_TOPIC + "+", { qos: 0 });
          client.publish(MQTT_TOPIC + sid, String(Date.now()), { qos: 0, retain: false });
          tickView();
        });
        client.on("message", function (topic, payload) {
          const parts = String(topic || "").split("/");
          const other = parts[parts.length - 1];
          if (!other || other.length < 8) return;
          heard[other] = Date.now();
          tickView();
        });
        client.on("error", function () {});
        client.on("close", function () {
          if (!mqttOk) {
            broker += 1;
            window.setTimeout(connect, 400);
          }
        });
      } catch (e) {
        broker += 1;
        window.setTimeout(connect, 400);
      }
    }

    loadMqtt(connect);
    window.setInterval(function () {
      if (client && mqttOk) {
        try { client.publish(MQTT_TOPIC + sid, String(Date.now()), { qos: 0, retain: false }); } catch (e2) {}
        heard[sid] = Date.now();
        tickView();
      }
    }, 20000);
    window.addEventListener("pagehide", function () {
      if (client) { try { client.end(true); } catch (e3) {} }
    });
  }

  let nudgeTimer = 0;
  function armNudge(ms) {
    window.clearTimeout(nudgeTimer);
    nudgeTimer = window.setTimeout(showNudge, ms || NUDGE_MS);
  }
  function hideNudge() {
    const el = $("nudge");
    if (el) el.hidden = true;
    try { localStorage.setItem(NUDGE_KEY, String(Date.now())); } catch (e) {}
    armNudge(NUDGE_MS);
  }
  function showNudge() {
    if ($("gate") && !$("gate").hidden) { armNudge(60000); return; }
    if (document.fullscreenElement) { armNudge(60000); return; }
    const el = $("nudge");
    if (el && el.hidden) el.hidden = false;
    armNudge(NUDGE_MS);
  }
  function startNudge() {
    const box = $("nudge");
    if (!box) return;
    $("nudge-x").addEventListener("click", hideNudge);
    box.addEventListener("click", function (e) {
      const a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (a && a.href) hideNudge();
    });
    let last = 0;
    try { last = parseInt(localStorage.getItem(NUDGE_KEY) || "0", 10) || 0; } catch (e) {}
    let wait = NUDGE_MS;
    if (last) {
      wait = NUDGE_MS - (Date.now() - last);
      if (wait < 5000) wait = NUDGE_MS;
    }
    armNudge(wait);
  }

  let deferredInstall = null;
  function copyPlayerLink() {
    const url = PLAYER_URL;
    const done = function () { setStatus("Player link copied — paste it into a bookmark.", "ok"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () {
        window.prompt("Copy this player link:", url);
      });
    } else {
      window.prompt("Copy this player link:", url);
    }
  }
  function hideBm() {
    const el = $("bm-card");
    if (el) el.hidden = true;
    try { localStorage.setItem(BM_KEY, "1"); } catch (e) {}
  }
  function showBm() {
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return;
    if ($("gate") && !$("gate").hidden) return;
    if ($("nudge") && !$("nudge").hidden) return;
    try { if (localStorage.getItem(BM_KEY) === "1") return; } catch (e) {}
    const el = $("bm-card");
    if (el) el.hidden = false;
  }
  function startBookmark() {
    const card = $("bm-card");
    if (!card) return;
    if ($("bm-x")) $("bm-x").addEventListener("click", hideBm);
    if ($("bm-copy")) $("bm-copy").addEventListener("click", function () { copyPlayerLink(); hideBm(); });
    if ($("bm")) $("bm").addEventListener("click", function () {
      const el = $("bm-card");
      if (el) el.hidden = !el.hidden;
    });
    if ($("bm-install")) {
      $("bm-install").addEventListener("click", function () {
        if (!deferredInstall) return;
        deferredInstall.prompt();
        deferredInstall.userChoice.then(function () { deferredInstall = null; hideBm(); }).catch(function () {});
      });
    }
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredInstall = e;
      const b = $("bm-install");
      if (b) b.hidden = false;
    });
    window.setTimeout(showBm, 18000);
  }

  function openFromHash() {
    const raw = (location.hash || "").replace(/^#/, "");
    if (!raw) return false;
    const parts = raw.split("/");
    const tab = parts[0];
    const bid = parts[1] ? decodeURIComponent(parts[1]) : "";
    if (tab === "saved") { loadSaved(); return true; }
    if (tab === "channel" || tab === "watch" || bid === "live") { loadLive(bid && bid !== "live" ? bid : ""); return true; }
    if (!termsOk()) {
      loadLive("");
      st.tab = tab || "fast";
      paintTabs();
      needTerms();
      return true;
    }
    if (!bid) return false;
    const b = (st.catalog.bouquets || []).filter(function (x) { return x.id === bid; })[0];
    if (b) { loadBouquet(b, false); return true; }
    return false;
  }

  fetch("catalog.json?v=" + CAT_VER, { credentials: "omit", cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      st.catalog = j;
      paintTabs();
      paintChips();
      paintAudience();
      startPulse();
      startNudge();
      startBookmark();
      st.termsOk = termsOk();
      if ($("terms-ok")) $("terms-ok").addEventListener("click", acceptTerms);
      if (openFromHash()) return;
      if ((j.live || []).length) {
        loadLive("rumble_live");
        return;
      }
      const id = j.default_bouquet || "live";
      const b = (j.bouquets || []).filter(function (x) { return x.id === id; })[0] || (j.bouquets || [])[0];
      if (b) loadBouquet(b, false);
      else setStatus("No lists in catalog.", "bad");
    })
    .catch(function () { setStatus("Could not load the channel catalog.", "bad"); });
})();
