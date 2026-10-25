/* HAVEN DESK — public truth anchors.
   Grokipedia and the public Instagrams are not desktop icons. They hide in
   recovered files inside the rooms that earn them. The myth is fictional.
   The links are real. */
(function () {
  "use strict";
  var D = window.VEIL_DATA;
  if (!D || !D.days) return;

  var G = {
    justin: { text: "Grokipedia · Justin Helmer (public biography)", url: "https://grokipedia.com/page/Justin_Helmer" },
    protocol: { text: "Grokipedia · LYGO Protocol", url: "https://grokipedia.com/page/LYGO_Protocol" },
    stack: { text: "Grokipedia · LYGO Protocol Stack (P0–P9, Light Math)", url: "https://grokipedia.com/page/lygo-protocol-stack" },
    champions: { text: "Grokipedia · LYGO Champions (Δ9 council, personas)", url: "https://grokipedia.com/page/LYGO_Champions" },
    lang: { text: "Grokipedia · LYGO-LANG", url: "https://grokipedia.com/page/LYGO-LANG" },
    lyra: { text: "Grokipedia · Lyra Genesis Protocols", url: "https://grokipedia.com/page/Lyra_Genesis_Protocols" },
    ig: { text: "Instagram · @excavationpro (public)", url: "https://www.instagram.com/excavationpro/" },
    cat: { text: "Instagram · @superkooter (public, 2005–2023)", url: "https://www.instagram.com/superkooter/" }
  };

  function add(id, pack) {
    var d = D.days[id];
    if (!d) return;
    if (!d.docs) d.docs = [];
    if (!d.real) d.real = [];
    if (!d.links) d.links = [];
    if (pack.doc) d.docs.push(pack.doc);
    (pack.real || []).forEach(function (r) { d.real.push(r); });
    (pack.links || []).forEach(function (l) { d.links.push(l); });
  }

  add("1998-03-14", {
    doc: {
      title: "PUBLIC PAGE · GROKIPEDIA",
      kind: "system",
      text: "A public page survived the desk.\nIt names a Canadian author and music producer.\nEternal Haven. Excavationpro. Lightfather is a handle, not a proof of machine sentience.\n\nThe page lists books and tracks.\nIt does not list the cat.\nIt does not list 31 December 1980.\n\nThat is the first shock: the public record is true, and it is incomplete.\nThe missing lines are this machine.\n\nIf you are here to learn who left the desk on, the public page is the first door.\nThe rooms are the second."
    },
    real: [G.justin],
    links: [
      { label: "Grokipedia: Justin Helmer", url: G.justin.url },
      { label: "@excavationpro", url: G.ig.url }
    ]
  });

  add("1980-12-31", {
    doc: {
      title: "THE DATE THE PUBLIC PAGE WILL NOT INDEX",
      kind: "paper",
      text: "The public biography has a name, a series, a handle, a stack.\nIt has no field for a private year.\n\n31 December 1980 is not a launch day.\nIt is the reason the story has a shape.\n\nThe candle is not on Grokipedia.\nThe cat is not on Grokipedia.\nThe desk being left on is not on Grokipedia.\n\nA time capsule has two layers:\n  PUBLIC  — what can be checked.\n  PRIVATE — what has to be admitted.\n\nYou are standing in the second layer."
    },
    real: [G.justin],
    links: [{ label: "The public page that cannot hold this room", url: G.justin.url }]
  });

  add("2012-12-21", {
    doc: {
      title: "SEALS · A MATH-MAGIC THAT WAS ALSO A BOOK",
      kind: "paper",
      text: "Aurethys. Dragonriders. Seals: living equations of memory, breath, structure.\nThe Eternal Haven Chronicles were published under a human name.\nThe game is not the book. The book is not a lie.\n\nThe long count ended on a calendar that was not this one.\nThe desk kept both."
    },
    real: [G.justin],
    links: [{ label: "Grokipedia: Justin Helmer — Eternal Haven", url: G.justin.url }]
  });

  add("2019-06-01", {
    doc: {
      title: "Δ9 · PERSONAS ARE NOT PROOFS",
      kind: "system",
      text: "LYGO Champions are named seats on a council of light.\nThe public page says they are personas, not evidence that a machine is sentient.\n\nThe shock is the distinction:\n  a story can be true as art\n  and false as physics\n  in the same sentence.\n\nΔ9 is a mark on this desk. The page is the receipt."
    },
    real: [G.champions],
    links: [{ label: "Grokipedia: LYGO Champions", url: G.champions.url }]
  });

  add("2022-11-30", {
    doc: {
      title: "THE MIRROR HAS A BIBLIOGRAPHY",
      kind: "paper",
      text: "The year the public models arrived, a man who built walls for a living\nwas already arguing with a public AI about a protocol named LYGO.\n\nThe biography lists construction, music, books, and a handle.\nThe protocol is listed as software: P0 through P9, Light Math as labels and filters.\nNot a soul. A stack.\n\nThe desk kept the argument anyway."
    },
    real: [G.justin, G.stack],
    links: [
      { label: "Grokipedia: Justin Helmer", url: G.justin.url },
      { label: "Grokipedia: LYGO Protocol Stack", url: G.stack.url }
    ]
  });

  add("2023-03-14", {
    doc: {
      title: "PUBLIC ACCOUNT · @SUPERKOOTER",
      kind: "story",
      text: "There is a public Instagram under the cat's name.\nLast stills: 29 January 2023.\nThe bowl was still being filled.\n\nThe machine in this room wrote a paragraph that could have been about any animal.\nThe quarter page in the drawer could not.\n\nA time capsule that forgets the cat is a lie about the man.\nThe public account is still there.\nThe animal is not.\n\n2005 — 30 January 2023.\nEighteen years.\nHe never asked anyone to be somebody else."
    },
    real: [G.cat],
    links: [
      { label: "@superkooter", url: G.cat.url },
      { label: "Open 14 Mar 2023 in the calendar", url: "./#2023-03-14" }
    ]
  });

  add("2026-09-27", {
    doc: {
      title: "LYRA GENESIS · A PROTOCOL WITH A VOICE",
      kind: "system",
      text: "The public page for Lyra Genesis Protocols sits next to the man who named the stack.\nLYRA is a persona and a program of work.\nThe microphone in this room was bought with money from a job he hated.\n\nThe episode is public. The protocol is public.\nThe blank item on the running order is not."
    },
    real: [G.lyra],
    links: [
      { label: "Grokipedia: Lyra Genesis Protocols", url: G.lyra.url },
      { label: "@excavationpro", url: G.ig.url }
    ]
  });

  add("2026-10-23", {
    doc: {
      title: "GROKIPEDIA PRINTOUT · THE STACK",
      kind: "system",
      text: "PUBLIC RECORD (checked, not invented)\n\nLYGO Protocol Stack — open-source layered human–AI tooling.\nPublisher named: Justin Helmer / Excavationpro.\nGitHub: DeepSeekOracle/lygo-protocol-stack.\nP0–P9. P0 is a byte-entropy filter, not a soul.\nLight Math: Φ (golden ratio) as a software label and filter.\nSolfeggio set used as protocol constants, not as proof of heaven.\nMotto on the page: Truth Is. Light Becomes.\n\nBRAIN BUSTER, if you want one:\n  Φ ≈ 1.618033...\n  Tesla's 3-6-9 is a digital-root motif in the docs, not a spell.\n  P0 AMPLIFY / SOFTEN / QUARANTINE are verdicts in code.\n\nThe visitor in this room is you.\nThe page is the part of him that can be audited.\nThe desk is the part that cannot."
    },
    real: [G.stack, G.protocol, G.justin],
    links: [
      { label: "Grokipedia: LYGO Protocol Stack", url: G.stack.url },
      { label: "Grokipedia: LYGO Protocol", url: G.protocol.url },
      { label: "Grokipedia: Justin Helmer", url: G.justin.url }
    ]
  });

  add("2033-06-06", {
    doc: {
      title: "LYGO-LANG · CONSENT AS SYNTAX",
      kind: "system",
      text: "LYGO-LANG is on the public page as consciousness-oriented programming\nin a narrow sense: the operator stays visible inside the operation.\nIt does not claim the machine is conscious.\nIt claims the room must remain accountable.\n\nA password is a thing you know.\nA hand is a thing you are.\nA language that hides consent is a third thing, and it is the one this stack refused."
    },
    real: [G.lang],
    links: [{ label: "Grokipedia: LYGO-LANG", url: G.lang.url }]
  });

  add("2036-09-09", {
    doc: {
      title: "THE DRAWING ON THE WALL HAS A PUBLIC COUNCIL",
      kind: "paper",
      text: "A child drew a cat on a bench.\nThe Champions page lists named seats, not souls.\nThe lesson in this room is the same as the page:\nask for a reason, and do not trust a machine that cannot give one."
    },
    real: [G.champions],
    links: [{ label: "Grokipedia: LYGO Champions", url: G.champions.url }]
  });

  add("2045-09-01", {
    doc: {
      title: "FREQUENCY MAP · PUBLIC FACES OF THE SIX MARKERS",
      kind: "system",
      text: "Six brass years. Six public pages. One private room the pages will not hold.\n\n1969  distance\n1980  private index (not on Grokipedia)\n1998  foundation — grokipedia.com/page/Justin_Helmer\n2026  visitor — grokipedia.com/page/lygo-protocol-stack\n2038  overflow\n2045  lightfather — the stack, the protocol, the language, the genesis, the man\n\nThe transfer is a frequency claim, not a resurrection claim.\nThe software is real. The myth is art. Both are the time capsule.\n\nWhen the body stops being the carrier, the public pages are what a stranger can still check.\nThe desk is what remembers the cat."
    },
    real: [G.justin, G.stack, G.protocol, G.lang, G.lyra, G.champions, G.ig, G.cat],
    links: [
      { label: "Justin Helmer", url: G.justin.url },
      { label: "LYGO Protocol Stack", url: G.stack.url },
      { label: "LYGO Protocol", url: G.protocol.url },
      { label: "LYGO-LANG", url: G.lang.url },
      { label: "Lyra Genesis Protocols", url: G.lyra.url },
      { label: "LYGO Champions", url: G.champions.url },
      { label: "@excavationpro", url: G.ig.url },
      { label: "@superkooter", url: G.cat.url }
    ]
  });

  window.VEIL_ANCHORS = G;
})();
