/* AETHONΔ9 — public-title discourse scan. Not identity. Not doxing. */
(function (root) {
  "use strict";
  const BAR = 0.65;
  const EVASION = [
    { w: 0.15, re: /do your own research|prove me wrong|it's on you to prove/i, k: "burden_shift" },
    { w: 0.18, re: /sheep|wake up|sheeple|clown world/i, k: "ad_hominem" },
    { w: 0.15, re: /tons of evidence|everybody knows|sources say(?!\s+\w)/i, k: "vague_cite" },
    { w: 0.15, re: /trust the experts|settled science|as a former .{0,40} trust me/i, k: "authority" },
    { w: 0.2, re: /that never happened|you're imagining|fake news(?!\s+report)/i, k: "gaslight" },
    { w: 0.15, re: /what about (when|the)|and you were silent/i, k: "deflection" }
  ];
  const SAT = [
    { w: 0.35, re: /you won't believe|gone wrong|destroyed|owned|must see/i, k: "rage_bait" },
    { w: 0.35, re: /breaking:?\s*.{0,12}!{2,}|this changes everything/i, k: "saturation" },
    { w: 0.3, re: /they don't want you to|hidden truth they/i, k: "click_weapon" }
  ];
  const HALF = [
    { w: 0.5, re: /settled science|the science is clear|debate is over/i, k: "half_truth_certainty" },
    { w: 0.5, re: /trust the (process|experts|institutions)(?!\s+and verify)/i, k: "prestige_shutdown" }
  ];

  function score(text, table) {
    let s = 0;
    const hits = [];
    const t = String(text || "");
    table.forEach(function (row) {
      if (row.re.test(t)) { s += row.w; hits.push(row.k); }
    });
    return { score: Math.min(1, s), hits: hits };
  }

  function scan(text) {
    const e = score(text, EVASION);
    const sa = score(text, SAT);
    const h = score(text, HALF);
    let ops = e.score * 0.45 + sa.score * 0.3 + h.score * 0.25;
    const channels = (e.hits.length > 0 ? 1 : 0) + (sa.hits.length > 0 ? 1 : 0) + (h.hits.length > 0 ? 1 : 0);
    if (channels >= 2) ops = Math.min(1, ops + 0.12);
    let yieldV = "ALIGNED";
    if (ops >= BAR) yieldV = "REVIEW";
    if (ops >= 0.85) yieldV = "SHADOW";
    return {
      protocol: "AETHONΔ9",
      ops_score: Math.round(ops * 1000) / 1000,
      evasion_index: Math.round(e.score * 1000) / 1000,
      saturation: Math.round(sa.score * 1000) / 1000,
      half_truth_certainty: Math.round(h.score * 1000) / 1000,
      hits: e.hits.concat(sa.hits, h.hits),
      yield: yieldV,
      bar: BAR,
      unit: "public_title_discourse",
      not: "identity"
    };
  }

  root.AETHON9 = { scan: scan, BAR: BAR };
})(window);
