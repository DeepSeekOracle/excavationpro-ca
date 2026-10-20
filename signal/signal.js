/* Signal player — one small module for the hub cards and the episode pages. */
(function () {
  "use strict";
  var LS_VOL = "lygo_signal_vol";
  var LS_POS = "lygo_signal_pos_";
  var players = [];
  var byslug = {};

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(x).padStart(2, "0");
  }
  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  function Player(root) {
    var self = this;
    this.root = root;
    this.slug = root.getAttribute("data-slug") || "signal";
    this.audio = root.querySelector("[data-sig-audio]");
    this.seek = root.querySelector("[data-sig-seek]");
    this.cur = root.querySelector("[data-sig-cur]");
    this.dur = root.querySelector("[data-sig-dur]");
    this.ico = root.querySelector("[data-sig-ico]");
    this.hint = root.querySelector("[data-sig-hint]");
    this.rateBtn = root.querySelector("[data-sig-rate]");
    this.vol = root.querySelector("[data-sig-vol]");
    if (!this.audio) return;
    this.rates = [1, 1.25, 1.5, 0.75];
    this.rate = 0;

    var savedVol = parseFloat(read(LS_VOL));
    this.audio.volume = isFinite(savedVol) ? Math.max(0, Math.min(1, savedVol)) : 0.85;
    if (this.vol) this.vol.value = this.audio.volume;

    var toggle = root.querySelector("[data-sig-toggle]");
    if (toggle) toggle.addEventListener("click", function () { self.toggle(); });
    var back = root.querySelector("[data-sig-back]");
    var fwd = root.querySelector("[data-sig-fwd]");
    if (back) back.addEventListener("click", function () { self.nudge(-15); });
    if (fwd) fwd.addEventListener("click", function () { self.nudge(15); });

    if (this.seek) {
      this.seek.addEventListener("input", function () {
        if (self.seeking) return;
        self.seeking = true;
        var d = self.audio.duration || 0;
        self.paint((self.seek.value / 1000) * d, d);
      });
      this.seek.addEventListener("change", function () {
        var d = self.audio.duration || 0;
        if (d) self.audio.currentTime = (self.seek.value / 1000) * d;
        self.seeking = false;
      });
      this.seek.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          self.nudge(e.key === "ArrowRight" ? 15 : -15);
        }
      });
    }
    if (this.rateBtn) {
      this.rateBtn.addEventListener("click", function () {
        self.rate = (self.rate + 1) % self.rates.length;
        self.audio.playbackRate = self.rates[self.rate];
        self.rateBtn.innerHTML = String(self.rates[self.rate]).replace("0.", ".") + "&times;";
      });
    }
    if (this.vol) {
      this.vol.addEventListener("input", function () {
        self.audio.volume = parseFloat(self.vol.value);
        store(LS_VOL, String(self.audio.volume));
      });
    }

    this.audio.addEventListener("loadedmetadata", function () {
      var d = self.audio.duration;
      if (self.dur && isFinite(d)) self.dur.textContent = fmt(d);
      self.paint(self.audio.currentTime, d);
      var pos = parseFloat(read(LS_POS + self.slug));
      if (isFinite(pos) && pos > 20 && d && pos < d - 15) {
        self.audio.currentTime = pos;
        self.paint(pos, d);
        if (self.hint) {
          self.hint.hidden = false;
          self.hint.innerHTML = "Resumed at " + fmt(pos) + " — <a href=\"#\" data-sig-restart>start over</a>";
          var r = self.hint.querySelector("[data-sig-restart]");
          if (r) r.addEventListener("click", function (e) {
            e.preventDefault();
            self.audio.currentTime = 0;
            self.hint.hidden = true;
          });
        }
      }
    });
    this.audio.addEventListener("timeupdate", function () {
      if (!self.seeking) self.paint(self.audio.currentTime, self.audio.duration);
      var t = Math.floor(self.audio.currentTime);
      if (t >= 0 && t % 5 === 0 && t !== self.lastSave) {
        self.lastSave = t;
        store(LS_POS + self.slug, String(t));
      }
    });
    this.audio.addEventListener("play", function () {
      self.root.classList.add("is-playing");
      if (self.ico) self.ico.innerHTML = "&#10073;&#10073;";
      if (toggle) toggle.setAttribute("aria-label", "Pause");
      players.forEach(function (p) { if (p !== self) p.pause(); });
      if ("mediaSession" in navigator && window.MediaMetadata) {
        try {
          var now = root.querySelector(".sig-now-title");
          var art = document.querySelector("meta[property='og:image']");
          navigator.mediaSession.metadata = new window.MediaMetadata({
            title: now ? now.textContent : document.title,
            artist: "LYGO Signal — AI Radio",
            album: "chatagent.ca",
            artwork: art ? [{ src: art.getAttribute("content") }] : []
          });
          navigator.mediaSession.setActionHandler("seekbackward", function () { self.nudge(-15); });
          navigator.mediaSession.setActionHandler("seekforward", function () { self.nudge(15); });
        } catch (e) {}
      }
    });
    this.audio.addEventListener("pause", function () {
      self.root.classList.remove("is-playing");
      if (self.ico) self.ico.innerHTML = "&#9654;";
      if (toggle) toggle.setAttribute("aria-label", "Play");
      store(LS_POS + self.slug, String(Math.floor(self.audio.currentTime || 0)));
    });
    this.audio.addEventListener("ended", function () {
      self.root.classList.remove("is-playing");
      if (self.ico) self.ico.innerHTML = "&#9654;";
      store(LS_POS + self.slug, "0");
    });
    this.audio.addEventListener("error", function () {
      if (self.hint) {
        self.hint.hidden = false;
        self.hint.textContent = "Audio did not load here — use the download link in this player.";
      }
    });
  }

  Player.prototype.paint = function (t, d) {
    if (this.cur) this.cur.textContent = fmt(t);
    if (this.dur && isFinite(d) && d > 0) this.dur.textContent = fmt(d);
    if (this.seek && isFinite(d) && d > 0) {
      var pct = Math.max(0, Math.min(1000, Math.round((t / d) * 1000)));
      if (!this.seeking) this.seek.value = pct;
      this.seek.style.setProperty("--p", (pct / 10) + "%");
    }
  };
  Player.prototype.toggle = function () {
    if (this.audio.paused) {
      var p = this.audio.play();
      if (p && p.catch) p.catch(function () {});
    } else { this.audio.pause(); }
  };
  Player.prototype.pause = function () { if (!this.audio.paused) this.audio.pause(); };
  Player.prototype.nudge = function (delta) {
    var d = this.audio.duration || 0;
    var t = (this.audio.currentTime || 0) + delta;
    this.audio.currentTime = Math.max(0, d ? Math.min(d - 0.5, t) : t);
    this.paint(this.audio.currentTime, d);
  };
  Player.prototype.jump = function (sec) {
    var self = this;
    var go = function () {
      var d = self.audio.duration;
      self.audio.currentTime = d ? Math.min(sec, d - 0.5) : sec;
      self.paint(self.audio.currentTime, d);
      var p = self.audio.play();
      if (p && p.catch) p.catch(function () {});
    };
    if (this.audio.readyState >= 1) go();
    else this.audio.addEventListener("loadedmetadata", go, { once: true });
  };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-sig-player]"), function (r) {
      var p = new Player(r);
      players.push(p);
      byslug[p.slug] = byslug[p.slug] || p;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-sig-jump]"), function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var p = byslug[b.getAttribute("data-player")] || players[0];
        if (!p) return;
        p.jump(parseFloat(b.getAttribute("data-sig-jump")) || 0);
        var card = p.root.closest(".gcard, .sig-panel");
        if (card && card.getBoundingClientRect().top < 0) {
          p.root.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
    /* hero doors: play that episode and bring its card into view */
    Array.prototype.forEach.call(document.querySelectorAll("[data-sig-play]"), function (b) {
      b.addEventListener("click", function () {
        var p = byslug[b.getAttribute("data-sig-play")];
        if (!p) return;
        if (p.audio.paused) {
          p.toggle();
          var card = p.root.closest(".gcard");
          if (card) setTimeout(function () {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 220);
        } else { p.pause(); }
      });
    });
    initYouTube();
    initShare();
    oneStreamAtATime();
  }

  /* ── the archive: YouTube plays in place, one embed at a time, audio stops first ── */
  function initYouTube() {
    function stopAudio() {
      Array.prototype.forEach.call(players, function (p) { p.pause(); });
      if (window.SignalRadio && window.SignalRadio.pause) {
        try { window.SignalRadio.pause(); } catch (e) {}
      }
    }
    function dropEmbed(frame) {
      var iframe = frame.querySelector("iframe");
      if (iframe) frame.removeChild(iframe);
      var img = frame.querySelector("img"), btn = frame.querySelector(".yt-play");
      if (img) img.hidden = false;
      if (btn) btn.hidden = false;
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-yt-frame]"), function (frame) {
      var btn = frame.querySelector("[data-yt-play]");
      if (!btn) return;
      btn.addEventListener("click", function () {
        if (frame.querySelector("iframe")) return;
        Array.prototype.forEach.call(document.querySelectorAll("[data-yt-frame]"), function (other) {
          if (other !== frame) dropEmbed(other);
        });
        stopAudio();
        var iframe = document.createElement("iframe");
        iframe.className = "yt-iframe";
        iframe.setAttribute("src", "https://www.youtube-nocookie.com/embed/" + btn.getAttribute("data-yt-play") +
          "?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&playsinline=1");
        iframe.setAttribute("title", btn.getAttribute("data-yt-title") || "YouTube player");
        iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; " +
          "picture-in-picture; web-share");
        iframe.setAttribute("allowfullscreen", "");
        frame.appendChild(iframe);
        var im = frame.querySelector("img");
        if (im) im.hidden = true;
        btn.hidden = true;
      });
    });
  }

  /* an embed cannot be told to stop through the DOM alone: talk to it through the iframe API */
  function pauseEmbeds() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-yt-frame] iframe"), function (f) {
      try {
        f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
      } catch (e) {}
    });
  }

  /* radio dock (hub) + episode players must never play over each other */
  function oneStreamAtATime() {
    var all = Array.prototype.slice.call(document.querySelectorAll("audio"));
    all.forEach(function (a) {
      a.addEventListener("play", function () {
        all.forEach(function (b) { if (b !== a && !b.paused) b.pause(); });
        pauseEmbeds();
      });
    });
  }

  /* ── share: native sheet where the device has one, plus copy-to-clipboard ── */
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ── one copy handler for every button: the page URL by default, whatever data-copy-text names, or
     the value of the element data-copy-from points at (the embed-code boxes) ── */
  function copyTextFor(b) {
    var text = b.getAttribute("data-copy-text");
    if (text) return text;
    var sel = b.getAttribute("data-copy-from");
    if (sel) {
      var src = document.querySelector(sel);
      if (src) return (typeof src.value === "string" ? src.value : src.textContent) || "";
    }
    return b.getAttribute("data-share-url") || window.location.href;
  }

  function initShare() {
    var native = document.querySelector("[data-native-share]");
    if (native && navigator.share) {
      native.hidden = false;
      native.addEventListener("click", function () {
        navigator.share({
          title: document.title,
          text: native.getAttribute("data-share-text") || document.title,
          url: window.location.href
        }).catch(function () {});
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-copy-link]"), function (b) {
      b.addEventListener("click", function () {
        var url = copyTextFor(b);
        var label = b.getAttribute("data-label") || b.textContent;
        var copied = b.getAttribute("data-copied") || "Link copied ✓";
        b.setAttribute("data-label", label);
        var done = function () {
          b.textContent = copied;
          b.classList.add("copied");
          window.setTimeout(function () {
            b.textContent = label;
            b.classList.remove("copied");
          }, 2200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url); done(); });
        } else {
          fallbackCopy(url);
          done();
        }
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
