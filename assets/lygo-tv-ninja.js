/* LYGO TV Ninja — portable Channel rooms, Rumble default. Full player: https://chatagent.ca/sources/ */
(function () {
  "use strict";
  const TV_PAGE = "https://chatagent.ca/sources/";
  const DEFAULT_ID = "rumble_live";
  const ROOMS = [
    { id: "rumble_live", title: "Excavationpro Rumble LIVE", kind: "rumble",
      url: "https://rumble.com/embed/v7b5p30/?pub=1th29y" },
    { id: "kick_live", title: "Excavationpro on Kick", kind: "kick",
      url: "https://player.kick.com/excavationpro?autoplay=true" },
    { id: "twitch_live", title: "Excavationpro on Twitch", kind: "twitch",
      channel: "excavationpro" },
    { id: "yt_justin_live", title: "Justin Helmer YouTube LIVE", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCIbGSxMpDaj5ivh6mP_-k-A" },
    { id: "yt_excav_live", title: "Excavationpro YouTube LIVE", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCr2GPEJcl2lXu0lS9-0FjvA" },
    { id: "rumble_radio", title: "Excavationpro Rumble radio", kind: "rumble",
      url: "https://rumble.com/embed/v7anxls/?pub=1th29y" },
    { id: "yt_justin_videos", title: "Justin Helmer YouTube videos", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUIbGSxMpDaj5ivh6mP_-k-A" },
    { id: "yt_excav_videos", title: "Excavationpro YouTube videos", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUr2GPEJcl2lXu0lS9-0FjvA" }
  ];

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

  function embed(ch) {
    if (ch.kind === "twitch" || (ch.url && ch.url.indexOf("player.twitch.tv") !== -1)) {
      return "https://player.twitch.tv/?channel=" + encodeURIComponent(ch.channel || "excavationpro") +
        "&parent=" + encodeURIComponent(location.hostname) + "&autoplay=true&muted=true";
    }
    let url = ch.url || "";
    if (ch.kind === "rumble" || url.indexOf("rumble.com") !== -1) {
      return withParam(url, "autoplay", "2");
    }
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
      '<div class="tv-screen"><iframe title="LYGO TV channel" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' +
      '<div class="tv-bar">' +
        '<button type="button" class="tv-zap" data-dir="-1" aria-label="Previous channel">Prev</button>' +
        '<p class="tv-meta">Channel</p>' +
        '<button type="button" class="tv-zap" data-dir="1" aria-label="Next channel">Next</button>' +
      "</div>";

    const list = ROOMS.slice();
    let i = rumbleIndex(list);
    const frame = host.querySelector("iframe");
    const meta = host.querySelector(".tv-meta");
    const open = host.querySelector(".tv-open");

    function play(n) {
      if (!list.length) return;
      i = (n + list.length) % list.length;
      const ch = list[i];
      frame.src = embed(ch);
      frame.title = ch.title;
      meta.textContent = ch.title + " · " + (i + 1) + " / " + list.length;
      open.href = TV_PAGE + "#channel/" + ch.id;
    }

    host.querySelectorAll(".tv-zap").forEach(function (btn) {
      btn.addEventListener("click", function () {
        play(i + parseInt(btn.getAttribute("data-dir"), 10));
      });
    });
    play(i);

    fetch(TV_PAGE + "catalog.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (cat) {
      const live = cat && cat.live;
      if (!live || !live.length) return;
      list.length = 0;
      live.forEach(function (ch) {
        if (ch && ch.id && (ch.url || ch.kind === "twitch")) list.push(ch);
      });
      play(rumbleIndex(list));
    }).catch(function () {});
  }

  function boot() {
    document.querySelectorAll("[data-lygo-tv]").forEach(mount);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
