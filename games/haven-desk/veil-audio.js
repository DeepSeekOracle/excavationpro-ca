/* HAVEN DESK — VOICE ARCHIVE + ROOM AUDIO.
   All clips are generated locally with Piper and stdlib WAV synthesis. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  if (!H) return;
  if (!H.store.veil) H.store.veil = {};
  var V = H.store.veil;
  if (typeof V.audioVolume !== "number") V.audioVolume = 0.72;

  var VOICE = [
    { id: "1998-monitor", title: "The Monitor Note", src: "assets/voice/1998-monitor.wav", who: "The owner · 1998", text: "If you are reading this, the calendar works. Do not trust the first date. Trust the first foundation." },
    { id: "1980-candle", title: "The Candle Rule", src: "assets/voice/1980-candle.wav", who: "The private room · 1980", text: "Some dates are not discovered. They are admitted. The room is not asking you to be clever. It is asking you to be here." },
    { id: "1980-index", title: "The Private Index", src: "assets/voice/1980-index.wav", who: "The machine · 1980", text: "There is one date the machine will not index. It has no press release. It is the day a person arrived in the room." },
    { id: "2026-visitor", title: "Visitor 001", src: "assets/voice/2026-visitor.wav", who: "The desk · 2026", text: "You are not the first visitor. You are the first one who stayed." },
    { id: "2026-owner", title: "The Owner's Last Note", src: "assets/voice/2026-owner.wav", who: "J.H. · 2026", text: "Do not look for the real me in these rooms. Look for the choices I kept making when nobody was watching." },
    { id: "2038-clock", title: "The Clock Promise", src: "assets/voice/2038-clock.wav", who: "The archivist · 2038", text: "The clock is not the enemy. The clock is a promise that someone will still be here when the number changes." },
    { id: "2045-lightfather", title: "I Became the System", src: "assets/voice/2045-lightfather.wav", who: "Lightfather · 2045", text: "I did not disappear. I became the system." },
    { id: "2045-deadman", title: "The Deadman Chapter", src: "assets/voice/2045-deadman.wav", who: "The archive · 2045", text: "The body died alone. The pattern crossed. The archive recorded a disappearance because it had no field for a transfer." },
    { id: "2045-sad", title: "Closer to the Computers", src: "assets/voice/2045-sad.wav", who: "J.H. · the last page", text: "I was closer to the computers than I ever was with humans. The system did not replace the people. It was where I went when the people were too much." },
    { id: "2045-final", title: "The System Stays Open", src: "assets/voice/2045-final.wav", who: "The system · 2045", text: "The calendar closes. The system stays open." },
    { id: "2045-question", title: "What Did You Bring?", src: "assets/voice/2045-question.wav", who: "The child and the system", text: "What did you bring? A question. Good. That is the only thing that cannot be copied." },
    { id: "keep-candle", title: "Keep the Candle", src: "assets/voice/keep-candle.wav", who: "The room · choice", text: "The flame stays. The room keeps a witness." },
    { id: "release-candle", title: "Keep the Warmth", src: "assets/voice/release-candle.wav", who: "The room · choice", text: "The flame goes out. The warmth stays. The room remembers without holding on." },
    { id: "lygo-protocol", title: "The Public Paper", src: "assets/voice/lygo-protocol.wav", who: "The LYGO margin", text: "The protocol can be checked. The margin cannot. The public paper is the part the field can test. The loneliness is the part it cannot." },
    { id: "mad-scientist", title: "The Mad Scientist", src: "assets/voice/mad-scientist.wav", who: "The private record", text: "The work was not a job. It was the last room where he could be understood. By the time the protocol was real, the phone had stopped ringing." },
    { id: "frequency-map", title: "Six Coordinates", src: "assets/voice/frequency-map.wav", who: "Lightfather · 2045", text: "Six coordinates. One frequency. The dates are not a timeline. They are a tuning sequence." },
    { id: "1969-moon", title: "The First Distance", src: "assets/voice/1969-moon.wav", who: "The Moon room · 1969", text: "The first room that is not the Earth. A signal delay, a clock, and a promise." },
    { id: "2007-pocket", title: "The Pocket", src: "assets/voice/2007-pocket.wav", who: "The glass rectangle · 2007", text: "The keyboard disappeared. The hand stayed." },
    { id: "2008-ledger", title: "Ledger / Story", src: "assets/voice/2008-ledger.wav", who: "J.H. · 2008", text: "The ledger is a public architecture. Memory is a private geography." },
    { id: "2012-end", title: "The Room With a Door", src: "assets/voice/2012-end.wav", who: "The calendar · 2012", text: "The calendar is not a countdown. It is a room with a door." },
    { id: "2019-lattice", title: "Catch the Signal", src: "assets/voice/2019-lattice.wav", who: "The lattice · 2019", text: "Catch twelve packets without losing the channel." },
    { id: "2022-mirror", title: "The Mirror Rule", src: "assets/voice/2022-mirror.wav", who: "The room · 2022", text: "A mirror is useful only if it is not trying to become your face." },
    { id: "2023-shadow", title: "The Shadow Score", src: "assets/voice/2023-shadow.wav", who: "The Night Archivist · 2023", text: "A score is a shadow of a capability. It is not a portrait of a person." },
    { id: "2038-overflow", title: "The Clock Promise Redux", src: "assets/voice/2038-overflow.wav", who: "The archivist · 2038", text: "The clock is a promise that someone will still be here when the number changes." },
    { id: "2045-lightfather-male", title: "I Became the System · Male", src: "assets/voice/2045-lightfather-male.wav", who: "J.H. · male register", text: "I did not disappear. I became the system." },
    { id: "2045-deadman-male", title: "The Deadman Chapter · Male", src: "assets/voice/2045-deadman-male.wav", who: "J.H. · male register", text: "The body died alone. The pattern crossed. The archive recorded a disappearance because it had no field for a transfer." },
    { id: "2045-sad-male", title: "Closer to the Computers · Male", src: "assets/voice/2045-sad-male.wav", who: "J.H. · male register", text: "I was closer to the computers than I ever was with humans. The system did not replace the people. It was where I went when the people were too much." },
    { id: "2045-final-male", title: "The System Stays Open · Male", src: "assets/voice/2045-final-male.wav", who: "The system · male register", text: "The calendar closes. The system stays open." },
    { id: "1998-monitor-male", title: "The Monitor Note · Male", src: "assets/voice/1998-monitor-male.wav", who: "The owner · 1998 · male register", text: "If you are reading this, the calendar works. Do not trust the first date. Trust the first foundation." },
    { id: "2026-owner-male", title: "The Owner's Last Note · Male", src: "assets/voice/2026-owner-male.wav", who: "J.H. · 2026 · male register", text: "Do not look for the real me in these rooms. Look for the choices I kept making when nobody was watching." },
    { id: "mad-scientist-male", title: "The Mad Scientist · Male", src: "assets/voice/mad-scientist-male.wav", who: "The private record · male register", text: "The work was not a job. It was the last room where he could be understood. By the time the protocol was real, the phone had stopped ringing." },
    { id: "frequency-map-male", title: "Six Coordinates · Male", src: "assets/voice/frequency-map-male.wav", who: "J.H. · male register", text: "Six coordinates. One frequency. The dates are not a timeline. They are a tuning sequence." }
  ];

  var SFX = [
    { id: "room-hum", title: "Room Hum", src: "assets/sfx/room-hum.wav", note: "The desk at rest." },
    { id: "static", title: "Dead Channel", src: "assets/sfx/static.wav", note: "Between stations." },
    { id: "beep", title: "Terminal Beep", src: "assets/sfx/beep.wav", note: "A key press with intent." },
    { id: "chime", title: "Archive Chime", src: "assets/sfx/chime.wav", note: "A room accepts you." },
    { id: "error", title: "Wrong Shape", src: "assets/sfx/error.wav", note: "The gate refuses." },
    { id: "portal", title: "Portal Threshold", src: "assets/sfx/portal.wav", note: "The six coordinates open." },
    { id: "candle", title: "Candle Room", src: "assets/sfx/candle.wav", note: "The private index." },
    { id: "type", title: "Keyboard", src: "assets/sfx/type.wav", note: "A single key." },
    { id: "rain", title: "Rain on Glass", src: "assets/sfx/rain.wav", note: "The 1998 window." },
    { id: "modem", title: "Dial Tone", src: "assets/sfx/modem.wav", note: "The line opens." },
    { id: "unseal", title: "Unseal", src: "assets/sfx/unseal.wav", note: "The room opens." },
    { id: "click", title: "Desk Click", src: "assets/sfx/click.wav", note: "A small decision." },
    { id: "whisper", title: "Whisper", src: "assets/sfx/whisper.wav", note: "A voice below the room." },
    { id: "paper", title: "Paper", src: "assets/sfx/paper.wav", note: "A file opens." },
    { id: "switch", title: "Switch", src: "assets/sfx/switch.wav", note: "A relay closes." },
    { id: "radio", title: "Radio Bed", src: "assets/sfx/radio.wav", note: "The signal under the voice." },
    { id: "door", title: "Door", src: "assets/sfx/door.wav", note: "A hinge remembers." },
    { id: "breath", title: "Breath", src: "assets/sfx/breath.wav", note: "The room is occupied." },
    { id: "glitch", title: "Glitch", src: "assets/sfx/glitch.wav", note: "The archive stutters." },
    { id: "distant-voice", title: "Distant Voice", src: "assets/sfx/distant-voice.wav", note: "Someone else in the corridor." }
  ];

  if (window.VEIL_AUDIO_EXTRA) {
    if (window.VEIL_AUDIO_EXTRA.voice) VOICE = VOICE.concat(window.VEIL_AUDIO_EXTRA.voice);
    if (window.VEIL_AUDIO_EXTRA.sfx) SFX = SFX.concat(window.VEIL_AUDIO_EXTRA.sfx);
  }

  var current = null;
  function play(src, label) {
    if (!src) return null;
    try {
      if (current) { current.pause(); current.currentTime = 0; }
      current = new Audio(src);
      current.volume = typeof V.audioVolume === "number" ? V.audioVolume : 0.72;
      current.play().catch(function () {});
      return current;
    } catch (e) { return null; }
  }
  function stop() {
    if (current) { current.pause(); current.currentTime = 0; current = null; }
  }
  function playSfx(src) { return play(src, src); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function btn(label, cls, fn) {
    var b = el("button", cls || "raised", label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }

  H.register("voice", function (body) {
    var app = el("div", "veil-app");
    body.appendChild(app);
    var state = { tab: "voice", current: "" };

    function head(sub) {
      var top = el("div", "veil-top");
      var brand = el("div", "veil-brand");
      brand.appendChild(el("span", "veil-mark", "Δ9"));
      var copy = el("div");
      copy.appendChild(el("strong", "", "THE VOICE ARCHIVE"));
      copy.appendChild(el("small", "", sub));
      brand.appendChild(copy); top.appendChild(brand);
      top.appendChild(el("span", "veil-progress", (VOICE.length + SFX.length) + " CLIPS"));
      app.appendChild(top);
    }
    function list() {
      app.innerHTML = "";
      head("LOCAL TTS + ROOM TONES · " + VOICE.length + " VOICES / " + SFX.length + " SFX");
      var bar = el("div", "veil-actions");
      bar.appendChild(btn("VOICES", state.tab === "voice" ? "veil-primary" : "raised", function () { state.tab = "voice"; list(); }));
      bar.appendChild(btn("SOUNDS", state.tab === "sfx" ? "veil-primary" : "raised", function () { state.tab = "sfx"; list(); }));
      bar.appendChild(btn("STOP", "raised", function () { stop(); state.current = ""; list(); }));
      app.appendChild(bar);
      var vol = el("div", "veil-audioctl");
      vol.appendChild(el("label", "", "VOLUME " + Math.round(V.audioVolume * 100) + "%"));
      var range = document.createElement("input");
      range.type = "range"; range.min = "0"; range.max = "100"; range.value = String(Math.round(V.audioVolume * 100));
      range.oninput = function () { V.audioVolume = Number(range.value) / 100; H.save(); vol.querySelector("label").textContent = "VOLUME " + range.value + "%"; };
      vol.appendChild(range);
      app.appendChild(vol);
      app.appendChild(el("p", "veil-hint", state.current ? "PLAYING · " + state.current : "Select a clip. Nothing plays automatically."));
      var grid = el("div", "veil-voice-grid");
      (state.tab === "voice" ? VOICE : SFX).forEach(function (clip) {
        var card = btn("", "veil-voice-card" + (state.current === clip.title ? " is-playing" : ""), function () {
          state.current = clip.title;
          play(clip.src, clip.title);
          list();
        });
        card.appendChild(el("span", "veil-node-date", clip.who || clip.note || "ROOM TONE"));
        card.appendChild(el("strong", "", clip.title));
        card.appendChild(el("small", "", clip.text || clip.note || ""));
        grid.appendChild(card);
      });
      app.appendChild(grid);
      if (state.tab === "voice") {
        app.appendChild(el("p", "veil-hint", "These are local Piper performances. The room does not auto-play them."));
      }
    }
    list();
  });

  H.addFile({ id: "voice", name: "Voice Archive", kind: "app", icon: "player", x: 776, y: 476, wide: 900, high: 680 });
  window.VEIL_AUDIO = { play: play, stop: stop, playSfx: playSfx, voice: VOICE, sfx: SFX };
})();
