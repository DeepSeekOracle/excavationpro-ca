/*! LYGO portal — the bench's synthesis core (app.js?v=20260924h)
 *
 * One feature, two routes, both of them one click:
 *   A. PICK THE SEGMENTS — split every side-by-side answer into segments a reader can point at
 *      (a paragraph, a bullet, or the sentences a long paragraph breaks into), let the visitor keep
 *      the strongest ones, and assemble those verbatim into one answer with per-segment provenance.
 *   B. SYNTHESIZE — one meta-prompt to one lane that reads the answers (all of them, or just the
 *      picked segments) and writes ONE refined answer, naming what it leaned on and inventing nothing.
 *
 * Everything here is pure: no DOM, no network, no keys. It is loaded as `window.LYGO_SYNTH` by the page
 * and required directly by tools/portal_synth_check.js, so the splitter, the assembler and the prompt
 * are the same code in the test and in the browser — the page cannot drift from what was verified.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module && module.exports) module.exports = api;
  if (root) root.LYGO_SYNTH = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var PARA_MAX = 700;   // a paragraph longer than this is asked to break at its own sentences
  var SEG_MAX = 420;    // the size a broken paragraph aims for, so no segment is a wall of text
  var SEG_MIN = 120;    // a fragment below this is glued to its neighbour rather than standing alone

  function norm(t) {
    return String(t == null ? "" : t).replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
  }
  function flat(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }
  function isListLine(l) {
    return /^\s{0,4}([-*•·–]|\(?\d{1,2}[.)]|\(?[a-z][.)])\s+\S/i.test(l);
  }
  // A sentence ends on . ! ? … plus any closing quote/bracket that belongs to it.
  function sentences(para) {
    var parts = para.match(/[^.!?…]+[.!?…]+["'”’)\]]*|[^.!?…]+$/g);
    if (!parts) return null;
    parts = parts.map(flat).filter(Boolean);
    return parts.length > 1 ? parts : null;
  }
  function hardWrap(s, max) {
    var out = [], cur = "";
    String(s).split(/\s+/).forEach(function (w) {
      if (!w) return;
      if (cur && (cur.length + 1 + w.length) > max) { out.push(cur); cur = w; }
      else cur = cur ? cur + " " + w : w;
    });
    if (cur) out.push(cur);
    return out;
  }
  function chunk(sentencesIn, max, min) {
    var out = [], cur = "";
    sentencesIn.forEach(function (s) {
      (s.length > max ? hardWrap(s, max) : [s]).forEach(function (piece) {
        if (!cur) { cur = piece; return; }
        if (cur.length + 1 + piece.length <= max) { cur = cur + " " + piece; return; }
        out.push(cur);
        cur = piece;
      });
    });
    if (cur) out.push(cur);
    // never ship a two-word segment: fold a runt back into the segment before it
    for (var i = out.length - 1; i > 0; i--) {
      if (out[i].length < min && (out[i - 1].length + 1 + out[i].length) <= (max * 1.6)) {
        out[i - 1] = out[i - 1] + " " + out[i];
        out.splice(i, 1);
      }
    }
    return out;
  }

  /** Split one answer into segments a reader can pick. Nothing is added or dropped: joining every
   *  segment's text with a space and collapsing whitespace reproduces the answer. */
  function splitSegments(text) {
    var t = norm(text), segs = [];
    if (!t) return segs;
    function put(s, kind, para) {
      var v = flat(s);
      if (!v) return;
      segs.push({ i: segs.length + 1, text: v, kind: kind, para: para });
    }
    t.split(/\n{2,}/).forEach(function (raw, pi) {
      var para = raw.replace(/\n+$/, "");
      var lines = para.split("\n").filter(function (l) { return l.trim(); });
      var listy = lines.filter(isListLine).length;
      if (listy >= 2) {
        // a bullet or a numbered step is already the unit a reader picks
        lines.forEach(function (l) { put(l, "line", pi + 1); });
        return;
      }
      var flatPara = flat(para);
      if (flatPara.length <= PARA_MAX) { put(flatPara, "para", pi + 1); return; }
      var sents = sentences(flatPara);
      if (!sents) { hardWrap(flatPara, SEG_MAX).forEach(function (c) { put(c, "para", pi + 1); }); return; }
      chunk(sents, SEG_MAX, SEG_MIN).forEach(function (c) { put(c, "sentence", pi + 1); });
    });
    return segs;
  }

  /**
   * Assemble hand-picked segments into one answer, verbatim.
   * rows: [{ lane:"A", label:"Groq · openai/gpt-oss-20b", seg:{ i:2, text:"…" } }] in reading order.
   * Returns { text, count, lanes:[{lane,label,segs:[n]}], tags:[ "A2", … ] } — the tags ARE the
   * provenance, so the text stays paste-ready instead of carrying attribution prose inside it.
   */
  function assemble(rows, opts) {
    opts = opts || {};
    var withTags = opts.tags !== false;
    var list = (rows || []).filter(function (r) { return r && r.seg && flat(r.seg.text); });
    if (!list.length) return { text: "", count: 0, lanes: [], tags: [] };
    var blocks = [], tags = [], byLane = {}, order = [];
    list.forEach(function (r) {
      var tag = r.lane + r.seg.i;
      var body = flat(r.seg.text);
      blocks.push(withTags ? body + " (" + tag + ")" : body);
      tags.push(tag);
      if (!byLane[r.lane]) { byLane[r.lane] = { lane: r.lane, label: r.label || "", segs: [] }; order.push(r.lane); }
      byLane[r.lane].segs.push(r.seg.i);
    });
    var lines = order.map(function (k) {
      var b = byLane[k];
      return b.lane + " · " + b.label + " — segment" + (b.segs.length === 1 ? "" : "s") + " " + b.segs.join(", ");
    });
    // The example tag has to be one that is actually in this answer, or the reader goes looking for a
    // block marked A2 that is not there.
    var ex = "";
    if (withTags && tags.length) {
      var m = /^([A-Z]+)(\d+)$/.exec(tags[0]);
      ex = m ? "; the tag after a block (" + tags[0] + ") is answer " + m[1] + ", segment " + m[2]
             : "; the tag after a block names the answer and segment it came from";
    }
    var text = blocks.join("\n\n") + "\n\n———\n" +
      "Picked by hand from the bench and kept verbatim" +
      (withTags ? " — no model rewrote these" + ex + "." : " — no model rewrote these.") +
      "\n" + lines.join("\n");
    return { text: text, count: list.length, lanes: order.map(function (k) { return byLane[k]; }), tags: tags };
  }

  /** The source block the synthesizer reads: one section per answer, labelled, in the order given.
   *  A source may carry the bench's own lane letter (`lane`), so the synthesizer sees the SAME letter
   *  the visitor's tags use (A2, B3) instead of a second, sequential numbering of the same answers. */
  function sourceBlock(sources) {
    return (sources || []).map(function (s, i) {
      var letter = (s && s.lane) ? s.lane : String.fromCharCode(65 + i);
      return "--- ANSWER " + letter + " (" + ((s && s.label) || "unnamed lane") + ") ---\n" +
             norm(s && s.text);
    }).join("\n\n");
  }

  /** The meta-prompt. mode "picks" = the visitor chose the material; mode "all" = every full answer.
   *  Both modes ask for ONE refined answer with named provenance and an explicit no-invention rule. */
  function synthPrompt(o) {
    o = o || {};
    var fromPicks = o.mode === "picks";
    var head = "Several models were each given the same prompt. That prompt was:\n" + String(o.prompt || "").trim();
    var body = fromPicks
      ? "A human read the answers side by side and kept only the segments below, each labelled with the answer it came from. Material outside them was read and rejected:\n\n" + String(o.body || "")
      : "Their answers:\n\n" + String(o.body || "");
    var rules = [
      "Write ONE refined answer to that prompt, as a single piece the reader can use as-is — not a list of who said what.",
      "Keep the strongest material and drop the repetition, the hedging and the filler. Where two answers made the same point, make it once.",
      "Where they disagree, or one of them is unsure, say so in one short line at the point it matters, rather than silently picking a side.",
      "Invent nothing none of them gave. If they all missed something the prompt asked for, name that gap instead of filling it.",
      "Intensify nothing either: no claim, number, name or instruction that is not in the answers above may appear in yours.",
      "End with one line beginning 'Provenance:' naming which answer(s) each part of your answer leans on."
    ];
    if (fromPicks) {
      rules.splice(1, 0, "The material you were handed was hand-picked by the person reading the bench: use those segments, and only them, as your material. You may reorder and rephrase for coherence, but add nothing from outside them.");
    }
    return head + "\n\n" + body + "\n\n" + rules.map(function (r, i) { return "(" + (i + 1) + ") " + r; }).join("\n");
  }

  function synthSystem(mode) {
    var base = "You are the bench's synthesizer: other models answered the same prompt, and your reply is one refined answer built from their answers. You name what you leaned on, and you invent nothing that is not on the page.";
    return mode === "picks"
      ? base + " The material below was hand-picked by the human reading the bench, so treat it as the only source you have."
      : base;
  }

  return {
    PARA_MAX: PARA_MAX, SEG_MAX: SEG_MAX, SEG_MIN: SEG_MIN,
    norm: norm, flat: flat,
    splitSegments: splitSegments,
    assemble: assemble,
    sourceBlock: sourceBlock,
    synthPrompt: synthPrompt,
    synthSystem: synthSystem
  };
});
