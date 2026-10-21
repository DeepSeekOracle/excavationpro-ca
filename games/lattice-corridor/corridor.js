(function () {
  "use strict";

  var SHAREWARE_ZIP = "https://gmh-code.github.io/dwasm/doom19s.zip";
  var mode = "freedoom1";
  var booted = false;
  var touchWanted = false;

  var menu = document.getElementById("menu");
  var stage = document.getElementById("stage");
  var canvas = document.getElementById("canvas");
  var output = document.getElementById("output");
  var statusEl = document.getElementById("status");
  var playBtn = document.getElementById("play");
  var age = document.getElementById("age");
  var phosphor = document.getElementById("phosphor");
  var touch = document.getElementById("touch");
  var fileLabel = document.getElementById("fileLabel");
  var wadFile = document.getElementById("wadFile");
  var ruleFast = document.getElementById("ruleFast");
  var ruleRespawn = document.getElementById("ruleRespawn");
  var ruleCoop = document.getElementById("ruleCoop");
  var ruleEmpty = document.getElementById("ruleEmpty");
  var PACKS = {
    freedoom1: "freedoom1.wad",
    freedoom2: "freedoom2.wad",
    freedm: "freedm.wad",
    lt1: "lt1.wad",
    lt2: "lt2.wad",
    ltdemo: "ltdemo.wad"
  };

  function say(text) {
    var line = text || "";
    statusEl.textContent = line;
    var stageStatus = document.getElementById("stageStatus");
    if (stageStatus) stageStatus.textContent = line;
  }

  function phosphorOn(on) {
    stage.classList.toggle("phosphor", on);
    try { localStorage.setItem("lattice-corridor-phosphor", on ? "1" : "0"); } catch (e) {}
  }

  function fitCanvas() {
    var box = stage.getBoundingClientRect();
    var aw = canvas.width || 640;
    var ah = canvas.height || 480;
    var scale = Math.min(box.width / aw, box.height / ah);
    if (!isFinite(scale) || scale <= 0) return;
    canvas.style.width = Math.floor(aw * scale) + "px";
    canvas.style.height = Math.floor(ah * scale) + "px";
  }

  function readStored() {
    var ph = "1";
    try { ph = localStorage.getItem("lattice-corridor-phosphor"); } catch (e) {}
    if (ph === null) ph = "1";
    phosphor.checked = ph !== "0";
    phosphorOn(phosphor.checked);
    if (navigator.maxTouchPoints > 1) touch.checked = true;
  }

  async function fetchBytes(url, label) {
    var res = await fetch(url);
    if (!res.ok) throw new Error(label + " did not download (" + res.status + ")");
    var total = Number(res.headers.get("content-length")) || 0;
    var reader = res.body && res.body.getReader ? res.body.getReader() : null;
    if (!reader) return new Uint8Array(await res.arrayBuffer());
    var chunks = [];
    var loaded = 0;
    while (true) {
      var step = await reader.read();
      if (step.done) break;
      chunks.push(step.value);
      loaded += step.value.length;
      var mb = (loaded / 1048576).toFixed(1);
      var of = total ? " / " + (total / 1048576).toFixed(1) : "";
      say(label + " " + mb + of + " MB");
    }
    var out = new Uint8Array(loaded);
    var offset = 0;
    chunks.forEach(function (chunk) {
      out.set(chunk, offset);
      offset += chunk.length;
    });
    return out;
  }

  async function gunzip(bytes, label) {
    say("Opening " + label);
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    var buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }

  function isIwad(bytes) {
    return bytes && bytes.length > 12 &&
      String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "IWAD";
  }

  async function loadPacked(name) {
    var gz = await fetchBytes("./wads/" + name + ".gz", name);
    var wad = await gunzip(gz, name);
    if (!isIwad(wad)) throw new Error(name + " is not an IWAD");
    return { name: name, bytes: wad };
  }

  async function loadShareware() {
    say("Fetching the original shareware archive");
    var zipBytes = await fetchBytes(SHAREWARE_ZIP, "doom19s.zip");
    var zipFile = new File([zipBytes], "doom19s.zip");
    var lib = await import("./engine/libarchive.js");
    say("Opening doom19s.zip");
    var zip = await lib.Archive.open(zipFile);
    var files = await zip.getFilesObject();
    var part1 = await files["DOOMS_19.1"].extract();
    var part2 = await files["DOOMS_19.2"].extract();
    var a = new Uint8Array(await part1.arrayBuffer());
    var b = new Uint8Array(await part2.arrayBuffer());
    var joined = new Uint8Array(a.length + b.length);
    joined.set(a, 0);
    joined.set(b, a.length);
    await zip.close();
    say("Opening the shareware package");
    var lha = await lib.Archive.open(new File([joined], "doom.lha"));
    var inner = await lha.getFilesObject();
    var wadFileObj = await inner["DOOM1.WAD"].extract();
    var wad = new Uint8Array(await wadFileObj.arrayBuffer());
    await lha.close();
    if (!isIwad(wad)) throw new Error("Shareware archive did not contain DOOM1.WAD");
    return { name: "doom1.wad", bytes: wad };
  }

  async function loadOwn() {
    var file = wadFile.files && wadFile.files[0];
    if (!file) throw new Error("Choose an IWAD file first");
    say("Reading " + file.name);
    var bytes = new Uint8Array(await file.arrayBuffer());
    if (!isIwad(bytes)) throw new Error("That file is not an IWAD. It stays on this computer either way.");
    return { name: file.name.toLowerCase(), bytes: bytes };
  }

  function showCanvas() {
    output.style.display = "none";
    canvas.style.display = "block";
    stage.classList.add("on");
    menu.hidden = true;
    fitCanvas();
    canvas.focus();
    if (touchWanted && window.olyOn) window.olyOn();
  }

  function patchJumpFile(path) {
    var raw;
    try {
      raw = FS.readFile(path, { encoding: "utf8" });
    } catch (err) {
      return false;
    }
    var next = raw;
    if (/^comperr_allowjump[ \t]+\d+/m.test(next)) {
      next = next.replace(/^comperr_allowjump[ \t]+\d+/m, "comperr_allowjump 2");
    } else {
      if (next.length && !/[\n\r]$/.test(next)) next += "\n";
      next += "comperr_allowjump 2\n";
    }
    if (next !== raw) FS.writeFile(path, next);
    return true;
  }

  function patchJump() {
    var saw = false;
    ["/defaults/prboomX.cfg", "/dwasm/prboomX.cfg"].forEach(function (path) {
      if (patchJumpFile(path)) saw = true;
    });
    if (saw) {
      var line = "Lattice Corridor: ALLOW JUMP set to High";
      console.info(line);
      output.value += line + "\n";
    }
  }

  function ruleArgs(wadName) {
    var args = ["-iwad", wadName];
    if (ruleFast.checked) args.push("-fast");
    if (ruleRespawn.checked) args.push("-respawn");
    if (ruleCoop.checked) args.push("-solo-net");
    if (ruleEmpty.checked) args.push("-nomonsters");
    return args;
  }

  function installModule(wad) {
    var pointerArmed = true;
    window.Module = {
      arguments: ruleArgs(wad.name),
      locateFile: function (path) { return "./engine/" + path; },
      canvas: canvas,
      print: function (text) {
        console.log(text);
        output.value += text + "\n";
      },
      printErr: function (text) {
        console.error(text);
        output.value += "(!) " + text + "\n";
      },
      setStatus: function (text) {
        if (text) say(String(text).replace(/<[^>]+>/g, " "));
      },
      onRuntimeInitialized: function () {
        var handle = FS.open("/" + wad.name, "w");
        FS.write(handle, wad.bytes, 0, wad.bytes.length, 0);
        FS.close(handle);
        patchJump();
        var nativeSync = FS.syncfs.bind(FS);
        FS.syncfs = function (populate, callback) {
          if (typeof populate === "function") {
            callback = populate;
            populate = false;
          }
          return nativeSync(populate, function (err) {
            if (populate) patchJump();
            if (typeof callback === "function") callback(err);
          });
        };
        say("");
      },
      hideConsole: function () {
        showCanvas();
      },
      showConsole: function () {
        canvas.style.display = "none";
        output.style.display = "block";
      },
      captureMouse: function () {
        if (touchWanted) return;
        if (pointerArmed && document.pointerLockElement !== canvas) {
          canvas.requestPointerLock();
        }
      },
      winResized: function () {
        fitCanvas();
      },
      softExit: function () {
        location.reload();
      }
    };
  }

  function startTouch() {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "./engine/oly.js";
      script.onload = function () {
        window.olySetup({
          Escape: { lbl: "☰" },
          Enter: { lbl: "↩", pos: [15, 0] },
          ArrowUp: { lbl: "↑", pos: [0, 15] },
          ArrowDown: { lbl: "↓", pos: [0, 30] },
          ArrowLeft: { lbl: "←", pos: [15, 15] },
          ArrowRight: { lbl: "→", pos: [15, 30] },
          Tab: { lbl: "⇥", anc: "R", pos: [30, 0] },
          Minus: { lbl: "−", anc: "R", pos: [15, 0] },
          Equal: { lbl: "+", anc: "R" },
          KeyW: { lbl: "W", anc: "B", pos: [10, 20], shape: "U" },
          KeyS: { lbl: "S", anc: "B", pos: [10, 0], shape: "D" },
          KeyA: { lbl: "A", anc: "B", pos: [0, 10], shape: "L" },
          KeyD: { lbl: "D", anc: "B", pos: [20, 10], shape: "R" },
          ControlLeft: { lbl: "●", anc: "RB", pos: [0, 10], shape: "" },
          Space: { lbl: "▢", anc: "RB", pos: [20, 10], shape: "" }
        }, 3);
        resolve();
      };
      script.onerror = function () { reject(new Error("Touch controls did not load")); };
      document.body.appendChild(script);
    });
  }

  function bootEngine() {
    var script = document.createElement("script");
    script.src = "./engine/index.js";
    script.async = true;
    script.onerror = function () {
      say("The engine did not load.");
      playBtn.disabled = false;
      booted = false;
    };
    document.body.appendChild(script);
  }

  async function enter() {
    if (booted) return;
    booted = true;
    playBtn.disabled = true;
    touchWanted = touch.checked;
    phosphorOn(phosphor.checked);
    stage.classList.add("on");
    menu.hidden = true;
    try {
      var wad;
      if (PACKS[mode]) wad = await loadPacked(PACKS[mode]);
      else if (mode === "shareware") wad = await loadShareware();
      else wad = await loadOwn();
      say("Starting the engine");
      if (touchWanted) await startTouch();
      installModule(wad);
      bootEngine();
    } catch (err) {
      console.error(err);
      say(err && err.message ? err.message : "Could not start");
      stage.classList.remove("on");
      menu.hidden = false;
      playBtn.disabled = !age.checked;
      booted = false;
    }
  }

  document.querySelectorAll(".mode").forEach(function (btn) {
    btn.addEventListener("click", function () {
      mode = btn.getAttribute("data-mode");
      document.querySelectorAll(".mode").forEach(function (other) {
        var on = other === btn;
        other.classList.toggle("on", on);
        other.setAttribute("aria-selected", on ? "true" : "false");
      });
      fileLabel.classList.toggle("show", mode === "own");
    });
  });

  age.addEventListener("change", function () {
    playBtn.disabled = !age.checked || booted;
  });
  phosphor.addEventListener("change", function () {
    phosphorOn(phosphor.checked);
  });
  playBtn.addEventListener("click", enter);
  document.getElementById("btnBack").addEventListener("click", function () {
    location.reload();
  });
  document.getElementById("btnCrt").addEventListener("click", function () {
    phosphor.checked = !stage.classList.contains("phosphor");
    phosphorOn(phosphor.checked);
  });
  document.getElementById("btnFull").addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else stage.requestFullscreen();
  });
  window.addEventListener("resize", fitCanvas);
  canvas.addEventListener("contextmenu", function (event) { event.preventDefault(); });
  readStored();
})();
