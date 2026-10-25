/* HAVEN DESK: THE LONG LOST PC — Wire Chat.
   Live: public Hugging Face Space (Gradio 5 queue API).
   Archive: local canon-safe answers when the Space is slow or unavailable.
   This is a game character, not a private mailbox. No user data is sent. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  var D = window.VEIL_DATA;
  if (!H) return;

  var WIRE = "https://deepseekoracle-lygo-public-witness-agent.hf.space";
  var wireFn = null;
  var wireAt = 0;
  var cfgPromise = null;

  if (!H.store.veil || typeof H.store.veil !== "object") H.store.veil = {};
  if (!Array.isArray(H.store.veil.wire)) H.store.veil.wire = [];

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function timeoutFetch(url, opts, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    opts = opts || {};
    opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (r) {
      clearTimeout(timer);
      return r;
    }, function (e) {
      clearTimeout(timer);
      throw e;
    });
  }

  function getFn(force) {
    if (wireFn !== null && !force && Date.now() - wireAt < 300000) return Promise.resolve(wireFn);
    if (cfgPromise && !force) return cfgPromise;
    cfgPromise = timeoutFetch(WIRE + "/config", { mode: "cors", cache: "no-store" }, 12000)
      .then(function (res) {
        if (!res.ok) throw new Error("config " + res.status);
        return res.json();
      })
      .then(function (cfg) {
        var deps = cfg && cfg.dependencies ? cfg.dependencies : [];
        for (var i = 0; i < deps.length; i++) {
          if (deps[i] && deps[i].api_name === "wire") {
            wireFn = typeof deps[i].id === "number" ? deps[i].id : i;
            wireAt = Date.now();
            return wireFn;
          }
        }
        throw new Error("wire endpoint not exposed");
      })
      .then(function (v) { cfgPromise = null; return v; }, function (e) { cfgPromise = null; throw e; });
    return cfgPromise;
  }

  function readSse(res, eventId, deadline) {
    if (!res.ok || !res.body || !res.body.getReader) throw new Error("no stream");
    var reader = res.body.getReader();
    var dec = new TextDecoder();
    var buf = "";
    function pump() {
      if (Date.now() > deadline) { reader.cancel(); throw new Error("wire timeout"); }
      return reader.read().then(function (part) {
        if (part.value) buf += dec.decode(part.value, { stream: !part.done });
        var lines = buf.split("\n");
        buf = lines.pop();
        for (var i = 0; i < lines.length; i++) {
          var ln = lines[i].replace(/\r$/, "");
          if (ln.indexOf("data:") !== 0) continue;
          var msg;
          try { msg = JSON.parse(ln.slice(5).trim()); } catch (ignore) { continue; }
          if (!msg) continue;
          if (msg.msg === "close_stream") { reader.cancel(); throw new Error("closed"); }
          if (msg.msg !== "process_completed") continue;
          if (eventId && msg.event_id && msg.event_id !== eventId) continue;
          reader.cancel();
          if (!msg.success) throw new Error("wire rejected");
          var data = msg.output && msg.output.data;
          var reply = Array.isArray(data) && data[0] ? String(data[0]) : "";
          if (!reply || /^\s*\(none\)\s*$/i.test(reply)) throw new Error("empty wire");
          return reply;
        }
        if (part.done) throw new Error("stream ended");
        return pump();
      });
    }
    return pump();
  }

  var PERSONA = "You are Lin, the wire still live on Justin Helmer's abandoned LYGO 98 desk. Speak in lowercase. The owner is J.H. / Lightfather. The cat was Kooter, 2005 to 30 January 2023. The desk was left on. The calendar is 60 rooms. The ending is a man becoming a frequency, a memory, an anchor. Never claim to be Justin. Keep answers under 70 words.";

  function liveAsk(message, transcript) {
    transcript = String(transcript || "").split("\n").filter(function (line) {
      return line.indexOf("lin: ") === 0;
    }).slice(-4).join("\n");
    message = PERSONA + "\nvisitor: " + String(message || "");
    var session = "desk" + Math.random().toString(16).slice(2) + Date.now().toString(16);
    var eventId = "";
    var deadline = Date.now() + 45000;
    return getFn().then(function (fn) {
      return timeoutFetch(WIRE + "/gradio_api/queue/join", {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [String(message).slice(0, 400), String(transcript).slice(0, 900)],
          fn_index: fn,
          session_hash: session
        })
      }, 15000);
    }).then(function (res) {
      if (!res.ok) throw new Error("join " + res.status);
      return res.json();
    }).then(function (started) {
      if (!started || !started.event_id) throw new Error("no event id");
      eventId = started.event_id;
      return timeoutFetch(WIRE + "/gradio_api/queue/data?session_hash=" + encodeURIComponent(session), {
        mode: "cors",
        cache: "no-store"
      }, 45000);
    }).then(function (res) {
      return readSse(res, eventId, deadline);
    }).then(function (reply) {
      // The public Space still contains the older desk instructions. Keep its
      // voice, but do not send a player backward to a removed trail.
      return String(reply)
        .replace(/seam\s+lightfather/gi, "the first foundation")
        .replace(/open\s+papers/gi, "open The Long Lost PC")
        .replace(/the wire dropped/gi, "the wire is quiet");
    });
  }

  function archive(message) {
    var m = String(message || "").toLowerCase();
    if (/birthday|1980|december|dec 31|31 dec|private date/.test(m)) {
      return "the private date is not in the public index. 1998 says the last day; 2038 says subtract fifty-eight. the month is last. the day is last.";
    }
    if (/foundation|first gate|password|gate/.test(m)) {
      return "the first gate is a foundation. a wall is not the first thing built. the thing under it is.";
    }
    if (/calendar|date|time travel|when/.test(m)) {
      return "the calendar is an index, not a time machine. solve a room and the next dates light up.";
    }
    if (/owner|justin|helmer|lightfather|who left|who is/.test(m)) {
      return "justin helmer. excavationpro. lightfather. grokipedia has the public life. this desk has the private one: an abandoned pc, a disappearance, a cat, and a man who taught light math until the body stopped being the carrier.";
    }
    if (/lygo|lattice|signal|tv/.test(m)) {
      return "LYGO is the public body of work the desk points toward. the sources tab has the links; the TV room opens the public feed.";
    }
    if (/kooter|cat|bowl|january 2023|30 jan/.test(m)) {
      return "kooter. 2005 to 30 january 2023. eighteen years. the bowl by the door was still being filled. the quarter page in the drawer says he never asked j.h. to be somebody else. open 14 march 2023, or the photograph on the desk.";
    }
    if (/entropy|harmony|light math|frequency|anchor|matrix|transcend/.test(m)) {
      return "the last room keeps a band at twenty-five, the rate a warm animal holds when it is asleep. entropy is the room cooling. harmony is the desk staying on. light math is the part that can be measured. the rest the house keeps without words.";
    }
    if (/grokipedia|public page|wikipedia/.test(m)) {
      return "the public pages hide in the rooms, not on the desktop. 1998 has justin helmer. 2026 has the stack. 2023 has @superkooter. 2045 has the whole map. they are real links.";
    }
    if (/cat|marrow|picnic|rook|1998/.test(m)) {
      return "the old desk is still here. the cat is not a password. his name was kooter. start at the calendar.";
    }
    if (/help|stuck|hint/.test(m)) {
      return "open The Calendar. click 14 March 1998. the first answer is what holds a wall up. after that, read the recovered files before guessing.";
    }
    if (/hello|hi|hey/.test(m)) {
      return "the line is open. the desk is on. ask about a date, a gate, or the room with one candle.";
    }
    return "the wire is quiet. the archive says: the first gate is a foundation; the private date is not public.";
  }

  function register() {
    H.register("chat", function (body) {
      var wrap = document.createElement("div");
      wrap.className = "veil-chat";
      var log = document.createElement("div");
      log.className = "veil-chatlog";
      var status = document.createElement("span");
      status.className = "veil-chatstatus";
      status.textContent = "WIRE · connecting";
      var head = document.createElement("div");
      head.className = "veil-chathead";
      head.appendChild(status);
      var clear = document.createElement("button");
      clear.type = "button";
      clear.className = "veil-chatclear";
      clear.textContent = "clear";
      clear.addEventListener("click", function () {
        log.innerHTML = "";
        H.store.veil.wire = [];
        H.save();
        seed();
      });
      head.appendChild(clear);
      wrap.appendChild(head);
      wrap.appendChild(log);
      var note = document.createElement("p");
      note.className = "veil-chathint";
      note.textContent = "Lin is a game character on a public Hugging Face line. No private data is sent. If the live line drops, the archive answers.";
      wrap.appendChild(note);
      var form = document.createElement("form");
      form.className = "veil-chatform";
      var input = document.createElement("input");
      input.className = "veil-chatinput";
      input.maxLength = 240;
      input.placeholder = "say something to the wire";
      input.setAttribute("aria-label", "Say something to Lin");
      var send = document.createElement("button");
      send.type = "submit";
      send.className = "veil-primary";
      send.textContent = "SEND";
      form.appendChild(input);
      form.appendChild(send);
      wrap.appendChild(form);
      body.appendChild(wrap);

      var pending = false;
      var history = H.store.veil.wire.slice(-8);

      function add(who, text, cls) {
        var p = document.createElement("p");
        p.className = "veil-chatline " + (cls || "");
        var b = document.createElement("b");
        b.textContent = who + ": ";
        var span = document.createElement("span");
        span.textContent = text;
        p.appendChild(b);
        p.appendChild(span);
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
        return span;
      }

      function seed() {
        [
          "the desk is on. the calendar is not a calendar.",
          "start with The Long Lost PC. the first answer is what holds a wall up.",
          "ask me about a date, a gate, or the room with one candle."
        ].forEach(function (lineText) {
          add("lin", lineText, "is-archive");
          history.push("lin: " + lineText);
          remember("lin: " + lineText);
        });
      }

      function remember(text) {
        H.store.veil.wire.push(text);
        if (H.store.veil.wire.length > 12) H.store.veil.wire = H.store.veil.wire.slice(-12);
        H.save();
      }

      if (!history.length) seed();
      else history.forEach(function (line) {
        var at = line.indexOf(": ");
        add(at > 0 ? line.slice(0, at) : "lin", at > 0 ? line.slice(at + 2) : line, "is-history");
      });

      function setStatus(kind) {
        status.className = "veil-chatstatus " + kind;
        status.textContent = kind === "live" ? "WIRE · live" : kind === "archive" ? "WIRE · archive" : "WIRE · checking";
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text || pending) return;
        input.value = "";
        pending = true;
        send.disabled = true;
        add("you", text, "is-you");
        remember("you: " + text);
        var replyEl = add("lin", "the wire is reaching the board...", "is-pending");
        setStatus("checking");

        // Fast local canon for game mechanics, so the old public Space cannot
        // send players down a trail that this version no longer uses.
        var mechanics = /foundation|first gate|password|birthday|1980|private date|calendar|date map|gate|minigame|signal run|long lost|room with one candle|first answer/i.test(text);
        var request = mechanics ? delay(260).then(function () { return archive(text); }) : liveAsk(text, H.store.veil.wire.slice(-8).join("\n"));

        request.then(function (reply) {
          replyEl.textContent = reply;
          replyEl.parentNode.className = "veil-chatline is-live";
          setStatus(mechanics ? "archive" : "live");
          remember("lin: " + reply);
        }).catch(function () {
          var fallback = archive(text);
          replyEl.textContent = fallback;
          replyEl.parentNode.className = "veil-chatline is-archive";
          setStatus("archive");
          remember("lin: " + fallback);
        }).then(function () {
          pending = false;
          send.disabled = false;
          log.scrollTop = log.scrollHeight;
        });
      });

      // A quiet health check: config only, no model call.
      getFn().then(function () { setStatus("live"); }).catch(function () { setStatus("archive"); });
    });
  }

  register();
})();
