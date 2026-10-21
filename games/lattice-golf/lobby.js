/* Lattice Golf live lobby client — WebSocket to tools/lobby/server.py */
(function (w) {
  "use strict";

  function defaultUrl() {
    try {
      var q = new URLSearchParams(location.search).get("lobby");
      if (q) return q;
    } catch (e) {}
    var h = location.hostname;
    if (h === "127.0.0.1" || h === "localhost" || h === "") {
      return "ws://" + (h || "127.0.0.1") + ":8768/ws";
    }
    return "wss://deepseekoracle-lattice-golf-lobby.hf.space/ws";
  }

  var ws = null;
  var url = defaultUrl();
  var pid = "";
  var handlers = {};
  var open = false;
  var queue = [];
  var retries = 0;

  function emit(type, msg) {
    var fn = handlers[type];
    if (typeof fn === "function") fn(msg);
    if (typeof handlers["*"] === "function") handlers["*"](msg);
  }

  function send(obj) {
    if (!obj) return;
    var s = JSON.stringify(obj);
    if (ws && ws.readyState === 1) {
      try { ws.send(s); } catch (e) { queue.push(s); }
    } else queue.push(s);
  }

  function flush() {
    while (queue.length && ws && ws.readyState === 1) {
      try { ws.send(queue.shift()); } catch (e) { break; }
    }
  }

  function connect(forceUrl) {
    if (forceUrl) url = forceUrl;
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      emit("error", { msg: "Could not open lobby socket." });
      return;
    }
    ws.onopen = function () {
      open = true;
      retries = 0;
      flush();
      emit("open", { url: url });
    };
    ws.onclose = function () {
      open = false;
      ws = null;
      emit("close", {});
      if (retries < 6) {
        retries += 1;
        setTimeout(function () { connect(); }, 700 * retries);
      }
    };
    ws.onerror = function () {
      emit("error", { msg: "Lobby server unreachable. Host can run tools/lobby/server.py" });
    };
    ws.onmessage = function (ev) {
      var msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (!msg || !msg.type) return;
      if (msg.type === "welcome" || msg.type === "hello") pid = msg.pid || pid;
      emit(msg.type, msg);
    };
  }

  function close() {
    retries = 99;
    if (ws) {
      try { ws.close(); } catch (e) {}
    }
    ws = null;
    open = false;
  }

  w.GolfNet = {
    connect: connect,
    send: send,
    close: close,
    on: function (type, fn) { handlers[type] = fn; },
    url: function () { return url; },
    pid: function () { return pid; },
    open: function () { return open; },
    setUrl: function (u) { url = u; }
  };
})(window);
