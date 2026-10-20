/* LYGO voice-engine recovery shim — talk-radio.
 *
 * The studio player voices every line with speechSynthesis and calls cancel()
 * before each chunk, but never calls resume(). Chrome pauses the synthesizer
 * when a tab is backgrounded, and a cancel() on some builds leaves it paused.
 * From then on speak() is accepted without speaking and without firing onend:
 * the player's per-chunk watchdog just moves to the next line, so the show
 * keeps advancing, the ON AIR lamp stays lit, and there is no audio — in every
 * tab, until Chrome itself is restarted.
 *
 * The fix is deliberately small: resume() before every speak and after every
 * cancel, resume again when the tab becomes visible, and say something on
 * screen when the engine stays paused or the browser has no voices, so a silent
 * ON AIR is never mistaken for a working one.
 *
 * It never re-speaks an utterance (that would double-voice short lines). It
 * wraps speak/cancel and touches nothing else. Loaded after the app bundle;
 * exposes window.__lygoVoice for diagnosis.
 */
(function () {
  'use strict';
  if (!('speechSynthesis' in window)) return;

  var synth = window.speechSynthesis;
  var state = { spoke: 0, started: 0, ended: 0, resumed: 0, stillPaused: 0, noVoices: 0, voices: -1, blocked: false };
  window.__lygoVoice = state;

  function log() {
    try { console.info.apply(console, ['[LYGO voice]'].concat([].slice.call(arguments))); } catch (e) {}
  }

  function resumeIfPaused(why) {
    var was = false;
    try { was = synth.paused; } catch (e) { return false; }
    if (!was) return false;
    try { synth.resume(); state.resumed++; log('engine was paused (' + why + ') — resumed'); } catch (e) {}
    return true;
  }

  var nativeSpeak = synth.speak.bind(synth);
  var nativeCancel = synth.cancel.bind(synth);

  synth.speak = function (u) {
    if (!u || !u.text) { try { return nativeSpeak(u); } catch (e) { return; } }
    state.spoke++;

    var wasPaused = resumeIfPaused('before speak');
    if (wasPaused) {
      // If the resume does not take, this is the wedge people report.
      window.setTimeout(function () {
        var paused = false;
        try { paused = synth.paused; } catch (e) {}
        if (paused) {
          state.stillPaused++;
          showNotice('The browser voice engine is stuck paused, so the studio cannot speak. Press Fix audio, then Play.');
        }
      }, 900);
    }

    var prevStart = u.onstart;
    u.onstart = function (ev) {
      state.started++;
      hideNotice();
      if (prevStart) { try { prevStart.call(u, ev); } catch (e) {} }
    };
    var prevEnd = u.onend;
    u.onend = function (ev) {
      state.ended++;
      if (prevEnd) { try { prevEnd.call(u, ev); } catch (e) {} }
    };

    try { nativeSpeak(u); } catch (e) { log('speak threw', e && e.message); }
  };

  // cancel() is the call that can leave the engine paused.
  synth.cancel = function () {
    try { nativeCancel(); } catch (e) {}
    window.setTimeout(function () { resumeIfPaused('after cancel'); }, 0);
  };

  function voiceCount() {
    try { return synth.getVoices().length; } catch (e) { return 0; }
  }
  function checkVoices() {
    state.voices = voiceCount();
    if (state.voices === 0) {
      // Voices arrive late in Chrome; only complain once a line was asked for.
      if (state.spoke > 0) {
        state.noVoices++;
        showNotice('This browser reports no speech voices, so the studio cannot voice its lines. Try another browser, or install a system voice.');
      }
    } else if (notice && state.blocked) {
      hideNotice();
    }
  }
  if (synth.addEventListener) synth.addEventListener('voiceschanged', checkVoices);
  synth.onvoiceschanged = (function (prev) {
    return function (ev) {
      try { checkVoices(); } catch (e) {}
      if (prev) { try { prev.call(synth, ev); } catch (e) {} }
    };
  })(synth.onvoiceschanged);

  var notice = null;
  function showNotice(reason) {
    state.blocked = true;
    if (!document.body) return;
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'lygo-voice-notice';
      notice.setAttribute('role', 'status');
      notice.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:18px', 'transform:translateX(-50%)',
        'z-index:2147483646', 'max-width:min(92vw,30rem)',
        'background:#1b1206', 'border:1px solid rgba(212,175,55,.6)', 'border-radius:12px',
        'box-shadow:0 10px 30px rgba(0,0,0,.5)', 'padding:12px 14px',
        'font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif', 'color:#f4e9d2',
        'display:flex', 'gap:10px', 'align-items:center'
      ].join(';');

      var msg = document.createElement('span');
      msg.id = 'lygo-voice-msg';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Fix audio';
      btn.style.cssText = [
        'flex:0 0 auto', 'cursor:pointer', 'border:0', 'border-radius:8px',
        'padding:7px 11px', 'font:600 12px system-ui,sans-serif',
        'background:#d4af37', 'color:#1b1206'
      ].join(';');
      btn.addEventListener('click', function () {
        try { synth.cancel(); } catch (e) {}
        try { synth.resume(); } catch (e) {}
        resumeIfPaused('user fix');
        msg.textContent = 'Voice engine restarted — press Play on the studio bar.';
        window.setTimeout(function () {
          if (state.blocked && !synth.paused) hideNotice();
        }, 1200);
      });
      notice.appendChild(msg);
      notice.appendChild(btn);
      document.body.appendChild(notice);
    }
    var m = document.getElementById('lygo-voice-msg');
    if (m) m.textContent = reason || 'The browser voice engine is not producing sound. Press Fix audio, then Play again.';
  }

  function hideNotice() {
    state.blocked = false;
    if (notice) { notice.remove(); notice = null; }
  }

  window.addEventListener('pageshow', function () { resumeIfPaused('pageshow'); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') resumeIfPaused('tab visible');
  });
  window.setTimeout(checkVoices, 2500);
  log('shim active, voices now:', voiceCount());
})();
